import {CATALOG,homes,TRANSPORT_KINDS,type Building} from './town';
export const MISSION_CATALOG=[
 {id:'market-delivery',title:'Le consegne del mercato',description:'Porta un pacco al mercato del quartiere.',kind:'market',seconds:45,reward:5,activity:'Consegna un pacco al mercato'},
 {id:'garden-care',title:'Un giardino da curare',description:'Aiuta a pulire e annaffiare il giardino comune.',kind:'garden',seconds:60,reward:6,activity:'Si prende cura del giardino'},
 {id:'library-books',title:'Libri in circolo',description:'Riporta i libri e aiuta a sistemare la biblioteca.',kind:'library',seconds:45,reward:5,activity:'Riordina i libri in biblioteca'},
 {id:'station-help',title:'Benvenuti in città',description:'Aiuta i nuovi arrivati a orientarsi in stazione.',kind:'station',seconds:60,reward:6,activity:'Accoglie i viaggiatori in stazione'},
 {id:'clinic-supplies',title:'Una mano all’ambulatorio',description:'Consegna le scorte all’ambulatorio della città.',kind:'clinic',seconds:45,reward:5,activity:'Consegna le scorte all’ambulatorio'},
] as const;
export type DailyMission={id:string;username:string;day:string;missionId:string;buildingId:string|null;startedAt:number;readyAt:number;expiresAt:number;claimedAt:number|null;reward:number;fromX:number;fromY:number};
export type NeighborhoodProject={id:string;gardenId:string|null;item:string;title:string;district:string;goal:number;raised:number;createdAt:number;completedAt:number|null;kind:'garden'|'civic';x:number|null;y:number|null};
export type ProjectContribution={projectId:string;username:string;amount:number};
export type CommunityState={day:string;resetsAt:number;dailyIds:string[];missions:DailyMission[];projects:NeighborhoodProject[];contributions:ProjectContribution[]};
const dateFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
function parts(now:number){return Object.fromEntries(dateFormatter.formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
export function dailyWindow(now:number){const d=parts(now),day=`${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`,utc=Date.UTC(d.year,d.month-1,d.day+1);let resetsAt=utc;for(let i=0;i<2;i++){const p=parts(resetsAt),offset=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-resetsAt;resetsAt=utc-offset;}return {day,resetsAt};}
export function dailyMissionIds(day:string){const seed=day.split('').reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7),start=seed%MISSION_CATALOG.length;return [0,1,2].map(i=>MISSION_CATALOG[(start+i)%MISSION_CATALOG.length].id);}
export const missionTarget=(kind:string,buildings:Building[])=>buildings.filter(b=>b.kind===kind).sort((a,b)=>a.id.localeCompare(b.id))[0];
// Civic projects let residents fund public buildings; homes, transport and the unique town hall stay mayor-built.
export const CIVIC_KINDS=CATALOG.filter(c=>!homes.includes(c.id)&&!TRANSPORT_KINDS.includes(c.id)&&c.id!=='townhall');
export const civicBuildingId=(projectId:string)=>'project-'+projectId;
