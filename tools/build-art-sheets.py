"""Build the artwork contact sheets used by the README."""
import os, json, subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'screenshots')
os.makedirs(OUT, exist_ok=True)
BG = (7, 16, 27)
GOLD = (233, 183, 95)
CREAM = (247, 234, 210)
MUTED = (140, 165, 170)
FONT = 'C:/Windows/Fonts/georgia.ttf'
FONT_UI = 'C:/Windows/Fonts/segoeui.ttf'

def font(path, size):
    try: return ImageFont.truetype(path, size)
    except OSError: return ImageFont.load_default()

# --- icon sheet: reuse the labelled contact sheet the build already produces -----------
sheet = Image.open(os.path.join(ROOT, 'icons-preview.png')).convert('RGB')
sheet.thumbnail((1500, 4000), Image.LANCZOS)
sheet.save(os.path.join(OUT, '09-icon-set.jpg'), 'JPEG', quality=90, optimize=True)
print('09-icon-set.jpg', sheet.size, os.path.getsize(os.path.join(OUT, '09-icon-set.jpg')) // 1024, 'KB')

# --- portrait sheet: every artist portrait with their label name ------------------------
names = json.loads(subprocess.run(
    ['node', '-e', "import('./data.mjs').then(d=>console.log(JSON.stringify("
                   "[...d.starters,...d.artists].map(a=>[a.id,a.name,a.genre]))))"],
    cwd=ROOT, capture_output=True, text=True).stdout)
names = {i: (n, g) for i, n, g in names}
order = [i for i in names if os.path.exists(os.path.join(ROOT, 'portraits', f'{i}.jpg'))]
cols, tile_w, tile_h = 6, 260, 390
rows = (len(order) + cols - 1) // cols
pad, head, label_h = 26, 96, 52
width = pad + cols * (tile_w + pad)
height = head + rows * (tile_h + label_h + pad)
board = Image.new('RGB', (width, height), BG)
draw = ImageDraw.Draw(board)

draw.text((pad + 6, 26), 'TWENTY-FOUR VOICES', font=font(FONT_UI, 15), fill=GOLD)
draw.text((pad + 6, 50), 'Every artist enters the deck with a portrait, a genre and a trait.',
          font=font(FONT, 22), fill=CREAM)

for index, artist_id in enumerate(order):
    col, row = index % cols, index // cols
    x = pad + col * (tile_w + pad)
    y = head + row * (tile_h + label_h + pad)
    card = Image.open(os.path.join(ROOT, 'portraits', f'{artist_id}.jpg')).convert('RGB')
    # cover-crop into the tile, keeping the face centred
    scale = max(tile_w / card.width, tile_h / card.height)
    card = card.resize((round(card.width * scale), round(card.height * scale)), Image.LANCZOS)
    left = (card.width - tile_w) // 2
    top = int((card.height - tile_h) * 0.22)
    card = card.crop((left, top, left + tile_w, top + tile_h))
    board.paste(card, (x, y))
    draw.rectangle([x, y, x + tile_w - 1, y + tile_h - 1], outline=(212, 167, 92), width=2)
    name, genre = names[artist_id]
    draw.text((x + 4, y + tile_h + 12), name, font=font(FONT, 19), fill=CREAM)
    draw.text((x + 4, y + tile_h + 32), genre.upper(), font=font(FONT_UI, 12), fill=MUTED)

target = os.path.join(OUT, '10-artist-portraits.jpg')
board.save(target, 'JPEG', quality=88, optimize=True)
print('10-artist-portraits.jpg', board.size, os.path.getsize(target) // 1024, 'KB', f'({len(order)} portraits)')
