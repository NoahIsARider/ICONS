"""Capture showcase screenshots from the packaged build (real window pixels)."""
import os, sys, time, json, shutil, subprocess, importlib.util
spec = importlib.util.spec_from_file_location('dv', os.path.join('tools', 'desktop-validate.py'))
dv = importlib.util.module_from_spec(spec); spec.loader.exec_module(dv)
from PIL import Image

OUT = os.path.join('screenshots')
os.makedirs(OUT, exist_ok=True)
EXE = os.path.abspath('dist/RecordLabelRivals-win32-x64/RecordLabelRivals.exe')
PROFILE = os.path.join(os.environ['TEMP'], 'rlr-shots2', 'userdata')
shutil.rmtree(PROFILE, ignore_errors=True); os.makedirs(PROFILE, exist_ok=True)
PORT = 9270

def launch():
    p = subprocess.Popen([EXE, f'--user-data-dir={PROFILE}', f'--remote-debugging-port={PORT}'],
                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    page = dv.Page(PORT, p)
    page.call("Page.enable"); page.call("Runtime.enable")
    page.wait_for("document.readyState === 'complete' && !!document.querySelector('#app > *')", 30, "render")
    time.sleep(0.6)
    return p, page

def save(page, name, width=1920):
    raw = os.path.join(os.environ['TEMP'], 'rlr-shots2', name.replace('.jpg', '.png'))
    page.screenshot(raw)
    image = Image.open(raw).convert('RGB')
    if image.width > width:
        image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
    target = os.path.join(OUT, name)
    image.save(target, 'JPEG', quality=92, optimize=True)
    print(f"  {name:<28} {image.size[0]}x{image.size[1]}  {os.path.getsize(target)//1024} KB")
    return target

process, page = launch()
try:
    print("capturing game scenes...")
    save(page, '01-title-screen.jpg')

    def settle():
        for _ in range(4):
            if page.js("!!document.querySelector('.gate-veil')"):
                page.click(".gate-veil [data-action='ready']"); time.sleep(0.5)
            else: return

    page.click(".start-button"); time.sleep(0.9); settle()
    save(page, '02-artist-auction.jpg')
    page.click(".bid-submit"); time.sleep(0.7); settle()
    page.click(".bid-submit"); time.sleep(0.9); settle()
    save(page, '03-training-and-care.jpg')
    page.click(".pass-tile"); time.sleep(0.7)
    save(page, '04-event-card.jpg')
    page.click(".event-back"); time.sleep(0.7); settle()
    save(page, '05-album-creation.jpg')
    if page.js("!!document.querySelector('.studio-press:not([disabled])')"):
        page.click(".studio-press"); time.sleep(0.8)
    else:
        page.click(".scene-pass"); time.sleep(0.8)
    settle()
    save(page, '06-live-show-board.jpg')
    # walk to the Grammy scene
    for _ in range(14):
        if page.js("document.querySelector('.scene-instruction h2')?.innerText === 'AND THE WINNER IS…'"):
            break
        sel = (".gate-veil [data-action='ready']" if page.js("!!document.querySelector('.gate-veil')")
               else ".scene-pass" if page.js("!!document.querySelector('.scene-pass')")
               else ".venue-tile.eligible:not([disabled])" if page.js("!!document.querySelector('.venue-tile.eligible:not([disabled])')")
               else "button:not([disabled])")
        page.click(sel); time.sleep(0.6)
    save(page, '07-grammy-awards.jpg')
finally:
    dv.stop_game(process)

# The finale only exists at the end of a ten-round game: load a finished save and let the app render it.
print("capturing the finale...")
save_path = os.path.join(PROFILE, 'game-save.json')
finished = json.load(open(save_path, encoding='utf8'))
finished.update(round=10, phase=8, gameOver=True, winnerIds=[0])
finished['players'][0]['money'] = 268; finished['players'][0]['acclaim'] = 31
finished['players'][1]['money'] = 214; finished['players'][1]['acclaim'] = 24
finished['log'].insert(0, {"id": 9999, "round": 10, "phase": 8, "type": "highlight",
                           "text": f"GAME OVER — {finished['players'][0]['name']} wins with $268!"})
json.dump(finished, open(save_path, 'w', encoding='utf8'))
process, page = launch()
try:
    time.sleep(1.0)
    print("  finale scene rendered:", page.js("document.querySelector('.scene-finale h1')?.innerText"))
    save(page, '08-winner-finale.jpg')
finally:
    dv.stop_game(process)
print("done")
