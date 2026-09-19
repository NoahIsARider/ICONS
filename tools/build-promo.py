"""Generate docs/PROMO.md — launch copy for X, with character counts computed, not typed."""
import io, re

ROOT = 'D:/Projects/其他项目/创作空间/CodexWorkspace/ICONS/'
RELEASES = 'https://github.com/NoahIsARider/ICONS/releases/latest'
REPO = 'https://github.com/NoahIsARider/ICONS'


def weighted(text):
    """Twitter's limit: 280 weighted chars, CJK and emoji count 2, any URL counts 23."""
    urls = re.findall(r'https?://\S+', text)
    body = re.sub(r'https?://\S+', '', text)
    total = 23 * len(urls)
    for ch in body:
        cp = ord(ch)
        heavy = (0x1100 <= cp <= 0x115F or 0x2E80 <= cp <= 0xA4CF or 0xAC00 <= cp <= 0xD7A3
                 or 0xF900 <= cp <= 0xFAFF or 0xFE30 <= cp <= 0xFE4F or 0xFF00 <= cp <= 0xFF60
                 or 0xFFE0 <= cp <= 0xFFE6 or 0x1F300 <= cp <= 0x1FAFF or 0x20000 <= cp <= 0x3FFFD)
        total += 2 if heavy else 1
    return total


EN = [
 ("1 — the hook", """I made a tabletop card game about running a record label: 10 rounds, 24 artists, sealed bids where only the winner pays.

Then I simulated 4,400 games to find out whether it was fair.

Free for Windows, no installer. Solo vs 3 computer labels, or 2-4 players on one device.""",
  ["01-title-screen.jpg"],
  "Title screen: the gold RECORD LABEL RIVALS logo, a Choose 2-4 labels form, and four artist cards fanned out on a navy Art Deco table."),

 ("2 — what the simulations say", """What 4,400 simulated games say:

Skip the auction: 0% win rate.
Skip albums: 0%.
Skip live shows: 0%.

Play it the way the computers play: 5%.
Play it well: 41%, finishing on $394.""",
  ["06-live-show-board.jpg", "02-artist-auction.jpg"],
  "Left: the live show board with five venue tiles from Studio Session $4 to Grand Arena $12. Right: the sealed-bid auction, with a bid dial reading $8 and the note that losing bids cost nothing."),

 ("3 — the flaw it found", """The one balance flaw it found: with four equally good players, the first seat wins 50.5% of games instead of 25%.

The show phase always starts at seat 1, and equal bids break by seat order. The fix and the experiment that caught it are both in the repo.""",
  [], None),

 ("4 — the counter-intuitive design bit", """A design fact I only learned by measuring: the four trait tags are worth about 6% of your final cash.

What actually decides whether an artist belongs on albums or on stage is Vocal and Stamina. Vocal 5 unlocks the $12 arena; Vocal 4 caps you at $9.""",
  [], None),

 ("5 — the download", """Download: Windows x64, 173 MB, unzip and run.

SmartScreen will warn because it isn't signed: More info, then Run anyway.

github.com/NoahIsARider/ICONS/releases/latest""",
  ["08-winner-finale.jpg"],
  "The final chart: the winner's name above the ranked scores, Your Label $268 and ★31 acclaim against Rival Records $214 and ★24."),

 ("6 — the repo and the ask", """Source, all 24 artist card portraits, 27 print-ready icon tokens, and a strategy guide measured from those 4,400 games:

github.com/NoahIsARider/ICONS

Solo project, so tell me what breaks. Art is AI-generated, happy to talk about that too.""",
  ["09-icon-set.jpg", "10-artist-portraits.jpg"],
  "Two artwork sheets: the 27 gold-on-navy game icon medallions, and twenty-four illustrated artist portraits with their names and genres."),
]

ZH = [
 ("1 — 开场", """做了个桌面卡牌游戏《Record Label Rivals》：经营一家唱片公司，10 个回合里抢艺人、发专辑、跑演出、冲格莱美。竞价是密封的，只有赢家付钱。

免费，Windows 解压即玩；单人打 3 个电脑，也能 2-4 人同机轮流。""",
  ["01-title-screen.jpg"],
  "标题界面：金色的 RECORD LABEL RIVALS 标志、2-4 家公司的选择表单，以及深蓝 Art Deco 桌面上摊开的四张艺人卡。"),

 ("2 — 数据", """为了确认它公不公平，我跑了 4400 局模拟：

不抢艺人 → 胜率 0%
不发专辑 → 0%
不跑演出 → 0%
照电脑的打法打 → 5%
认真打 → 41%""",
  ["06-live-show-board.jpg"],
  "演出回合的界面：五张场地牌，从 Studio Session $4 到 Grand Arena $12，玩家需要在其中安排自己的艺人。"),

 ("3 — 唯一的缺陷", """唯一测出的平衡缺陷：四个同水平玩家时，1 号座位胜率 50.5%，而公平值应该是 25%。

原因是演出阶段永远从 1 号座开始，且平票判给座号小的那位。修法和找出它的实验都在仓库里。""",
  [], None),

 ("4 — 下载", """下载（Windows x64，173MB，解压即玩；未签名会被 SmartScreen 拦，点 More info → Run anyway）：

github.com/NoahIsARider/ICONS/releases/latest

源码、24 张艺人立绘、27 个可打印的图标筹码，还有那份用 4400 局模拟写出来的攻略：

github.com/NoahIsARider/ICONS""",
  ["09-icon-set.jpg"],
  "两张美术图：27 个金线深蓝底的图标圆章，以及 24 位艺人的立绘与流派。"),
]

