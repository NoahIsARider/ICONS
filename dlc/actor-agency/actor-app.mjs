import { phaseNames, phaseIcons, venues } from './actor-data.mjs';
import { newGame, act, autoPlayAi, currentLot, currentPlayer, canCreate, canPlay } from './actor-engine.mjs';

const root = document.querySelector('#app');
const KEY = 'actor-agency-save-v1';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon = (name, className = '') => `<img class="${className}" src="dlc/actor-agency/icons/${name}.png" alt="" draggable="false">`;
const portrait = artist => `dlc/actor-agency/portraits/${artist.id}.jpg`;
const traitNames = {Artpop:'Method',Jazz:'Range','Vocal Flip':'Star Power',Empress:'Box Office'};
const statusNames = {stress:'Pressure',illness:'Injury',exhaustion:'Burnout',drugs:'Meltdown',tobacco:'Typecast'};
const alive = player => player.artists.filter(artist => !artist.dead);
const roundCost = () => state.event?.id === 'rebate' ? 1 : 2;

let state = null;
let selectedId = null;
let bidAmount = 8;
let gate = true;
let modal = '';
let notice = null;
let noticeTimer = null;
let soundOn = localStorage.getItem('record-label-rivals-sound') !== 'off';
let audioContext = null;

try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  if (saved?.version === 1 && Array.isArray(saved.players)) state = saved;
} catch { /* Damaged saves start fresh. */ }
if (state) state.showCycle ??= 0;
if (state && !state.gameOver) { try { autoPlayAi(state); } catch { state = null; } }
if (state) selectedId = alive(currentPlayer(state))[0]?.id ?? null;

function sound(kind = 'tap') {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    const notes = kind === 'win' ? [523,659,784] : kind === 'coin' ? [560,880] : kind === 'flip' ? [220,440] : [360];
    notes.forEach((frequency,index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = kind === 'coin' ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency,now+index*.075);
      gain.gain.setValueAtTime(.0001,now+index*.075);
      gain.gain.exponentialRampToValueAtTime(.055,now+index*.075+.01);
      gain.gain.exponentialRampToValueAtTime(.0001,now+index*.075+.2);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(now+index*.075); oscillator.stop(now+index*.075+.21);
    });
  } catch { /* Audio is optional. */ }
}

function save() {
  if (state) {
    const data = JSON.stringify(state);
    localStorage.setItem(KEY,data);
  } else {
    localStorage.removeItem(KEY);
  }
}
function showNotice(text,type='good') {
  notice = {text,type};
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice = null; render(); },3200);
}
function perform(action) {
  if (!state || state.gameOver) return;
  try {
    const oldPhase = state.phase, oldPlayer = state.current, oldLogId = state.log[0]?.id;
    act(state,action);
    autoPlayAi(state);
    if ([0,1,3,4].includes(state.phase) && (state.phase !== oldPhase || state.current !== oldPlayer || action.type === 'bid')) gate = true;
    if (state.phase === 0 && (oldPhase !== 0 || state.auctionIndex !== 0)) bidAmount = Math.min(8,currentPlayer(state).money);
    const actor = currentPlayer(state);
    if (!alive(actor).some(artist => artist.id === selectedId)) selectedId = alive(actor)[0]?.id ?? null;
    const change = state.log.find(item => item.id !== oldLogId && ['success','highlight','danger','event'].includes(item.type));
    if (change) showNotice(change.text,change.type);
    sound(action.type === 'bid' || action.type === 'perform' ? 'coin' : action.type === 'continue' ? 'flip' : 'tap');
    if (state.gameOver) sound('win');
    save(); render();
  } catch(error) { showNotice(error.message,'danger'); sound('tap'); render(); }
}

