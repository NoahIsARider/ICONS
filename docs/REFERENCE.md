# Elements reference

Everything a card, a venue, an event or a status does, with the numbers the engine
actually uses. Tables are generated from `data.mjs` and `engine.mjs` — regenerate them with
`node tools/strategy-lab.mjs reference`. For the plan that wins games, see
[STRATEGY.md](STRATEGY.md); for the measurements behind the balance, see [BALANCE.md](BALANCE.md).

## Does the tag decide whether an artist releases or performs?

No. **The role comes from the stats, the stamina and the stages an artist can stand on.**
Tags only tilt one of the two plans:

| tag | exact effect | which plan it helps |
| --- | --- | --- |
| Artpop | +1 album quality when releasing | albums (about +$0.5 a round of royalties, +1 acclaim) |
| Vocal Flip | +1 vocal, but only for show checks | shows — the only way a vocal-4 artist reaches the Grand Arena |
| Jazz | ignores the −1 vocal from Tobacco | shows (defensive) |
| Empress | wins Grammy quality ties | awards only |

Measured weight of the whole tag system (400 seeded games each, reference policy):

| deck | win rate | final cash | shows | albums |
| --- | --- | --- | --- | --- |
| all four tags (shipped) | 45% | $398 | 19.8 | 10.3 |
| no Artpop | 47% | $384 | 19.8 | 10.3 |
| no Vocal Flip | 43% | $387 | 19.8 | 10.3 |
| no Jazz | 45% | $397 | 19.8 | 10.3 |
| no Empress | 46% | $398 | 19.8 | 10.3 |
| **no tags at all** | 45% | **$373** | 19.8 | 10.4 |

The entire tag system is worth about **$25 of final cash (6%)** and moves the win rate inside
noise. Stats decide roles; tags decide margins.

## The four numbers on a card

| number | what it does | formula in the engine |
| --- | --- | --- |
| **Vocal** | which stage an artist may play, and the bonus on the fee | a stage needs `vocal ≥ venue.vocal`; the fee adds `⌊vocal/2⌋` (Vocal Flip adds +1 first, Tobacco subtracts 1 unless Jazz) |
| **Creativity** | album quality, which sets royalties and acclaim | `quality = creativity + die(1-6) + Artpop + mentor − stress − illness`, clamped 1–14 |
| **Stamina** | how much one artist can do in a round | an album costs 1, a show 1 (studio, club) or 2 (festival, arena, tour); exactly 1 comes back every reset |
| **Tag** | a small modifier (table above) | Artpop +1 quality, Vocal Flip +1 show vocal, Jazz ignores Tobacco, Empress breaks Grammy ties |

## The two money machines

**Albums** — $2 per album ($1 during Studio Rebate), 1 stamina, one per label per round.
Royalties are `1 + ⌊quality/4⌋` **every round for the rest of the game**, and acclaim is
`max(1, ⌊quality/3⌋)`. Quality 8+ pays $3 a round; quality 12+ pays $4.

**Live shows** — two placements per round, each artist at most once per round. A fee is
`venue pay + ⌊vocal/2⌋ + $2 on a 5 or 6`, paid immediately.

An album at quality 8 released in round 1 pays about **$27 across the remaining rounds plus
acclaim**; an arena show pays about **$14.7 once**. Albums scale with the calendar, shows
scale with stamina — which is why the winning plan does both with the same artists.

A third, quieter channel: **acclaim pays `⌊acclaim/5⌋` every round** in the Grammy phase, and
the label last on the acclaim track loses $3 (or $5 with Tough Critics).

A word on stamina, because it is the quiet constraint: every round each artist recovers **1**
point and no more. Releasing an album (1) and playing the Grand Arena (2) costs 3, so no artist
can repeat that every round — the routine is *rotation*: spread album duty and show duty across
the roster, and buy Rest & Care (+2 stamina, $2) when someone is spent or sick. With four to six
artists there is almost always somebody fresh enough for both show placements.

