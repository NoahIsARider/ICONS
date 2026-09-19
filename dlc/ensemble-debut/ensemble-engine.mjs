import { artists as singers, starters as singerStarters } from '../../data.mjs';
import { artists as actors, starters as actorStarters } from '../actor-agency/actor-data.mjs';

const source = [
  ...[...singers,...singerStarters].map(card => ({...card,kind:'singer'})),
  ...[...actors,...actorStarters].map(card => ({...card,kind:'actor'}))
];
const clamp = (number,min,max) => Math.max(min,Math.min(max,number));
const roll = rng => 1 + Math.floor(rng()*6);
const shuffle = (items,rng) => {
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
  return copy;
};
const seats = [10,8,6,5,4,3,2];
const currentPlayer = state => state.players[state.current];
const candidate = (player,id) => player.cards.find(card => card.id===id);
const active = state => state.players.filter(player => !player.ai);
const stageSkill = (card,focus) => focus==='vocal' ? card.vocal : focus==='dance' ? card.creativity : Math.round((card.vocal+card.creativity)/2)+(card.kind==='actor'?1:0);
const log = (state,message) => {state.log.unshift({id:++state.serial,round:state.round,message});state.log=state.log.slice(0,30);};

export function newEnsembleGame(config,rng=Math.random){
  const entries=(config.players||[]).filter(player=>player.name?.trim()).slice(0,4);
  if(entries.length<2||!active({players:entries}).length)throw new Error('Choose 2–4 companies with at least one human.');
  const singerPool=shuffle(source.filter(card=>card.kind==='singer'),rng);
  const actorPool=shuffle(source.filter(card=>card.kind==='actor'),rng);
  const players=entries.map((entry,index)=>({id:index,name:entry.name.trim().slice(0,24),ai:!!entry.ai,cash:12,color:['#efbb64','#6edbd4','#e88db8','#b6a1f7'][index],cards:shuffle([...singerPool.slice(index*2,index*2+2),...actorPool.slice(index*2,index*2+2)],rng).map(card=>({
    id:card.id,name:card.name,kind:card.kind,genre:card.genre,vocal:card.vocal,creativity:card.creativity,
    fans:0,fatigue:0,rehearsal:null,performed:0
  }))}));
  const state={version:1,mode:'ensemble',round:1,phase:'rehearsal',current:0,players,stations:{},submissions:{},results:[],debut:[],winnerIds:[],log:[],serial:0};
  log(state,'The mixed-gender debut season begins. Seven seats await.');
  return state;
}

export function rankings(state){
  return state.players.flatMap(player=>player.cards.map(card=>({...card,companyId:player.id,companyName:player.name,companyColor:player.color})))
    .sort((a,b)=>b.fans-a.fans||b.performed-a.performed||b.vocal+b.creativity-a.vocal-a.creativity||a.name.localeCompare(b.name));
}

export function canRehearse(state,station){return station==='rest'||!state.stations[station];}

function advance(state,rng){
  state.current++;
  if(state.current<state.players.length)return;
  state.current=0;
  if(state.phase==='rehearsal'){state.phase='stage';log(state,`Episode ${state.round}: stage submissions are open.`);return;}
  if(state.phase==='stage'){
    state.results=Object.entries(state.submissions).map(([playerId,submission])=>{
      const player=state.players[Number(playerId)],card=candidate(player,submission.cardId);
      const rehearsal=card.rehearsal===submission.focus?2:card.rehearsal==='all'?1:0;
      const score=stageSkill(card,submission.focus)+rehearsal+roll(rng)+submission.promo-Math.floor(card.fatigue/2);
      card.fans+=Math.max(1,score);card.fatigue=clamp(card.fatigue+2,0,5);card.performed++;
      return {playerId:player.id,cardId:card.id,name:card.name,company:player.name,score,focus:submission.focus,bonus:0};
    }).sort((a,b)=>b.score-a.score||a.playerId-b.playerId);
    state.results.forEach((result,index)=>{result.bonus=[5,3,1,0][index]||0;candidate(state.players[result.playerId],result.cardId).fans+=result.bonus;});
    state.phase='results';
    log(state,`${state.results[0].name} tops Episode ${state.round} and earns five bonus fans.`);
  }
}

