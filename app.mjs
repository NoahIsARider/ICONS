import { phaseNames, phaseIcons, venues } from './data.mjs';
import { newGame, act, autoPlayAi, currentLot, currentPlayer, canCreate, canPlay } from './engine.mjs';

const $ = selector => document.querySelector(selector);
const icon = (name, className = '') => `<img class="${className}" src="icons/${name}.png" alt="">`;
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const storageKey = 'record-label-rivals-save-v1';
let state = null;
let gate = true;
let message = '';

try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved?.version === 1 && Array.isArray(saved.players)) state = saved;
} catch { /* Ignore damaged saves. */ }
if (state && !state.gameOver) { try { autoPlayAi(state); } catch { state = null; } }

function save() { if (state) localStorage.setItem(storageKey, JSON.stringify(state)); else localStorage.removeItem(storageKey); }
function stateAction(action) {
  try {
    const oldPlayer = state.current;
    const oldPhase = state.phase;
    act(state, action);
    autoPlayAi(state);
    if ([0,1,3,4].includes(state.phase) && !state.gameOver && (state.phase !== oldPhase || state.current !== oldPlayer || action.type === 'bid')) gate = true;
    message = '';
    save(); render();
  } catch (error) { message = error.message; render(); }
}

function setupPage() {
  return `<div class="setup-shell">
    <header class="brand"><span class="brand-mark">◉</span><span>RECORD LABEL<br><strong>RIVALS</strong></span></header>
    <div class="setup-grid">
      <section class="intro">
        <div class="eyebrow">A MUSIC INDUSTRY STRATEGY GAME</div>
        <h1>Sign the stars.<br><em>Own the charts.</em></h1>
        <p>Build a record label over 10 rounds. Recruit artists, release albums for recurring royalties, claim live show venues, and outmaneuver rival labels. The richest label wins.</p>
        <div class="intro-icons">${['01-recruitment','04-creation','05-concert','06-awards'].map(item=>icon(item)).join('')}</div>
        <div class="rule-strip"><span>2–4 labels</span><span>Local multiplayer</span><span>Computer rivals</span><span>Autosave</span></div>
      </section>
      <section class="setup-card">
        <div class="panel-kicker">NEW SESSION</div><h2>Choose your labels</h2>
        <p>Pass the device between human players. Computer labels play their turns automatically.</p>
        <form id="setup-form">
          ${[0,1,2,3].map((index) => `<div class="setup-player"><span class="player-number">0${index+1}</span><input name="name${index}" value="${['Your Label','Rival Records','Third Label','Fourth Label'][index]}" maxlength="24" aria-label="Label ${index+1} name"><select name="type${index}" aria-label="Label ${index+1} type"><option value="human" ${index===0?'selected':''}>Human</option><option value="ai" ${index===1?'selected':''}>Computer</option><option value="off" ${index>1?'selected':''}>Off</option></select></div>`).join('')}
          <button class="primary-button" type="submit">START THE GAME <span>→</span></button>
        </form>
        ${localStorage.getItem(storageKey) && state ? '<button class="text-button" id="resume">Resume saved game</button>' : ''}
        <div class="small-note">All rules and interface text are in English.</div>
      </section>
    </div>
    <footer>DESIGNED FOR THIS RECORD LABEL CARD GAME · 27 CUSTOM ICONS</footer>
  </div>`;
}

function playerCard(player) {
  const active = !state.gameOver && [0,1,3,4].includes(state.phase) && state.current === player.id;
  const royalties = player.works.reduce((sum,work)=>sum+work.royalty,0);
  return `<div class="label-card ${active?'active':''}" style="--player-color:${player.color}">
    <div class="label-top"><div><span class="label-swatch"></span><b>${esc(player.name)}</b></div><span class="ai-tag">${player.ai?'COMPUTER':'HUMAN'}</span></div>
    <div class="label-stats"><span>${icon('10-cash')}<b>$${player.money}</b><small>CASH</small></span><span>${icon('12-acclaim')}<b>${player.acclaim}</b><small>ACCLAIM</small></span><span>${icon('11-royalties')}<b>+$${royalties}</b><small>ROYALTIES</small></span></div>
    <div class="label-foot">${player.artists.filter(a=>!a.dead).length} artists <i>·</i> ${player.works.length} releases</div>
  </div>`;
}