## Venues

| venue | pay | needs | stamina | notes |
| --- | --- | --- | --- | --- |
| Studio Session | $4 | — | 1 | always available |
| Night Club | $6 | vocal 3 | 1 | cheapest upgrade |
| Summer Festival | $9 | vocal 4 | 2 | |
| Grand Arena | $12 | vocal 5 | 2 | best regular stage |
| Solo Tour | $10 | that artist must have released an album | 2 | never fills up, no vocal requirement |

Shared venues (everything except the Solo Tour) can be claimed by only one label per round,
so the labels that move first in the show phase take the best stages.

## The Grammy Awards

The awards phase resolves after the live shows, every round, and it hands out two things: one
Grammy, and the acclaim payout for every label.

**What is eligible.** Only releases made *in this round*: albums released in the album phase and
collaboration singles signed during the auction. Everything from earlier rounds is out, which is
why releasing one album every round keeps you in the race for all ten awards.

**How the winner is chosen**, in order:

1. **highest quality** — albums run from 1 to 14 (`creativity + die + Artpop + mentor − stress −
   illness`); a collaboration single can reach **15** (`both artists' creativity + 2`);
2. **Empress** — if two works tie on quality, the one whose performers include an Empress artist
   takes it;
3. **earlier release** — after that, the work created first in the round wins, and collaborations
   are created during the auction, so a collab single beats an album on a double tie.

**The prize**: +3 acclaim and **$4** in cash to the winner (**$7** during the Award Season event).
Then every label collects `⌊acclaim/5⌋` in cash, which is the quiet money in this phase — 20
acclaim pays $4 every single round. The last-place penalty for the acclaim track comes in the
next phase, not this one.

**How it plays out.** `node tools/strategy-lab.mjs awards 400` instruments 4,000 award rounds:

| measurement | result |
| --- | --- |
| rounds with no eligible release | 0% (any label releasing every round is always in it) |
| entries per round | 4.46 works on average |
| rounds where the top quality was tied | **26.1%** — these were decided by a tie-break |
| ...of which the Empress rule decided it | 3.6% of all rounds (about one in seven ties) |
| awards won by a collaboration single | 9.7% |
| winning quality | average **11.5**, range 7–14; 55% of wins were quality 12 or 13 |

So the Grammy is a quality-12 contest: an album from a creativity-5 artist with Artpop or a
mentor lands at 11–13 and is a real contender, and an Empress artist is your tie-breaker of
choice. A collaboration single is not just flavour — it is the only work that can reach quality
15, and it wins roughly one award in ten.

## What one point of each stat buys

| vocal | best stage unlocked | fee there | what changed |
| --- | --- | --- | --- |
| 1 | Studio Session | $4.7 |  |
| 2 | Studio Session | $5.7 |  |
| 3 | Night Club | $7.7 | Night Club opens |
| 4 | Summer Festival | $11.7 | **Summer Festival opens — +$4 a show** |
| 5 | Grand Arena | $14.7 | **Grand Arena opens — +$3 a show** |
| 6 | Grand Arena | $15.7 | no new stage, only +$0.5 |

| creativity | average quality | royalties | acclaim per album |
| --- | --- | --- | --- |
| 1 | 4.5 | $2 a round | +1 |
| 2 | 5.5 | $2 a round | +1 |
| 3 | 6.5 | $2 a round | +2 |
| 4 | 7.5 | $2 a round | +2 |
| 5 (or with Artpop/mentor) | 8.5 | $3 a round | +2 |
| 6 | 9.5 | $3 a round | +3 |

Creativity 5 is the practical step to $3 a round. Quality 12 ($4 a round) is realistic only
for a creativity-6 artist with Artpop **and** a living mentor: `6 + 1 + 1 + die ≥ 12` needs a 4+.

## Status effects, and how artists die