function miniStat(iconName,value,label) { return `<span class="mini-stat">${icon(iconName)}<strong>${value}</strong><small>${label}</small></span>`; }
function artistCard(artist,{size='hand',selected=false,draggable=false,showOwner=false}={}) {
  const status = Object.entries(artist.status || {}).filter(([,value])=>value).map(([key])=>statusNames[key]||key);
  const traitIcons = {Artpop:'19-artpop',Jazz:'20-jazz','Vocal Flip':'21-vocal-flip',Empress:'22-empress'};
  return `<button class="playing-card ${size} ${selected?'selected':''} ${artist.dead?'dead':''}" data-action="select-artist" data-id="${escapeHtml(artist.id)}" ${draggable?'draggable="true"':''} type="button" aria-label="Select ${escapeHtml(artist.name)}">
    <div class="card-face-art" style="background-image:url('${portrait(artist)}')"></div>
    <span class="card-foil"></span><span class="card-genre">${escapeHtml(artist.genre)}</span>
    <span class="card-trait">${icon(traitIcons[artist.tag]||'01-recruitment')}<span>${escapeHtml(traitNames[artist.tag]||artist.tag)}</span></span>
    <span class="card-info"><b>${escapeHtml(artist.name)}</b><span class="card-stats">${miniStat('13-vocal',artist.vocal,'PRESENCE')}${miniStat('14-creativity',artist.creativity,'CRAFT')}${miniStat('15-stamina',artist.currentStamina ?? artist.stamina,'ENERGY')}</span></span>
    ${status.length?`<span class="card-status">${status.map(escapeHtml).join(' · ')}</span>`:''}
    ${artist.dead?'<span class="card-dead">RETIRED</span>':''}
    ${showOwner?'<span class="card-owner">SIGNED</span>':''}
  </button>`;
}

function setupScreen() {
  return `<main class="title-screen"><div class="title-vignette"></div><div class="title-content">
    <div class="title-kicker">ACTOR AGENCY RIVALS · ACTOR AGENCY DLC</div>
    <h1>ACTOR AGENCY<br><em>RIVALS</em></h1>
    <div class="title-rule"></div>
    <p>Cast tomorrow's stars. Produce the stories. Own the screen.<br>The richest agency after ten rounds takes the crown.</p>
    <form id="setup-form" class="label-setup"><div class="setup-caption">CHOOSE 2–4 AGENCIES</div>
      ${[0,1,2,3].map((index)=>`<div class="setup-slot"><span class="slot-number">0${index+1}</span><input name="name${index}" value="${['Your Agency','Silver Screen','Third Agency','Fourth Agency'][index]}" maxlength="24" aria-label="Agency ${index+1} name"><select name="type${index}" aria-label="Agency ${index+1} type"><option value="human" ${index===0?'selected':''}>Human</option><option value="ai" ${index===1?'selected':''}>Computer</option><option value="off" ${index>1?'selected':''}>Off</option></select></div>`).join('')}
      <button class="gold-button start-button" type="submit">ENTER THE SET <span>➜</span></button>
    </form><div class="title-foot">LOCAL MULTIPLAYER · SOLO VS COMPUTER · AUTOSAVE · <a href="/">MAIN GAME</a></div>
  </div><div class="title-cards">${['mei','imani','farid','mira'].map((id,i)=>`<div class="title-art" style="--i:${i};background-image:url('dlc/actor-agency/portraits/${id}.jpg')"></div>`).join('')}</div></main>`;
}

function scoreChip(player) {
  const active = !state.gameOver && [0,1,3,4].includes(state.phase) && state.current===player.id;
  return `<div class="score-chip ${active?'active':''}" style="--chip:${player.color}"><span class="chip-disc">●</span><span class="chip-label"><b>${escapeHtml(player.name)}</b><small>${player.ai?'CPU':'HUMAN'}</small></span><span class="chip-cash">$${player.money}</span><span class="chip-acclaim">★ ${player.acclaim}</span></div>`;
}
function phaseStrip() { return `<div class="phase-strip">${phaseNames.map((name,index)=>`<span class="phase-pip ${index===state.phase?'active':''} ${index<state.phase?'done':''}" title="${escapeHtml(name)}">${icon(phaseIcons[index])}<small>${index+1}</small></span>`).join('')}</div>`; }
function seatBar() {
  return `<header class="table-hud"><div class="table-brand"><span class="record-mark">◎</span><span>ACTOR AGENCY<br><b>RIVALS</b></span></div><div class="round-badge"><small>ROUND</small><b>${String(state.round).padStart(2,'0')} <em>/ 10</em></b></div><div class="score-row">${state.players.map(scoreChip).join('')}</div><button class="round-tool" data-action="sound" title="Toggle sound" aria-label="Toggle sound">${soundOn?'♫':'♪'}</button><button class="round-tool" data-action="menu" title="Game menu" aria-label="Open game menu">☰</button></header>`;
}

