#!/usr/bin/env node
/**
 * Balance and strategy lab — plays thousands of seeded games against the engine so
 * that claims about "what wins" and "what is balanced" can be re-measured after any
 * rules change. Every seat is driven by an explicit policy; the computer labels use
 * the engine's own aiAction.
 *
 *   node tools/strategy-lab.mjs            # every experiment, 400 games each
 *   node tools/strategy-lab.mjs bids 1000  # one experiment, more games
 *
 * Experiments
 *   habits     which habits decide games (switch one off at a time)
 *   bids       how much to bid vs one computer and vs three
 *   builds     are several play styles viable, or is one strictly best?
 *   awards     how the Grammy resolves: eligibility, tie-breaks, who wins
 *   ceiling    what the computers can possibly bid for a lot
 *   seats      positional fairness: four identical players, only the seat differs
 *   reference  what every stat, stage, status and artist is worth (arithmetic)
 *   tags       how much the four artist tags weigh (strip them and replay)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENGINE = join(ROOT, 'engine.mjs');
const DATA = join(ROOT, 'data.mjs');

const load = async (enginePath = ENGINE) => ({
  engine: await import(pathToFileURL(enginePath).href),
  data: await import(pathToFileURL(DATA).href)
});

const random = seed => () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
const living = player => player.artists.filter(artist => !artist.dead);
const effectiveVocal = artist => artist.vocal + (artist.tag === 'Vocal Flip' ? 1 : 0)
  - (artist.status.tobacco && artist.tag !== 'Jazz' ? 1 : 0);
const lotValue = lot => 2 + lot.vocal + lot.creativity;
const strongest = (player, score) => [...living(player)].sort((a, b) => score(b) - score(a))[0];
const isStrong = lot => lot.vocal >= 5 || lot.creativity >= 5;
const isUseful = lot => lot.vocal >= 4 || lot.creativity >= 4;
const albumScore = artist => artist.creativity + (artist.tag === 'Artpop' ? 1 : 0);

/** picks the stage with the best immediate payout for the artist we would send there */
function bestShow(engine, venues, state, player) {
  const event = state.event?.id;
  const options = [];
  for (const artist of living(player)) for (const venue of venues) {
    if (!engine.canPlay(state, player, artist, venue)) continue;
    options.push({
      artistId: artist.id, venueId: venue.id,
      score: venue.pay + Math.floor(effectiveVocal(artist) / 2)
        + (event === 'venue' ? 2 : 0)
        + (event === 'tourism' && ['festival', 'arena', 'tour'].includes(venue.id) ? 3 : 0)
    });
  }
  options.sort((a, b) => b.score - a.score);
  return options[0] ?? null;
}

/** the reference policy: selective bids, cure the sick, one album every round, both shows */
function habitsFor(engine, venues) {
  return {
    bid(state, player) {
      const lot = engine.currentLot(state), roster = living(player).length;
      const willing = roster < 3 ? (isStrong(lot) ? 12 : isUseful(lot) ? 7 : 0) : (isStrong(lot) ? 9 : 0);
      return Math.min(Math.max(0, player.money - 4), willing);
    },
    train(state, player) {
      const sick = living(player).find(a => a.status.illness || a.status.drugs);
      if (sick && player.money >= 2) return { type: 'train', artistId: sick.id, kind: 'care' };
      const tired = living(player).find(a => a.currentStamina < 2);
      if (tired && player.money >= 10) return { type: 'train', artistId: tired.id, kind: 'care' };
      const singer = strongest(player, a => a.vocal);
      if (singer && singer.vocal < 5 && player.money >= 8) return { type: 'train', artistId: singer.id, kind: 'vocal' };
      return { type: 'pass' };
    },
    create(state, player) {
      const artist = strongest(player, albumScore);
      if (!artist || player.money < 6 || !engine.canCreate(state, player, artist)) return { type: 'pass' };
      return { type: 'create', artistId: artist.id };
    },
    show(state, player) {
      const move = bestShow(engine, venues, state, player);
      return move ? { type: 'perform', ...move } : { type: 'pass' };
    }
  };
}

