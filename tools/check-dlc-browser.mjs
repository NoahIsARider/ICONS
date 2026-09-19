import { writeFile } from 'node:fs/promises';

const port=Number(process.argv[2]||9233);
let target;
for(let attempt=0;attempt<60;attempt++){
  try{const pages=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();target=pages.find(page=>page.type==='page');if(target)break;}catch{}
  await new Promise(resolve=>setTimeout(resolve,500));
}
if(!target)throw new Error('Electron DevTools target unavailable.');
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
let serial=0;const pending=new Map();ws.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){pending.get(message.id)(message);pending.delete(message.id);}});
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,message=>message.error?reject(Error(JSON.stringify(message.error))):resolve(message.result));ws.send(JSON.stringify({id,method,params}));});
const js=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
const wait=async expression=>{for(let i=0;i<60;i++){try{if(await js(expression))return;}catch{}await new Promise(resolve=>setTimeout(resolve,250));}throw Error(`Timeout: ${expression}`);};
const capture=async file=>{await js("document.getAnimations().forEach(animation=>{try{animation.finish()}catch{}})") ;const result=await call('Page.captureScreenshot',{format:'jpeg',quality:88});await writeFile(file,Buffer.from(result.data,'base64'));};
await call('Page.enable');await call('Runtime.enable');
const origin=new URL(target.url).origin;
await js("localStorage.removeItem('actor-agency-save-v1');localStorage.removeItem('ensemble-debut-save-v1');true");
for(const [edition,path,selector] of [['actor','actor.html','.title-screen'],['ensemble','ensemble.html','.debut-title']]){
  await call('Page.navigate',{url:`${origin}/${path}`});
  await wait(`document.readyState==='complete'&&!!document.querySelector('${selector}')`);
  const missing=await js(`(async()=>{const urls=${edition==='actor'?"['dlc/actor-agency/portraits/mira.jpg','dlc/actor-agency/icons/06-awards.png','dlc/actor-agency/animation/clapper/clapper-animated.png']":"['dlc/ensemble-debut/debut-stage-table.png','dlc/ensemble-debut/animation/stage-lights/stage-lights-animated.png']"};return (await Promise.all(urls.map(async url=>({url,ok:(await fetch(url)).ok})))).filter(item=>!item.ok)})()`);
  if(missing.length)throw Error(`${edition} missing assets ${JSON.stringify(missing)}`);
  await capture(`screenshots/dlc-${edition}-title.jpg`);
  await js(`document.querySelector('form button[type=submit]').click()`);
  await wait(`!!document.querySelector('${edition==='actor'?'.game-table':'.game-active'}')`);
  await js(`document.querySelector('[data-action=ready]')?.click()`);
  await capture(`screenshots/dlc-${edition}-game.jpg`);
  if(edition==='ensemble')console.log('card art:',await js("({background:getComputedStyle(document.querySelector('.debut-card-face')).backgroundImage,height:document.querySelector('.debut-card-face').getBoundingClientRect().height})"));
  if(edition==='actor'){
    await js("document.querySelector('[data-action=bid]').click()");
    await wait("!!document.querySelector('[data-action=ready]')");
    console.log('actor: sealed bid advanced to next seat');
  }else{
    await js("document.querySelector('[data-station=vocal]').click()");
    await wait("!!document.querySelector('.stage-controls')");
    await js("document.querySelector('[data-action=ready]').click();document.querySelector('[data-action=perform]').click()");
    await wait("!!document.querySelector('.episode-results')");
    await capture('screenshots/dlc-ensemble-results.jpg');
    console.log('ensemble: rehearsal and stage resolved to rankings');
  }
  console.log(`${edition}: rendered title and game, assets loaded`);
}
ws.close();