function instruction(title,body) { return `<div class="scene-instruction"><span>${escapeHtml(phaseNames[state.phase])} · ROUND ${state.round}</span><h2>${title}</h2><p>${body}</p></div>`; }
function goldAction(label,action='continue') { return `<button class="gold-button scene-button" data-action="${action}">${label}<span>➜</span></button>`; }

function recruitmentScene() {
  const lot = currentLot(state), submitted = Object.keys(state.bids).length;
  const player = currentPlayer(state);
  return `<div class="scene scene-auction">
    ${instruction('CAST THE NEXT STAR',`Lot ${state.auctionIndex+1} of 2 · ${submitted}/${state.players.length} sealed bids placed`)}
    <div class="auction-spotlight"><div class="auction-halo"></div>${artistCard(lot,{size:'feature'})}<div class="auction-lot">LOT ${state.auctionIndex+1}</div></div>
    <div class="auction-console"><span class="console-kicker">SEALED BID</span><p>Sign ${escapeHtml(lot.name)}. Highest bid signs the actor. Losing bids cost nothing.</p><div class="bid-dial"><button data-action="bid-down" aria-label="Decrease bid">−</button><strong>$${bidAmount}</strong><button data-action="bid-up" aria-label="Increase bid">+</button></div><input id="bid-range" type="range" min="0" max="${player.money}" value="${bidAmount}" aria-label="Bid amount"><div class="bid-limits"><span>PASS · $0</span><span>YOUR CASH · $${player.money}</span></div><div class="bid-limits"><span id="bid-left">CASH LEFT · $${player.money - bidAmount}</span><span>COACHING $3 · FILM $${roundCost()}</span></div><button class="gold-button bid-submit" data-action="bid">SEAL THE BID <span>➜</span></button></div>
    <div class="auction-decoration">${icon('01-recruitment')}<span>CASTING AUCTION</span></div>
  </div>`;
}

function trainingScene() {
  const player = currentPlayer(state), artist = selectedArtist();
  const actions = [
    ['creativity','14-creativity','Craft Coaching','$3','+1 Craft'],
    ['vocal','13-vocal','Presence Coaching','$3','+1 Presence'],
    ['stamina','15-stamina','Endurance','$3','+1 Max Stamina'],
    ['care','23-exhaustion','Rest & Care','$2','Restore energy · clear status']
  ];
  const reason = (kind, cost) => {
    if (!artist) return 'Select an actor first';
    if (player.money < cost) return 'Not enough cash';
    if (kind !== 'care' && artist[kind] >= 6) return 'Already at maximum';
    if (kind === 'care' && artist.currentStamina === artist.maxStamina && !Object.values(artist.status).some(Boolean)) return 'Nothing to heal';
    return '';
  };
  return `<div class="scene scene-training">${instruction('SHAPE A SCREEN STAR','Select an actor from your hand. Click a training tile or drag the card onto it.')}
    <div class="training-portrait">${artist?artistCard(artist,{size:'feature',selected:true}):'<div class="empty-card">NO ACTORS AVAILABLE</div>'}</div>
    <div class="training-actions">${actions.map(([kind,art,title,cost,detail])=>{const blocked=reason(kind,Number(cost.slice(1)));return `<button class="action-tile drop-zone" data-action="train" data-kind="${kind}" data-drop="train" ${blocked?'disabled':''} title="${escapeHtml(blocked)}">${icon(art)}<span><b>${title}</b><small>${blocked||detail}</small></span><strong>${cost}</strong></button>`;}).join('')}<button class="pass-tile" data-action="pass">PASS TRAINING ➜</button></div>
  </div>`;
}