HEAD = """# Launch copy for X

Written for a **free account**: no Premium means 280 weighted characters per post, no long-form
posts, and no edit button. Chinese characters and emoji count as two, any link counts as 23
characters no matter how long it is. Every count below is computed from the text itself by
`tools/build-promo.py`, so an edit that pushes a post over the limit shows up immediately.

Post the English thread as the main one and reply to it with the Chinese version — mixing both
languages into one post wastes the whole limit on one audience.

## How to post this on a free account

- **280 weighted characters per post.** All ten posts below fit; the tightest is EN post 1
  at 277, so it has no room for hashtags.
- **No editing.** A typo means delete and repost, which loses the replies. Read post 1 twice.
- **Up to 4 images per post, free.** Two per post is the sweet spot; the plan below uses 1-2.
- **Alt text is free.** Every image line below is written from the actual screenshot — paste it
  into the "Add description" field, it also helps reach.
- **One link per post.** Two links eat 46 characters and look like spam. The download and the
  repo link are deliberately split across posts 5 and 6.
- **Pin the first post** so the thread keeps showing on your profile.
- **Timing**: 20:00-23:00 Beijing time catches Europe's evening and the start of the US day.
- **Hashtags**: put them on the last post, not the first — post 1 is the tightest at 277/280
  and has no room left. `#indiegame #cardgame` fits at the end of post 6 (240 + 26 = 266), or
  use `#gamedev` as well and drop the word "too" from that line.
- **Don't promise what the game doesn't do**: no online play, no mobile build, Windows only, and
  the ZIP is unsigned so Windows shows a SmartScreen warning. Post 5 says this plainly, which
  pre-empts the only predictable reply.

## What the numbers in these posts come from

`4,400 games` is the habit experiment in `tools/strategy-lab.mjs` (eleven policies, 400 seeded
games each). The 0% / 5% / 41% win rates and the $394 finish are in `docs/STRATEGY.md`; the
50.5% seat figure and its two causes are in `docs/BALANCE.md`; the tags being worth 6% is in
`docs/REFERENCE.md`. Every one of them is reproducible with one command, which is the reason
they are safe to put in public.

---

# English thread

"""

MID = """
---

# Chinese thread (reply to your own first post)

"""

TAIL = """
---

# Assets to attach

| post | file | why |
| --- | --- | --- |
| EN 1 / ZH 1 | `screenshots/01-title-screen.jpg` | the logo and the promise in one frame |
| EN 2 | `screenshots/06-live-show-board.jpg` + `screenshots/02-artist-auction.jpg` | the two decisions that decide games |
| EN 5 | `screenshots/08-winner-finale.jpg` | a finished game, which proves it has an ending |
| EN 6 / ZH 4 | `screenshots/09-icon-set.jpg` + `screenshots/10-artist-portraits.jpg` | the artwork, which is what makes people stop scrolling |

That is 6 distinct images across the 10 posts; X allows four per post, so nothing here is a
constraint — it is a plan to avoid showing everything at once.
"""


def render(post, language, index):
    label, text, images, alt = post
    count = weighted(text)
    assert count <= 280, f'{language} post {index} is {count} characters'
    block = [f'### {language} post {label}', '', f'**{count} / 280 characters**', '']
    block += ['```', text.strip(), '```', '']
    if images:
        block.append('Attach: ' + ', '.join('`screenshots/' + name + '`' for name in images))
        block.append('')
        block.append('Alt text: ' + alt)
        block.append('')
    return '\n'.join(block)


body = HEAD
for index, post in enumerate(EN, 1):
    body += render(post, 'EN', index) + '\n'
body += MID
for index, post in enumerate(ZH, 1):
    body += render(post, 'ZH', index) + '\n'
body += TAIL

io.open(ROOT + 'docs/PROMO.md', 'w', encoding='utf8', newline='\n').write(body)
print('docs/PROMO.md written')
for language, posts in (('EN', EN), ('ZH', ZH)):
    print(f'  {language}:', ', '.join(f'{weighted(p[1])}' for p in posts),
          '| max', max(weighted(p[1]) for p in posts))
