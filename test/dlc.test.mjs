import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,autoPlayAi,currentPlayer,canCreate,canPlay} from '../dlc/actor-agency/actor-engine.mjs';
import {venues} from '../dlc/actor-agency/actor-data.mjs';
import {newEnsembleGame,actEnsemble,autoPlayEnsemble,rankings,companyPoints} from '../dlc/ensemble-debut/ensemble-engine.mjs';

function random(seed=7123){return()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};}

test('actor agency runs all ten rounds with an actor-only deck',()=>{
  const rng=random(),state=newGame({players:[{name:'Agency',ai:false},{name:'Rival',ai:true}]},rng);
  assert.equal(state.deck.length,20);
  assert.ok(state.deck.every(card=>card.genre!=='Pop'));
  let steps=0;
  while(!state.gameOver&&steps++<300){
    autoPlayAi(state,rng);
    if(state.gameOver)break;
    const player=currentPlayer(state);
    let action;
    if(state.phase===0)action={type:'bid',amount:Math.min(7,player.money)};
    else if(state.phase===1)action={type:'pass'};
    else if(state.phase===3){const card=player.artists.find(card=>canCreate(state,player,card));action=card?{type:'create',artistId:card.id}:{type:'pass'};}
    else if(state.phase===4){const available=venues.flatMap(venue=>player.artists.filter(card=>canPlay(state,player,card,venue)).map(card=>({venue,card})))[0];action=available?{type:'perform',artistId:available.card.id,venueId:available.venue.id}:{type:'pass'};}
    else action={type:'continue'};
    act(state,action,rng);
  }
  assert.ok(state.gameOver);
  assert.equal(state.round,10);
  assert.ok(state.players.every(player=>player.artists.every(card=>card.id!=='nova')));
});

test('coed debut resolves seven seats, company points, and AI turns',()=>{
  const rng=random(),state=newEnsembleGame({players:[{name:'Studio A',ai:false},{name:'Studio B',ai:true},{name:'Studio C',ai:true}]},rng);
  assert.ok(state.players.every(player=>player.cards.filter(card=>card.kind==='singer').length===2&&player.cards.filter(card=>card.kind==='actor').length===2));
  let steps=0;
  while(state.phase!=='finale'&&steps++<60){
    autoPlayEnsemble(state,rng);
    if(state.phase==='results'){actEnsemble(state,{type:'continue'},rng);continue;}
    const card=state.players[state.current].cards[0];
    if(state.phase==='rehearsal')actEnsemble(state,{type:'rehearse',cardId:card.id,station:'rest'},rng);
    else actEnsemble(state,{type:'perform',cardId:card.id,focus:'vocal',promo:0},rng);
  }
  assert.equal(state.phase,'finale');
  assert.equal(state.debut.length,7);
  assert.equal(new Set(state.debut.map(card=>card.id)).size,7);
  assert.equal(state.debut.reduce((sum,card)=>sum+card.points,0),38);
  assert.ok(state.winnerIds.length>=1);
  assert.ok(state.players.every(player=>companyPoints(state,player.id)>=0));
  assert.equal(rankings(state).length,12);
});