function eventScene() {
  return `<div class="scene scene-event">${instruction('FATE HAS A NEW SCENE','A single event changes the rhythm of this round. Flip the card to reveal it.')}
    <button class="event-back" data-action="continue" aria-label="Reveal event card"><span class="event-back-inner">${icon('03-event')}<strong>EVENT</strong><small>ROUND ${state.round}</small></span></button>
    <div class="scene-side-note">ONE CARD CAN CHANGE EVERYTHING</div>
  </div>`;
}

function creationScene() {
  const artist = selectedArtist(), player = currentPlayer(state);
  const can = artist && canCreate(state,player,artist);
  const anyone = alive(player).some(candidate=>canCreate(state,player,candidate));
  return `<div class="scene scene-creation">${instruction('MAKE THE NEXT CLASSIC',`Select a ready actor. A new production costs $${roundCost()} and generates residuals every round.`)}
    <div class="creation-artist">${artist?artistCard(artist,{size:'feature',selected:true}):'<div class="empty-card">NO ACTORS AVAILABLE</div>'}</div>
    <button class="studio-press drop-zone ${can?'ready':'unavailable'}" data-action="create" data-drop="create" ${!anyone?'disabled':''} aria-label="Produce a film with selected actor"><span class="spinning-vinyl"><span></span></span><b>ROLL CAMERA</b><small>$${roundCost()} PRODUCTION COST · +RESIDUALS · +REVIEWS</small></button>
    <button class="scene-pass" data-action="pass">PASS CREATION ➜</button>
  </div>`;
}

function venueTile(venue,artist,player) {
  const occupied = state.venueUsed[venue.id] != null;
  const eligible = artist && canPlay(state,player,artist,venue);
  const anyone = alive(player).some(candidate=>canPlay(state,player,candidate,venue));
  return `<button class="venue-tile drop-zone ${eligible?'eligible':''} ${occupied?'occupied':''}" data-action="venue" data-venue="${venue.id}" data-drop="venue" ${!anyone?'disabled':''}>
    <span class="venue-light"></span>${icon(venue.icon)}<span class="venue-name">${escapeHtml(venue.name)}</span><span class="venue-pay">$${venue.pay} <small>BASE</small></span><span class="venue-needs">PRESENCE ${venue.vocal}+ · ${venue.stamina} ENERGY</span><span class="venue-marker">${occupied?'TAKEN':venue.tour?'AUTEUR':eligible?'PLACE ACTOR':anyone?'SELECT ARTIST':'LOCKED'}</span>
  </button>`;
}

function showScene() {
  const artist = selectedArtist(), player = currentPlayer(state);
  return `<div class="scene scene-shows">${instruction('CLAIM THE SET',`Shoot ${state.showCycle+1} of 2. Select an actor, then claim an open production. Each actor may shoot once per round; shared sets fill when claimed.`)}
    <div class="venues-board">${venues.map(venue=>venueTile(venue,artist,player)).join('')}</div><button class="scene-pass" data-action="pass">PASS SHOOT DAY ➜</button>
  </div>`;
}

function awardsScene() {
  const candidates = state.players.flatMap(player=>player.works.map(work=>({...work,player}))).filter(work=>state.newWorks.includes(work.id)).sort((a,b)=>b.quality-a.quality);
  return `<div class="scene scene-ceremony">${instruction('AND THE WINNER IS…','The strongest new production claims the Golden Reel. Box Office breaks quality ties. Reviews pay every agency.')}
    <div class="ceremony-trophy">${icon('06-awards')}<span>GOLDEN REEL</span></div><div class="nominees">${candidates.length?candidates.slice(0,3).map(work=>`<div class="nominee"><span class="nominee-disc">◉</span><b>${escapeHtml(work.title)}</b><small>${escapeHtml(work.player.name)} · Q${work.quality}</small></div>`).join(''):'<div class="nominee empty">NO NEW PRODUCTIONS</div>'}</div>${goldAction('OPEN THE ENVELOPE')}
  </div>`;
}