const pass = { bid: () => 0, train: () => ({ type: 'pass' }), create: () => ({ type: 'pass' }), show: () => ({ type: 'pass' }) };

/** turns a per-phase habit set into the action the current phase expects */
const toPolicy = habitSet => (state, player) => {
  if (state.phase === 0) return { type: 'bid', amount: habitSet.bid(state, player) };
  if (state.phase === 1) return habitSet.train(state, player);
  if (state.phase === 3) return habitSet.create(state, player);
  if (state.phase === 4) return habitSet.show(state, player);
  return { type: 'continue' };
};

/** plays one full game with `policy` in every non-computer seat */
function playGame(engine, policy, seed, seats, observe) {
  const rng = random(seed);
  const state = engine.newGame({ players: seats.map((ai, index) => ({ name: 'Seat ' + index, ai })) }, rng);
  let guard = 0;
  while (!state.gameOver && guard++ < 900) {
    engine.autoPlayAi(state, rng);
    if (state.gameOver) break;
    const player = engine.currentPlayer(state);
    let action;
    try { action = policy(state, player); } catch { action = { type: 'pass' }; }
    try { engine.act(state, action, rng); } catch { engine.act(state, { type: 'pass' }, rng); }
    if (observe) observe(state);
  }
  return state;
}

const ranks = state => [...state.players].sort((a, b) => b.money - a.money || b.acclaim - a.acclaim || b.works.length - a.works.length);
const pad = (value, width) => String(value).padStart(width);
const table = (heading, columns, rows) => {
  const widths = columns.slice(2).map(header => Math.max(8, header.length + 2));
  console.log('\n' + heading + '\n');
  console.log('  ' + columns[0].padEnd(columns[1]) + columns.slice(2).map((h, i) => pad(h, widths[i])).join(''));
  for (const row of rows) console.log('  ' + row[0].padEnd(columns[1]) + row.slice(1).map((v, i) => pad(v, widths[i])).join(''));
};

// ---------------------------------------------------------------- experiments ----------
async function experimentHabits(games) {
  const { engine, data } = await load();
  const habits = habitsFor(engine, data.venues);
  const variants = {
    'nothing (baseline)': pass,
    'only live shows': { ...pass, show: habits.show },
    'only albums': { ...pass, create: habits.create },
    'computers-style (bids like them, album, show)': { ...habits, bid: state => Math.floor(lotValue(engine.currentLot(state)) * 0.85), train: pass.train },

    'every habit': habits,
    'no auctions': { ...habits, bid: pass.bid },
    'no training or care': { ...habits, train: pass.train },
    'no albums': { ...habits, create: pass.create },
    'no live shows': { ...habits, show: pass.show },
    'only one show per round': { ...habits, show: (s, p) => (s.showCycle === 1 ? { type: 'pass' } : habits.show(s, p)) },
    'stops bidding after round 1': { ...habits, bid: (s, p) => (s.round === 1 ? habits.bid(s, p) : 0) }
  };
  const rows = [];
  for (const [name, policy] of Object.entries(variants)) {
    const totals = { win: 0, last: 0, cash: 0, shows: 0, albums: 0, artists: 0 };
    for (let i = 0; i < games; i++) {
      const state = playGame(engine, toPolicy(policy), 1000 + i * 7919, [false, true, true, true]);
      const me = state.players[0];
      const rank = ranks(state);
      totals.win += state.winnerIds.includes(0) ? 1 : 0;
      totals.last += rank[rank.length - 1] === me ? 1 : 0;
      totals.cash += me.money; totals.shows += me.placements; totals.albums += me.works.length; totals.artists += me.artists.length;
    }
    const pct = n => (100 * n / games).toFixed(0) + '%';
    rows.push([name, pct(totals.win), pct(totals.last), '$' + (totals.cash / games).toFixed(0),
      (totals.shows / games).toFixed(1), (totals.albums / games).toFixed(1), (totals.artists / games).toFixed(1)]);
  }
  table(`WHICH HABITS DECIDE GAMES — ${games} seeded games each, seat 0 vs three computers`,
    ['variant', 46, 'win', 'last', 'cash', 'shows', 'albums', 'artists'], rows);
}

