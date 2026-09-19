#!/usr/bin/env python
"""Validate the packaged desktop build (Windows) end to end.

Launches the built executable against a throwaway user-data folder, drives the
game with real mouse clicks over the DevTools protocol, and asserts the whole
standalone save channel: nothing on disk before play, a fresh save after every
action, and a restored game after a reload.

    python tools/desktop-validate.py --exe dist/RecordLabelRivals-win32-x64/RecordLabelRivals.exe

Needs the `websockets` package. Screenshots and a full log land in the work dir.
"""
import argparse, base64, json, os, shutil, signal, subprocess, sys, time, urllib.request

try:
    from websockets.sync.client import connect
except ImportError:
    sys.exit("pip install websockets  (needed to talk to the Electron DevTools protocol)")


def running_instances():
    """Electron's single-instance lock is app-wide, so a stale window blocks a new launch."""
    if os.name != "nt": return []
    try:
        output = subprocess.run(["tasklist", "/FI", "IMAGENAME eq RecordLabelRivals.exe", "/NH"],
                                capture_output=True, text=True).stdout
    except OSError:
        return []
    return [line.split()[1] for line in output.splitlines() if "RecordLabelRivals.exe" in line]


def stop_game(process):
    """Kill the whole Electron process tree — terminating the parent leaves children holding the lock."""
    if process.poll() is not None: return
    if os.name == "nt":
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(process.pid)], capture_output=True)
    else:
        process.terminate()
    try: process.wait(timeout=10)
    except subprocess.TimeoutExpired: process.kill()


def page_target(port, process=None, deadline=40):
    last = None
    until = time.time() + deadline
    while time.time() < until:
        if process is not None and process.poll() is not None:
            output = ""
            try: output = (process.stdout.read() or b"").decode("utf8", "replace")[-800:]
            except Exception: pass
            raise SystemExit(f"the game exited immediately (code {process.returncode}). Output:\n{output}")
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=2) as response:
                for target in json.load(response):
                    if target.get("type") == "page":
                        return target
        except Exception as error:  # not up yet
            last = error
        time.sleep(0.5)
    raise SystemExit(f"no DevTools page on port {port} ({last})")


class Page:
    def __init__(self, port, process=None):
        self.target = page_target(port, process)
        self.ws = connect(self.target["webSocketDebuggerUrl"], max_size=64 * 1024 * 1024)
        self.serial = 0

    def call(self, method, **params):
        self.serial += 1
        self.ws.send(json.dumps({"id": self.serial, "method": method, "params": params}))
        while True:
            message = json.loads(self.ws.recv())
            if message.get("id") == self.serial:
                if "error" in message:
                    raise RuntimeError(f"{method}: {message['error']}")
                return message.get("result", {})

    def js(self, expression, await_promise=False):
        result = self.call("Runtime.evaluate", expression=expression, returnByValue=True,
                           awaitPromise=await_promise)
        if result.get("exceptionDetails"):
            return None
        return result.get("result", {}).get("value")

    def click(self, selector):
        box = self.js("""(() => { const node = document.querySelector(%s);
            if (!node) return null; node.scrollIntoView({block:'center'});
            const rect = node.getBoundingClientRect();
            return {x:rect.left+rect.width/2, y:rect.top+rect.height/2, disabled:!!node.disabled}; })()""" % json.dumps(selector))
        if not box: return f"missing {selector}"
        if box["disabled"]: return f"disabled {selector}"
        for kind, buttons in (("mousePressed", 1), ("mouseReleased", 0)):
            self.call("Input.dispatchMouseEvent", type=kind, x=int(box["x"]), y=int(box["y"]),
                      button="left", clickCount=1, buttons=buttons)
        time.sleep(0.4)
        return f"clicked {selector}"

    def screenshot(self, path):
        with open(path, "wb") as handle:
            handle.write(base64.b64decode(self.call("Page.captureScreenshot", format="png")["data"]))
        return path

    def wait_for(self, expression, deadline=20, label=""):
        until = time.time() + deadline
        while time.time() < until:
            if self.js(expression): return True
            time.sleep(0.25)
        print(f"      (waited {deadline}s for {label or expression})")
        return False