function criticsScene() {
  const max = Math.max(1,...state.players.map(player=>player.acclaim));
  return `<div class="scene scene-critics">${instruction('THE CRITICS HAVE SPOKEN','The agency at the bottom of the review chart pays a penalty.')}
    <div class="critic-chart">${state.players.map(player=>`<div class="critic-column" style="--chart-color:${player.color}"><div class="critic-bar" style="--height:${Math.max(8,player.acclaim/max*100)}%"><span>★ ${player.acclaim}</span></div><b>${escapeHtml(player.name)}</b></div>`).join('')}</div>${goldAction('PUBLISH THE REVIEWS')}
  </div>`;
}

function karmaScene() {
  const risks = state.players.flatMap(player=>alive(player).filter(artist=>Object.values(artist.status).some(Boolean)).map(artist=>({artist,player})));
  return `<div class="scene scene-karma">${instruction('THE COST OF FAME','Burnout, injury, pressure and meltdown can leave permanent marks. Roll for every affected actor.')}
    <div class="risk-cards">${risks.length?risks.slice(0,5).map(({artist,player})=>`<div class="risk-card"><img src="${portrait(artist)}" alt=""><span><b>${escapeHtml(artist.name)}</b><small>${escapeHtml(player.name)}</small><em>${Object.entries(artist.status).filter(([,value])=>value).map(([key])=>escapeHtml(statusNames[key]||key)).join(' · ')}</em></span></div>`).join(''):`<div class="risk-clear">${icon('08-karma')}<b>NO ACTORS AT RISK</b></div>`}</div>${goldAction('ROLL THE CONSEQUENCES')}
  </div>`;
}

function resetScene() {
  return `<div class="scene scene-reset">${instruction('THE CAMERAS KEEP ROLLING','Collect residuals from every production. Actors recover energy before the next round.')}
    <div class="royalty-stack">${state.players.map(player=>{const amount=player.works.reduce((sum,work)=>sum+work.royalty+(state.event?.id==='streaming'?2:0),0);return `<div class="royalty-line">${icon('11-royalties')}<b>${escapeHtml(player.name)}</b><strong>+$${amount}</strong><small>${player.works.length} productions</small></div>`;}).join('')}</div>${goldAction(state.round===10?'REVEAL THE WINNER':'START THE NEXT ROUND')}
  </div>`;
}

function gameOverScene() {
  const sorted = [...state.players].sort((a,b)=>b.money-a.money||b.acclaim-a.acclaim);
  return `<div class="scene scene-finale"><div class="finale-rays"></div>${icon('06-awards','finale-trophy')}<span class="finale-kicker">THE FINAL REEL</span><h1>${escapeHtml(state.winnerIds.map(id=>state.players[id].name).join(' & '))}</h1><p>TAKES THE CROWN</p><div class="finale-scores">${sorted.map((player,index)=>`<div><span>#${index+1}</span><b>${escapeHtml(player.name)}</b><strong>$${player.money}</strong><small>★ ${player.acclaim}</small></div>`).join('')}</div><button class="gold-button" data-action="new-game">PLAY AGAIN ➜</button></div>`;
}

function scene() {
  if (state.gameOver) return gameOverScene();
  return [recruitmentScene,trainingScene,eventScene,creationScene,showScene,awardsScene,criticsScene,karmaScene,resetScene][state.phase]();
}

function hand() {
  if (state.gameOver) return '';
  const player = currentPlayer(state);
  const cards = alive(player);
  return `<div class="hand-zone"><div class="hand-heading"><span>YOUR ACTORS <b>${escapeHtml(player.name)}</b></span><button data-action="rosters">VIEW ALL AGENCIES ↗</button></div><div class="hand-cards">${cards.length?cards.map((artist,index)=>`<div class="hand-holder" style="--index:${index};--total:${cards.length}">${artistCard(artist,{selected:artist.id===selectedId,draggable:true})}</div>`).join(''):'<div class="hand-empty">No available actors. Pass this action and cast again next round.</div>'}</div><div class="hand-hint">${[1,3,4].includes(state.phase)?'CLICK A CARD TO SELECT · DRAG IT TO AN ACTION SPACE':'YOUR CAST'}</div></div>`;
}

