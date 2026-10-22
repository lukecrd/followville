import type {CivicPoll} from './voting';
import type {CharacterAppearance} from './appearance';
import type {SocialState,Gathering} from './social';
import type {CommunityState,DailyMission} from './community';
export const CATALOG = [
 {id:'cottage',name:'Casetta',cost:120,category:'Case',desc:'Il primo posto da chiamare casa',color:'#d88162'},
 {id:'apartment',name:'Palazzo',cost:180,category:'Case',desc:'3 piani · 6 appartamenti · 30 monete per alloggio',color:'#8fa6aa'},
 {id:'villa',name:'Villetta',cost:240,category:'Case',desc:'Una casa con più spazio',color:'#78918a'},
 {id:'loft',name:'Casa moderna',cost:320,category:'Case',desc:'Linee pulite, anima creativa',color:'#c1a56c'},
 {id:'tree',name:'Albero',cost:30,category:'Natura',desc:'Una boccata di verde',color:'#658562'},
 {id:'garden',name:'Giardino comune',cost:80,category:'Natura',desc:'Uno spazio da arredare insieme',color:'#658562'},
 {id:'fountain',name:'Fontana',cost:150,category:'Natura',desc:'Il cuore del quartiere',color:'#8ab6bc'},
 {id:'cafe',name:'Caffetteria',cost:180,category:'Servizi',desc:'Incontri e nuovi posti di lavoro',color:'#d88162'},
 {id:'townhall',name:'Municipio',cost:900,category:'Servizi',desc:'Sede del sindaco · bacheca della città · unico in città',color:'#a8b6a0'},
 {id:'bank',name:'Banca',cost:450,category:'Servizi',desc:'Sportelli per la città · 3 posti da impiegato bancario',color:'#a8a48b'},
 {id:'office',name:'Uffici',cost:380,category:'Servizi',desc:'Un palazzo del lavoro · 5 posti da impiegato',color:'#8faab0'},
 {id:'market',name:'Mercato',cost:260,category:'Servizi',desc:'La spesa sotto casa',color:'#bc9860'},
 {id:'school',name:'Scuola',cost:500,category:'Servizi',desc:'Un futuro da imparare',color:'#b9936e'},
 {id:'clinic',name:'Ambulatorio',cost:600,category:'Servizi',desc:'Prendersi cura dei vicini',color:'#8faeaa'},
 {id:'library',name:'Biblioteca',cost:400,category:'Servizi',desc:'Storie da condividere',color:'#b6a3ba'},
 {id:'mall',name:'Centro commerciale',cost:850,category:'Servizi',desc:'Negozi e punti ristoro · 6 posti da commesso',color:'#9aadb0'},
 {id:'hospital',name:'Ospedale',cost:1100,category:'Servizi',desc:'Un polo sanitario · 6 posti da medico',color:'#9fbab5'},
 {id:'firestation',name:'Vigili del fuoco',cost:650,category:'Servizi',desc:'Una caserma per la città · 4 posti da vigile del fuoco',color:'#c48770'},
 {id:'police',name:'Commissariato',cost:600,category:'Servizi',desc:'Il presidio del quartiere · 4 posti da agente',color:'#8ba2b4'},
 {id:'stadium',name:'Stadio',cost:1200,category:'Svago',desc:'Campo da calcio e tribune · 6 posti da addetto allo stadio',color:'#a1b494'},
 {id:'zoo',name:'Zoo',cost:1000,category:'Svago',desc:'Habitat verdi e animali · 5 posti da custode dello zoo',color:'#b7ad79'},
 {id:'amusement',name:'Parco divertimenti',cost:1400,category:'Svago',desc:'Ruota panoramica e giostre · 6 posti da operatore',color:'#c69a8b'},
 {id:'cinema',name:'Cinema',cost:480,category:'Svago',desc:'Il grande schermo in città · 3 posti da addetto al cinema',color:'#ac94ac'},
 {id:'museum',name:'Museo',cost:560,category:'Svago',desc:'Arte e storia da scoprire · 3 posti da guida museale',color:'#b5aa8e'},
 {id:'sports',name:'Centro sportivo',cost:720,category:'Svago',desc:'Piscina e campi sportivi · 4 posti da istruttore',color:'#84b5b5'},
 {id:'powerplant',name:'Centrale elettrica',cost:700,category:'Servizi',desc:'Porta la luce in ogni casa · 3 posti da elettricista · gli abitanti pagano la bolletta',color:'#c2a96a'},
 {id:'watertower',name:'Acquedotto',cost:550,category:'Servizi',desc:'Acqua corrente per la città · 2 posti da tecnico idrico · gli abitanti pagano la bolletta',color:'#8ab0c2'},
 {id:'bridge',name:'Ponte',cost:220,category:'Trasporti',desc:'Collega due strade · lunghezza automatica e rampe incluse',color:'#adad98'},
 {id:'road',name:'Strada',cost:25,category:'Trasporti',desc:'Un tratto di strada da collegare alla rete esistente',color:'#a0aaa1'},
 {id:'rail',name:'Binario',cost:40,category:'Trasporti',desc:'Un tratto di ferrovia collegato alla linea: il treno ci passerà',color:'#c3cfd6'},
 {id:'station',name:'Stazione',cost:750,category:'Trasporti',desc:'Costruiscila nella fila 1, lungo la ferrovia',color:'#7f9697'},
] as const;
export type Kind=typeof CATALOG[number]['id'];
// World scale shared by artwork, moving actors and label clearance.
const BUILDING_SCALES:Record<Kind,number>={cottage:.50,villa:.65,loft:.58,apartment:.78,office:.80,cafe:.60,market:.72,bank:.74,library:.76,clinic:.74,school:.80,station:.82,firestation:.75,police:.75,townhall:1.08,cinema:.72,museum:.76,hospital:1,mall:1,stadium:2.5,zoo:1.5,amusement:1.5,sports:1,powerplant:1,watertower:.72,tree:.65,garden:.78,fountain:.70,bridge:1,road:1,rail:1};
export const buildingScale=(kind:Kind)=>BUILDING_SCALES[kind];
export const PEDESTRIAN_SCALE=.30,CAR_SCALE=.30;

