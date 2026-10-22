import {GARDEN_ITEMS,buildingCells,canPlace,payroll,activeUtilities,UTILITIES,GAME_HOUR_MS,type Kind,type Building,type Resident,type HousingUnit} from '../../../lib/town';
import {dailyWindow,dailyMissionIds,MISSION_CATALOG,missionTarget,MISSION_DAY_BONUS,CIVIC_KINDS,FUND_CONTRIBUTOR,streakBonus,streakEnding,previousDay,daysBefore,civicBuildingId,type DailyMission,type NeighborhoodProject,type ProjectContribution} from '../../../lib/community';
import {residentFrame,simulationIndex,missionStage} from '../../../lib/simulation';
import {DISTRICTS} from '../../../lib/district-labels';
export class CommunityError extends Error{constructor(message:string,public status=400){super(message);}}
const missionSelect='SELECT id,username,day,mission_id AS missionId,building_id AS buildingId,started_at AS startedAt,ready_at AS readyAt,expires_at AS expiresAt,claimed_at AS claimedAt,reward,from_x AS fromX,from_y AS fromY FROM daily_missions';
const projectSelect='SELECT id,garden_id AS gardenId,item,title,district,goal,raised,created_at AS createdAt,completed_at AS completedAt,kind,x,y,created_by AS createdBy FROM neighborhood_projects';
const projectCells=(p:Pick<NeighborhoodProject,'item'|'x'|'y'>)=>buildingCells({kind:p.item as Kind,x:p.x!,y:p.y!});
const nearestDistrict=(x:number,y:number,size:number)=>[...DISTRICTS].sort((a,b)=>Math.hypot(x-a.x*size/24,y-a.y*size/24)-Math.hypot(x-b.x*size/24,y-b.y*size/24))[0].name;
// Bills follow the plants that exist while people work: before a plant appears or disappears, every worker's pay so far is banked into their credits at the old rates.
// shortcut: banking restarts the offline backpay cap from now; fine while plants change rarely, store per-plant build times if that changes.
export const PLANT_KINDS:readonly string[]=UTILITIES.map(u=>u.plant);
export async function bankPayroll(d:D1Database,now:number){
 const [plants,workers]=await Promise.all([d.prepare("SELECT kind FROM buildings WHERE kind IN ('powerplant','watertower')").all<Pick<Building,'kind'>>(),d.prepare('SELECT username,job,paid_at AS paidAt,pay_credit AS payCredit,fee_credit AS feeCredit,job_ms AS jobMs FROM residents WHERE job IS NOT NULL').all<Resident>()]),utilities=activeUtilities(plants.results);
 const updates=workers.results.map(r=>{const p=payroll(r,now,utilities);return d.prepare('UPDATE residents SET paid_at=?,job_ms=job_ms+?,pay_credit=?,fee_credit=? WHERE username=? AND paid_at=? AND job=? AND pay_credit=? AND fee_credit=?').bind(now,p.workMs,p.credit+p.net*GAME_HOUR_MS,p.feeCredit+p.tax*GAME_HOUR_MS,r.username,r.paidAt,r.job,r.payCredit||0,r.feeCredit||0);});
 if(updates.length)await d.batch(updates);
}
const townKinds=async(d:D1Database)=>new Set((await d.prepare('SELECT DISTINCT kind FROM buildings').all<{kind:string}>()).results.map(b=>b.kind));
export async function communitySnapshot(d:D1Database,now:number){const window=dailyWindow(now),[missions,projects,contributions,complete,kinds]=await Promise.all([
 d.prepare(missionSelect+' WHERE day=?').bind(window.day).all<DailyMission>(),
 d.prepare(projectSelect+' ORDER BY completed_at IS NULL DESC,created_at DESC,id LIMIT 50').all<NeighborhoodProject>(),
 d.prepare('SELECT project_id AS projectId,username,SUM(amount) AS amount FROM project_contributions WHERE project_id IN (SELECT id FROM neighborhood_projects ORDER BY completed_at IS NULL DESC,created_at DESC,id LIMIT 50) GROUP BY project_id,username').all<ProjectContribution>(),
 d.prepare('SELECT username,day FROM daily_missions WHERE claimed_at IS NOT NULL AND day>=? GROUP BY username,day HAVING COUNT(*)>=3').bind(daysBefore(window.day,8)).all<{username:string;day:string}>(),
 townKinds(d)
]);
 // A streak stays alive until a whole day is missed, so it counts back from today or yesterday.
 const byUser=new Map<string,Set<string>>();for(const c of complete.results)byUser.set(c.username,(byUser.get(c.username)||new Set()).add(c.day));
 const streaks=Object.fromEntries([...byUser].map(([u,days])=>[u,streakEnding(days,window.day)||streakEnding(days,previousDay(window.day))]));
 return {...window,dailyIds:dailyMissionIds(window.day,kinds),missions:missions.results,projects:projects.results,contributions:contributions.results,streaks};}
