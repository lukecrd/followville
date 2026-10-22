import {CATALOG,homes,TRANSPORT_KINDS,type Building} from './town';
export const MISSION_CATALOG=[
 {id:'market-delivery',title:'Le consegne del mercato',description:'Porta un pacco al mercato del quartiere.',kind:'market',seconds:45,reward:20,activity:'Consegna un pacco al mercato',requester:'I banchi del mercato',thanks:'Il mercato ringrazia: il pacco è arrivato in tempo per l’apertura.'},
 {id:'garden-care',title:'Un giardino da curare',description:'Aiuta a pulire e annaffiare il giardino comune.',kind:'garden',seconds:60,reward:25,activity:'Si prende cura del giardino',requester:'I vicini del giardino',thanks:'Le aiuole respirano di nuovo: i vicini ti salutano dalla panchina.'},
 {id:'library-books',title:'Libri in circolo',description:'Riporta i libri e aiuta a sistemare la biblioteca.',kind:'library',seconds:45,reward:20,activity:'Riordina i libri in biblioteca',requester:'Lo staff della biblioteca',thanks:'Gli scaffali sono in ordine: la biblioteca ti ha messo da parte un libro.'},
 {id:'station-help',title:'Benvenuti in città',description:'Aiuta i nuovi arrivati a orientarsi in stazione.',kind:'station',seconds:60,reward:25,activity:'Accoglie i viaggiatori in stazione',requester:'Il capostazione',thanks:'I viaggiatori hanno trovato la strada: la stazione ringrazia.'},
 {id:'clinic-supplies',title:'Una mano all’ambulatorio',description:'Consegna le scorte all’ambulatorio della città.',kind:'clinic',seconds:45,reward:20,activity:'Consegna le scorte all’ambulatorio',requester:'Il personale dell’ambulatorio',thanks:'Le scorte sono al loro posto: l’ambulatorio ringrazia.'},
] as const;
// Extra coins for claiming all three missions of the same day.
export const MISSION_DAY_BONUS=20;
// Consecutive complete days raise the day bonus by STREAK_STEP, up to STREAK_MAX extra.
export const STREAK_STEP=10,STREAK_MAX=50;
export const streakBonus=(daysBefore:number)=>Math.min(STREAK_MAX,STREAK_STEP*daysBefore);
export const previousDay=(day:string)=>new Date(Date.parse(day+'T12:00:00Z')-86400000).toISOString().slice(0,10);
export function daysBefore(day:string,n:number){let d=day;for(let i=0;i<n;i++)d=previousDay(d);return d;}
export function streakEnding(complete:Set<string>,day:string){let n=0;for(let d=day;complete.has(d);d=previousDay(d))n++;return n;}
export type DailyMission={id:string;username:string;day:string;missionId:string;buildingId:string|null;startedAt:number;readyAt:number;expiresAt:number;claimedAt:number|null;reward:number;fromX:number;fromY:number};
export type NeighborhoodProject={id:string;gardenId:string|null;item:string;title:string;district:string;goal:number;raised:number;createdAt:number;completedAt:number|null;kind:'garden'|'civic';x:number|null;y:number|null;createdBy:string|null};
// Contributor name for town-fund donations; the space keeps it apart from any resident username.
export const FUND_CONTRIBUTOR='fondo comunale';
export type ProjectContribution={projectId:string;username:string;amount:number};
export type CommunityState={day:string;resetsAt:number;dailyIds:string[];missions:DailyMission[];projects:NeighborhoodProject[];contributions:ProjectContribution[];streaks?:Record<string,number>};
const dateFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
function parts(now:number){return Object.fromEntries(dateFormatter.formatToParts(now).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
export function dailyWindow(now:number){const d=parts(now),day=`${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}`,utc=Date.UTC(d.year,d.month-1,d.day+1);let resetsAt=utc;for(let i=0;i<2;i++){const p=parts(resetsAt),offset=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-resetsAt;resetsAt=utc-offset;}return {day,resetsAt};}
// Missions whose service is missing from the town are skipped so a day stays completable; they only fill in when fewer than three services exist.
export function dailyMissionIds(day:string,kinds?:ReadonlySet<string>){const seed=day.split('').reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,7),start=seed%MISSION_CATALOG.length,order=MISSION_CATALOG.map((_,i)=>MISSION_CATALOG[(start+i)%MISSION_CATALOG.length]),open=order.filter(m=>!kinds||kinds.has(m.kind));return [...open,...order.filter(m=>!open.includes(m))].slice(0,3).map(m=>m.id);}
// Nearest building of the service to the resident; ties fall back to id order so server and panel agree.
export const missionTarget=(kind:string,buildings:Building[],from?:{x:number;y:number})=>buildings.filter(b=>b.kind===kind).sort((a,b)=>(from?Math.abs(a.x-from.x)+Math.abs(a.y-from.y)-Math.abs(b.x-from.x)-Math.abs(b.y-from.y):0)||a.id.localeCompare(b.id))[0];
// Civic projects let residents fund public buildings; homes, transport and the unique town hall stay mayor-built.
export const CIVIC_KINDS=CATALOG.filter(c=>!homes.includes(c.id)&&!TRANSPORT_KINDS.includes(c.id)&&c.id!=='rail'&&c.id!=='townhall');
export const civicBuildingId=(projectId:string)=>'project-'+projectId;