export type Building={id:string;x:number;y:number;kind:Kind;username:string|null;color:string;bridgeAxis?:'x'|'y'|null;bridgeSpan?:number|null;plotSpan?:number|null};
export type Resident={appearance?:CharacterAppearance;gathering?:Gathering;friendVisit?:{buildingId:string;username:string};mission?:DailyMission;username:string;wallet:number;job:string|null;candidate:string|null;paidAt:number;payCredit?:number;feeCredit?:number;jobMs?:number;avatar:string;houseDecor:number;carLevel:number;pendingPay:number};
export type Decoration={id:string;gardenId:string;username:string;item:string};
export type Purchase={username:string;item:string};
export type BoardMessage={id:string;buildingId:string;title:string;body:string;authorLabel:string;official:boolean;pinned:boolean;createdAt:number;own:boolean};
export type Town={roadCuts?:{x:number;y:number}[];polls?:CivicPoll[];social?:SocialState;community?:CommunityState;boardMessages:BoardMessage[];name:string;buildings:Building[];units:HousingUnit[];coins:number;residents:Resident[];decorations:Decoration[];purchases:Purchase[];now:number;size:number;session:{canAdmin:boolean;self:string|null;signedIn:boolean};linkedResidents:{username:string}[];inviteCode?:string};
export const homes=['cottage','villa','loft','apartment'];
export const LARGE_BUILDINGS=['townhall','mall','hospital','stadium','zoo','amusement','sports','powerplant'];
export const TRANSPORT_KINDS=['road','bridge'];
export function footprint(kind:string){return kind==='stadium'?{width:5,height:5}:kind==='zoo'||kind==='amusement'?{width:3,height:3}:LARGE_BUILDINGS.includes(kind)?{width:2,height:2}:{width:1,height:1};}
type PlacedBuilding=Pick<Building,'x'|'y'|'kind'|'bridgeAxis'|'bridgeSpan'|'plotSpan'>;
export function buildingFootprint(b:Pick<Building,'kind'|'bridgeAxis'|'bridgeSpan'|'plotSpan'>){const span=Math.max(1,b.bridgeSpan||1);return b.kind==='bridge'?{width:b.bridgeAxis==='y'?1:span,height:b.bridgeAxis==='y'?span:1}:b.plotSpan?{width:b.plotSpan,height:b.plotSpan}:footprint(b.kind);}
export function buildingCells(b:PlacedBuilding){const f=buildingFootprint(b);return Array.from({length:f.width},(_,dx)=>Array.from({length:f.height},(_,dy)=>({x:b.x+dx,y:b.y+dy}))).flat();}
export function buildingCenter(b:PlacedBuilding){const f=buildingFootprint(b);return {x:b.x+(f.width-1)/2,y:b.y+(f.height-1)/2};}
// Tracks may also cross the base streets, as level crossings.
export const railBuildable=(x:number,y:number,size:number)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=1&&y>=1&&x<size-1&&y<size-1;
export function canPlace(kind:string,x:number,y:number,size:number,occupied:Set<string>,roadCuts:{x:number;y:number}[]=[]){return buildingCells({kind:kind as Kind,x,y}).every(c=>(kind==='rail'?railBuildable(c.x,c.y,size):buildable(c.x,c.y,size,roadCuts))&&!occupied.has(`${c.x},${c.y}`));}
export const APARTMENTS_PER_BUILDING=6;
export type HousingUnit={id:string;buildingId:string;unit:number;username:string|null;color:string};
export type Dwelling=Building&{buildingId:string;unit:number};
export function dwellingSlots(town:Pick<Town,'buildings'|'units'>):Dwelling[]{const lookup=new Map(town.buildings.map(b=>[b.id,b]));return town.units.flatMap(u=>{const b=lookup.get(u.buildingId);return b?[{...b,id:u.id,buildingId:b.id,unit:u.unit,username:u.username,color:u.color}]:[];});}
export function residentHome(buildings:Building[],units:HousingUnit[],username:string){const unit=units.find(u=>u.username===username);const b=unit?buildings.find(b=>b.id===unit.buildingId):buildings.find(b=>b.username===username);return b?{...b,id:unit?.id||b.id,buildingId:b.id,unit:unit?.unit||1,username,color:unit?.color||b.color}:undefined;}
export function homeLabel(home:Pick<Building,'kind'>&{unit?:number}){return home.kind==='apartment'?`Appartamento ${home.unit||1} · piano ${Math.ceil((home.unit||1)/2)}`:home.kind==='villa'?'Villetta':home.kind==='loft'?'Casa moderna':'Casetta';}
export const colors=['#d88162','#76938b','#b89ac0','#8aabc1','#c5a15b'];
export const BASE_SIZE=24,SIZE=40;
export function expansionCost(size:number){return size>=SIZE?null:1500+(size-BASE_SIZE)/8*1000;}
export const ROAD_X=[4,12,20,28,36],ROAD_Y=[6,14,21,29,37];
export const isRoad=(x:number,y:number)=>ROAD_X.includes(x)||ROAD_Y.includes(y);
export const INITIAL=[{x:2,y:2,kind:'cottage'},{x:3,y:4,kind:'villa'},{x:6,y:2,kind:'cottage'},{x:8,y:3,kind:'loft'},{x:7,y:8,kind:'villa'},{x:3,y:8,kind:'cottage'},{x:7,y:5,kind:'cafe'},{x:5,y:4,kind:'fountain'},{x:2,y:9,kind:'garden'},{x:9,y:8,kind:'garden'},{x:1,y:3,kind:'tree'},{x:2,y:5,kind:'tree'},{x:9,y:2,kind:'tree'},{x:10,y:4,kind:'tree'},{x:6,y:9,kind:'tree'},{x:9,y:10,kind:'tree'}] as {x:number;y:number;kind:Kind}[];
export const EXPANSION=[{x:14,y:1,kind:'station'},{x:22,y:1,kind:'station'},{x:14,y:5,kind:'school'},{x:19,y:9,kind:'clinic'},{x:16,y:13,kind:'market'},{x:13,y:18,kind:'library'},{x:17,y:18,kind:'cafe'},{x:8,y:17,kind:'garden'},{x:17,y:9,kind:'garden'},{x:18,y:17,kind:'fountain'},{x:15,y:17,kind:'cottage'},{x:16,y:19,kind:'villa'},{x:6,y:18,kind:'loft'},{x:9,y:16,kind:'cottage'},{x:21,y:16,kind:'cottage'},{x:21,y:18,kind:'villa'},{x:10,y:17,kind:'tree'},{x:15,y:9,kind:'tree'},{x:17,y:4,kind:'tree'},{x:19,y:17,kind:'tree'},{x:7,y:19,kind:'tree'},{x:15,y:20,kind:'tree'}] as {x:number;y:number;kind:Kind}[];
export function buildable(x:number,y:number,size=BASE_SIZE,roadCuts:{x:number;y:number}[]=[]){return Number.isInteger(x)&&Number.isInteger(y)&&x>=1&&y>=1&&x<size-1&&y<size-1&&(!isRoad(x,y)||roadCuts.some(c=>c.x===x&&c.y===y));}
export function cost(kind:string){return CATALOG.find(c=>c.id===kind)?.cost||0;}
// Compressed calendar: 1 virtual hour = 7.5 real minutes, 1 day = 3 real hours.
export const GAME_HOUR_MS=450000,GAME_DAY_MS=24*GAME_HOUR_MS,GAME_WEEK_MS=7*GAME_DAY_MS;
export const GAME_EPOCH=Date.UTC(2026,9,12),WORK_START=9,WORK_END=17,WORK_HOURS=8,MAX_BACKPAY_DAYS=7;
export const GAME_WEEKDAYS=['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
export function workClock(now:number){const elapsed=now-GAME_EPOCH,weekTime=((elapsed%GAME_WEEK_MS)+GAME_WEEK_MS)%GAME_WEEK_MS,day=Math.floor(weekTime/GAME_DAY_MS),dayTime=weekTime%GAME_DAY_MS,hour=Math.floor(dayTime/GAME_HOUR_MS),minute=Math.floor(dayTime%GAME_HOUR_MS/GAME_HOUR_MS*60);return {day,dayTime,hour,minute,working:day<5&&hour>=WORK_START&&hour<WORK_END,label:`${GAME_WEEKDAYS[day]} · ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`};}
function workIntegral(now:number){const elapsed=now-GAME_EPOCH,weeks=Math.floor(elapsed/GAME_WEEK_MS),rest=elapsed-weeks*GAME_WEEK_MS;let total=weeks*5*WORK_HOURS*GAME_HOUR_MS;for(let d=0;d<5;d++)total+=Math.max(0,Math.min(WORK_HOURS*GAME_HOUR_MS,rest-d*GAME_DAY_MS-WORK_START*GAME_HOUR_MS));return total;}
export function workedTime(from:number,to:number){return to>from?Math.max(0,workIntegral(to)-workIntegral(from)):0;}

export const JOBS=[
 {id:'barista',name:'Barista',service:'cafe',wage:3,slots:3,desc:'Il primo sorriso della giornata.'},
 {id:'gardener',name:'Giardiniere',service:'garden',wage:3,slots:4,desc:'Fai fiorire il tuo quartiere.'},
 {id:'driver',name:'Macchinista',service:'station',wage:5,slots:2,desc:'Collega persone e quartieri.'},
 {id:'teacher',name:'Insegnante',service:'school',wage:4,slots:2,desc:'Aiuta la città a crescere.'},
 {id:'nurse',name:'Infermiere',service:'clinic',wage:5,slots:3,desc:'La salute della community.'},
 {id:'librarian',name:'Bibliotecario',service:'library',wage:4,slots:2,desc:'Una storia per ogni vicino.'},
 {id:'banker',name:'Impiegato bancario',service:'bank',wage:4,slots:3,desc:'Accogli i cittadini agli sportelli della banca.'},
 {id:'employee',name:'Impiegato',service:'office',wage:4,slots:5,desc:'Lavora negli uffici del nuovo quartiere.'},
 {id:'sales-assistant',name:'Commesso',service:'mall',wage:3,slots:6,desc:'Aiuta i clienti del centro commerciale.'},
 {id:'doctor',name:'Medico',service:'hospital',wage:6,slots:6,desc:'Prenditi cura degli abitanti in ospedale.'},
 {id:'firefighter',name:'Vigile del fuoco',service:'firestation',wage:5,slots:4,desc:'Lavora nella caserma dei vigili del fuoco.'},
 {id:'officer',name:'Agente',service:'police',wage:5,slots:4,desc:'Contribuisci alla vita sicura del quartiere.'},
 {id:'stadium-staff',name:'Addetto allo stadio',service:'stadium',wage:3,slots:6,desc:'Prepara il campo e accogli i tifosi.'},
 {id:'zookeeper',name:'Custode dello zoo',service:'zoo',wage:4,slots:5,desc:'Segui gli animali e i loro habitat.'},
 {id:'ride-operator',name:'Operatore delle giostre',service:'amusement',wage:3,slots:6,desc:'Accogli i visitatori del parco divertimenti.'},
 {id:'cinema-staff',name:'Addetto al cinema',service:'cinema',wage:3,slots:3,desc:'Accompagna il pubblico tra film e spettacoli.'},
 {id:'museum-guide',name:'Guida museale',service:'museum',wage:4,slots:3,desc:'Racconta le collezioni ai visitatori.'},
 {id:'coach',name:'Istruttore sportivo',service:'sports',wage:4,slots:4,desc:'Organizza allenamenti e corsi al centro sportivo.'},
 {id:'electrician',name:'Elettricista',service:'powerplant',wage:5,slots:3,desc:'Tieni accese le luci della città.'},
 {id:'plumber',name:'Tecnico idrico',service:'watertower',wage:4,slots:2,desc:'Fai arrivare l’acqua in ogni casa.'},
 {id:'clerk',name:'Commerciante',service:'market',wage:3,slots:3,desc:'La vita dietro al bancone.'},
] as const;
// Seniority: worked game hours in the current job unlock a wage bonus; changing job resets it.
export const SENIORITY=[{hours:0,bonus:0,title:'Base'},{hours:40,bonus:1,title:'Avanzata'},{hours:120,bonus:2,title:'Senior'},{hours:240,bonus:3,title:'Master'}] as const;
export function seniority(jobMs=0){const hours=Math.floor(jobMs/GAME_HOUR_MS),level=SENIORITY.filter(s=>hours>=s.hours).length-1;return {...SENIORITY[level],level,hours,next:SENIORITY[level+1]?.hours??null};}
// shortcut: the bonus uses seniority stored at the last collection, so a level reached mid-period pays from the next collection.
type PayState=Pick<Resident,'job'|'paidAt'|'payCredit'|'feeCredit'|'jobMs'>;
export function payroll(r:PayState,now:number,utilities:readonly UtilityId[]=[]){const job=JOBS.find(j=>j.id===r.job),credit=Math.max(0,r.payCredit||0),feeCredit=Math.max(0,r.feeCredit||0),from=Math.max(r.paidAt,now-MAX_BACKPAY_DAYS*GAME_DAY_MS),workMs=job?workedTime(from,now):0,wage=job?job.wage+seniority(r.jobMs).bonus:0,gross=workMs*wage;
 // Net pay and the town's share (civic tax + bills per worked hour) keep separate remainders, so frequent small collections can't round the town's share away.
 const pct=Math.round(CIVIC_TAX*100),den=100*Math.max(1,wage),bp=Math.round(UTILITIES.reduce((s,u)=>s+(utilities.includes(u.id)?u.rate:0),0)*100),fee=Math.min(den,pct*Math.max(1,wage)+bp),feePart=Math.floor(gross*fee/den),netTotal=credit+gross-feePart,feeTotal=feeCredit+feePart;
 if(!job)return {amount:0,tax:0,bills:0,net:0,credit,feeCredit,workMs,from,capped:r.paidAt<from};
 const net=Math.floor(netTotal/GAME_HOUR_MS),tax=Math.floor(feeTotal/GAME_HOUR_MS);return {amount:net+tax,tax,bills:fee?Math.floor(tax*bp/fee):0,net,credit:netTotal-net*GAME_HOUR_MS,feeCredit:feeTotal-tax*GAME_HOUR_MS,workMs,from,capped:r.paidAt<from};}
// Share of every salary withheld for the town treasury, so residents' work funds new buildings.
export const CIVIC_TAX=.15;
// Utility bills: coins per worked game hour, charged only while the town has the plant; they go to the town fund.
export const UTILITIES=[{id:'power',name:'Luce',plant:'powerplant',rate:.3},{id:'water',name:'Acqua',plant:'watertower',rate:.2}] as const;
export type UtilityId=typeof UTILITIES[number]['id'];
export const activeUtilities=(buildings:Pick<Building,'kind'>[]):UtilityId[]=>UTILITIES.filter(u=>buildings.some(b=>b.kind===u.plant)).map(u=>u.id);
export function salary(r:PayState,now:number,utilities:readonly UtilityId[]=[]){return payroll(r,now,utilities).net;}
export function shiftsToAfford(price:number,hourlyWage:number){return Math.ceil(price/(WORK_HOURS*hourlyWage));}
export const SHOP=[
 {id:'flower-box',name:'Balcone fiorito',price:90,type:'home',desc:'Fiori alle finestre della tua casa.',bit:1},
 {id:'pergola',name:'Pergolato',price:180,type:'home',desc:'Un angolo per le serate insieme.',bit:2},
 {id:'pool',name:'Piccola piscina',price:600,type:'home',desc:'Un tuffo nel tuo giardino.',bit:4},
 {id:'car',name:'La tua prima auto',price:350,type:'car',desc:'Una city car per girare in città.',bit:0},
 {id:'car-upgrade',name:'Auto sportiva',price:550,type:'car',desc:'Un nuovo stile per la tua auto.',bit:0},
 {id:'apartment-move',name:'Il tuo appartamento',price:300,type:'home',desc:'Un alloggio tutto tuo in un palazzo. Costa meno della villetta.',bit:0},
 {id:'villa-upgrade',name:'Passa alla villetta',price:900,type:'home',desc:'Più spazio e un giardino: dalla casa singola o da un appartamento.',bit:0},
] as const;
export const GARDEN_ITEMS=[
 {id:'flowers',name:'Aiuole in fiore',price:40,desc:'Un po’ di colore per tutti.'},
 {id:'bench',name:'Panchine',price:70,desc:'Fermarsi a fare due chiacchiere.'},
 {id:'lights',name:'Luci del giardino',price:100,desc:'Una piccola magia al tramonto.'},
 {id:'gazebo',name:'Gazebo',price:160,desc:'Il nuovo ritrovo del quartiere.'},
] as const;