| status | effect | how to get rid of it |
| --- | --- | --- |
| Stress | −1 album quality, +1 karma risk | $2 Rest & Care, or resets reduce it by 1 |
| Illness | −1 album quality, +2 karma risk, and it enables the death roll | $2 Rest & Care only |
| Exhaustion | +1 karma risk, and the karma ability loss hits Vocal first | recovers with stamina |
| Banned Substances | +2 karma risk, enables the death roll | $2 Rest & Care only |
| Tobacco | −1 vocal unless the artist is Jazz | $2 Rest & Care only |

Karma phase, per affected artist: `risk = exhaustion + stress + illness×2 + drugs×2`, roll a die;
`roll + 2 ≤ risk` **and** the artist carries illness or drugs → the artist dies; otherwise
`roll ≤ risk` → a permanent −1 (Vocal if exhausted, else Creativity). Rest & Care costs $2 and
clears every status at once, which is why curing beats almost any other $2 purchase.

Deaths are not the end of the money: the dead artist's released albums keep paying royalties,
and a mentee inherits +1 creativity (capped at 6).

## Event cards

Ten of the thirteen are dealt per game (one per round), so some never appear.

| event | effect |
| --- | --- |
| Streaming Boom | every royalty payment pays +$2 this round (per album) |
| Venue Rush | every live show earns +$2 this round |
| Press Spotlight | albums released this round gain +2 acclaim |
| Health Scare | the artist with the lowest stamina gains Stress |
| Flu Season | a random artist gains Illness |
| Backstage Incident | a random artist gains Banned Substances and Stress |
| Smoky Club | a random artist gains Tobacco (Jazz ignores the penalty) |
| Sponsor Offer | every label receives $2 immediately |
| Studio Rebate | album creation costs $1 less this round |
| Award Season | the Grammy winner earns an extra $3 (so $7 in total) |
| Tourist Wave | Festival, Arena and Solo Tour shows earn +$3 |
| Tough Critics | the last-place critic-track penalty increases by $2 (to $5) |
| Wellness Week | all living artists recover 1 stamina immediately |

## Every artist, and what to use them for

Royalty and acclaim columns average the quality die. `*` marks a starting artist.

