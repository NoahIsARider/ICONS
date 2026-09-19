"""Build the expansion artwork contact sheets used by the README.

Same layout, palette and fonts as tools/build-art-sheets.py, so the two expansions sit next to the
base game's sheets without looking like a different game.
"""
import json, os, subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'screenshots')
BG = (7, 16, 27)
GOLD = (233, 183, 95)
CREAM = (247, 234, 210)
MUTED = (140, 165, 170)
TEAL = (125, 224, 214)
FONT = 'C:/Windows/Fonts/georgia.ttf'
FONT_UI = 'C:/Windows/Fonts/segoeui.ttf'


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        return ImageFont.load_default()


def nodedata(expression):
    result = subprocess.run(['node', '-e', expression], cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit(f'node failed: {result.stderr}')
    return json.loads(result.stdout)


def covercrop(path, tile_w, tile_h, top_bias=0.22):
    card = Image.open(path).convert('RGB')
    scale = max(tile_w / card.width, tile_h / card.height)
    card = card.resize((round(card.width * scale), round(card.height * scale)), Image.LANCZOS)
    left = (card.width - tile_w) // 2
    top = int((card.height - tile_h) * top_bias)
    return card.crop((left, top, left + tile_w, top + tile_h))


def build_icon_sheet(name, title, subtitle, icon_dir, labels, jpeg_quality=90):
    order = sorted(os.path.basename(path) for path in os.listdir(icon_dir) if path.endswith('.png'))
    assert len(order) == len(labels), f'{name}: {len(order)} icons for {len(labels)} labels'
    cols, tile, pad, head, label_h = 5, 270, 22, 108, 36
    rows = (len(order) + cols - 1) // cols
    width = pad + cols * (tile + pad)
    height = head + rows * (tile + label_h + pad)
    board = Image.new('RGB', (width, height), BG)
    draw = ImageDraw.Draw(board)
    draw.text((pad + 2, 30), 'ACTOR AGENCY RIVALS', font=font(FONT_UI, 15), fill=GOLD)
    draw.text((pad + 2, 54), subtitle, font=font(FONT, 24), fill=CREAM)
    for index, filename in enumerate(order):
        col, row = index % cols, index // cols
        x = pad + col * (tile + pad)
        y = head + row * (tile + label_h + pad)
        icon = Image.open(os.path.join(icon_dir, filename)).convert('RGBA')
        icon = icon.resize((tile - 12, tile - 12), Image.LANCZOS)
        board.paste(icon, (x + 6, y + 6), icon)
        label = labels[index]
        size = draw.textlength(label, font=font(FONT_UI, 15))
        draw.text((x + tile / 2 - size / 2, y + tile + 8), label, font=font(FONT_UI, 15), fill=MUTED)
    target = os.path.join(OUT, name)
    board.save(target, 'JPEG', quality=jpeg_quality, optimize=True)
    print(f'{name}: {board.size[0]}x{board.size[1]}, {os.path.getsize(target) // 1024} KB, {len(order)} icons')
    return f'{title}: {len(order)}'


def build_portrait_sheet(name, subtitle, people, cols=6, tile_w=260, tile_h=390, label_h=52, quality=88):
    pad, head = 26, 96
    rows = (len(people) + cols - 1) // cols
    width = pad + cols * (tile_w + pad)
    height = head + rows * (tile_h + label_h + pad)
    board = Image.new('RGB', (width, height), BG)
    draw = ImageDraw.Draw(board)
    draw.text((pad + 6, 26), 'ACTOR AGENCY RIVALS', font=font(FONT_UI, 15), fill=GOLD)
    draw.text((pad + 6, 50), subtitle, font=font(FONT, 22), fill=CREAM)
    for index, person in enumerate(people):
        col, row = index % cols, index // cols
        x = pad + col * (tile_w + pad)
        y = head + row * (tile_h + label_h + pad)
        board.paste(covercrop(person['portrait'], tile_w, tile_h), (x, y))
        draw.rectangle([x, y, x + tile_w - 1, y + tile_h - 1], outline=(212, 167, 92), width=2)
        draw.text((x + 4, y + tile_h + 12), person['name'], font=font(FONT, 19), fill=CREAM)
        draw.text((x + 4, y + tile_h + 32), person['genre'].upper(), font=font(FONT_UI, 12), fill=MUTED)
    target = os.path.join(OUT, name)
    board.save(target, 'JPEG', quality=quality, optimize=True)
    print(f'{name}: {board.size[0]}x{board.size[1]}, {os.path.getsize(target) // 1024} KB, {len(people)} cards')


ACTING_LABELS = [
    'Casting', 'Coaching & Care', 'Industry Event', 'Production', 'Shoot Day',
    'Golden Reel', 'Reviews', 'Career Risk', 'Wrap',
    'Cash', 'Residuals', 'Acclaim', 'Presence', 'Craft', 'Stamina',
    'Two-Hander', 'Mentorship', 'Location',
    'Method', 'Range', 'Star Power', 'Box Office', 'Burnout', 'Injury',
    'Pressure', 'Meltdown', 'Retirement',
]

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)

    build_icon_sheet('11-actor-agency-icons.jpg', 'acting set',
                     'Every medallion the acting edition uses, on the base set’s navy and gold.',
                     os.path.join(ROOT, 'dlc', 'actor-agency', 'icons'), ACTING_LABELS)

    cast = nodedata("import('./dlc/actor-agency/actor-data.mjs')"
                    ".then(d=>console.log(JSON.stringify([...d.artists,...d.starters]"
                    ".map(a=>[a.id,a.name,a.genre]))))")
    actors = [{'portrait': os.path.join(ROOT, 'dlc', 'actor-agency', 'portraits', f'{i}.jpg'),
               'name': n, 'genre': g} for i, n, g in cast
              if os.path.exists(os.path.join(ROOT, 'dlc', 'actor-agency', 'portraits', f'{i}.jpg'))]
    build_portrait_sheet('12-actor-agency-cast.jpg',
                         'Twenty-four actors, cast card by card.', actors)

    singers = nodedata("import('./data.mjs')"
                       ".then(d=>console.log(JSON.stringify([...d.starters,...d.artists]"
                       ".map(a=>[a.id,a.name,a.genre]))))")
    debut = [{'portrait': os.path.join(ROOT, 'portraits', f'{i}.jpg'), 'name': n,
              'genre': f'SINGER · {g}'} for i, n, g in singers
             if os.path.exists(os.path.join(ROOT, 'portraits', f'{i}.jpg'))]
    debut += [{'portrait': os.path.join(ROOT, 'dlc', 'actor-agency', 'portraits', f'{i}.jpg'),
               'name': n, 'genre': f'ACTOR · {g}'} for i, n, g in cast
              if os.path.exists(os.path.join(ROOT, 'dlc', 'actor-agency', 'portraits', f'{i}.jpg'))]
    build_portrait_sheet('13-debut-night-cast.jpg',
                         'Forty-eight cards are eligible for the seven debut seats.',
                         debut, cols=8, tile_w=232, tile_h=348, label_h=48, quality=82)