def digests(save_path):
    if not os.path.exists(save_path): return None
    with open(save_path, encoding="utf8") as handle:
        state = json.load(handle)
    return {"round": state["round"], "phase": state["phase"], "log": len(state["log"]),
            "money": {player["name"]: player["money"] for player in state["players"]},
            "stamp": os.path.getmtime(save_path)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--exe", required=True, help="path to the packaged RecordLabelRivals.exe")
    parser.add_argument("--port", type=int, default=9224)
    parser.add_argument("--work", default=os.path.join(os.environ.get("TEMP", "."), "rlr-desktop-validation"))
    parser.add_argument("--steps", type=int, default=16, help="turns to play after starting a game")
    parser.add_argument("--keep-open", action="store_true", help="leave the game running when done")
    args = parser.parse_args()

    exe = os.path.abspath(args.exe)
    if not os.path.exists(exe): sys.exit(f"executable not found: {exe}")
    stale = running_instances()
    if stale: sys.exit(f"close the running game first ({len(stale)} RecordLabelRivals.exe processes: {', '.join(stale)})")
    profile = os.path.join(args.work, "userdata")
    save_path = os.path.join(profile, "game-save.json")
    shutil.rmtree(profile, ignore_errors=True)
    os.makedirs(profile, exist_ok=True)

    log, failures = [], []
    def check(label, ok, detail=""):
        log.append(f"{'PASS' if ok else 'FAIL'}  {label}{(' — ' + str(detail)) if detail else ''}")
        print(log[-1])
        if not ok: failures.append(label)

    process = subprocess.Popen([exe, f"--user-data-dir={profile}", f"--remote-debugging-port={args.port}"],
                               stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    try:
        page = Page(args.port, process)
        page.call("Page.enable"); page.call("Runtime.enable")
        ready = page.wait_for("document.readyState === 'complete' && !!document.querySelector('#app > *')", 30, "first render")
        loaded_title = page.js("document.title")
        check("game window loaded over the packaged app",
              bool(ready) and loaded_title == "Record Label Rivals",
              f"title={loaded_title!r} url={page.target.get('url')}")
        check("preload bridge exposes the desktop save API", page.js("!!window.recordLabelDesktop") is True)
        check("title screen renders and its artwork loads",
              page.js("!!document.querySelector('.title-screen')") is True
              and page.js("""(async () => (await Promise.all(['icons/11-royalties.png','portraits/nova.jpg',
                    'assets/record-table.png'].map(async url => (await fetch(url)).ok))).every(Boolean))()""",
                    await_promise=True) is True)
        check("no save file before a game is started", not os.path.exists(save_path))
        page.screenshot(os.path.join(args.work, "01-title.png"))

        page.click(".start-button")
        time.sleep(0.7)
        first = digests(save_path)
        check("starting a game writes the standalone save", bool(first), first)
        check("fresh save holds the new game", first and first["round"] == 1 and first["phase"] == 0
              and set(first["money"].values()) == {18}, first and first["money"])

        def next_action():
            for selector in (".gate-veil [data-action='ready']", ".bid-submit", ".pass-tile", ".event-back",
                             ".studio-press:not([disabled])", ".venue-tile.eligible:not([disabled])",
                             ".scene-pass", ".scene-button, .gold-button"):
                if page.js(f"!!document.querySelector({json.dumps(selector)})"): return selector
            return None

        writes, actions = 0, 0
        for step in range(args.steps):
            selector = next_action()
            if not selector: break
            before = digests(save_path)
            outcome = page.click(selector)
            after = digests(save_path)
            turned = before and after and (after["stamp"] != before["stamp"] or after["log"] != before["log"])
            if "ready" not in outcome:            # seat hand-offs change nothing
                actions += 1
                writes += 1 if turned else 0
                log.append(f"      {outcome:<38} R{after['round']}P{after['phase']} log={after['log']} money={after['money']}")
            if after["round"] > 1 and after["phase"] == 0: break
        check(f"every one of the {actions} played actions updated the save file", writes == actions,
              f"{writes}/{actions} wrote")
        page.screenshot(os.path.join(args.work, "02-play.png"))

        on_disk = digests(save_path)
        page.call("Page.reload", ignoreCache=True)
        time.sleep(2.5)
        restored = page.js("document.querySelector('.score-row')?.innerText.replace(/\\n/g,' ')")
        check("reload restores the saved game instead of the title screen",
              page.js("!!document.querySelector('.game-table')") is True
              and page.js("!!document.querySelector('.title-screen')") is False, restored)
        check("restored table matches the save on disk",
              restored is not None and all(f"${money}" in restored for money in on_disk["money"].values()), restored)
        page.screenshot(os.path.join(args.work, "03-reload.png"))
    finally:
        if args.keep_open:
            print("game left running (pid %d)" % process.pid)
        else:
            stop_game(process)

    os.makedirs(args.work, exist_ok=True)
    with open(os.path.join(args.work, "report.txt"), "w", encoding="utf8") as handle:
        handle.write("\n".join(log) + "\n")
    print(f"\n{len(log)} checks, {len(failures)} failures — report: {os.path.join(args.work, 'report.txt')}")
    if failures: sys.exit("FAILED: " + "; ".join(failures))
    print("desktop validation passed")


if __name__ == "__main__":
    main()
