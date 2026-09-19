# Play the expansions

Both expansions are part of the same desktop game and use its midnight navy felt, antique gold trim, painterly card portraits, and local multiplayer format. All game text is in English. The people and shows are fictional.

| Edition | Open in the local game | Core objective |
| --- | --- | --- |
| Record Label Rivals | `/` | Finish ten rounds with the most cash. |
| Actor Agency Rivals | `/actor.html` | Cast actors, produce screen works, book shoot days, and finish ten rounds with the most cash. |
| Debut Night | `/ensemble.html` | Send singers and actors to a five-episode mixed group competition; own more of the seven debut seats and place higher. |

The title screen links to both DLCs. Every edition allows 2–4 local companies, including one human against computer players. Each edition has its own autosave in local storage. The main game's existing desktop save remains separate.

## Actor Agency Rivals

The ten-round game keeps the original economy and worker placement rules. Twenty-four original actors replace the singer deck, including four young coming-of-age performers. Their portrait backgrounds depict different film genres and sets while sharing the base game's rendering, card finish, and color family.

| Main game | Actor edition |
| --- | --- |
| Artist auction | Casting auction |
| Vocal / Creativity | Presence / Craft |
| Album / royalties | Screen production / residuals |
| Live show | Shoot day |
| Grammy | Golden Reel |
| Critic acclaim | Reviews |
| Artpop / Jazz / Vocal Flip / Empress | Method / Range / Star Power / Box Office |

The four trait names are presentation labels over the original balanced stat effects. Actor collaborations and mentor inheritance also work. The film-set table appears through all nine phases; casting and award phases use their own animated assets.

## Debut Night

Each company starts with **two singer cards and two actor cards** from the existing and new decks. Five episodes have two decisions:

1. **Rehearsal:** place one card in Vocal, Choreography, or Camera Rehearsal. Each specialist space accepts one company per episode. Recovery remains open to everyone and clears fatigue.
2. **Stage:** submit a card, pick Vocal, Dance, or Story, and spend $0–$3 on promotion. Submissions stay sealed until all companies have acted. A six-sided roll, card skill, rehearsal, fatigue, and promotion determine that episode's result.

Performers gain fans from their stage score; the top three receive another 5, 3, and 1 fan respectively. After episode five, the seven performers with the most fans debut. Ranks 1–7 score **10, 8, 6, 5, 4, 3, 2** points for their company. The company with the most debut seats earns **8** extra points; tied seat leaders each receive the bonus. Most points wins.

## Art files

- `dlc/actor-agency/portraits/`: 24 individual actor card portraits. Source contact sheets are under `source-sheets/`.
- `dlc/actor-agency/icons/`: 27 acting-themed 512 × 512 PNG medallions. Source sheets are under `icon-sheets/`.
- `dlc/actor-agency/film-set-table.png` and `dlc/ensemble-debut/debut-stage-table.png`: 1672 × 941 tabletop backgrounds.
- Both `animation/` directories: source sprite sheets, six individual frames, and playable animated PNGs (`*-animated.png`). The animation files have seven encoded frames because the final frame is held briefly; they were verified with FFprobe.

The `dlc/build-visual-assets.ps1`, `dlc/build-actor-icons.ps1`, and `dlc/build-animation-assets.ps1` scripts regenerate sliced files from source sheets already checked into the project. FFmpeg is required to run the scripts; it is **not** required to play the game.

Run `./build-desktop.ps1` before building the Windows executable. It stages only runtime art and code under `desktop-app/`, excluding source sprite sheets and individual animation frames. The local browser server serves both DLC pages directly.

From `desktop-app/`, the separate DLC executable used for validation was built with:

```powershell
node .\node_modules\@electron\packager\bin\electron-packager.mjs . RecordLabelRivalsDLC --platform=win32 --arch=x64 --out=../dist-dlc-final --asar --prune=true --icon=assets/app.ico
```
