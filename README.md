# Record Label Rivals

A playable, English-language record label strategy game for 2–4 labels. Play with friends on one device, or play solo against computer labels. No account or online service is required. Progress saves in your browser automatically.

## Play

**Windows:** double-click `PLAY.cmd`. Keep its terminal window open while playing.

**Any system with Node.js 20+:** run `node server.mjs` in this folder, then visit `http://localhost:4173`.

The game has no package dependencies. The browser loads the local game files and icon artwork from the server.

## Goal and turn structure

The label with the most cash after **10 rounds** wins. Acclaim and release count break cash ties. Each round has nine phases:

1. **Recruitment:** two artists enter sealed-bid auctions. The highest bid signs each artist.
2. **Training & Care:** each label can improve an ability, recover an artist, or pass.
3. **Event:** reveal a card that changes the round.
4. **Album Creation:** each label can release one album. Quality sets acclaim and recurring royalties.
5. **Live Show:** each label places one artist at a shared venue or on an unlocked Solo Tour. Shows pay immediately.
6. **Grammy Awards:** the best new release wins. Acclaim also pays a cash benefit.
7. **Critics:** the label at the bottom of the acclaim track loses cash.
8. **Karma:** status effects may permanently reduce an artist's ability or cause death.
9. **Reset:** collect royalties, recover stamina, and begin the next round.

Artpop boosts album creation. Vocal Flip boosts shows. Jazz protects Vocal from Tobacco. Empress wins Grammy quality ties. Related artists can gain mentorship and release collaboration singles; a younger artist can inherit a creative spark if a mentor dies.

## Controls

Use the **I'M READY** screen when passing the device to another human player. Auction bids stay hidden until all labels submit. The right panel shows label standings and recent activity. The game autosaves after every action. **New Game** starts over after confirmation.

## Files

- `index.html`, `app.mjs`, `style.css`: playable interface.
- `engine.mjs`, `data.mjs`: rules and game content.
- `server.mjs`: local static server.
- `test/game.test.mjs`: complete-game and rule tests; run with `node --test`.
- `icons/`: 27 individual 512 × 512 transparent PNGs.
- `icons-preview.png`: labeled icon contact sheet.
- `source/`, `build_icons.ps1`, `PROMPTS.md`: original sprite sheets and artwork build information.

For print, check a physical proof at the intended token size. The icons are raster illustrations, not vector files.