function gateOverlay() {
  if (!gate || state.gameOver || ![0,1,3,4].includes(state.phase) || currentPlayer(state).ai) return '';
  return `<div class="veil gate-veil"><div class="handoff"><div class="card-back">${icon('11-royalties')}</div><div class="handoff-kicker">PASS THE DEVICE</div><h2>${escapeHtml(currentPlayer(state).name)}</h2><p>${state.phase===0?'Your sealed bid stays private until everyone bids.':'Your turn at the table.'}</p><button class="gold-button" data-action="ready">TAKE YOUR SEAT ➜</button></div></div>`;
}

function modalOverlay() {
  if (!modal) return '';
  if (modal === 'menu') return `<div class="veil modal-veil"><div class="game-modal"><span class="modal-kicker">PAUSE MENU</span><h2>Actor Agency Rivals</h2><button data-action="rules">HOW TO PLAY</button><button data-action="rosters">ALL AGENCIES</button><button data-action="sound">SOUND: ${soundOn?'ON':'OFF'}</button><button data-action="confirm-new">NEW GAME</button><button data-action="close-modal">RETURN TO TABLE</button><a href="/">MAIN GAME</a></div></div>`;
  if (modal === 'confirm-new') return `<div class="veil modal-veil"><div class="game-modal"><h2>Start a new game?</h2><p>Your current saved game will be replaced.</p><button data-action="new-game">YES, START OVER</button><button data-action="close-modal">KEEP PLAYING</button></div></div>`;
  if (modal === 'rules') return `<div class="veil modal-veil"><div class="game-modal rules-modal"><h2>How to Play</h2><p>After ten rounds, the agency with the most cash wins. Each round: bid for two actors, coach or care for one, reveal an industry event, produce one screen work, place actors on two shoot days, resolve the Golden Reel, reviews, career risk, and residuals.</p><p>Productions earn reviews now and residuals every round. Shoot days pay cash immediately. Auteur Project unlocks after an actor has a production. Shared shoot slots fill when claimed.</p><p>Method improves production quality. Star Power improves shoot days. Range ignores Typecast's Presence penalty. Box Office wins award ties. Related actors can collaborate and inherit a weaker talent after a mentor retires.</p><button data-action="menu">BACK TO MENU</button><button data-action="close-modal">RETURN TO TABLE</button></div></div>`;
  if (modal === 'rosters') return `<div class="veil modal-veil"><div class="roster-modal"><div class="roster-top"><h2>Signed Actors</h2><button data-action="close-modal">✕</button></div><div class="all-rosters">${state.players.map(player=>`<section><h3 style="--chip:${player.color}">${escapeHtml(player.name)} <span>$${player.money} · ★ ${player.acclaim} · ${player.works.length} productions</span></h3><div>${player.artists.map(artist=>artistCard(artist,{size:'roster'})).join('')}</div></section>`).join('')}</div></div></div>`;
  return '';
}

function render() {
  if (!state) { root.innerHTML = setupScreen(); return; }
  root.innerHTML = `<div class="game-table">${seatBar()}${phaseStrip()}<main class="table-surface">${scene()}</main>${hand()}<div class="table-corner left">SIDE B · FILM REEL</div><div class="table-corner right">10 ROUNDS · MOST CASH WINS</div>${notice?`<div class="game-notice ${notice.type}">${icon(notice.type==='danger'?'08-karma':notice.type==='event'?'03-event':'11-royalties')}<span>${escapeHtml(notice.text)}</span></div>`:''}${gateOverlay()}${modalOverlay()}</div>`;
}

function selectedArtist() {
  if (!state) return null;
  const player = currentPlayer(state);
  return alive(player).find(artist=>artist.id===selectedId) || alive(player)[0] || null;
}