async function experimentBids(games) {
  const { engine, data } = await load();
  const habits = habitsFor(engine, data.venues);
  const styles = {
    'never bid': () => 0,
    'at the computers level (~2+v+c)': lot => Math.floor(lotValue(lot) * 0.85),
    'cautious: $8 strong / $5 useful': (lot, roster) => (roster < 3 ? (isStrong(lot) ? 8 : isUseful(lot) ? 5 : 0) : (isStrong(lot) ? 6 : 0)),
    'balanced: $12 strong / $7 useful, then $9 strong': (lot, roster) => (roster < 3 ? (isStrong(lot) ? 12 : isUseful(lot) ? 7 : 0) : (isStrong(lot) ? 9 : 0)),
    'hungry: $14 strong / $9 useful': (lot) => (isStrong(lot) ? 14 : isUseful(lot) ? 9 : 0),
    'all in: $16 for anything useful': (lot) => (isUseful(lot) ? 16 : 0)
  };
  for (const opponents of [1, 3]) {
    const rows = [];
    for (const [name, style] of Object.entries(styles)) {
      const totals = { win: 0, cash: 0, cpu: 0, artists: 0 };
      for (let i = 0; i < games; i++) {
        const biddingHabits = { ...habits,
          bid: (s, p) => Math.min(Math.max(0, p.money - 4), style(engine.currentLot(s), living(p).length)) };
        const state = playGame(engine, toPolicy(biddingHabits), 4242 + i * 3571, [false, ...Array(opponents).fill(true)]);
        const me = state.players[0];
        totals.win += ranks(state)[0] === me ? 1 : 0;
        totals.cash += me.money; totals.artists += me.artists.length;
        totals.cpu += state.players.slice(1).reduce((sum, p) => sum + p.money, 0) / opponents;
      }
      rows.push([name, (100 * totals.win / games).toFixed(0) + '%', '$' + (totals.cash / games).toFixed(0),
        '$' + (totals.cpu / games).toFixed(0), (totals.artists / games).toFixed(1)]);
    }
    table(`BID STYLES vs ${opponents === 1 ? 'one computer' : 'three computers'} — ${games} seeded games each (same habits otherwise)`,
      ['style', 52, 'you win', 'your $', 'their $', 'artists'], rows);
  }
}

async function experimentCeiling() {
  const { engine, data } = await load();
  // aiAction bids floor(value * (0.65 + 0.45 * rng)) capped at cash - 3, so the ceiling is mechanical
  const chance = (value, bid) => Math.max(0, Math.min(1, (bid / value - 0.65) / 0.45));
  const rows = [];
  for (let value = 6; value <= 12; value++) {
    const low = Math.floor(value * 0.65), high = Math.floor(value * 1.0999);
    rows.push(['value ' + value, `$${low} - $${high}`, '$' + (high + 1),
      (100 * chance(value, 8)).toFixed(0) + '%', (100 * chance(value, 10)).toFixed(0) + '%', (100 * chance(value, 12)).toFixed(0) + '%']);
  }
  table('WHAT A COMPUTER CAN BID FOR A LOT (its ceiling is floor(value x 1.1), never more than its cash minus $3)',
    ['lot value 2+v+c', 16, 'it bids', 'guaranteed', 'your $8', 'your $10', 'your $12'], rows);
  const best = data.artists.map(a => ({ a, value: lotValue(a) })).sort((x, y) => y.value - x.value).slice(0, 6);
  console.log('\n  strongest lots in the deck: ' + best.map(({ a, value }) => `${a.name} (${value}, $${Math.floor(value * 1.0999) + 1})`).join(', '));
}

