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
 {id:'bridge',name:'Ponte',cost:220,category:'Trasporti',desc:'Collega due strade · lunghezza automatica e rampe incluse',color:'#adad98'},
 {id:'road',name:'Strada',cost:25,category:'Trasporti',desc:'Un tratto di strada da collegare alla rete esistente',color:'#a0aaa1'},
 {id:'station',name:'Stazione',cost:750,category:'Trasporti',desc:'Costruiscila nella fila 1, lungo la ferrovia',color:'#7f9697'},
] as const;
export type Kind=typeof CATALOG[number]['id'];
// World scale shared by artwork, moving actors and label clearance.
const BUILDING_SCALES:Record<Kind,number>={cottage:.50,villa:.65,loft:.58,apartment:.78,office:.80,cafe:.60,market:.72,bank:.74,library:.76,clinic:.74,school:.80,station:.82,firestation:.75,police:.75,townhall:1,cinema:.72,museum:.76,hospital:1,mall:1,stadium:1.12,zoo:1.05,amusement:1.05,sports:1,tree:.65,garden:.78,fountain:.70,bridge:1,road:1};
export const buildingScale=(kind:Kind)=>BUILDING_SCALES[kind];
export const PEDESTRIAN_SCALE=.30,CAR_SCALE=.30;

export type Building={id:string;x:number;y:number;kind:Kind;username:string|null;color:string;bridgeAxis?:'x'|'y'|null;bridgeSpan?:number|null};
export type Resident={username:string;wallet:number;job:string|null;candidate:string|null;paidAt:number;payCredit?:number;avatar:string;houseDecor:number;carLevel:number;pendingPay:number};
export type Decoration={id:string;gardenId:string;username:string;item:string};
export type Purchase={username:string;item:string};
export type BoardMessage={id:string;buildingId:string;title:string;body:string;authorLabel:string;official:boolean;pinned:boolean;createdAt:number;own:boolean};
export type Town={boardMessages:BoardMessage[];name:string;buildings:Building[];units:HousingUnit[];coins:number;residents:Resident[];decorations:Decoration[];purchases:Purchase[];now:number;size:number;session:{canAdmin:boolean;self:string|null;signedIn:boolean};linkedResidents:{username:string}[];inviteCode?:string};
export const homes=['cottage','villa','loft','apartment'];
export const LARGE_BUILDINGS=['townhall','mall','hospital','stadium','zoo','amusement','sports'];
export const TRANSPORT_KINDS=['road','bridge'];
export function footprint(kind:string){return LARGE_BUILDINGS.includes(kind)?{width:2,height:2}:{width:1,height:1};}
type PlacedBuilding=Pick<Building,'x'|'y'|'kind'|'bridgeAxis'|'bridgeSpan'>;
export function buildingFootprint(b:Pick<Building,'kind'|'bridgeAxis'|'bridgeSpan'>){const span=Math.max(1,b.bridgeSpan||1);return b.kind==='bridge'?{width:b.bridgeAxis==='y'?1:span,height:b.bridgeAxis==='y'?span:1}:footprint(b.kind);}
export function buildingCells(b:PlacedBuilding){const f=buildingFootprint(b);return Array.from({length:f.width},(_,dx)=>Array.from({length:f.height},(_,dy)=>({x:b.x+dx,y:b.y+dy}))).flat();}
export function buildingCenter(b:PlacedBuilding){const f=buildingFootprint(b);return {x:b.x+(f.width-1)/2,y:b.y+(f.height-1)/2};}
export function canPlace(kind:string,x:number,y:number,size:number,occupied:Set<string>){return buildingCells({kind:kind as Kind,x,y}).every(c=>buildable(c.x,c.y,size)&&!occupied.has(`${c.x},${c.y}`));}
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
export function buildable(x:number,y:number,size=BASE_SIZE){return Number.isInteger(x)&&Number.isInteger(y)&&x>=1&&y>=1&&x<size-1&&y<size-1&&!isRoad(x,y);}
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
 {id:'clerk',name:'Commerciante',service:'market',wage:3,slots:3,desc:'La vita dietro al bancone.'},
] as const;
export function payroll(r:Pick<Resident,'job'|'paidAt'|'payCredit'>,now:number){const job=JOBS.find(j=>j.id===r.job),credit=Math.max(0,r.payCredit||0),from=Math.max(r.paidAt,now-MAX_BACKPAY_DAYS*GAME_DAY_MS),workMs=job?workedTime(from,now):0,total=credit+workMs*(job?.wage||0);return {amount:job?Math.floor(total/GAME_HOUR_MS):0,credit:job?total%GAME_HOUR_MS:credit,workMs,from,capped:r.paidAt<from};}
export function salary(r:Pick<Resident,'job'|'paidAt'|'payCredit'>,now:number){return payroll(r,now).amount;}
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