function artistCard(artist, owner = null, selected = false) {
  const status = Object.entries(artist.status || {}).filter(([,value])=>value).map(([key])=>key);
  const tagIcons = {Artpop:'19-artpop',Jazz:'20-jazz','Vocal Flip':'21-vocal-flip',Empress:'22-empress'};
  return `<div class="artist-card ${selected?'selected':''} ${artist.dead?'dead':''}">
    <div class="artist-card-top"><span class="genre">${esc(artist.genre)}</span>${icon(tagIcons[artist.tag] || '01-recruitment','tag-icon')}</div>
    <div class="artist-art">${icon('01-recruitment')}</div>
    <h3>${esc(artist.name)}</h3><div class="artist-tag">${esc(artist.tag)}${artist.inherited?' · Inherited spark':''}</div>
    <div class="artist-abilities"><span>${icon('13-vocal')} ${artist.vocal}</span><span>${icon('14-creativity')} ${artist.creativity}</span><span>${icon('15-stamina')} ${owner ? `${artist.currentStamina}/${artist.maxStamina}` : artist.stamina}</span></div>
    ${status.length ? `<div class="status-line">${status.map(s=>esc(s)).join(' · ')}</div>` : ''}
    ${artist.dead ? '<div class="dead-ribbon">IN MEMORIAM</div>' : ''}
  </div>`;
}

function phaseRail() {
  return `<div class="phase-rail">${phaseNames.map((name,index)=>`<div class="phase-step ${index===state.phase?'current':''} ${index<state.phase?'complete':''}">${icon(phaseIcons[index])}<span>${index+1}. ${esc(name)}</span></div>`).join('')}</div>`;
}

function selectArtist(player, predicate = () => true) {
  const options = player.artists.filter(artist => !artist.dead && predicate(artist));
  return options.length ? `<select name="artistId" required>${options.map(artist=>`<option value="${esc(artist.id)}">${esc(artist.name)} · V${artist.vocal} C${artist.creativity} E${artist.currentStamina}</option>`).join('')}</select>` : '<div class="empty-hint">No eligible artist</div>';
}

function actionPanel() {
  if (state.gameOver) return gameOverPanel();
  const player = currentPlayer(state);
  const phase = state.phase;
  const opening = `<div class="panel-kicker">YOUR DECISION</div><h2>${esc(phaseNames[phase])}</h2><p class="turn-owner">${esc(player.name)} <span>${player.ai?'COMPUTER':'HUMAN TURN'}</span></p>`;
  if (phase === 0) {
    const lot = currentLot(state);
    const bidCount = Object.keys(state.bids).length;
    return `${opening}<p>Submit a sealed bid for <b>${esc(lot.name)}</b>. Highest bid wins; ties favor the label with more acclaim, then turn order.</p>
      <div class="auction-card">${artistCard(lot)}<div class="auction-meta"><strong>LOT ${state.auctionIndex+1} / 2</strong><span>${bidCount} of ${state.players.length} bids submitted</span></div></div>
      <form class="action-form" id="bid-form"><label>Your bid <small>Available: $${player.money}</small><input name="amount" type="number" min="0" max="${player.money}" value="${Math.min(8,player.money)}" step="1" required></label><button class="primary-button" type="submit">SUBMIT SEALED BID →</button></form>`;
  }
  if (phase === 1) return `${opening}<p>Spend one action and $3 to improve an ability, or $2 to restore stamina and clear status effects.</p>
    <form class="action-form" id="train-form"><label>Artist ${selectArtist(player)}</label><label>Training<select name="kind"><option value="creativity">Creativity · $3</option><option value="vocal">Vocal · $3</option><option value="stamina">Max Stamina · $3</option><option value="care">Care & Recovery · $2</option></select></label><button class="primary-button" type="submit">CONFIRM TRAINING →</button></form><button class="secondary-button" data-pass>Skip training</button>`;
  if (phase === 2) return `${opening}<p>Reveal the round's event. It can change album releases, shows, awards, or recovery.</p><button class="primary-button" data-continue>REVEAL EVENT →</button>`;
  if (phase === 3) {
    const available = player.artists.some(artist => canCreate(state,player,artist));
    return `${opening}<p>Create one album for $${state.event?.id==='rebate'?1:2}. Album quality sets recurring royalties and immediate acclaim. Artpop and mentorship add creativity.</p>
      ${available ? `<form class="action-form" id="create-form"><label>Artist ${selectArtist(player,artist=>canCreate(state,player,artist))}</label><button class="primary-button" type="submit">RELEASE AN ALBUM →</button></form>` : '<div class="empty-hint">You need an available artist and enough cash.</div>'}<button class="secondary-button" data-pass>Skip creation</button>`;
  }
  if (phase === 4) {
    const options = player.artists.filter(artist => venues.some(venue=>canPlay(state,player,artist,venue)));
    return `${opening}<p>Place one artist at an open venue. Shared venues fill on a first-come basis. Solo Tour unlocks after that artist releases music.</p>
      <div class="venue-list">${venues.map(venue=>`<div class="venue ${state.venueUsed[venue.id]!=null?'taken':''}">${icon(venue.icon)}<span><b>${esc(venue.name)}</b><small>$${venue.pay} base · V${venue.vocal}+ · ${venue.stamina} stamina</small></span><em>${venue.tour?'PRIVATE':state.venueUsed[venue.id]!=null?'TAKEN':'OPEN'}</em></div>`).join('')}</div>
      ${options.length ? `<form class="action-form" id="perform-form"><label>Artist ${selectArtist(player,artist=>venues.some(venue=>canPlay(state,player,artist,venue)))}</label><label>Venue<select name="venueId">${venues.filter(venue=>canPlay(state,player,options[0],venue)).map(venue=>`<option value="${venue.id}">${esc(venue.name)}</option>`).join('')}</select></label><button class="primary-button" type="submit">BOOK THE SHOW →</button></form>` : '<div class="empty-hint">No eligible performance is available.</div>'}<button class="secondary-button" data-pass>Skip live show</button>`;
  }
  const copy = {
    5:['The highest-quality new release wins the Grammy. An Empress artist wins quality ties. All labels then collect cash from acclaim.','RESOLVE AWARDS'],
    6:['The label at the bottom of the critics track loses $3. A complete tie avoids the penalty.','RESOLVE CRITICS'],
    7:['Artists with stress, illness, exhaustion, or banned substances face a risk check. Severe cases can cause permanent loss.','RESOLVE KARMA'],
    8:['Collect royalties from every release, recover stamina, and prepare the next round. After round 10, cash decides the winner.','END ROUND']
  }[phase];
  return `${opening}<p>${copy[0]}</p><button class="primary-button" data-continue>${copy[1]} →</button>`;
}