export function actEnsemble(state,action,rng=Math.random){
  if(state.phase==='finale')throw new Error('The season is complete.');
  if(state.phase==='results'){
    if(action.type!=='continue')throw new Error('Continue to the next episode.');
    if(state.round===5){
      state.debut=rankings(state).slice(0,7).map((card,index)=>({...card,rank:index+1,points:seats[index]}));
      const counts=state.players.map(player=>state.debut.filter(card=>card.companyId===player.id).length);
      const most=Math.max(...counts);
      const winners=state.players.map((player,index)=>({player,points:state.debut.filter(card=>card.companyId===index).reduce((sum,card)=>sum+card.points,0)+(counts[index]===most?8:0),slots:counts[index]}));
      const high=Math.max(...winners.map(item=>item.points));
      state.winnerIds=winners.filter(item=>item.points===high).map(item=>item.player.id);
      state.phase='finale';log(state,`The debut lineup is revealed. ${state.players[state.winnerIds[0]].name} wins the company race.`);
      return;
    }
    state.round++;state.phase='rehearsal';state.current=0;state.stations={};state.submissions={};state.results=[];
    state.players.forEach(player=>player.cards.forEach(card=>{card.fatigue=Math.max(0,card.fatigue-1);card.rehearsal=null;}));
    log(state,`Episode ${state.round} begins. Rehearsal stations reopen.`);
    return;
  }
  const player=currentPlayer(state);
  const card=candidate(player,action.cardId);
  if(!card)throw new Error('Choose one of your cards.');
  if(state.phase==='rehearsal'){
    const station=action.station;
    if(!['vocal','dance','story','rest'].includes(station)||!canRehearse(state,station))throw new Error('That rehearsal space is already taken.');
    if(station==='rest'){card.fatigue=Math.max(0,card.fatigue-3);card.rehearsal='all';}
    else {state.stations[station]=player.id+1;card.rehearsal=station;}
    log(state,`${player.name} sends ${card.name} to ${station==='rest'?'Recovery':station.toUpperCase()+' Rehearsal'}.`);
    advance(state,rng);return;
  }
  if(state.phase==='stage'){
    const focus=action.focus,promo=Number(action.promo);
    if(!['vocal','dance','story'].includes(focus)||!Number.isInteger(promo)||promo<0||promo>3||promo>player.cash)throw new Error('Choose a valid stage focus and promotion spend.');
    player.cash-=promo;state.submissions[player.id]={cardId:card.id,focus,promo};
    log(state,`${player.name} locks in a secret stage performance.`);
    advance(state,rng);
  }
}

export function autoPlayEnsemble(state,rng=Math.random){
  let safety=0;
  while(['rehearsal','stage'].includes(state.phase)&&currentPlayer(state).ai&&safety++<30){
    const player=currentPlayer(state);
    if(state.phase==='rehearsal'){
      const card=[...player.cards].sort((a,b)=>b.fans-a.fans||b.vocal+b.creativity-a.vocal-a.creativity)[0];
      const station=['vocal','dance','story'].filter(item=>canRehearse(state,item)).sort((a,b)=>stageSkill(card,b)-stageSkill(card,a))[0]||'rest';
      actEnsemble(state,{type:'rehearse',cardId:card.id,station},rng);
    }else{
      const card=[...player.cards].sort((a,b)=>b.fans+Math.max(b.vocal,b.creativity)*2-a.fans-Math.max(a.vocal,a.creativity)*2)[0];
      const focus=['vocal','dance','story'].sort((a,b)=>stageSkill(card,b)+(card.rehearsal===b?2:0)-stageSkill(card,a)-(card.rehearsal===a?2:0))[0];
      actEnsemble(state,{type:'perform',cardId:card.id,focus,promo:Math.min(player.cash,state.round>=3?3:1)},rng);
    }
  }
  if(safety>=30)throw new Error('AI turn limit reached.');
}

export function companyPoints(state,playerId){
  const cards=state.debut.filter(card=>card.companyId===playerId);
  const most=Math.max(...state.players.map(player=>state.debut.filter(card=>card.companyId===player.id).length));
  return cards.reduce((sum,card)=>sum+card.points,0)+(cards.length===most?8:0);
}
