# DLC asset manifest

Two expansions are planned, and neither one touches the rules engine: each DLC swaps the data
table and the artwork, so every number measured in `docs/REFERENCE.md` still holds.

- **DLC 1 — STUDIO SEASON (演员经纪公司)**: the same ten rounds played by an acting agency.
  Rounds become casting, coaching, shoots and productions; the cards are 24 actors.
- **DLC 2 — STAGE SEASON: DEBUT NIGHT (乘风破浪/披荆斩棘式的成团舞台)**: the labels bring their own
  cards to a mixed-gender stage competition and fight over the debut slots (出道位), trying to
  debut more of their own and in higher positions. It **reuses every existing card**, singers and
  actors alike, so it needs new stages and medallions rather than new faces.

This file is the shopping list for image generation: what to make, how many, what the files are
named, and the prompt for each sheet.

## The slicing contract

Three asset types exist, and the build scripts cut them mechanically. Art that ignores these
rules cannot be sliced automatically.

| type | source sheet | sliced to | output |
| --- | --- | --- | --- |
| medallion icon | one **3×3 grid** on a genuinely transparent background, roughly 1536×1024 or larger | `icons/NN-slug.png` | 512×512 RGBA, auto-cropped to the medallion |
| card portrait | one **3×2 grid** (3 across, 2 down), 2:3 cells, ~1254×1254 total | `portraits/<id>.jpg` | 350×525 JPEG |
| background | single image | `assets/<name>.png` | 1672×941 for the board, 1920×1080 for scenes |

