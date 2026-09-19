# How to win Record Label Rivals

Every number below comes from playing seeded games against the engine itself — the computer
labels use the same `aiAction` the game ships with. Reproduce any of it with:

```
node tools/strategy-lab.mjs            # every experiment, 400 games per line
node tools/strategy-lab.mjs habits 1000
```

## The short version

Cash at the end of round 10 wins, and cash only comes from three places: **live shows**,
**album royalties**, and the **acclaim track**. All three compound, so a good game is an
engine, not a savings account:

> recruit artists → fill both show slots every round → reinvest in an album every round →
> acclaim pays every round → recruit better artists.

Skipping any part of that loop costs the game. Measured over 400 seeded games each, playing
seat 0 against three computer labels:

| variant | win % | last place % | final cash | shows | albums | artists |
| --- | --- | --- | --- | --- | --- | --- |
| every habit (reference) | **41%** | 9% | **$394** | 19.7 | 10.3 | 4.6 |
| no live shows | 0% | 99% | $80 | 0.0 | 6.3 | 3.1 |
| only one show per round | 3% | 53% | $288 | 10.0 | 10.1 | 4.4 |
| no albums | 0% | 100% | $191 | 19.6 | 0.2 | 3.8 |
| no auctions (never recruit) | 0% | 93% | $236 | 9.8 | 9.8 | 1.0 |
| stops bidding after round 1 | 6% | 43% | $321 | 18.3 | 10.0 | 1.9 |
| no training or care | 31% | 17% | $372 | 19.5 | 10.3 | 4.6 |
| computers-style play (bids like them, album, show) | 5% | 74% | $237 | 10.3 | 9.9 | 2.2 |

Read it as a priority list. **Both show slots are worth about $105 of final cash each over a
game**, an album every round is worth about $200, recruitment is non-negotiable, and curing
sick artists protects the engine rather than adding to it.

## Bidding: the computers have a ceiling

A computer values a lot at `2 + vocal + creativity` (plus 4 if it already owns that artist's
collaboration partner, plus 2 for a mentor/mentee it owns), bids a random 65–110% of that,
and is capped at `its cash − $3`. So its bid for a lot is bounded and knowable:

| lot value (2+vocal+creativity) | computers bid | bid this to be safe | your $8 wins | $10 | $12 |
| --- | --- | --- | --- | --- | --- |
| 7 | $4 – $7 | $8 | 100% | 100% | 100% |
| 8 | $5 – $8 | $9 | 78% | 100% | 100% |
| 9 | $5 – $9 | $10 | 53% | 100% | 100% |
| 10 | $6 – $10 | $11 | 33% | 78% | 100% |
| 11 | $7 – $12 | $13 | 17% | 58% | 98% |
| 12 | $7 – $13 | $14 | 4% | 41% | 78% |

Only the winning bidder pays, so an unaffordable plan costs nothing — but an affordable one
that wins pays in full. The strongest lots in the deck are the three **Empress** artists
(Iris Crown, Luna Voss, Sable Noir) at value 11; Empress also wins Grammy quality ties.

Measured bid styles (same habits otherwise):

| bid style | vs one computer | vs three computers |
| --- | --- | --- |
| never bid | 0% | 0% |
| at the computers' own level (~0.85 × value) | 58% | 10% |
| cautious: $8 strong / $5 useful | 48% | 5% |
| **balanced: $12 strong / $7 useful while under 3 artists, then $9 strong** | **65%** | **48%** |
| hungry: $14 strong / $9 useful, always | 11% | 2% |
| all in: $16 for anything useful | 0% | 0% |

Against one computer, matching its price is enough because you split the lots. Against three,
under-bidding starves you and over-bidding leaves you unable to train or release anything —
the two extreme columns end the game with 16–18 artists and no cash, which is why they lose.
**Aim for 4–7 artists, keep at least $6 in hand, and pay $10–13 for genuine stars.**

## The round, in priority order

1. **Both show slots.** Two placements per round, one per artist, 20 per game. Venue pay is
   `base + ⌊vocal/2⌋ + $2 when the die shows 5 or 6`, plus event bonuses:
   Studio $4 (no requirement) · Night Club $6 (vocal 3) · Summer Festival $9 (vocal 4) ·
   **Grand Arena $12 (vocal 5)** · Solo Tour $10.
2. **Train one singer to vocal 5.** The Arena is the best regular stage, and `Vocal Flip`
   artists reach it one point earlier. Creative training matters most *after* that.
3. **One album every round** ($2, or $1 during Studio Rebate). Quality is
   `creativity + die + 1 Artpop + 1 mentor − stress − illness` (clamped 1–14) and royalties are
   `1 + ⌊quality/4⌋` **every round for the rest of the game**, plus acclaim. A round-1 album at
   quality 8+ pays three or four dollars nine more times.
4. **Cure illness and banned substances immediately** ($2 Rest & Care also restores 2 stamina
   and clears everything). Karma risk is `exhaustion + stress + illness×2 + drugs×2`, and any
   artist carrying illness or drugs can die or permanently lose an ability.
5. **A released album unlocks the Solo Tour** for that artist: $10 for no vocal requirement.
   Spending $2 to turn a weak artist into a second $10-per-round performer is the best value
   in the game.
6. **Acclaim pays.** `⌊acclaim/5⌋` in cash every round in the Grammy phase, and finishing last
   on the acclaim track costs $3 (or $5 with Tough Critics). Empress wins quality ties;
   mentors and collaborators add extra releases and royalties.

## Traps

- **Buying only singers.** A vocal-first build wins 10% in the tests where a balanced build wins
  40%: vocal is the more expensive stat and pays back only through shows, while creativity pays
  through royalties *and* acclaim *and* album quality.
- **Buying everything.** Winning 16 artists starves training and albums and finishes around
  $180–300.
- **Skipping albums to bank cash.** Cash is the score, but albums are the best return on $2 in
  the game; a show-only game lands near $90.
- **Letting illness sit.** One death removes a whole performer from the roster for the rest of
  the game — usually the two show slots you have been counting on.

## Reasonable targets

(Full balance measurements, including the seat-order flaw and its verified fix, live in
[docs/BALANCE.md](BALANCE.md).)


- vs three computers: **$380–410** final cash wins about half the time; computers-style play
  finishes around $236; a truly passive game ends under $100.
- vs one computer: $400+ wins roughly 60% of games.
- Leader after round 5 goes on to win about 64% of games — the mid-game engine matters, but a
  comeback is normal.