/** a copy of the engine whose live-show phase starts with a different seat each round */
function rotatingShowEngine() {
  const source = readFileSync(ENGINE, 'utf8');
  let patched = source
    .replace(`function nextPlayer(state) {
  state.current++;
  if (state.current >= state.players.length) {
    if (state.phase === 4 && state.showCycle === 0) {
      state.showCycle = 1;
      state.current = 0;`,
    `function nextPlayer(state) {
  const size = state.players.length;
  if (state.phase === 4) {
    state.acted = (state.acted || 0) + 1;
    if (state.acted < size) { state.current = (state.showStart + state.acted) % size; return; }
    state.acted = 0;
    if (state.showCycle === 0) {
      state.showCycle = 1;
      state.current = (state.showStart + 1) % size;`)
    .replace(`function nextPhase(state) {
  state.phase++;
  state.current = 0;`,
    `function nextPhase(state) {
  state.phase++;
  if (state.phase === 4) { state.showStart = (state.round - 1) % state.players.length; state.acted = 0; state.current = state.showStart; return; }
  state.current = 0;`)
    .replace(`      pushLog(state, 'Second live-show placement begins. Artists who already performed are unavailable.', 'highlight');
    } else nextPhase(state);
  }
}`,
    `      pushLog(state, 'Second live-show placement begins. Artists who already performed are unavailable.', 'highlight');
      return;
    }
    nextPhase(state);
    return;
  }
  state.current++;
  if (state.current >= state.players.length) nextPhase(state);
}`);
  if (patched === source) throw new Error('rotatingShowEngine: engine.mjs anchors moved, update the patch');
  const target = join(tmpdir(), 'rlr-engine-rotating-show.mjs');
  writeFileSync(target, patched);
  writeFileSync(join(tmpdir(), 'data.mjs'), readFileSync(DATA));   // the copy imports './data.mjs'
  return target;
}

async function experimentSeats(games) {
  const rotatedPath = rotatingShowEngine();
  for (const [label, enginePath] of [['as shipped', ENGINE], ['live-show order rotates', rotatedPath]]) {
    const { engine, data } = await load(enginePath);
    const won = [0, 0, 0, 0], cash = [0, 0, 0, 0], shows = [0, 0, 0, 0];
    for (let i = 0; i < games; i++) {
      const seed = 5150 + i * 2411;
      // four equal players, but each prices lots and stages a little differently,
      // otherwise every bid is a tie and the tie-break rule decides instead of skill
      const jitter = [0, 1, 2, 3].map(seat => random(seed * 7 + seat * 131 + 5));
      const habits = habitsFor(engine, data.venues);
      const policy = (state, player) => {
        const wobble = jitter[player.id];
        if (state.phase === 0) {
          const lot = engine.currentLot(state), roster = living(player).length;
          const willing = roster < 3 ? (isStrong(lot) ? 12 : isUseful(lot) ? 7 : 0) : (isStrong(lot) ? 9 : 0);
          return { type: 'bid', amount: Math.min(Math.max(0, player.money - 4), Math.round(willing * (0.75 + 0.5 * wobble()))) };
        }
        if (state.phase === 4) {
          const options = [];
          for (const artist of living(player)) for (const venue of data.venues) {
            if (!engine.canPlay(state, player, artist, venue)) continue;
            options.push({ artistId: artist.id, venueId: venue.id, score: venue.pay + Math.floor(effectiveVocal(artist) / 2) + 2 * wobble() });
          }
          options.sort((a, b) => b.score - a.score);
          return options[0] ? { type: 'perform', ...options[0] } : { type: 'pass' };
        }
        if (state.phase === 1) return habits.train(state, player);
        if (state.phase === 3) return habits.create(state, player);
        return { type: 'continue' };
      };
      const state = playGame(engine, policy, seed, [false, false, false, false]);
      for (const id of state.winnerIds) won[id] += 1 / state.winnerIds.length;
      state.players.forEach((p, index) => { cash[index] += p.money; shows[index] += p.placements; });
    }
    console.log(`\n  ${label} — ${games} games, four identical players:`);
    console.log('    win %      ' + won.map(w => pad((100 * w / games).toFixed(1), 8)).join(''));
    console.log('    final cash ' + cash.map(c => pad('$' + (c / games).toFixed(0), 8)).join(''));
    console.log('    shows      ' + shows.map(s => pad((s / games).toFixed(1), 8)).join(''));
  }
  console.log('\n  A seat that moves first every round (seat 0 as shipped) converts that order into a large edge.');
}