| artist | vocal / creativity / stamina | tag | best stage | fee per show | album | use them for |
| --- | --- | --- | --- | --- | --- | --- |
| Nova Vale | 4 / 4 / 3 | Artpop | Summer Festival (vocal 4+) | $11.7 | $3 a round, +2 acclaim | festival performer + album duty |
| Echo Wren | 3 / 5 / 3 | Vocal Flip | Summer Festival (vocal 4+) | $11.7 | $3 a round, +2 acclaim | festival performer + album duty |
| Mara Blue | 5 / 3 / 3 | Jazz | Grand Arena (vocal 5+) | $14.7 | $2 a round, +2 acclaim | arena performer |
| Felix Moon | 5 / 3 / 3 | Vocal Flip | Grand Arena (vocal 5+) | $15.7 | $2 a round, +2 acclaim | arena performer |
| Iris Crown | 5 / 4 / 2 | Empress | Grand Arena (vocal 5+) | $14.7 | $2 a round, +2 acclaim | arena performer + wins Grammy ties |
| Juno Star | 4 / 4 / 4 | Artpop | Summer Festival (vocal 4+) | $11.7 | $3 a round, +2 acclaim | festival performer + album duty |
| Astra Bloom | 3 / 5 / 3 | Artpop | Night Club (vocal 3+) | $7.7 | $3 a round, +3 acclaim | album, then solo tour + album duty |
| Reed Ash | 4 / 4 / 4 | Jazz | Summer Festival (vocal 4+) | $11.7 | $2 a round, +2 acclaim | festival performer |
| Sol Rivera | 5 / 3 / 4 | Vocal Flip | Grand Arena (vocal 5+) | $15.7 | $2 a round, +2 acclaim | arena performer |
| Luna Voss | 4 / 5 / 3 | Empress | Summer Festival (vocal 4+) | $11.7 | $3 a round, +2 acclaim | festival performer + album duty + wins Grammy ties |
| Violet Ray | 5 / 3 / 3 | Vocal Flip | Grand Arena (vocal 5+) | $15.7 | $2 a round, +2 acclaim | arena performer |
| Orion Sky | 3 / 5 / 4 | Artpop | Night Club (vocal 3+) | $7.7 | $3 a round, +3 acclaim | album, then solo tour + album duty |
| Cleo Glass | 4 / 4 / 4 | Jazz | Summer Festival (vocal 4+) | $11.7 | $2 a round, +2 acclaim | festival performer |
| Miles Gold | 5 / 3 / 3 | Vocal Flip | Grand Arena (vocal 5+) | $15.7 | $2 a round, +2 acclaim | arena performer |
| Ember Fox | 5 / 3 / 4 | Vocal Flip | Grand Arena (vocal 5+) | $15.7 | $2 a round, +2 acclaim | arena performer |
| Ash Winter | 3 / 5 / 3 | Artpop | Night Club (vocal 3+) | $7.7 | $3 a round, +3 acclaim | album, then solo tour + album duty |
| Zara Pulse | 4 / 4 / 4 | Artpop | Summer Festival (vocal 4+) | $11.7 | $3 a round, +2 acclaim | festival performer + album duty |
| Kit Tempo | 4 / 4 / 3 | Vocal Flip | Grand Arena (vocal 5+) | $14.7 | $2 a round, +2 acclaim | arena performer |
| Sable Noir | 5 / 4 / 2 | Empress | Grand Arena (vocal 5+) | $14.7 | $2 a round, +2 acclaim | arena performer + wins Grammy ties |
| Poppy Bloom | 4 / 4 / 4 | Vocal Flip | Grand Arena (vocal 5+) | $14.7 | $2 a round, +2 acclaim | arena performer |
| Adele Kite * | 3 / 3 / 4 | Jazz | Night Club (vocal 3+) | $7.7 | $2 a round, +2 acclaim | album, then solo tour |
| Benji Beat * | 4 / 2 / 4 | Vocal Flip | Grand Arena (vocal 5+) | $14.7 | $2 a round, +1 acclaim | arena performer |
| Cora Lux * | 3 / 4 / 4 | Artpop | Night Club (vocal 3+) | $7.7 | $3 a round, +2 acclaim | album, then solo tour + album duty |
| Dante Blue * | 4 / 3 / 3 | Jazz | Summer Festival (vocal 4+) | $11.7 | $2 a round, +2 acclaim | festival performer |

Reading the table: the artists who reach the **Grand Arena** (vocal 5, or vocal 4 with Vocal
Flip) are your show earners; the low-vocal / high-creativity Artpop artists are your album
engine, and their own album unlocks the **Solo Tour**, which pays $11.7 — better than the
Night Club they would otherwise be stuck with. Formal training can move an artist one role
across: pushing a vocal-4 artist to vocal 5 opens the Grand Arena for +$3 a show, so an artist who
performs every round earns about +$30 more across a game — and two of them double that.

## The round, as a checklist

1. Bid for a strong lot if it upgrades the roster ($10–13 for vocal 5 / creativity 5), then stop
   bidding and keep at least $6 in hand.
2. Cure anyone carrying Illness or Banned Substances ($2); otherwise train your best singer
   toward vocal 5.
3. Take the event card in stride — venue, tourism and streaming change which action pays most.
4. Release an album every round, with your best creativity artist (Artpop and a living mentor
   add +1 quality each).
5. Fill both show placements: Arena first, then Solo Tour for anyone with a release, then
   Festival. Never leave a placement unused — an empty slot is up to $14.7 thrown away.
6. At the reset, check that nobody is running on 0 stamina going into the next round.
