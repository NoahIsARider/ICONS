import { artists as singers, starters as singerStarters } from '../../data.mjs';

const identities = [
  ['mei','Mei Arden','Period'],['malcolm','Malcolm Voss','Thriller'],['valeria','Valeria Cruz','Drama'],['arjun','Arjun Sethi','Epic'],
  ['rowan','Rowan Hale','Indie'],['kenji','Kenji Mori','Courtroom'],['imani','Imani Brooks','Action'],['farid','Farid Nasser','Comedy'],
  ['sasha','Sasha Lin','Stunts'],['august','August Reed','Period'],['lucien','Lucien Vale','Fantasy'],['hana','Hana Kim','Sci-Fi'],
  ['nadine','Nadine Price','Procedural'],['eiji','Eiji Kuroda','Mystery'],['celeste','Celeste Gray','Theater'],['mateo','Mateo Reyes','Road Movie'],
  ['yuna','Yuna Park','Sci-Fi'],['leila','Leila Haddad','Gothic'],['theo','Theo Banks','Romance'],['graham','Graham Shaw','Noir'],
  ['mira','Mira Song','Coming of Age'],['jay','Jay Carter','Sports'],['priya','Priya Shah','Campus'],['finn','Finn Walker','Rom-Com']
];
const sourceCast = [...singers, ...singerStarters];
const actorIdBySingerId = new Map(sourceCast.map((template,index) => [template.id, identities[index][0]]));
const cast = sourceCast.map((template,index) => {
  const [id,name,genre] = identities[index];
  return { ...template, id, name, genre,
    mentor:actorIdBySingerId.get(template.mentor) || null,
    collab:actorIdBySingerId.get(template.collab) || null };
});
// The original game's four starter stat blocks are preserved for balance.
export const artists = cast.slice(0,20);
export const starters = cast.slice(20,24);
export const phaseNames = ['Casting','Coaching & Care','Industry Event','Production','Shoot Day','Golden Reel','Reviews','Career Risk','Wrap'];
export const phaseIcons = ['01-recruitment','02-training','03-event','04-creation','05-concert','06-awards','07-critics','08-karma','09-reset'];
export const venues = [
  {id:'studio',name:'Web Short',pay:4,vocal:0,stamina:1,icon:'04-creation'},
  {id:'club',name:'Streaming Series',pay:6,vocal:3,stamina:1,icon:'05-concert'},
  {id:'festival',name:'Prime-Time Drama',pay:9,vocal:4,stamina:2,icon:'05-concert'},
  {id:'arena',name:'Feature Film',pay:12,vocal:5,stamina:2,icon:'06-awards'},
  {id:'tour',name:'Auteur Project',pay:10,vocal:0,stamina:2,icon:'04-creation',tour:true}
];
export const events = [
  {id:'streaming',title:'Streaming Rights Boom',text:'Every residual payment gains +2 this round.',icon:'11-royalties'},
  {id:'venue',title:'Production Rush',text:'Every shoot day earns +2 this round.',icon:'05-concert'},
  {id:'press',title:'Festival Spotlight',text:'Productions released this round gain +2 reviews.',icon:'12-acclaim'},
  {id:'health',title:'Publicity Pressure',text:'The actor with the lowest stamina gains Pressure.',icon:'25-stress'},
  {id:'flu',title:'Set Injury',text:'A random actor gains Injury and needs care.',icon:'24-disease'},
  {id:'backstage',title:'On-Set Meltdown',text:'A random actor gains Meltdown and Pressure.',icon:'26-banned-substances'},
  {id:'smoky',title:'Typecast Rumors',text:'A random actor becomes Typecast. Range ignores its Presence penalty.',icon:'20-jazz'},
  {id:'sponsor',title:'Brand Deal',text:'Every agency receives $2 immediately.',icon:'10-cash'},
  {id:'rebate',title:'Film Tax Credit',text:'Production costs $1 less this round.',icon:'14-creativity'},
  {id:'awards',title:'Award Season',text:'The Golden Reel winner earns an extra $3.',icon:'06-awards'},
  {id:'tourism',title:'Global Distribution',text:'Prime-Time, Feature, and Auteur shoots earn +$3.',icon:'11-royalties'},
  {id:'critics',title:'Harsh Reviews',text:'The last-place review penalty increases by $2.',icon:'07-critics'},
  {id:'recovery',title:'Wrap Party',text:'All active actors recover 1 stamina.',icon:'15-stamina'}
];
export const albumWordsA = ['Midnight','Velvet','Last','Golden','Silent','Broken','After','Hidden','Wild','Blue','Second','Paper'];
export const albumWordsB = ['Frame','City','Promise','Witness','Empire','Summer','Act','Horizon','Memory','Signal','Hour','Reel'];