async function experimentBuilds(games) {
  const { engine, data } = await load();
  const reference = habitsFor(engine, data.venues);
  const albumWith = reserve => (state, player) => {
    const artist = strongest(player, albumScore);
    if (!artist || player.money < reserve || !engine.canCreate(state, player, artist)) return { type: 'pass' };
    return { type: 'create', artistId: artist.id };
  };
  const cure = (state, player) => {
    const sick = living(player).find(a => a.status.illness || a.status.drugs);
    return sick && player.money >= 2 ? { type: 'train', artistId: sick.id, kind: 'care' } : null;
  };
  // every build is given the same spending power; they differ only in what they want
  const builds = {
    'balanced: wants both stats, album every round': reference,
    'voices: only buys singers, trains vocal': {
      bid: (state, player) => { const lot = engine.currentLot(state);
        return Math.min(Math.max(0, player.money - 4), lot.vocal >= 5 ? 12 : lot.vocal >= 4 ? 9 : 0); },
      train: (state, player) => cure(state, player) || (() => {
        const singer = strongest(player, a => a.vocal);
        return singer && singer.vocal < 6 && player.money >= 9 ? { type: 'train', artistId: singer.id, kind: 'vocal' } : { type: 'pass' };
      })(),
      create: albumWith(5), show: reference.show
    },
    'writers: only buys songwriters, trains creativity': {
      bid: (state, player) => { const lot = engine.currentLot(state);
        return Math.min(Math.max(0, player.money - 4), lot.creativity >= 5 ? 12 : lot.creativity >= 4 ? 9 : 0); },
      train: (state, player) => cure(state, player) || (() => {
        const writer = strongest(player, albumScore);
        return writer && writer.creativity < 6 && player.money >= 9 ? { type: 'train', artistId: writer.id, kind: 'creativity' } : { type: 'pass' };
      })(),
      create: albumWith(5), show: reference.show
    },
    'breadth: buys anything decent, spends wide': {
      bid: (state, player) => { const lot = engine.currentLot(state);
        return Math.min(Math.max(0, player.money - 4), lotValue(lot) >= 9 ? 10 : isUseful(lot) ? 6 : 0); },
      train: (state, player) => cure(state, player) || (() => {
        const artist = strongest(player, a => a.vocal + a.creativity);
        if (!artist || player.money < 12) return { type: 'pass' };
        return { type: 'train', artistId: artist.id, kind: artist.vocal >= artist.creativity ? 'vocal' : 'creativity' };
      })(),
      create: albumWith(4), show: reference.show
    }
  };
  const rows = [];
  for (const [name, build] of Object.entries(builds)) {
    const totals = { win: 0, cash: 0, shows: 0, albums: 0, artists: 0, led: 0, ledWon: 0 };
    for (let i = 0; i < games; i++) {
      let led = null;
      const state = playGame(engine, toPolicy(build), 8080 + i * 3691, [false, true, true, true], s => {
        if (s.round === 6 && s.phase === 0 && led === null) {
          const cash = s.players.map(p => p.money);
          led = cash[0] >= Math.max(...cash);
        }
      });
      const me = state.players[0];
      totals.win += state.winnerIds.includes(0) ? 1 : 0;
      totals.cash += me.money; totals.shows += me.placements; totals.albums += me.works.length; totals.artists += me.artists.length;
      if (led) { totals.led++; if (state.winnerIds.includes(0)) totals.ledWon++; }
    }
    rows.push([name, (100 * totals.win / games).toFixed(0) + '%', '$' + (totals.cash / games).toFixed(0),
      (totals.artists / games).toFixed(1), (totals.albums / games).toFixed(1), (totals.shows / games).toFixed(1),
      (100 * totals.led / games).toFixed(0) + '% -> ' + (100 * totals.ledWon / Math.max(1, totals.led)).toFixed(0) + '%']);
  }
  table(`ARE SEVERAL BUILDS VIABLE? — ${games} seeded games each vs three computers, equal spending power`,
    ['build', 50, 'win', 'cash', 'artists', 'albums', 'shows', 'led R5 -> won'], rows);
  console.log('\n  Buying only singers is the trap: vocal costs more and returns less than creativity,\n  which pays through royalties, acclaim and album quality at the same time.');
}