function gameOverPanel() {
  const winners = state.winnerIds.map(id=>state.players[id].name).join(' & ');
  const sorted = [...state.players].sort((a,b)=>b.money-a.money || b.acclaim-a.acclaim);
  return `<div class="panel-kicker">THE FINAL CHART</div><h2>${esc(winners)} wins!</h2><p>Ten rounds are complete. The label with the most cash takes the crown.</p><div class="final-scores">${sorted.map((player,index)=>`<div><b>#${index+1} ${esc(player.name)}</b><strong>$${player.money}</strong><span>${player.acclaim} acclaim · ${player.works.length} releases</span></div>`).join('')}</div><button class="primary-button" id="new-game-final">PLAY AGAIN →</button>`;
}

function board() {
  const event = state.event;
  const player = currentPlayer(state);
  const releases = state.players.flatMap(p=>p.works.map(work=>({...work,label:p.name}))).sort((a,b)=>b.id-a.id).slice(0,5);
  return `<div class="game-shell">
    <header class="game-header"><div class="brand"><span class="brand-mark">◉</span><span>RECORD LABEL<br><strong>RIVALS</strong></span></div><div class="round-display"><small>ROUND</small><strong>${String(state.round).padStart(2,'0')} <i>/ 10</i></strong></div><button class="menu-button" id="new-game">New Game</button></header>
    ${phaseRail()}
    <div class="game-layout">
      <main>
        <section class="hero-panel"><div><span class="eyebrow">THE BOARDROOM</span><h1>${esc(phaseNames[state.phase])}</h1><p>${state.gameOver?'The final chart is in.':`Round ${state.round} of 10 · ${[0,1,3,4].includes(state.phase)?`${esc(player.name)} is making a move`:'Ready to resolve the phase'}`}</p></div>${icon(phaseIcons[state.phase])}</section>
        <div class="main-grid"><section class="action-panel panel">${actionPanel()}${message?`<div class="error-message" role="alert">${esc(message)}</div>`:''}</section>
        <section class="side-board"><div class="panel event-panel"><div class="panel-heading"><span>ROUND EVENT</span>${event?icon(event.icon):icon('03-event')}</div>${event?`<h3>${esc(event.title)}</h3><p>${esc(event.text)}</p>`:'<h3>Still to come</h3><p>The event card is revealed after Training & Care.</p>'}</div>
          <div class="panel releases-panel"><div class="panel-heading"><span>RECENT RELEASES</span>${icon('04-creation')}</div>${releases.length?releases.map(work=>`<div class="release"><div class="release-vinyl">${icon(work.collaboration?'16-collaboration':'11-royalties')}</div><span><b>${esc(work.title)}</b><small>${esc(work.label)} · Quality ${work.quality}${work.awarded?' · Grammy winner':''}</small></span><strong>+$${work.royalty}</strong></div>`).join(''):'<p class="muted">No records released yet.</p>'}</div></section></div>
        <section class="roster-section"><div class="section-title"><h2>Artist Rosters</h2><span>Sign talent. Build an engine.</span></div><div class="roster-grid">${state.players.map(player=>`<div class="roster-column"><div class="roster-heading" style="--player-color:${player.color}"><span class="label-swatch"></span>${esc(player.name)}</div><div class="roster-cards">${player.artists.map(artist=>artistCard(artist,player)).join('')}</div></div>`).join('')}</div></section>
      </main>
      <aside class="right-sidebar"><div class="sidebar-heading">LABEL STANDINGS <span>↗</span></div>${state.players.map(playerCard).join('')}<div class="activity panel"><div class="panel-heading"><span>ACTIVITY</span>${icon('03-event')}</div><div class="activity-list">${state.log.slice(0,14).map(item=>`<div class="activity-item ${item.type}"><small>R${item.round} · ${esc(phaseNames[item.phase]||'End')}</small><p>${esc(item.text)}</p></div>`).join('')}</div></div></aside>
    </div>
    ${gate && !state.gameOver && [0,1,3,4].includes(state.phase) && !currentPlayer(state).ai ? `<div class="gate" role="dialog" aria-modal="true"><div class="gate-card">${icon(phaseIcons[state.phase])}<span class="eyebrow">PASS THE DEVICE</span><h2>${esc(currentPlayer(state).name)}'s turn</h2><p>${state.phase===0?'Your bid will stay hidden until all labels have submitted.':'Make your move when you are ready.'}</p><button class="primary-button" id="enter-turn">I'M READY →</button></div></div>` : ''}
    <div id="confirm-dialog" class="confirm-dialog hidden" role="dialog" aria-modal="true"><div><h2>Start a new game?</h2><p>Your current saved game will be replaced.</p><div><button class="secondary-button" id="cancel-new">Cancel</button><button class="primary-button" id="confirm-new">New Game</button></div></div></div>
  </div>`;
}