Rules that make the cutter work: equal cells, clear gutters between them, exactly one subject per
cell, **no text, letters, numbers, signatures or watermarks anywhere**, and for medallions no
stray specks in the transparent gutters (the cropper finds each medallion's bounding box by alpha).
Medallion slugs stay stable — `01-recruitment`, `06-awards`, `14-creativity` … — because the code
refers to them by name; only the picture inside changes.

## DLC 1 — STUDIO SEASON

### What changes, and nothing else

| music build | acting build |
| --- | --- |
| label / artist | agency / actor |
| Vocal (嗓音) | **Presence (镜前魅力)** — which project tiers an actor can carry |
| Creativity (创造力) | **Craft (演技)** — production quality |
| Stamina | Stamina (档期与体力) |
| album | **production** (a series or film) |
| royalties | **residuals** (分账) |
| live show | **shoot day** |
| Studio / Night Club / Festival / Grand Arena | **Web Short $4 / Streaming Series $6 / Prime-Time Drama $9 / Feature Film $12** |
| Solo Tour | **Auteur Project $10** (unlocked by having a production out) |
| Grammy | **GOLDEN REEL AWARD (金胶片奖)** |
| acclaim | reviews |
| collaboration single | **two-hander** (对手戏火花) |
| Artpop / Jazz / Vocal Flip / Empress | **Method 方法派 +1 quality / Range 戏路宽 (ignores being typecast) / Star Power 票房号召力 +1 presence / Box Office 票房帝后 (wins award ties)** |
| Stress / Illness / Exhaustion / Drugs / Tobacco / Death | **Pressure 舆论压力 / Injury 伤病 / Burnout 过劳 / Meltdown 崩溃 / Typecast 戏路固化 / Retirement 淡出银幕** |
| events: tours, festivals, award season | film festival, media visit, heatwave on set, censorship scare, tax rebate, awards season, bad reviews, wrap party |

### 勋章 medallions — 27, three sheets, same slugs

**Sheet A — the nine phases (`source/dlc1-01-phases.png`)**

Prompt:

> Use case: stylized-concept. Asset type: production-ready icon sprite sheet for an acting-agency tabletop game: exactly nine icons in a precise 3x3 grid, equal cells, transparent gutters, no overlap. Row 1: casting call (a director's clapperboard crossed with a signed contract and pen); acting coaching (a five-point star above a heart with an upward arrow, a script page behind); industry event (a lightning bolt over a folded newspaper and a strip of film). Row 2: production (a film reel with a stylus and a script page); shoot day (a film camera on a tripod lit by a spotlight); the Golden Reel Award (a golden film reel on a plinth with a laurel wreath). Row 3: reviews (a critic's page with a star and laurel); career scales (a balance scale holding a cracked star, quiet and tasteful); wrap (a circular arrow around a film reel). Match the existing set exactly: luxurious Art Deco board game iconography, deep midnight navy circular enamel medallions with thin antique gold rims, gleaming gold symbols with restrained electric magenta and teal accents, bold clear silhouettes, crisp geometric lines, readable at 40 px. No letters, no numbers, no words, no watermark, no mockup. Genuinely transparent background outside the medallions.

**Sheet B — resources and mechanics (`source/dlc1-02-resources.png`)**

Prompt:

> Use case: stylized-concept. Asset type: production-ready icon sprite sheet for the SAME premium acting-agency tabletop game. Exactly nine distinct circular icons in a precise 3x3 grid, equal cells, transparent gutters, no overlap. Row 1: cash (a stack of banknotes with a coin); residuals (a film reel with recurring gold coin arrows); reviews (a five-point critic's star with a small laurel). Row 2: screen presence (a spotlighted profile silhouette in a beam of light); craft (a quill nib over script pages with a star); stamina (an energetic heartbeat pulse around a small heart). Row 3: two-hander (two clapperboards crossing over a shared film reel); mentorship (an older and a younger performer silhouette joined by a star); location placement (a stylized game meeple standing on a film-set floor marker). Match the existing art direction exactly: luxurious Art Deco board game iconography, deep midnight navy circular enamel medallions with thin antique gold rims; gleaming gold symbols with restrained electric magenta and teal accent; bold clear silhouettes, crisp geometric lines, readable at 40 px. No letters, no numbers, no words, no watermark, no mockup. Genuinely transparent background outside the medallions.

**Sheet C — keywords and statuses (`source/dlc1-03-status.png`)**

Prompt:

> Use case: stylized-concept. Asset type: production-ready icon sprite sheet for the SAME premium acting-agency tabletop game. Exactly nine distinct circular icons in a precise 3x3 grid, equal cells, transparent gutters, no overlap. Row 1: method acting (a theatrical mask under a spotlight); range (a mask flanked by two-way arrows spanning two script pages, meaning the actor can play anything); star power (a marquee star with an upward arrow). Row 2: box office (a regal crown above a film reel); burnout (a nearly empty battery with a drooping spotlight); injury (a medical cross with a bandaged heart). Row 3: pressure (a cracked lightning bolt over a tense profile silhouette with camera flashes); meltdown (a cracked star crossed by a warning slash — tasteful, not graphic); retirement (a folded director's chair beside a dimmed lamp and one small star — quiet and tasteful). Match the existing art direction exactly: luxurious Art Deco board game iconography, deep midnight navy circular enamel medallions with thin antique gold rims; gleaming gold symbols with restrained electric magenta and teal accent; bold clear silhouettes, crisp geometric lines, readable at 40 px. No letters, numbers, words, watermark, mockup. Genuinely transparent background outside the medallions.

**Which symbol goes in which file** — the reading order of each prompt is exactly this order, so
the cutter can be configured straight from the table:

| slug | sheet A (phases) | sheet B (resources) | sheet C (keywords) |
| --- | --- | --- | --- |
| 01 / 10 / 19 | `01-recruitment` casting call | `10-cash` banknotes and coin | `19-artpop` method mask |
| 02 / 11 / 20 | `02-training` acting coaching | `11-royalties` residuals | `20-jazz` range |
| 03 / 12 / 21 | `03-event` industry event | `12-acclaim` reviews star | `21-vocal-flip` star power |
| 04 / 13 / 22 | `04-creation` production | `13-vocal` screen presence | `22-empress` box office crown |
| 05 / 14 / 23 | `05-concert` shoot day | `14-creativity` craft | `23-exhaustion` burnout |
| 06 / 15 / 24 | `06-awards` the Golden Reel | `15-stamina` stamina | `24-disease` injury |
| 07 / 16 / 25 | `07-critics` reviews | `16-collaboration` two-hander | `25-stress` pressure |
| 08 / 17 / 26 | `08-karma` career scales | `17-legacy` mentorship | `26-banned-substances` meltdown |
| 09 / 18 / 27 | `09-reset` wrap | `18-worker-placement` location placement | `27-death` retirement |

### 人物 portraits — 24 actors, four sheets of six

The actors keep the singers' stat skeleton one-to-one, so balance carries over untouched. Each
sheet is a 3×2 grid in this reading order (left to right, then next row).

| sheet | id | name | genre / 戏路 | P / C / S | tag |
| --- | --- | --- | --- | --- | --- |
| 1 | `vera` | Vera Quinn | Drama | 4 / 4 / 3 | Method |
| 1 | `silas` | Silas Reed | Thriller | 3 / 5 / 3 | Star Power |
| 1 | `marcus` | Marcus Vale | Noir | 5 / 3 / 3 | Range |
| 1 | `jules` | Jules Moreau | Romance | 5 / 3 / 3 | Star Power |
| 1 | `dahlia` | Dahlia Crown | Blockbuster | 5 / 4 / 2 | Box Office |
| 1 | `river` | River Star | Musical | 4 / 4 / 4 | Method |
| 2 | `ophelia` | Ophelia Marsh | Arthouse | 3 / 5 / 3 | Method |
| 2 | `hugh` | Hugh Ashby | Western | 4 / 4 / 4 | Range |
| 2 | `ramon` | Ramon Solis | Crime | 5 / 3 / 4 | Star Power |
| 2 | `noor` | Noor Vance | Prestige | 4 / 5 / 3 | Box Office |
| 2 | `viola` | Viola Reyes | Action | 5 / 3 / 3 | Star Power |
| 2 | `otto` | Otto Sky | Sci-Fi | 3 / 5 / 4 | Method |
| 3 | `clara` | Clara Glass | Period | 4 / 4 / 4 | Range |
| 3 | `monte` | Monte Gold | Heist | 5 / 3 / 3 | Star Power |
| 3 | `esme` | Esme Fox | Horror | 5 / 3 / 4 | Star Power |
| 3 | `wren` | Wren Winter | Mystery | 3 / 5 / 3 | Method |
| 3 | `zoe` | Zoe Pulse | Sitcom | 4 / 4 / 4 | Method |
| 3 | `kito` | Kito Tempo | Martial Arts | 4 / 4 / 3 | Star Power |
| 4 | `sabine` | Sabine Noir | Drama | 5 / 4 / 2 | Box Office |
| 4 | `pia` | Pia Blume | Comedy | 4 / 4 / 4 | Star Power |
| 4 | `anna` | Anna Kite | Indie Film | 3 / 3 / 4 | Range |
| 4 | `bruno` | Bruno Beck | Comedy | 4 / 2 / 4 | Star Power |
| 4 | `lena` | Lena Lux | Romance | 3 / 4 / 4 | Method |
| 4 | `dario` | Dario Blue | Crime | 4 / 3 / 3 | Range |

Sheets 1–3 hold eighteen of the twenty auction actors; sheet 4 holds the last two plus the four
starting actors. Pairing mirrors the music deck as well: `vera`↔`silas`, `marcus`↔`jules`,
`dahlia`↔`river`, `ophelia`↔`hugh`, `ramon`↔`noor`, `viola`↔`otto`, `clara`↔`monte`,
`esme`↔`wren`, `zoe`↔`kito`, `sabine`↔`pia` are the two-handers, and each pair member keeps the
mentor link the singer version had.

Portrait prompt, sheet 1 (the other three follow the same template with their own six subjects):

> Use case: stylized-concept. Asset type: character portrait sprite sheet for a premium tabletop acting-agency game. Exactly SIX portraits in a clean 3x2 grid, three across and two down, equal cells, no gutters wider than a few pixels, no overlap, no text. Painterly semi-realistic digital illustration, cinematic key light, deep navy and warm gold palette with restrained magenta or teal rim light, each subject chest-up and turned slightly off camera, genre-coded wardrobe and a distinct background environment per cell. Top row, left to right: a 30s woman with copper bob hair in a camel trench coat, soft window light, drama rehearsal room behind her; a 30s Black man with short hair in a sharp charcoal suit, cold blue night light, a rain-streaked warehouse behind him; a 40s man with a weathered face, fedora and raincoat, amber street lamp on wet cobblestones behind him. Bottom row, left to right: a 30s woman with dark hair in a silk slip dress, golden-hour light, a balcony above a city; a 30s woman with a sculpted updo in a red-carpet gown, neon marquee glow behind her; a 20s man in loose dance clothes, warm rehearsal-mirror light and a barre behind him. Match the existing portrait set: rich painterly detail, strong single-source lighting, no text anywhere, 2:3 portrait framing inside each cell.

### 背景 backgrounds — 8

| file | size | scene |
| --- | --- | --- |
| `assets/studio-table.png` | 1672×941 | the agency board: the same Art Deco table construction as the record table — deep navy felt with gold inlaid ellipses and an empty centre for the UI — but the out-of-focus props around the edge are a clapperboard, a script, a film reel, an editing monitor, a brass lamp, a leather chair and a wardrobe rail |
| `assets/scene-web-short.png` | 1920×1080 | micro-budget set: one room, ring light, phone on a tripod, gaffer tape |
| `assets/scene-streaming.png` | 1920×1080 | streaming series: mid-size studio floor, lighting rig, monitors |
| `assets/scene-network.png` | 1920×1080 | prime-time drama: large soundstage, crew silhouettes, cranes |
| `assets/scene-feature.png` | 1920×1080 | feature film: cinema-grade set with a premiere red carpet beyond |
| `assets/scene-auteur.png` | 1920×1080 | auteur project: empty theatre stage, single chair, one spotlight |
| `assets/scene-golden-reel.png` | 1920×1080 | the award ceremony: gold curtain, plinth, spotlight, empty centre |
| `assets/title-studio-season.png` | 1920×1080 | key art for the title screen: a marquee and a soundstage at night, room on the left for the logo |

Prompt template for the board and scenes (replace the scene sentence):

> Use case: stylized-concept. Asset type: background artwork for a premium tabletop acting-agency game. A single 16:9 image: SCENE. Keep the centre of the frame visually quiet and uncluttered so interface panels can sit on top of it. Cinematic ambient lighting, deep midnight navy base with warm antique gold highlights and restrained electric magenta and teal accent light, painterly semi-realistic digital illustration, slight vignette, no text, no letters, no numbers, no watermark, no user interface, no people looking at the camera.

## DLC 2 — STAGE SEASON: DEBUT NIGHT

### 人物 — 0 new portraits (reuse all 48)

Every singer and every actor can enter this show, so the twenty-four music portraits and the
twenty-four acting portraits are the whole cast. If the mentors should be visible on screen
rather than described in text, add one sheet of six (optional):

| id | role |
| --- | --- |
| `judge-art` | Artistic Director |
| `judge-vocal` | Vocal Coach |
| `judge-dance` | Dance Director |
| `judge-rap` | Rap Mentor |
| `judge-stage` | Stage Producer |
| `judge-host` | Host |

> Use case: stylized-concept. Asset type: character portrait sprite sheet for a premium tabletop stage-competition game. Exactly SIX portraits in a clean 3x2 grid, three across and two down, equal cells, no overlap, no text. Painterly semi-realistic digital illustration, cinematic stage lighting, deep navy with warm gold and restrained magenta or teal accents, each subject chest-up and slightly off camera, professional and authoritative rather than glamorous. Top row: a 50s woman artistic director in a black turtleneck with a studio light rig behind her; a 40s man vocal coach with headphones around his neck in a rehearsal room; a 30s woman dance director in a track jacket in front of a mirrored wall. Bottom row: a 30s man rap mentor with a chain and a cap in a dim studio; a 40s man stage producer with a headset and clipboard beside a lighting console; a 30s woman host in an elegant stage dress holding a card, out-of-focus audience lights behind her. Match the existing portrait set: rich painterly detail, strong single-source lighting, 2:3 portrait framing inside each cell, no text anywhere.

### 勋章 medallions — 9 new, one sheet (`source/dlc2-stage.png`)

Numbering continues after the base set so both sets can coexist: `28-debut-slot` … `36-elimination`.

Prompt:

> Use case: stylized-concept. Asset type: production-ready icon sprite sheet for a premium stage-competition tabletop game. Exactly nine distinct circular icons in a precise 3x3 grid, equal cells, transparent gutters, no overlap. Row 1: debut slot (an empty stool on a stage lit by a single spotlight); centre position (a centre-stage floor marker with a small crown and star); the group (three interlocking rings forming one badge). Row 2: audience vote (a ballot box with a heart and a star); judge score (a judge's paddle showing three stars); stage performance (a stage with crossing spotlight beams and a microphone stand). Row 3: rehearsal (a rehearsal mirror with dance shoes on the floor); theme song (a sheet of music with a spotlight beam and one star); elimination (a dimmed spotlight over an empty stool, quiet and tasteful). Match the base game exactly: luxurious Art Deco board game iconography, deep midnight navy circular enamel medallions with thin antique gold rims, gleaming gold symbols with restrained electric magenta and teal accents, bold clear silhouettes, readable at 40 px. No letters, no numbers, no words, no watermark, no mockup. Genuinely transparent background outside the medallions.

**Slug order for the stage sheet**: `28-debut-slot` (empty stool in a spotlight), `29-center`
(centre-stage marker with crown), `30-group` (three interlocking rings), `31-vote` (ballot box),
`32-score` (judge's paddle), `33-stage` (stage with beams and mic stand), `34-rehearsal` (mirror
and dance shoes), `35-theme-song` (sheet music and spotlight), `36-elimination` (dimmed spotlight
over an empty stool).

### 背景 backgrounds — 6

| file | size | scene |
| --- | --- | --- |
| `assets/stage-board.png` | 1672×941 | the board: the same Art Deco table construction viewed from above a stage floor — navy surface with gold inlaid lanes and an empty centre — with out-of-focus floor monitors, a lighting truss, a rail of costumes and a water bottle at the frame edges |
| `assets/scene-stage.png` | 1920×1080 | the main round backdrop: a live stage with beams, a band riser and an audience in silhouette |
| `assets/scene-rehearsal.png` | 1920×1080 | rehearsal room and backstage corridor: mirrored wall, tape marks on the floor, costume rail |
| `assets/scene-ranking.png` | 1920×1080 | the ranking board: a huge dark screen with nine empty slots and hanging spotlights, deliberately unreadable |
| `assets/scene-debut-night.png` | 1920×1080 | the finale: nine lit stools in a row on a stage, confetti suspended, gold curtain |
| `assets/title-stage-season.png` | 1920×1080 | key art for the title screen: a stage seen from the wings at night, room on the left for the logo |

## Totals

| set | sheets to generate | images inside |
| --- | --- | --- |
| DLC 1 medallions | 3 | 27 |
| DLC 1 portraits | 4 | 24 |
| DLC 1 backgrounds | 8 | 8 |
| DLC 2 medallions | 1 | 9 |
| DLC 2 mentor portraits (optional) | 1 | 6 |
| DLC 2 backgrounds | 6 | 6 |
| **total** | **23 sheets** | **80 images** |

The playable minimum for DLC 1 is the three medallion sheets plus the four portrait sheets; the
backgrounds are polish and can arrive later. For DLC 2 the single medallion sheet is enough,
because every face already exists.

## Where the files go

```
dlc/studio-season/icons/01-recruitment.png … 27-death.png
dlc/studio-season/portraits/vera.jpg … dario.jpg
dlc/studio-season/backgrounds/… (the eight above)
dlc/stage-season/icons/28-debut-slot.png … 36-elimination.png
dlc/stage-season/portraits/judge-*.jpg (optional)
dlc/stage-season/backgrounds/… (the six above)
```

The app needs one switch to point at a DLC folder instead of the root `icons/`, `portraits/` and
`assets/` directories; `data.mjs` gains a sibling per DLC with the new names, genres and slugs.
Both are small, mechanical changes once the art exists.