/** pure arithmetic from the rules: what each stat, tag and stage is actually worth */
async function experimentReference() {
  const { data } = await load();
  const { artists, starters, venues } = data;
  const flip = artist => artist.vocal + (artist.tag === 'Vocal Flip' ? 1 : 0);
  const artpop = artist => artist.creativity + (artist.tag === 'Artpop' ? 1 : 0);
  const LUCKY = 2 / 3;                                  // 5 or 6 on the show die pays +$2
  const quality = artist => artpop(artist) + 3.5;       // a quality die averages 3.5
  const royalty = artist => 1 + Math.floor(quality(artist) / 4);
  const acclaim = artist => Math.max(1, Math.floor(quality(artist) / 3));
  const stage = artist => venues.filter(v => !v.tour && v.vocal <= flip(artist)).sort((a, b) => b.pay - a.pay)[0];
  const payAt = (artist, venue) => venue.pay + Math.floor(flip(artist) / 2) + LUCKY;
  const soloTour = venues.find(venue => venue.tour);
  const label = venue => `${venue.name} (v${venue.vocal}+)`;

  console.log('\nEVERY ARTIST IN THE DECK — what they are for (royalty and acclaim average the 1-6 die)\n');
  console.log('  ' + 'artist'.padEnd(15) + 'v/c/sta'.padEnd(9) + 'tag'.padEnd(12) + 'best stage'.padEnd(23)
    + '$/show'.padEnd(8) + 'album'.padEnd(16) + 'use them for');
  for (const artist of [...starters.map(a => ({ ...a, starter: true })), ...artists]) {
    const venue = stage(artist);
    const tourPay = payAt(artist, soloTour), venuePay = payAt(artist, venue);
    const plan = flip(artist) >= 5 ? 'arena performer'
      : flip(artist) >= 4 ? 'festival performer'
      : tourPay > venuePay ? `album then solo tour ($${tourPay.toFixed(1)} beats $${venuePay.toFixed(1)})` : 'album performer';
    const role = [plan];
    if (artpop(artist) >= 5) role.push('album duty');
    if (artist.tag === 'Empress') role.push('Grammy ties');
    console.log('  ' + (artist.name + (artist.starter ? ' *' : '')).padEnd(15)
      + `${artist.vocal}/${artist.creativity}/${artist.stamina}`.padEnd(9)
      + artist.tag.padEnd(12)
      + label(venue).padEnd(23)
      + ('$' + venuePay.toFixed(1)).padEnd(8)
      + ('$' + royalty(artist) + '/rd  +' + acclaim(artist) + ' ac').padEnd(16)
      + role.join(' + '));
  }
  console.log('  * starter artist — which one you begin with depends on your seat');

  console.log('\nWHAT ONE POINT OF EACH STAT BUYS\n');
  console.log('  vocal   best stage the singer unlocks   pay per show');
  for (let vocal = 1; vocal <= 6; vocal++) {
    const artist = { vocal, creativity: 0, tag: 'None' };
    const venue = stage(artist);
    const note = vocal === 3 ? ' <- night club opens' : vocal === 4 ? ' <- SUMMER FESTIVAL opens (+$4 a show)'
      : vocal === 5 ? ' <- GRAND ARENA opens (+$3 a show)' : vocal === 6 ? ' <- no new stage, only +$0.5' : '';
    console.log('  ' + String(vocal).padEnd(8) + label(venue).padEnd(32) + ('$' + payAt(artist, venue).toFixed(1)).padEnd(9) + note);
  }
  console.log('\n  creativity          avg quality   royalties   acclaim   note');
  let previousRoyalty = null;
  const statLine = (text, artist, note) => console.log('  ' + text.padEnd(20)
    + quality(artist).toFixed(1).padEnd(14) + ('$' + royalty(artist) + '/round').padEnd(12)
    + ('+' + acclaim(artist) + ' acclaim').padEnd(10) + note);
  for (let creativity = 1; creativity <= 6; creativity++) {
    const plain = { creativity, tag: 'None' };
    const steps = previousRoyalty !== null && royalty(plain) > previousRoyalty;
    statLine(String(creativity), plain, steps ? '<- royalty steps up to $' + royalty(plain) + ' a round' : '');
    previousRoyalty = royalty(plain);
    if (creativity === 5) statLine('5 + Artpop', { creativity, tag: 'Artpop' }, 'better odds of quality 12 ($4 a round)');
  }
  console.log('\n  stamina — an album costs 1 point, a show costs 1 (studio, club) or 2 (festival, arena, tour),');
  console.log('  and every artist recovers exactly 1 point at the reset. A round that spends more than 1');
  console.log('  cannot repeat for ever: an album plus an arena show spends 3 and returns 1, so the routine');
  console.log('  is rotation — spread album and show duty over the roster, or buy Rest & Care (+2 for $2).');
}