const actions=new Set(['mission-start','mission-claim','project-create','project-contribute','project-fund']);
export async function communityAction(d:D1Database,data:Record<string,unknown>,identity:{canAdmin:boolean;self:string|null},now:number){
 const action=String(data.action);if(!actions.has(action))return false;
 if(action==='project-create'){
  const official=identity.canAdmin&&data.view!=='player',creator=official?null:identity.canAdmin?String(data.username||'').replace(/^@/,'').toLowerCase():identity.self;
  if(!official&&!(creator&&await d.prepare('SELECT 1 FROM home_units WHERE username=?').bind(creator).first()))throw new CommunityError('Collega prima un abitante con una casa per proporre un progetto.',403);
  // Each resident keeps at most one open proposal, so nobody can fill all three slots alone.
  const oneEach='AND NOT EXISTS(SELECT 1 FROM neighborhood_projects WHERE created_by=? AND completed_at IS NULL)',busyMessage=official?'Limite di 3 progetti attivi raggiunto.':'Limite di 3 progetti attivi raggiunto oppure hai già un progetto aperto.';
  const size=sizeOfTown(await d.prepare('SELECT map_size AS size FROM town_settings WHERE id=1').first<{size:number}>());
  if(data.kind!==undefined){
   const building=CIVIC_KINDS.find(c=>c.id===data.kind),x=Number(data.x),y=Number(data.y);if(!building)throw new CommunityError('Scegli un edificio pubblico del catalogo.');
   if(building.id==='station'&&y!==1)throw new CommunityError('Le stazioni vanno nella fila 1, accanto alla ferrovia.');
   const [tiles,reserved]=await Promise.all([d.prepare('SELECT x,y FROM building_tiles').all<{x:number;y:number}>(),d.prepare(projectSelect+" WHERE kind='civic' AND completed_at IS NULL").all<NeighborhoodProject>()]);
   const occupied=new Set([...tiles.results,...reserved.results.flatMap(projectCells)].map(c=>`${c.x},${c.y}`)),cuts=(await d.prepare('SELECT x,y FROM road_cuts').all<{x:number;y:number}>()).results;
   if(!canPlace(building.id,x,y,size,occupied,cuts))throw new CommunityError('Scegli un lotto libero ed edificabile, senza strade, bordi o altri progetti civici.');
   // shortcut: the plot is checked here and on every donation, not locked in SQL; a racing mayor build only makes donations fail with a clear error.
   const result=await d.prepare(`INSERT INTO neighborhood_projects (id,garden_id,item,title,district,goal,created_at,kind,x,y,created_by) SELECT ?,NULL,?,?,?,?,?,'civic',?,?,? WHERE (SELECT COUNT(*) FROM neighborhood_projects WHERE completed_at IS NULL)<3 ${oneEach}`).bind(crypto.randomUUID(),building.id,building.name,nearestDistrict(x,y,size),building.cost,now,x,y,creator,creator).run();
   if(!result.meta.changes)throw new CommunityError(busyMessage,409);return true;
  }
  const item=GARDEN_ITEMS.find(i=>i.id===data.item),gardenId=String(data.gardenId||'');if(!item)throw new CommunityError('Scegli una miglioria del giardino.');
  const garden=await d.prepare("SELECT x,y FROM buildings WHERE id=? AND kind='garden'").bind(gardenId).first<{x:number;y:number}>();if(!garden)throw new CommunityError('Scegli un giardino esistente.');
  const district=nearestDistrict(garden.x,garden.y,size);
  const result=await d.prepare(`INSERT OR IGNORE INTO neighborhood_projects (id,garden_id,item,title,district,goal,created_at,created_by) SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM buildings WHERE id=? AND kind='garden') AND NOT EXISTS(SELECT 1 FROM garden_decorations WHERE garden_id=? AND item=?) AND (SELECT COUNT(*) FROM neighborhood_projects WHERE completed_at IS NULL)<3 ${oneEach}`).bind(crypto.randomUUID(),gardenId,item.id,item.name,district,item.price,now,creator,gardenId,gardenId,item.id,creator).run();
  if(!result.meta.changes)throw new CommunityError(official?'Miglioria già presente, progetto già avviato o limite di 3 progetti attivi raggiunto.':'Miglioria già presente o in progetto, limite di 3 progetti attivi raggiunto oppure hai già un progetto aperto.',409);return true;
 }
 const fund=action==='project-fund';if(fund&&(!identity.canAdmin||data.view==='player'))throw new CommunityError('Solo l’amministratore può usare il fondo comunale.',403);
 const username=fund?FUND_CONTRIBUTOR:String(data.username||'').replace(/^@/,'').toLowerCase();if(!fund&&!identity.canAdmin&&username!==identity.self)throw new CommunityError('Puoi gestire soltanto il tuo abitante.',403);
 if(!fund){
 const r=await d.prepare('SELECT username,wallet,job,paid_at AS paidAt,avatar,car_level AS carLevel FROM residents WHERE username=? AND EXISTS(SELECT 1 FROM home_units WHERE username=?)').bind(username,username).first<Resident>();if(!r)throw new CommunityError('Collega prima un abitante con una casa.',403);
 if(action==='mission-start'){
  const window=dailyWindow(now),mission=MISSION_CATALOG.find(m=>m.id===data.missionId);if(!mission||!dailyMissionIds(window.day,await townKinds(d)).includes(mission.id))throw new CommunityError('Questa missione non fa parte della giornata attuale.');
  const buildings=await d.prepare('SELECT id,x,y,kind,username,color,bridge_axis AS bridgeAxis,bridge_span AS bridgeSpan,plot_span AS plotSpan FROM buildings').all<Building>(),units=await d.prepare('SELECT id,building_id AS buildingId,unit,username,color FROM home_units').all<HousingUnit>(),cuts=(await d.prepare('SELECT x,y FROM road_cuts').all<{x:number;y:number}>()).results,index=simulationIndex(buildings.results,units.results,cuts);
  const size=sizeOfTown(await d.prepare('SELECT map_size AS size FROM town_settings WHERE id=1').first<{size:number}>()),frame=residentFrame(r,buildings.results,now,size,units.results,cuts),from={x:Math.round(frame?.x??index.byUser.get(username)!.x),y:Math.round(frame?.y??index.byUser.get(username)!.y)},target=missionTarget(mission.kind,buildings.results,from);
  if(!target)throw new CommunityError('Questo servizio non è disponibile in città. Chiedi all’amministratore di costruirlo.');
  const stage=missionStage(from,target,index,size,mission.activity),ready=now+Math.ceil(stage.travelMs)+mission.seconds*1000;
  if(ready>=window.resetsAt)throw new CommunityError('Le missioni stanno per rinnovarsi: torna dopo mezzanotte.');
  const result=await d.prepare('INSERT OR IGNORE INTO daily_missions (id,username,day,mission_id,building_id,started_at,ready_at,expires_at,reward,from_x,from_y) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM daily_missions WHERE username=? AND claimed_at IS NULL AND expires_at>?)').bind(crypto.randomUUID(),username,window.day,mission.id,target.id,now,ready,window.resetsAt,mission.reward,from.x,from.y,username,now).run();
  if(!result.meta.changes)throw new CommunityError('Missione già svolta oggi oppure un’altra missione è ancora in corso.',409);return true;
 }
 if(action==='mission-claim'){
  const runDay=(await d.prepare('SELECT day FROM daily_missions WHERE id=? AND username=?').bind(String(data.id||''),username).first<{day:string}>())?.day;if(!runDay)throw new CommunityError('Missione ancora in corso, scaduta o ricompensa già riscossa.',409);
  const done=await d.prepare('SELECT day FROM daily_missions WHERE username=? AND claimed_at IS NOT NULL AND day>=? AND day<? GROUP BY day HAVING COUNT(*)>=3').bind(username,daysBefore(runDay,8),runDay).all<{day:string}>(),dayBonus=MISSION_DAY_BONUS+streakBonus(streakEnding(new Set(done.results.map(x=>x.day)),previousDay(runDay)));
  const result=await d.batch([d.prepare('UPDATE daily_missions SET claimed_at=? WHERE id=? AND username=? AND claimed_at IS NULL AND ready_at<=? AND expires_at>?').bind(now,String(data.id||''),username,now,now),d.prepare('UPDATE residents SET wallet=wallet+(SELECT reward FROM daily_missions WHERE id=? AND username=?) WHERE username=? AND changes()>0').bind(String(data.id||''),username,username),
   // Missions run one at a time, so only one claim can be the third of the day.
   d.prepare('UPDATE residents SET wallet=wallet+? WHERE username=? AND changes()>0 AND (SELECT COUNT(*) FROM daily_missions WHERE username=? AND claimed_at IS NOT NULL AND day=(SELECT day FROM daily_missions WHERE id=?))=3').bind(dayBonus,username,username,String(data.id||''))]);
  if(!result[0].meta.changes)throw new CommunityError('Missione ancora in corso, scaduta o ricompensa già riscossa.',409);return true;
 }
 }
 const requested=Number(data.amount),requestId=String(data.requestId||'');if(!Number.isSafeInteger(requested)||requested<1||requested>(fund?1000000:50)||!/^[a-f0-9-]{36}$/.test(requestId))throw new CommunityError(fund?'Scegli quante monete del fondo usare.':'Scegli un contributo da 1 a 50 monete.');
 const project=await d.prepare(projectSelect+' WHERE id=?').bind(String(data.projectId||'')).first<NeighborhoodProject>();if(!project||project.completedAt||(project.kind==='garden'&&!project.gardenId))throw new CommunityError('Il progetto è già concluso o non è disponibile.',409);
 const amount=Math.min(requested,project.goal-project.raised),civic=project.kind==='civic',cells=civic?projectCells(project):[],buildingId=civicBuildingId(project.id);
 // The town fund pays like a resident wallet, under the same race and plot guards.
 const [payer,payerArgs]:[string,(string|number)[]]=fund?['UPDATE town_settings SET coins=coins-? WHERE id=1 AND coins>=?',[amount,amount]]:['UPDATE residents SET wallet=wallet-? WHERE username=? AND wallet>=?',[amount,username,amount]];
 const debit=civic
  ?d.prepare(`${payer} AND NOT EXISTS(SELECT 1 FROM project_contributions WHERE id=?) AND EXISTS(SELECT 1 FROM neighborhood_projects WHERE id=? AND raised=? AND completed_at IS NULL) AND NOT EXISTS(SELECT 1 FROM building_tiles WHERE ${cells.map(()=>'(x=? AND y=?)').join(' OR ')})`).bind(...payerArgs,requestId,project.id,project.raised,...cells.flatMap(c=>[c.x,c.y]))
  :d.prepare(`${payer} AND NOT EXISTS(SELECT 1 FROM project_contributions WHERE id=?) AND EXISTS(SELECT 1 FROM neighborhood_projects p JOIN buildings b ON b.id=p.garden_id WHERE p.id=? AND p.raised=? AND p.completed_at IS NULL AND b.kind='garden') AND NOT EXISTS(SELECT 1 FROM garden_decorations WHERE garden_id=? AND item=?)`).bind(...payerArgs,requestId,project.id,project.raised,project.gardenId,project.item);
 // The last donation builds the public building on the reserved plot in the same transaction.
 const complete=civic?[
  d.prepare('INSERT INTO buildings (id,x,y,kind,username,color) SELECT ?,x,y,item,NULL,? FROM neighborhood_projects WHERE id=? AND raised=goal AND completed_at IS NULL AND changes()>0').bind(buildingId,CIVIC_KINDS.find(c=>c.id===project.item)?.color||'#a8b6a0',project.id),
  ...cells.map(c=>d.prepare('INSERT INTO building_tiles (id,building_id,x,y) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM buildings WHERE id=?)').bind(buildingId+':'+c.x+','+c.y,buildingId,c.x,c.y,buildingId)),
  d.prepare('UPDATE neighborhood_projects SET completed_at=? WHERE id=? AND raised=goal AND completed_at IS NULL AND EXISTS(SELECT 1 FROM buildings WHERE id=?)').bind(now,project.id,buildingId)
 ]:[
  // Shared artwork belongs to the neighborhood, not to whoever made the final donation.
  d.prepare("INSERT OR IGNORE INTO garden_decorations (id,garden_id,username,item) SELECT ?,garden_id,'quartiere',item FROM neighborhood_projects WHERE id=? AND raised=goal AND completed_at IS NULL AND changes()>0").bind('project-'+project.id,project.id),
  d.prepare('UPDATE neighborhood_projects SET completed_at=? WHERE id=? AND raised=goal AND completed_at IS NULL AND changes()>0').bind(now,project.id)
 ];
 if(civic&&amount===project.goal-project.raised&&PLANT_KINDS.includes(project.item))await bankPayroll(d,now);
 const result=await d.batch([
  debit,
  d.prepare('INSERT INTO project_contributions (id,project_id,username,amount,created_at) SELECT ?,?,?,?,? WHERE changes()>0').bind(requestId,project.id,username,amount,now),
  d.prepare('UPDATE neighborhood_projects SET raised=raised+? WHERE id=? AND changes()>0').bind(amount,project.id),
  ...complete
 ]);
 if(!result[0].meta.changes)throw new CommunityError(fund?'Fondo comunale insufficiente o progressi cambiati. Aggiorna e riprova.':'Saldo insufficiente, contributo già inviato o progressi cambiati. Aggiorna e riprova.',409);return true;
}
const sizeOfTown=(s:{size:number}|null)=>s?.size||24;
