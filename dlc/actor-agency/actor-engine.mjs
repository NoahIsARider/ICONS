import { artists, starters, venues, events, albumWordsA, albumWordsB, phaseNames } from './actor-data.mjs';

const roll = rng => 1 + Math.floor(rng() * 6);
const choose = (items, rng) => items[Math.floor(rng() * items.length)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const living = player => player.artists.filter(artist => !artist.dead);
const owned = (player, id) => player.artists.find(artist => artist.id === id && !artist.dead);
const albumCost = state => state.event?.id === 'rebate' ? 1 : 2;
const pushLog = (state, text, type = 'normal') => state.log.unshift({ id: ++state.serial, round: state.round, phase: state.phase, text, type });
const randomAlbumTitle = rng => `${choose(albumWordsA,rng)} ${choose(albumWordsB,rng)}`;

function cloneArtist(template) {
  return { ...template, maxStamina: template.stamina, currentStamina: template.stamina, status: { stress:0, illness:0, exhaustion:0, drugs:0, tobacco:0 }, inherited:false, dead:false, used:false };
}

function shuffle(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}

export function newGame(config, rng = Math.random) {
  const entries = (config.players || []).filter(p => p.name?.trim()).slice(0,4);
  if (entries.length < 2 || entries.length > 4 || !entries.some(p => !p.ai)) throw new Error('Choose 2–4 agencies with at least one human player.');
  const players = entries.map((entry, index) => ({
    id:index, name:entry.name.trim().slice(0,24), ai:!!entry.ai, money:18, acclaim:0,
    artists:[cloneArtist(starters[index])], works:[], placements:0, color:['#e9b75f','#7de0d6','#ed8db9','#b9a1f9'][index]
  }));
  const state = { version:1, round:1, phase:0, current:0, auctionIndex:0, bids:{},
    deck:shuffle(artists,rng), eventDeck:shuffle(events,rng).slice(0,10), event:null, players,
    venueUsed:{}, showCycle:0, newWorks:[], log:[], serial:0, gameOver:false, winnerIds:[] };
  pushLog(state, 'The agencies open for business. Round 1 begins!', 'highlight');
  return state;
}

export function currentLot(state) { return state.deck[(state.round - 1) * 2 + state.auctionIndex]; }
export function currentPlayer(state) { return state.players[state.current]; }
export function canCreate(state, player, artist) { return !artist.dead && artist.currentStamina >= 1 && player.money >= albumCost(state); }
export function canPlay(state, player, artist, venue) {
  if (!artist || artist.dead || artist.used || artist.currentStamina < venue.stamina) return false;
  const bonus = (artist.tag === 'Vocal Flip' ? 1 : 0) - (artist.status.tobacco && artist.tag !== 'Jazz' ? 1 : 0);
  if (artist.vocal + bonus < venue.vocal) return false;
  if (venue.tour && !player.works.some(work => work.artistIds.includes(artist.id))) return false;
  if (!venue.tour && state.venueUsed[venue.id] != null) return false;
  return true;
}

function nextPhase(state) {
  state.phase++;
  state.current = 0;
  if (state.phase === 2) pushLog(state, 'All agencies have completed Coaching & Care. Reveal the event.', 'highlight');
  if (state.phase === 5) pushLog(state, 'The shoot schedule closes. Resolve the Golden Reel Awards.', 'highlight');
}

function nextPlayer(state) {
  state.current++;
  if (state.current >= state.players.length) {
    if (state.phase === 4 && state.showCycle === 0) {
      state.showCycle = 1;
      state.current = 0;
      pushLog(state, 'Second live-show placement begins. Artists who already performed are unavailable.', 'highlight');
    } else nextPhase(state);
  }
}

function checkCollaboration(state, player, newArtist, rng) {
  const partner = newArtist.collab && owned(player, newArtist.collab);
  if (!partner) return;
  const test = roll(rng);
  if (test >= 3) {
    const quality = clamp(newArtist.creativity + partner.creativity + 2, 1, 15);
    const work = { id:++state.serial, title:`${newArtist.name} × ${partner.name}`, artistIds:[newArtist.id,partner.id], ownerId:player.id, quality, royalty:3, round:state.round, collaboration:true, awarded:false };
    player.works.push(work); state.newWorks.push(work.id); player.acclaim += 2;
    pushLog(state, `${player.name} landed a two-hander! ${newArtist.name} and ${partner.name} released a two-hander.`, 'success');
  } else pushLog(state, `${newArtist.name} and ${partner.name} considered a collaboration, but the chemistry roll failed.`);
}

function resolveAuction(state, rng) {
  const lot = currentLot(state);
  const ranking = state.players.map(player => ({ player, bid:state.bids[player.id] || 0 })).sort((a,b) => b.bid - a.bid || b.player.acclaim - a.player.acclaim || a.player.id - b.player.id);
  for (const entry of [...ranking].reverse()) pushLog(state, `${entry.player.name} bid $${entry.bid}.`);
  if (ranking[0].bid > 0) {
    const { player, bid } = ranking[0];
    const rivals = ranking.slice(1).filter(entry => entry.bid > 0);
    player.money -= bid;
    const recruit = cloneArtist(lot);
    player.artists.push(recruit);
    pushLog(state, rivals.length
      ? `${player.name} signed ${lot.name} for $${bid}, beating ${rivals.map(entry => `${entry.player.name} ($${entry.bid})`).join(', ')}. $${player.money} left.`
      : `${player.name} signed ${lot.name} for $${bid} with no other bids. $${player.money} left.`, 'success');
    if (recruit.mentor && owned(player, recruit.mentor)) pushLog(state, `${lot.name} gains mentorship from ${owned(player,recruit.mentor).name}.`, 'success');
    checkCollaboration(state, player, recruit, rng);
    for (const other of living(player)) if (other !== recruit && other.collab === recruit.id && recruit.collab !== other.id) checkCollaboration(state, player, other, rng);
  } else pushLog(state, `No agency bid on ${lot.name}. The actor remains independent.`);
  state.bids = {}; state.auctionIndex++; state.current = 0;
  if (state.auctionIndex >= 2) { state.auctionIndex = 0; nextPhase(state); }
}

function bid(state, action, rng) {
  const player = currentPlayer(state), amount = Number(action.amount);
  if (!Number.isInteger(amount) || amount < 0 || amount > player.money) throw new Error('Bid must be a whole amount you can afford.');
  state.bids[player.id] = amount;
  pushLog(state, `${player.name} submitted a sealed bid.`);
  state.current++;
  if (state.current >= state.players.length) resolveAuction(state, rng);
}

function train(state, action) {
  const player = currentPlayer(state);
  if (action.type === 'pass') { pushLog(state, `${player.name} skipped coaching.`); nextPlayer(state); return; }
  const artist = owned(player, action.artistId);
  if (!artist) throw new Error('Choose one of your active actors.');
  const kind = action.kind;
  const cost = kind === 'care' ? 2 : 3;
  if (!['vocal','creativity','stamina','care'].includes(kind) || player.money < cost) throw new Error('This training is unavailable.');
  if (kind !== 'care' && artist[kind] >= 6) throw new Error('This ability is already at its maximum.');
  if (kind === 'care' && artist.currentStamina === artist.maxStamina && !Object.values(artist.status).some(Boolean)) throw new Error('This actor needs no care.');
  player.money -= cost;
  if (kind === 'care') {
    artist.currentStamina = Math.min(artist.maxStamina, artist.currentStamina + 2);
    for (const key of ['stress','illness','exhaustion','drugs','tobacco']) artist.status[key] = 0;
  } else {
    artist[kind]++;
    if (kind === 'stamina') { artist.maxStamina++; artist.currentStamina++; }
  }
  pushLog(state, `${player.name} gave ${artist.name} ${kind === 'care' ? 'care' : `${kind} coaching`} for $${cost}.`, 'success');
  nextPlayer(state);
}

function eventPhase(state, rng) {
  state.event = state.eventDeck[(state.round - 1) % state.eventDeck.length];
  const event = state.event;
  pushLog(state, `EVENT — ${event.title}: ${event.text}`, 'event');
  if (event.id === 'sponsor') state.players.forEach(player => player.money += 2);
  if (event.id === 'recovery') state.players.forEach(player => living(player).forEach(artist => artist.currentStamina = Math.min(artist.maxStamina,artist.currentStamina + 1)));
  if (event.id === 'health') {
    const candidates = state.players.flatMap(player => living(player));
    candidates.sort((a,b) => a.currentStamina - b.currentStamina || a.name.localeCompare(b.name));
    if (candidates[0]) { candidates[0].status.stress++; pushLog(state, `${candidates[0].name} gained Stress.`); }
  }
  if (event.id === 'backstage' || event.id === 'smoky' || event.id === 'flu') {
    const candidates = state.players.flatMap(player => living(player));
    const target = candidates.length ? choose(candidates,rng) : null;
    if (target) {
      if (event.id === 'backstage') { target.status.drugs = 1; target.status.stress++; }
      else if (event.id === 'smoky') target.status.tobacco = 1;
      else target.status.illness = 1;
      pushLog(state, `${target.name} gained ${event.id === 'backstage' ? 'Meltdown and Pressure' : event.id === 'smoky' ? 'Typecast' : 'Injury'}.`, 'danger');
    }
  }
  nextPhase(state);
}

function create(state, action, rng) {
  const player = currentPlayer(state);
  if (action.type === 'pass') { pushLog(state, `${player.name} skipped production.`); nextPlayer(state); return; }
  const artist = owned(player, action.artistId);
  if (!artist || !canCreate(state, player, artist)) throw new Error('That actor cannot produce a film now.');
  const cost = albumCost(state); player.money -= cost; artist.currentStamina--;
  const mentor = artist.mentor && owned(player,artist.mentor) ? 1 : 0;
  const artpop = artist.tag === 'Artpop' ? 1 : 0;
  const quality = clamp(artist.creativity + roll(rng) + mentor + artpop - artist.status.stress - artist.status.illness, 1, 14);
  const royalty = 1 + Math.floor(quality / 4);
  const acclaim = Math.max(1, Math.floor(quality / 3)) + (state.event?.id === 'press' ? 2 : 0);
  const work = { id:++state.serial, title:randomAlbumTitle(rng), artistIds:[artist.id], ownerId:player.id, quality, royalty, round:state.round, collaboration:false, awarded:false };
  player.works.push(work); state.newWorks.push(work.id); player.acclaim += acclaim;
  if (artist.currentStamina === 0) artist.status.exhaustion = 1;
  pushLog(state, `${artist.name} premiered “${work.title}” (quality ${quality}, +$${royalty}/round, +${acclaim} reviews).`, 'success');
  nextPlayer(state);
}

function performance(state, action, rng) {
  const player = currentPlayer(state);
  if (action.type === 'pass') { pushLog(state, `${player.name} skipped the live circuit.`); nextPlayer(state); return; }
  const artist = owned(player,action.artistId), venue = venues.find(item => item.id === action.venueId);
  if (!venue || !canPlay(state,player,artist,venue)) throw new Error('Actor or shoot is unavailable.');
  const vocal = artist.vocal + (artist.tag === 'Vocal Flip' ? 1 : 0) - (artist.status.tobacco && artist.tag !== 'Jazz' ? 1 : 0);
  const earned = Math.max(1, venue.pay + Math.floor(vocal / 2) + (roll(rng) >= 5 ? 2 : 0) + (state.event?.id === 'venue' ? 2 : 0) + (state.event?.id === 'tourism' && ['festival','arena','tour'].includes(venue.id) ? 3 : 0));
  player.money += earned; artist.currentStamina -= venue.stamina; artist.used = true; player.placements++;
  if (!venue.tour) state.venueUsed[venue.id] = player.id;
  if (artist.currentStamina === 0) artist.status.exhaustion = 1;
  pushLog(state, `${artist.name} shot ${venue.name} for ${player.name}, earning $${earned}.`, 'success');
  nextPlayer(state);
}

function awards(state) {
  const works = state.players.flatMap(player => player.works).filter(work => state.newWorks.includes(work.id));
  if (works.length) {
    works.sort((a,b) => b.quality - a.quality || (state.players[b.ownerId].artists.some(artist => workArtist(artist,b) && artist.tag === 'Empress') ? 1 : 0) - (state.players[a.ownerId].artists.some(artist => workArtist(artist,a) && artist.tag === 'Empress') ? 1 : 0) || a.id - b.id);
    const winner = works[0], player = state.players[winner.ownerId];
    winner.awarded = true; player.acclaim += 3; player.money += 4 + (state.event?.id === 'awards' ? 3 : 0);
    pushLog(state, `GOLDEN REEL — ${winner.title} by ${player.name} wins! +3 acclaim and a cash prize.`, 'highlight');
  } else pushLog(state, 'GOLDEN REEL — No new release was eligible this round.');
  for (const player of state.players) {
    const payout = Math.floor(player.acclaim / 5);
    player.money += payout;
    if (payout) pushLog(state, `${player.name} collected $${payout} from the critics track.`);
  }
  nextPhase(state);
}
function workArtist(artist, work) { return work.artistIds.includes(artist.id); }

function critics(state) {
  const low = Math.min(...state.players.map(player => player.acclaim));
  const high = Math.max(...state.players.map(player => player.acclaim));
  if (low !== high) for (const player of state.players.filter(player => player.acclaim === low)) {
    const penalty = 3 + (state.event?.id === 'critics' ? 2 : 0);
    player.money = Math.max(0, player.money - penalty);
    pushLog(state, `CRITICS — ${player.name} finished last on the critics track and lost $${penalty}.`, 'danger');
  }
  else pushLog(state, 'CRITICS — Every agency is tied. No penalty.');
  nextPhase(state);
}

function karma(state, rng) {
  for (const player of state.players) for (const artist of living(player)) {
    const risk = artist.status.exhaustion + artist.status.stress + artist.status.illness * 2 + artist.status.drugs * 2;
    if (!risk) continue;
    const test = roll(rng);
    if (test + 2 <= risk && (artist.status.illness || artist.status.drugs)) {
      artist.dead = true;
      pushLog(state, `CAREER — ${artist.name} retired after a serious career crisis.`, 'danger');
      for (const younger of living(player).filter(other => other.mentor === artist.id)) {
        younger.inherited = true; younger.creativity = Math.min(6,younger.creativity + 1);
        pushLog(state, `${younger.name} inherited a creative spark from ${artist.name}.`, 'event');
      }
    } else if (test <= risk) {
      if (artist.status.exhaustion && artist.vocal > 1) artist.vocal--;
      else if (artist.creativity > 1) artist.creativity--;
      pushLog(state, `CAREER — ${artist.name} suffered a permanent ability loss.`, 'danger');
    }
  }
  nextPhase(state);
}

function reset(state) {
  for (const player of state.players) {
    const residuals = player.works.reduce((sum,work) => sum + work.royalty + (state.event?.id === 'streaming' ? 2 : 0),0);
    player.money += residuals;
    if (residuals) pushLog(state, `${player.name} received $${residuals} in residuals.`, 'success');
    for (const artist of living(player)) {
      artist.currentStamina = Math.min(artist.maxStamina,artist.currentStamina + 1);
      artist.used = false;
      artist.status.exhaustion = artist.currentStamina === 0 ? 1 : 0;
      artist.status.stress = Math.max(0,artist.status.stress - 1);
    }
  }
  if (state.round === 10) {
    state.gameOver = true;
    const sorted = [...state.players].sort((a,b) => b.money - a.money || b.acclaim - a.acclaim || b.works.length - a.works.length);
    const best = sorted[0];
    state.winnerIds = sorted.filter(player => player.money === best.money && player.acclaim === best.acclaim && player.works.length === best.works.length).map(player => player.id);
    pushLog(state, `GAME OVER — ${state.winnerIds.map(id => state.players[id].name).join(' & ')} wins with $${best.money}!`, 'highlight');
  } else {
    state.round++; state.phase = 0; state.current = 0; state.event = null; state.venueUsed = {}; state.showCycle = 0; state.newWorks = [];
    pushLog(state, `Round ${state.round} begins. New actors are up for casting.`, 'highlight');
  }
}

export function act(state, action, rng = Math.random) {
  if (state.gameOver) throw new Error('The game is over.');
  switch (state.phase) {
    case 0: if (action.type !== 'bid') throw new Error('Submit a sealed bid.'); bid(state,action,rng); break;
    case 1: if (!['train','pass'].includes(action.type)) throw new Error('Choose training or pass.'); train(state,action); break;
    case 2: if (action.type !== 'continue') throw new Error('Reveal the event.'); eventPhase(state,rng); break;
    case 3: if (!['create','pass'].includes(action.type)) throw new Error('Produce a screen work or pass.'); create(state,action,rng); break;
    case 4: if (!['perform','pass'].includes(action.type)) throw new Error('Choose a show or pass.'); performance(state,action,rng); break;
    case 5: if (action.type !== 'continue') throw new Error('Resolve the awards.'); awards(state); break;
    case 6: if (action.type !== 'continue') throw new Error('Resolve the critics track.'); critics(state); break;
    case 7: if (action.type !== 'continue') throw new Error('Resolve karma.'); karma(state,rng); break;
    case 8: if (action.type !== 'continue') throw new Error('Complete the reset.'); reset(state); break;
    default: throw new Error(`Unknown phase: ${phaseNames[state.phase]}`);
  }
  return state;
}

export function aiAction(state, rng = Math.random) {
  const player = currentPlayer(state);
  if (!player.ai) throw new Error('Current player is human.');
  if (state.phase === 0) {
    const lot = currentLot(state);
    const value = 2 + lot.vocal + lot.creativity + (lot.collab && owned(player,lot.collab) ? 4 : 0) + (lot.mentor && owned(player,lot.mentor) ? 2 : 0);
    const budget = Math.max(0,player.money - 3);
    return {type:'bid',amount:Math.min(budget,Math.max(0,Math.floor(value * (0.65 + rng() * 0.45))))};
  }
  if (state.phase === 1) {
    const candidate = living(player).sort((a,b) => b.creativity - a.creativity)[0];
    if (candidate && player.money >= 8 && candidate.creativity < 6 && rng() < 0.65) return {type:'train',artistId:candidate.id,kind:'creativity'};
    const tired = living(player).find(artist => artist.currentStamina < 2 || Object.values(artist.status).some(Boolean));
    if (tired && player.money >= 5) return {type:'train',artistId:tired.id,kind:'care'};
    return {type:'pass'};
  }
  if (state.phase === 3) {
    const candidate = living(player).filter(artist => canCreate(state,player,artist)).sort((a,b) => (b.creativity + (b.tag === 'Artpop')) - (a.creativity + (a.tag === 'Artpop')))[0];
    return candidate ? {type:'create',artistId:candidate.id} : {type:'pass'};
  }
  if (state.phase === 4) {
    const options = living(player).flatMap(artist => venues.filter(venue => canPlay(state,player,artist,venue)).map(venue => ({ artist,venue,score:venue.pay + artist.vocal/2 })));
    options.sort((a,b) => b.score - a.score);
    return options[0] ? {type:'perform',artistId:options[0].artist.id,venueId:options[0].venue.id} : {type:'pass'};
  }
  throw new Error('AI is not active in this phase.');
}

export function autoPlayAi(state, rng = Math.random) {
  let safety = 0;
  while (!state.gameOver && [0,1,3,4].includes(state.phase) && currentPlayer(state).ai) {
    act(state,aiAction(state,rng),rng);
    if (++safety > 30) throw new Error('AI turn loop stalled.');
  }
  return state;
}