/** how much do the four tags weigh? strip them and replay the reference policy */
async function experimentTags(games) {
  const { engine, data } = await load();
  const habits = habitsFor(engine, data.venues);
  const TAGS = ['Artpop', 'Vocal Flip', 'Jazz', 'Empress'];
  const scenarios = [{ label: 'all tags (shipped deck)', strip: [] }]
    .concat(TAGS.map(tag => ({ label: `no ${tag}`, strip: [tag] })))
    .concat([{ label: 'no tags at all', strip: TAGS }]);
  const rows = [];
  for (const scenario of scenarios) {
    const restore = [];
    for (const artist of [...data.starters, ...data.artists]) {
      if (scenario.strip.includes(artist.tag)) { restore.push([artist, artist.tag]); artist.tag = 'None'; }
    }
    const totals = { win: 0, cash: 0, shows: 0, albums: 0 };
    for (let i = 0; i < games; i++) {
      const state = playGame(engine, toPolicy(habits), 2000 + i * 5167, [false, true, true, true]);
      const me = state.players[0];
      totals.win += state.winnerIds.includes(0) ? 1 : 0;
      totals.cash += me.money; totals.shows += me.placements; totals.albums += me.works.length;
    }
    rows.push([scenario.label, (100 * totals.win / games).toFixed(0) + '%', '$' + (totals.cash / games).toFixed(0),
      (totals.shows / games).toFixed(1), (totals.albums / games).toFixed(1)]);
    for (const [artist, tag] of restore) artist.tag = tag;
  }
  table(`HOW MUCH DO THE TAGS WEIGH? — ${games} seeded games each with the reference policy`,
    ['deck', 26, 'win', 'cash', 'shows', 'albums'], rows);
  console.log('\n  Tags are small modifiers: they never decide whether an artist releases or performs,');
  console.log('  they only tilt one of the two plans. Stats, stamina and stage access decide roles.');
}