root.addEventListener('submit',event=>{
  if (event.target.id !== 'setup-form') return;
  event.preventDefault();
  const form = new FormData(event.target);
  const players = [0,1,2,3].filter(index=>form.get(`type${index}`)!=='off').map(index=>({name:form.get(`name${index}`),ai:form.get(`type${index}`)==='ai'}));
  try { state = newGame({players}); autoPlayAi(state); selectedId=alive(currentPlayer(state))[0]?.id??null; gate=true; modal=''; save(); sound('win'); render(); }
  catch(error) { showNotice(error.message,'danger'); alert(error.message); }
});

root.addEventListener('click',event=>{
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'ready') { gate=false; sound(); render(); return; }
  if (action === 'menu' || action === 'rules' || action === 'rosters' || action === 'confirm-new') { modal=action; sound(); render(); return; }
  if (action === 'close-modal') { modal=''; sound(); render(); return; }
  if (action === 'new-game') { state=null; selectedId=null; gate=true; modal=''; notice=null; save(); sound('flip'); render(); return; }
  if (action === 'sound') { soundOn=!soundOn; localStorage.setItem('record-label-rivals-sound',soundOn?'on':'off'); sound(); render(); return; }
  if (!state || state.gameOver || gate || modal) return;
  if (action === 'select-artist') { selectedId=button.dataset.id; sound(); render(); return; }
  if (action === 'bid-down' || action === 'bid-up') { bidAmount=Math.max(0,Math.min(currentPlayer(state).money,bidAmount+(action==='bid-up'?1:-1))); sound(); render(); return; }
  if (action === 'bid') { perform({type:'bid',amount:bidAmount}); return; }
  if (action === 'pass') { perform({type:'pass'}); return; }
  if (action === 'continue') { perform({type:'continue'}); return; }
  if (action === 'train') { perform({type:'train',artistId:selectedArtist()?.id,kind:button.dataset.kind}); return; }
  if (action === 'create') { perform({type:'create',artistId:selectedArtist()?.id}); return; }
  if (action === 'venue') { perform({type:'perform',artistId:selectedArtist()?.id,venueId:button.dataset.venue}); }
});

root.addEventListener('input',event=>{
  if (event.target.id === 'bid-range') {
    bidAmount=Number(event.target.value);
    const dial=root.querySelector('.bid-dial strong'); if (dial) dial.textContent=`$${bidAmount}`;
    const left=root.querySelector('#bid-left'); if (left) left.textContent=`CASH LEFT · $${currentPlayer(state).money-bidAmount}`;
  }
});

root.addEventListener('dragstart',event=>{
  const card = event.target.closest('.playing-card[draggable="true"]');
  if (!card) return;
  event.dataTransfer.setData('text/plain',card.dataset.id); event.dataTransfer.effectAllowed='move';
  card.classList.add('dragging');
});
root.addEventListener('dragend',event=>event.target.closest('.playing-card')?.classList.remove('dragging'));
root.addEventListener('dragover',event=>{ const zone=event.target.closest('.drop-zone:not([disabled])'); if (zone) { event.preventDefault(); event.dataTransfer.dropEffect='move'; zone.classList.add('drag-hover'); } });
root.addEventListener('dragleave',event=>event.target.closest('.drop-zone')?.classList.remove('drag-hover'));
root.addEventListener('drop',event=>{
  const zone=event.target.closest('.drop-zone:not([disabled])');
  if (!zone || !state || gate) return;
  event.preventDefault(); const artistId=event.dataTransfer.getData('text/plain');
  const player=currentPlayer(state), artist=alive(player).find(item=>item.id===artistId);
  if (!artist) return;
  selectedId=artistId;
  if (zone.dataset.drop==='train') perform({type:'train',artistId,kind:zone.dataset.kind});
  else if (zone.dataset.drop==='create') perform({type:'create',artistId});
  else if (zone.dataset.drop==='venue') perform({type:'perform',artistId,venueId:zone.dataset.venue});
});
document.addEventListener('keydown',event=>{ if (event.key==='Escape' && modal) { modal=''; render(); } });

render();


