import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, act, autoPlayAi, currentPlayer, canCreate, canPlay } from '../engine.mjs';
import { artists, venues } from '../data.mjs';

function random(seed = 42) {
  return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
}

function humanAction(state) {
  const player = currentPlayer(state);
  if (state.phase === 0) return { type:'bid', amount:Math.min(player.money,7) };
  if (state.phase === 1) return { type:'pass' };
  if (state.phase === 3) {
    const artist = player.artists.find(item => canCreate(state,player,item));
    return artist ? { type:'create', artistId:artist.id } : { type:'pass' };
  }
  if (state.phase === 4) {
    for (const venue of [...venues].reverse()) for (const artist of player.artists) if (canPlay(state,player,artist,venue)) return { type:'perform',artistId:artist.id,venueId:venue.id };
    return { type:'pass' };
  }
  return { type:'continue' };
}

for (const config of [
  [{name:'Human',ai:false},{name:'Computer',ai:true}],
  [{name:'Human 1',ai:false},{name:'Human 2',ai:false},{name:'Computer 1',ai:true},{name:'Computer 2',ai:true}],
  [{name:'Human 1',ai:false},{name:'Human 2',ai:false},{name:'Human 3',ai:false},{name:'Human 4',ai:false}]
]) {
  test(`full 10-round game with ${config.length} labels`, () => {
    const rng = random(23 + config.length);
    const state = newGame({ players:config },rng);
    let turns = 0;
    while (!state.gameOver && turns++ < 500) {
      autoPlayAi(state,rng);
      if (!state.gameOver) act(state,humanAction(state),rng);
    }
    assert.equal(state.gameOver,true);
    assert.equal(state.round,10);
    assert.ok(state.winnerIds.length >= 1);
    assert.ok(state.players.some(player => player.works.length > 0));
    assert.ok(state.players.every(player => player.money >= 0));
    assert.ok(turns < 500);
  });
}

test('sealed bid resolves only after all players bid and collaboration releases once', () => {
  const rng = () => 0.99;
  const state = newGame({players:[{name:'Alpha',ai:false},{name:'Beta',ai:false}]},rng);
  state.deck[0] = artists.find(artist => artist.id === 'nova');
  state.deck[1] = artists.find(artist => artist.id === 'echo');
  act(state,{type:'bid',amount:8},rng);
  assert.equal(state.players[0].artists.length,1);
  act(state,{type:'bid',amount:0},rng);
  assert.equal(state.players[0].artists.length,2);
  act(state,{type:'bid',amount:8},rng);
  act(state,{type:'bid',amount:0},rng);
  assert.equal(state.phase,1);
  assert.equal(state.players[0].artists.length,3);
  assert.equal(state.players[0].works.filter(work => work.collaboration).length,1);
});

test('an invalid bid cannot overspend', () => {
  const state = newGame({players:[{name:'Alpha',ai:false},{name:'Beta',ai:true}]},random());
  assert.throws(() => act(state,{type:'bid',amount:19}),/afford/);
  assert.equal(state.current,0);
  assert.equal(Object.keys(state.bids).length,0);
});

test('Artpop boosts creation quality and Empress breaks an award tie', () => {
  const rng = () => 0;
  const state = newGame({players:[{name:'Alpha',ai:false},{name:'Beta',ai:false}]},rng);
  const artpop = state.players[0].artists[0];
  artpop.tag = 'Artpop'; artpop.creativity = 3;
  state.phase = 3;
  act(state,{type:'create',artistId:artpop.id},rng);
  assert.equal(state.players[0].works[0].quality,5);
  const empress = { ...state.players[1].artists[0], id:'empress-test', tag:'Empress' };
  state.players[1].artists.push(empress);
  const challenger = {id:99,title:'The Challenger',artistIds:['empress-test'],ownerId:1,quality:5,royalty:2,round:1,collaboration:false,awarded:false};
  state.players[1].works.push(challenger); state.newWorks.push(challenger.id);
  state.phase = 5;
  act(state,{type:'continue'},rng);
  assert.equal(challenger.awarded,true);
});

test('Jazz ignores Tobacco, Vocal Flip boosts shows, and legacy can be inherited', () => {
  const state = newGame({players:[{name:'Alpha',ai:false},{name:'Beta',ai:false}]},()=>0);
  const player = state.players[0];
  const arena = venues.find(venue=>venue.id==='arena');
  const artist = player.artists[0];
  artist.vocal = 5; artist.currentStamina = 3; artist.status.tobacco = 1;
  artist.tag = 'Jazz';
  assert.equal(canPlay(state,player,artist,arena),true);
  artist.tag = 'Vocal Flip'; artist.vocal = 4; artist.status.tobacco = 0;
  assert.equal(canPlay(state,player,artist,arena),true);
  artist.status.tobacco = 1;
  assert.equal(canPlay(state,player,artist,arena),false);

  const elder = { ...artist, id:'elder', status:{stress:1,illness:1,exhaustion:1,drugs:1,tobacco:0}, dead:false };
  const younger = { ...artist, id:'younger', mentor:'elder', creativity:3, status:{stress:0,illness:0,exhaustion:0,drugs:0,tobacco:0}, dead:false };
  player.artists.push(elder,younger);
  state.phase = 7;
  act(state,{type:'continue'},()=>0);
  assert.equal(elder.dead,true);
  assert.equal(younger.inherited,true);
  assert.equal(younger.creativity,4);
});