function render() {
  $('#app').innerHTML = state ? board() : setupPage();
  if (!state) {
    $('#setup-form').addEventListener('submit', event => { event.preventDefault(); const form = new FormData(event.currentTarget); const players = [0,1,2,3].filter(i=>form.get(`type${i}`)!=='off').map(i=>({name:form.get(`name${i}`),ai:form.get(`type${i}`)==='ai'})); try { state = newGame({players}); autoPlayAi(state); gate = true; message=''; save(); render(); } catch(error) { alert(error.message); } });
    $('#resume')?.addEventListener('click',()=>{ gate=true; render(); });
    return;
  }
  $('#enter-turn')?.addEventListener('click',()=>{ gate=false; render(); });
  $('#bid-form')?.addEventListener('submit',event=>{ event.preventDefault(); stateAction({type:'bid',amount:Number(new FormData(event.currentTarget).get('amount'))}); });
  $('#train-form')?.addEventListener('submit',event=>{ event.preventDefault(); const form=new FormData(event.currentTarget); stateAction({type:'train',artistId:form.get('artistId'),kind:form.get('kind')}); });
  $('#create-form')?.addEventListener('submit',event=>{ event.preventDefault(); stateAction({type:'create',artistId:new FormData(event.currentTarget).get('artistId')}); });
  $('#perform-form')?.addEventListener('submit',event=>{ event.preventDefault(); const form=new FormData(event.currentTarget); stateAction({type:'perform',artistId:form.get('artistId'),venueId:form.get('venueId')}); });
  $('#perform-form select[name="artistId"]')?.addEventListener('change',event=>{
    const player = currentPlayer(state);
    const artist = player.artists.find(item=>item.id===event.currentTarget.value);
    $('#perform-form select[name="venueId"]').innerHTML = venues.filter(venue=>canPlay(state,player,artist,venue)).map(venue=>`<option value="${venue.id}">${esc(venue.name)}</option>`).join('');
  });
  document.querySelectorAll('[data-pass]').forEach(button=>button.addEventListener('click',()=>stateAction({type:'pass'})));
  $('[data-continue]')?.addEventListener('click',()=>stateAction({type:'continue'}));
  const openConfirm = () => $('#confirm-dialog').classList.remove('hidden');
  $('#new-game')?.addEventListener('click',openConfirm);
  $('#new-game-final')?.addEventListener('click',openConfirm);
  $('#cancel-new')?.addEventListener('click',()=>$('#confirm-dialog').classList.add('hidden'));
  $('#confirm-new')?.addEventListener('click',()=>{ state=null; gate=true; save(); render(); });
}
render();