/** how the Grammy actually resolves: instrument every awards phase */
async function experimentAwards(games) {
  const { engine, data } = await load();
  const policy = toPolicy(habitsFor(engine, data.venues));
  const stats = { rounds: 0, empty: 0, entries: 0, ties: 0, empress: 0, collab: 0, quality: 0, best: 0, worst: 99 };
  const distribution = new Map();
  for (let i = 0; i < games; i++) {
    const rng = random(31 + i * 977);
    const state = engine.newGame({ players: [0, 1, 2, 3].map(n => ({ name: 'P' + n, ai: n > 0 })) }, rng);
    let guard = 0;
    while (!state.gameOver && guard++ < 900) {
      engine.autoPlayAi(state, rng);
      if (state.gameOver) break;
      if (state.phase === 5) {
        const works = state.players.flatMap(p => p.works).filter(w => state.newWorks.includes(w.id));
        stats.rounds++;
        if (!works.length) stats.empty++;
        else {
          const empress = work => (state.players[work.ownerId].artists.some(a => work.artistIds.includes(a.id) && a.tag === 'Empress') ? 1 : 0);
          const ranked = [...works].sort((a, b) => b.quality - a.quality || empress(b) - empress(a) || a.id - b.id);
          const winner = ranked[0];
          stats.entries += works.length;
          if (ranked[1] && ranked[1].quality === winner.quality) {
            stats.ties++;
            if (empress(winner) && !empress(ranked[1])) stats.empress++;
          }
          if (winner.collaboration) stats.collab++;
          stats.quality += winner.quality;
          stats.best = Math.max(stats.best, winner.quality);
          stats.worst = Math.min(stats.worst, winner.quality);
          distribution.set(winner.quality, (distribution.get(winner.quality) || 0) + 1);
        }
      }
      try { engine.act(state, policy(state, engine.currentPlayer(state)), rng); } catch { engine.act(state, { type: 'pass' }, rng); }
    }
  }
  const pct = n => (100 * n / stats.rounds).toFixed(1) + '%';
  console.log(`\nTHE GRAMMY IN PRACTICE — ${games} games, ${stats.rounds} award rounds\n`);
  console.log('  rounds with no eligible release      ' + pct(stats.empty));
  console.log('  entries per round                    ' + (stats.entries / stats.rounds).toFixed(2));
  console.log('  rounds decided by a tie-break        ' + pct(stats.ties) + '  (top quality shared)');
  console.log('  ...decided by the Empress rule       ' + pct(stats.empress));
  console.log('  awards won by a collaboration single ' + pct(stats.collab));
  console.log(`  winning quality                      average ${(stats.quality / stats.rounds).toFixed(1)}, range ${stats.worst}-${stats.best}`);
  console.log('  distribution                         ' + [...distribution.entries()].sort((a, b) => a[0] - b[0])
    .map(([q, n]) => `${q}:${(100 * n / stats.rounds).toFixed(0)}%`).join('  '));
  console.log('\n  Eligibility is this round only; ranking is quality, then Empress on the work, then the');
  console.log('  earlier release. A collaboration single can reach quality 15 where an album caps at 14.');
}

const EXPERIMENTS = { habits: experimentHabits, bids: experimentBids, builds: experimentBuilds, awards: experimentAwards, ceiling: experimentCeiling, seats: experimentSeats, reference: experimentReference, tags: experimentTags };
const [command = 'all', games = '400'] = process.argv.slice(2);
const count = Math.max(20, Number(games) || 400);
const chosen = command === 'all' ? Object.entries(EXPERIMENTS) : [[command, EXPERIMENTS[command]]];
if (chosen.some(([, fn]) => !fn)) {
  console.error('usage: node tools/strategy-lab.mjs [all|habits|bids|builds|awards|ceiling|seats|reference|tags] [games]');
  process.exit(1);
}
for (const [, run] of chosen) await run(count);
console.log('');
