export const phaseNames = ['Recruitment', 'Training & Care', 'Event', 'Album Creation', 'Live Show', 'Grammy Awards', 'Critics', 'Karma', 'Reset'];
export const phaseIcons = ['01-recruitment','02-training','03-event','04-creation','05-concert','06-awards','07-critics','08-karma','09-reset'];

const rawArtists = [
  ['nova','Nova Vale','Electropop',4,4,3,'Artpop',null,'echo'],
  ['echo','Echo Wren','Synthwave',3,5,3,'Vocal Flip','nova','nova'],
  ['mara','Mara Blue','Jazz',5,3,3,'Jazz',null,'felix'],
  ['felix','Felix Moon','Soul',5,3,3,'Vocal Flip','mara','mara'],
  ['iris','Iris Crown','Pop',5,4,2,'Empress',null,'juno'],
  ['juno','Juno Star','Dance',4,4,4,'Artpop','iris','iris'],
  ['astra','Astra Bloom','Indie',3,5,3,'Artpop',null,'reed'],
  ['reed','Reed Ash','Folk',4,4,4,'Jazz','astra','astra'],
  ['sol','Sol Rivera','Latin',5,3,4,'Vocal Flip',null,'luna'],
  ['luna','Luna Voss','R&B',4,5,3,'Empress','sol','sol'],
  ['violet','Violet Ray','Pop Rock',5,3,3,'Vocal Flip',null,'orion'],
  ['orion','Orion Sky','Alternative',3,5,4,'Artpop','violet','violet'],
  ['cleo','Cleo Glass','Jazz',4,4,4,'Jazz',null,'miles'],
  ['miles','Miles Gold','Funk',5,3,3,'Vocal Flip','cleo','cleo'],
  ['ember','Ember Fox','Rock',5,3,4,'Vocal Flip',null,'ash'],
  ['ash','Ash Winter','Ambient',3,5,3,'Artpop','ember','ember'],
  ['zara','Zara Pulse','House',4,4,4,'Artpop',null,'kit'],
  ['kit','Kit Tempo','Hip-Hop',4,4,3,'Vocal Flip','zara','zara'],
  ['sable','Sable Noir','Soul',5,4,2,'Empress',null,'poppy'],
  ['poppy','Poppy Bloom','Pop',4,4,4,'Vocal Flip','sable','sable']
];

export const artists = rawArtists.map(([id,name,genre,vocal,creativity,stamina,tag,mentor,collab]) => ({ id,name,genre,vocal,creativity,stamina,tag,mentor,collab }));
export const starters = [
  ['adele','Adele Kite','Indie',3,3,4,'Jazz'],
  ['benji','Benji Beat','Pop',4,2,4,'Vocal Flip'],
  ['cora','Cora Lux','Synthpop',3,4,4,'Artpop'],
  ['dante','Dante Blue','Soul',4,3,3,'Jazz']
].map(([id,name,genre,vocal,creativity,stamina,tag]) => ({id,name,genre,vocal,creativity,stamina,tag,mentor:null,collab:null}));

export const venues = [
  { id:'studio', name:'Studio Session', pay:4, vocal:0, stamina:1, icon:'14-creativity' },
  { id:'club', name:'Night Club', pay:6, vocal:3, stamina:1, icon:'05-concert' },
  { id:'festival', name:'Summer Festival', pay:9, vocal:4, stamina:2, icon:'05-concert' },
  { id:'arena', name:'Grand Arena', pay:12, vocal:5, stamina:2, icon:'06-awards' },
  { id:'tour', name:'Solo Tour', pay:10, vocal:0, stamina:2, icon:'05-concert', tour:true }
];

export const events = [
  { id:'streaming', title:'Streaming Boom', text:'Every royalty payment gains +2 this round.', icon:'11-royalties' },
  { id:'venue', title:'Venue Rush', text:'Every live show earns +2 this round.', icon:'05-concert' },
  { id:'press', title:'Press Spotlight', text:'Albums released this round gain +2 acclaim.', icon:'12-acclaim' },
  { id:'health', title:'Health Scare', text:'The artist with the lowest stamina gains Stress.', icon:'25-stress' },
  { id:'flu', title:'Flu Season', text:'A random artist gains Illness and needs care to recover.', icon:'24-disease' },
  { id:'backstage', title:'Backstage Incident', text:'A random artist gains Banned Substances and Stress.', icon:'26-banned-substances' },
  { id:'smoky', title:'Smoky Club', text:'A random artist gains Tobacco. Jazz artists ignore its Vocal penalty.', icon:'20-jazz' },
  { id:'sponsor', title:'Sponsor Offer', text:'Every label receives $2 immediately.', icon:'10-cash' },
  { id:'rebate', title:'Studio Rebate', text:'Album creation costs $1 less this round.', icon:'14-creativity' },
  { id:'awards', title:'Award Season', text:'The Grammy winner earns an extra $3.', icon:'06-awards' },
  { id:'tourism', title:'Tourist Wave', text:'Festival, Arena, and Solo Tour shows earn +$3.', icon:'05-concert' },
  { id:'critics', title:'Tough Critics', text:'The last-place critic-track penalty increases by $2.', icon:'07-critics' },
  { id:'recovery', title:'Wellness Week', text:'All living artists recover 1 stamina immediately.', icon:'15-stamina' }
];

export const albumWordsA = ['Neon','Velvet','Golden','Midnight','Electric','Paper','Silver','Wild','Afterglow','Blue','Crystal','Future'];
export const albumWordsB = ['Signals','Echoes','Parade','Hearts','Static','Flowers','Rhythm','Dreams','Horizon','City','Letters','Weather'];
