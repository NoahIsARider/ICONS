# Balance audit

Every number here was produced by playing the engine against itself:

```
node tools/strategy-lab.mjs all 400     # 400 seeded games per line; seats driven by explicit policies,
                                        # computer labels use the shipped aiAction
```

Re-run it after any rules change — the claim and the check live in the same repository.

## Scorecard

| dimension | measurement (400 games per line) | verdict |
| --- | --- | --- |
| Skill expression | passive play 0% · plays like the computers 5% · a good policy 41% (seat 0 vs 3 computers) | strong — copying the computer's own style is not a winning plan |
| Multiple viable builds | equal spending power: balanced 40%, breadth 40%, writers 28%, voices 10% | acceptable — three builds are close, one is a trap |
| Snowballing | the cash leader after round 5 goes on to win 64–73% | normal for a ten-round economy |
| Opponent strength | 5% against three computers, 58% against one, when playing their style | the computers are a real opponent, and a beatable one |
| Cost of a bad start | never bidding 0% · stopping after round 1 6% · one show per round 3% | punishing but not instantly fatal |
| Positional fairness | four identical players: **50.5% / 27.3% / 14.3% / 8.0% by seat** | **the one flaw worth fixing** |
| Luck vs skill | die rolls and shuffles swing single games; policy swings the win rate from 0% to 41% | fine for a light game |

## The one real flaw: the first seat

With four players of identical skill the shipped engine hands the first seat a 50.5% share of
wins against a fair 25% — more than double. Three rules stack up to cause it:

1. **The live-show phase always starts at seat 0** (`nextPhase` sets `state.current = 0`), and
   both placement cycles do too. Seat 0 therefore claims the best stage every round, and the
   best stage (Grand Arena, $12) pays roughly three times the worst (Studio, $4).
2. **Auction ties are broken by seat id** (`resolveAuction`: `a.player.id - b.player.id` after
   bid and acclaim), so equal bids always fall to the earliest seat.
3. **Grammy ties fall back to the lowest work id** (`awards`: `a.id - b.id`), and works are
   created in seat order, so the earliest seat wins quality ties plus the accompanying acclaim
   and prize.

Measured with four identical players, 400 games each:

| variant | seat 0 | seat 1 | seat 2 | seat 3 |
| --- | --- | --- | --- | --- |
| as shipped | 50.5% | 27.3% | 14.3% | 8.0% |
| live-show order rotates each round | 27.3% | 27.8% | 30.3% | 14.8% |

Rotating only the live-show start seat removes most of the effect, and the placements per seat
even out (19.5 / 18.9 / 18.0 / 17.0 → 17.6 / 17.7 / 18.2 / 17.2). The residual gap at seat 3
comes from the two tie-break rules above.

### Verified fix for the show order

`tools/strategy-lab.mjs seats` builds this variant by patching a copy of `engine.mjs`:

```js
// entering the live-show phase, start one seat later each round
function nextPhase(state) {
  state.phase++;
  if (state.phase === 4) {
    state.showStart = (state.round - 1) % state.players.length;
    state.acted = 0; state.current = state.showStart;
    return;
  }
  state.current = 0;
  ...
}

// walk the full ring instead of counting up from zero
function nextPlayer(state) {
  const size = state.players.length;
  if (state.phase === 4) {
    state.acted = (state.acted || 0) + 1;
    if (state.acted < size) { state.current = (state.showStart + state.acted) % size; return; }
    state.acted = 0;
    if (state.showCycle === 0) {                       // second cycle starts one seat further on
      state.showCycle = 1; state.current = (state.showStart + 1) % size;
      pushLog(state, 'Second live-show placement begins. ...', 'highlight');
      return;
    }
    nextPhase(state);
    return;
  }
  state.current++;
  if (state.current >= size) nextPhase(state);
}
```

Optional follow-ups, in order of how much they matter:

- rotate the auction tie-break by round (or give ties to the poorer label) instead of always
  preferring the lowest seat id;
- break Grammy quality ties by acclaim rather than by internal work id.

In the shipped solo mode the human *is* seat 0, so this quirk works in the player's favour —
worth knowing before "fixing" it, since removing it makes solo play slightly harder. It matters
most in local multiplayer, where a human sitting in seat 3 starts about six times less likely to
win than the player in seat 0.

## What is already healthy

- **No single dominant action.** Every habit is load-bearing: drop live shows and the final cash
  falls from $394 to $80; drop albums and it falls to $191; never recruit and the roster stays
  at one artist; skip training and care and the win rate drops ten points.
- **Bidding has a real skill band.** Bidding at the computers' own level wins 10% against three
  of them, a balanced aggressive style wins 48%, and overbidding ($14–16 a lot) collapses to
  0–2% because the roster grows to 13–18 artists while the cash to train and release disappears.
- **The computer ceiling is mechanical and learnable**, so planning is possible:
  `floor((2 + vocal + creativity) × 1.1)`, never above `its cash − $3`.
- **Comebacks are live.** Leading after five rounds converts to a win 64–73% of the time, so the
  mid-game engine matters without the result being locked in.

## Optional polish (ideas, not measured)

- **Vocal is the more expensive stat for a smaller payoff.** A build that only buys singers wins
  10% where balanced and breadth builds win 40%: creativity pays through royalties, acclaim and
  album quality at once, while vocal pays only through show income. Cheapening vocal training, or
  giving creativity-driven artists a show-side bonus, would widen the viable build space.
- **One-on-one games are swingier than four-player games** (the same policy wins 58–65% against a
  single computer but only 48% against three). Adding a third lot in round 1, or letting the
  trailing label pick first at shows, would soften the opening coin flip.
- **Cash-only scoring makes late spending invisible.** A label that spends everything on round 10
  auctions gains nothing from doing so; ending the game on cash collected rather than cash held
  would reward the full length of the game.
