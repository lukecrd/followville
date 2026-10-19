import {votingAction,votingSnapshot} from './voting';
import {readAppearance,validAppearance} from '../../../lib/appearance';
import {socialSnapshot,socialAction,socialResidentData} from './social';
import {communitySnapshot,communityAction,CommunityError} from './community';
import {planBridge,bridgeEnds,canConnectRoad} from '../../../lib/bridges';
import {INITIAL,EXPANSION,CATALOG,colors,homes,buildable,cost,JOBS,SHOP,GARDEN_ITEMS,salary,payroll,Resident,expansionCost,SIZE,isRoad,buildingCells,TRANSPORT_KINDS,Building} from '../../../lib/town';
import {roadCells,nextToRoad,connectedRoadCells,cellKey,roadNeighbors,RoadCell,transportCells} from '../../../lib/roads';
import {ADMIN_ACTIONS,tokenHash} from '../../../lib/permissions';
export function createTownApi(env:{DB?:D1Database;SITE_OWNER_EMAIL?:string},development=false){
function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}});}
function db(){if(!env.DB)throw new Error('Database non disponibile');return env.DB;}
async function ensureUnits(){const d=db();const missing=await d.prepare("SELECT b.id,b.kind,b.username,b.color FROM buildings b WHERE b.kind IN ('cottage','villa','loft','apartment') AND NOT EXISTS(SELECT 1 FROM home_units u WHERE u.building_id=b.id)").all<{id:string;kind:string;username:string|null;color:string}>();if(!missing.results.length)return;await d.batch(missing.results.flatMap(b=>Array.from({length:b.kind==='apartment'?6:1},(_,i)=>d.prepare('INSERT OR IGNORE INTO home_units (id,building_id,unit,username,color) VALUES (?,?,?,?,?)').bind(b.kind==='apartment'?b.id+'-unit-'+(i+1):b.id,b.id,i+1,i===0?b.username:null,b.color))));}
async function ensureBuildingTiles(){const d=db(),missing=await d.prepare('SELECT b.x,b.y,b.kind,b.id,b.bridge_axis AS bridgeAxis,b.bridge_span AS bridgeSpan FROM buildings b WHERE NOT EXISTS(SELECT 1 FROM building_tiles t WHERE t.building_id=b.id)').all<Building>();if(missing.results.length)await d.batch(missing.results.flatMap(b=>buildingCells(b).map(c=>d.prepare('INSERT OR IGNORE INTO building_tiles (id,building_id,x,y) VALUES (?,?,?,?)').bind(b.id+':'+c.x+','+c.y,b.id,c.x,c.y))));}
async function ensureResidents(){await db().prepare('INSERT OR IGNORE INTO residents (username,wallet,paid_at,avatar) SELECT username,200,?,color FROM home_units WHERE username IS NOT NULL').bind(Date.now()).run();}
async function init(){
 const d=db();const existing=await d.prepare('SELECT id FROM town_settings WHERE id=1').first();
 if(!existing)await d.batch([d.prepare("INSERT OR IGNORE INTO town_settings (id,name,coins) VALUES (1,'La città dei sogni',3200)"),...INITIAL.map((b,i)=>d.prepare('INSERT OR IGNORE INTO buildings (id,x,y,kind,username,color) VALUES (?,?,?,?,NULL,?)').bind('initial-'+i,b.x,b.y,b.kind,colors[i%colors.length]))]);
 const setting=await d.prepare('SELECT expansion FROM town_settings WHERE id=1').first<{expansion:number}>();
 if(!setting?.expansion)await d.batch([...EXPANSION.map((b,i)=>d.prepare('INSERT OR IGNORE INTO buildings (id,x,y,kind,username,color) SELECT ?,?,?,?,NULL,? WHERE (SELECT expansion FROM town_settings WHERE id=1)=0').bind('expansion-'+i,b.x,b.y,b.kind,colors[i%colors.length])),d.prepare('UPDATE town_settings SET coins=coins+6000,expansion=1 WHERE id=1 AND expansion=0')]);
 const housing=await d.prepare('SELECT housing_version AS version FROM town_settings WHERE id=1').first<{version:number}>();
 if(!housing?.version){const occupied=await d.prepare('SELECT x,y FROM buildings').all<{x:number;y:number}>(),taken=new Set(occupied.results.map(b=>`${b.x},${b.y}`)),plots=[[14,10],[6,16],[15,11],[10,18],[18,12]].filter(([x,y])=>!taken.has(`${x},${y}`)).slice(0,2);await d.batch([...plots.map(([x,y],i)=>d.prepare("INSERT OR IGNORE INTO buildings (id,x,y,kind,username,color) SELECT ?,?,?,'apartment',NULL,? WHERE (SELECT housing_version FROM town_settings WHERE id=1)=0").bind('city-apartment-'+i,x,y,i?'#b7a18a':'#8fa6aa')),d.prepare('UPDATE town_settings SET housing_version=1 WHERE id=1 AND housing_version=0')]);}
 const commerce=await d.prepare('SELECT commerce_version AS version FROM town_settings WHERE id=1').first<{version:number}>();
 if(!commerce?.version){const occupied=await d.prepare('SELECT x,y FROM buildings').all<{x:number;y:number}>(),taken=new Set(occupied.results.map(b=>cellKey(b.x,b.y))),plots=[[18,5],[14,16],[19,11],[10,18],[18,12],[7,11]].filter(([x,y])=>!taken.has(cellKey(x,y))).slice(0,2);await d.batch([...plots.map(([x,y],i)=>d.prepare("INSERT OR IGNORE INTO buildings (id,x,y,kind,username,color) SELECT ?,?,?,?,NULL,? WHERE (SELECT commerce_version FROM town_settings WHERE id=1)=0").bind(i?'city-office-0':'city-bank-0',x,y,i?'office':'bank',i?'#8faab0':'#a8a48b')),d.prepare('UPDATE town_settings SET commerce_version=1 WHERE id=1 AND commerce_version=0')]);}
 await ensureBuildingTiles();await ensureUnits();await ensureResidents();
}
async function session(req:Request){
 const id=req.headers.get('oai-authenticated-user-id')||'',email=(req.headers.get('oai-authenticated-user-email')||'').toLowerCase(),configured=(env.SITE_OWNER_EMAIL||'').toLowerCase();
 // Bootstrap from the verified owner email, then authorize with the Site-scoped stable ID.
 let setting=await db().prepare('SELECT admin_user_id AS adminId FROM town_settings WHERE id=1').first<{adminId:string|null}>();
 if(id&&email&&configured&&email===configured&&!setting?.adminId){await db().prepare('UPDATE town_settings SET admin_user_id=? WHERE id=1 AND admin_user_id IS NULL').bind(id).run();setting=await db().prepare('SELECT admin_user_id AS adminId FROM town_settings WHERE id=1').first<{adminId:string|null}>();}
 const canAdmin=(!!id&&setting?.adminId===id)||(development&&!id);
 const link=id?await db().prepare('SELECT username FROM player_accounts WHERE user_id=?').bind(id).first<{username:string}>():null;
 return {canAdmin,self:link?.username||null,signedIn:!!id||development};
}
async function snapshot(req:Request){const d=db();const [s,b,r,g,p,u,m]=await Promise.all([d.prepare('SELECT name,coins,map_size AS size FROM town_settings WHERE id=1').first(),d.prepare('SELECT *,bridge_axis AS bridgeAxis,bridge_span AS bridgeSpan FROM buildings ORDER BY x+y,x').all(),d.prepare('SELECT username,wallet,job,candidate,paid_at AS paidAt,pay_credit AS payCredit,job_ms AS jobMs,avatar,appearance,house_decor AS houseDecor,car_level AS carLevel FROM residents WHERE username IN (SELECT username FROM home_units WHERE username IS NOT NULL)').all(),d.prepare('SELECT id,garden_id AS gardenId,username,item FROM garden_decorations WHERE garden_id IN (SELECT id FROM buildings WHERE kind=\'garden\')').all(),d.prepare('SELECT username,item FROM purchases').all(),d.prepare('SELECT id,building_id AS buildingId,unit,username,color FROM home_units ORDER BY building_id,unit').all(),d.prepare('SELECT id,building_id AS buildingId,author_user_id AS authorUserId,author_label AS authorLabel,official,pinned,title,body,created_at AS createdAt FROM town_messages ORDER BY pinned DESC,created_at DESC,id DESC LIMIT 50').all()]);const now=Date.now(),identity=await session(req),[community,social,polls]=await Promise.all([communitySnapshot(d,now),socialSnapshot(d,identity,now),votingSnapshot(d,req.headers.get('oai-authenticated-user-id')||'',now)]),socialData=socialResidentData(social,r.results as unknown as Resident[],b.results as unknown as Building[],now),activeMissions=new Map(community.missions.filter(m=>m.claimedAt===null&&m.expiresAt>now).map(m=>[m.username,m]));const linked=identity.canAdmin?await d.prepare('SELECT username FROM player_accounts').all():{results:[]};return {...s,polls,community,social,boardMessages:m.results.map(({authorUserId,official,pinned,...message})=>({...message,official:!!official,pinned:!!pinned,own:authorUserId===(req.headers.get('oai-authenticated-user-id')||'local-admin')})),session:identity,linkedResidents:linked.results,units:u.results,buildings:b.results,residents:r.results.map(v=>({...v,appearance:readAppearance(v.appearance,String(v.avatar)),pendingPay:salary(v as unknown as Resident,now),mission:activeMissions.get(String(v.username)),gathering:socialData.gatherings.get(String(v.username)),friendVisit:socialData.visits.get(String(v.username))})),decorations:g.results,purchases:p.results,now};}
async function GET(req:Request){try{await init();return json(await snapshot(req));}catch(e){console.error('town load',e);return json({error:'Impossibile caricare la città. Riprova tra poco.'},503);}}
async function POST(req:Request){
 try{
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json({error:'Richiesta non consentita'},403);
 // The hosting audience remains owner-private; actions are managed by the mayor.
 if(!development&&!req.headers.get('oai-authenticated-user-id'))return json({error:'Accedi per modificare la città.'},401);
 const body=await req.text();if(body.length>4096)return json({error:'Richiesta troppo grande'},413);
 const data=JSON.parse(body) as Record<string,unknown>;if(!data||typeof data!=='object')return json({error:'Richiesta non valida.'},400);
 await init();const d=db(),now=Date.now(),identity=await session(req),action=String(data.action);
 if(action==='claim'){
 const token=String(data.token||'');if(token.length<32||token.length>100)return json({error:'Codice di invito non valido.'},400);
 const uid=req.headers.get('oai-authenticated-user-id');if(!uid)return json({error:'Accedi prima di collegare il tuo abitante.'},401);
 const hash=await tokenHash(token);
 const result=await d.batch([d.prepare('INSERT INTO player_accounts (user_id,username) SELECT ?,username FROM resident_invites WHERE token_hash=? AND expires>? AND username IN (SELECT username FROM home_units WHERE username IS NOT NULL)').bind(uid,hash,now),d.prepare('DELETE FROM resident_invites WHERE token_hash=? AND EXISTS(SELECT 1 FROM player_accounts WHERE user_id=? AND username=resident_invites.username)').bind(hash,uid)]);
 if(!result[0].meta.changes)return json({error:'Codice scaduto o già utilizzato.'},400);return json(await snapshot(req));
 }
 if(ADMIN_ACTIONS.has(action)&&(!identity.canAdmin||data.view==='player'))return json({error:'Questa azione è riservata all’amministratore.'},403);
 if(!identity.canAdmin&&['apply','reject','collect','buy','contribute','avatar','appearance','paint'].includes(action)&&String(data.username||'').replace(/^@/,'').toLowerCase()!==identity.self)return json({error:'Puoi gestire soltanto il tuo abitante.'},403);
 if(['board-post','board-delete','board-pin'].includes(action)){
 const uid=req.headers.get('oai-authenticated-user-id')||(development?'local-admin':''),official=identity.canAdmin&&data.view!=='player';if(!uid)return json({error:'Accedi per usare la bacheca.'},401);
 if(action==='board-post'){
 const title=String(data.title||'').trim(),body=String(data.body||'').trim(),buildingId=String(data.buildingId||'');if(title.length<3||title.length>80||!body||body.length>600)return json({error:'Inserisci un titolo di 3–80 caratteri e un messaggio di massimo 600 caratteri.'},400);
 let author='Amministrazione';if(!official){const name=identity.canAdmin?String(data.username||'').replace(/^@/,'').toLowerCase():identity.self;if(!name||!await d.prepare('SELECT username FROM home_units WHERE username=?').bind(name).first())return json({error:'Collega un abitante per scrivere in bacheca.'},403);author='@'+name;}
 const result=await d.prepare("INSERT INTO town_messages (id,building_id,author_user_id,author_label,official,pinned,title,body,created_at) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM buildings WHERE id=? AND kind='townhall')").bind(crypto.randomUUID(),buildingId,uid,author,official?1:0,official&&data.pinned===true?1:0,title,body,now,buildingId).run();if(!result.meta.changes)return json({error:'Costruisci prima il municipio per aprire la bacheca.'},400);
 }else if(action==='board-pin'){const result=await d.prepare('UPDATE town_messages SET pinned=? WHERE id=?').bind(data.pinned===true?1:0,String(data.id||'')).run();if(!result.meta.changes)return json({error:'Messaggio non trovato.'},404);}
 else {const result=await d.prepare('DELETE FROM town_messages WHERE id=? AND (?=1 OR author_user_id=?)').bind(String(data.id||''),official?1:0,uid).run();if(!result.meta.changes)return json({error:'Puoi rimuovere solo i tuoi messaggi.'},403);}
 return json(await snapshot(req));
 }
 if(await votingAction(d,data,identity,req.headers.get('oai-authenticated-user-id')||'',now))return json(await snapshot(req));
 if(await socialAction(d,data,identity,now))return json(await snapshot(req));
 if(await communityAction(d,data,identity,now))return json(await snapshot(req));
 if(action==='expand'){
 const settings=await d.prepare('SELECT map_size AS size FROM town_settings WHERE id=1').first<{size:number}>();const size=settings?.size||24,price=expansionCost(size);if(Number(data.expectedSize)!==size)return json({error:'La città è cambiata. Aggiorna prima di espandere.'},409);if(price===null)return json({error:'La città ha raggiunto l’estensione massima.'},400);
 const result=await d.prepare('UPDATE town_settings SET map_size=map_size+8,coins=coins-? WHERE id=1 AND map_size=? AND coins>=? AND map_size<?').bind(price,size,price,SIZE).run();
 if(!result.meta.changes)return json({error:'Fondi insufficienti o espansione già eseguita. Aggiorna la città.'},400);return json(await snapshot(req));
 }
 if(action==='invite'){
 const username=String(data.username||'');const target=await d.prepare('SELECT username FROM home_units WHERE username=?').bind(username).first();if(!target)return json({error:'Abitante non trovato.'},404);
 if(await d.prepare('SELECT user_id FROM player_accounts WHERE username=?').bind(username).first())return json({error:'Questo abitante è già collegato a un giocatore.'},400);
 const token=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
 await d.prepare('INSERT INTO resident_invites (username,token_hash,expires) VALUES (?,?,?) ON CONFLICT(username) DO UPDATE SET token_hash=excluded.token_hash,expires=excluded.expires').bind(username,await tokenHash(token),now+7*86400000).run();return json({...await snapshot(req),inviteCode:token});
 }
 if(data.action==='rename'){
 const name=String(data.name||'').trim();if(name.length<2||name.length>40)return json({error:'Scegli un nome tra 2 e 40 caratteri.'},400);
 await d.prepare('UPDATE town_settings SET name=? WHERE id=1').bind(name).run();return json(await snapshot(req));
 }
 let username=String(data.username||'').trim().replace(/^@/,'').toLowerCase();
 if(username&&!/^[a-z0-9._]{2,24}$/.test(username))return json({error:'Nome TikTok non valido: usa 2–24 lettere, numeri, punti o underscore.'},400);
 if(['apply','approve','reject','collect','buy','contribute','avatar','appearance','paint'].includes(String(data.action))){
 const r=await d.prepare('SELECT username,wallet,job,candidate,paid_at AS paidAt,pay_credit AS payCredit,job_ms AS jobMs,avatar,appearance,house_decor AS houseDecor,car_level AS carLevel FROM residents WHERE username=? AND EXISTS(SELECT 1 FROM home_units WHERE username=?)').bind(username,username).first<Resident>();
 if(!r)return json({error:'Assegna prima una casa a questo abitante.'},404);
 if(data.action==='apply'){
 const job=JOBS.find(j=>j.id===data.job);if(!job)return json({error:'Mestiere non valido.'},400);
 if(r.job===job.id)return json({error:'Questo è già il tuo mestiere.'},400);
 const result=await d.prepare('UPDATE residents SET candidate=? WHERE username=? AND (SELECT COUNT(*) FROM buildings WHERE kind=?)>0 AND (SELECT COUNT(*) FROM residents WHERE job=? AND username IN (SELECT username FROM home_units)) < ?*(SELECT COUNT(*) FROM buildings WHERE kind=?)').bind(job.id,username,job.service,job.id,job.slots,job.service).run();
 if(!result.meta.changes)return json({error:'Non ci sono posti disponibili per questo mestiere.'},409);
 }else if(data.action==='approve'){
 const job=JOBS.find(j=>j.id===r.candidate);if(!job)return json({error:'Nessuna candidatura in attesa.'},400);
 const settled=payroll(r,now);const [result]=await d.batch([d.prepare('UPDATE residents SET job=?,candidate=NULL,job_ms=0,paid_at=?,wallet=wallet+?,pay_credit=? WHERE username=? AND candidate=? AND paid_at=? AND pay_credit=? AND (SELECT COUNT(*) FROM residents WHERE job=? AND username IN (SELECT username FROM home_units)) < ?*(SELECT COUNT(*) FROM buildings WHERE kind=?)').bind(job.id,now,settled.net,settled.credit,username,job.id,r.paidAt,r.payCredit||0,job.id,job.slots,job.service),d.prepare('UPDATE town_settings SET coins=coins+? WHERE id=1 AND changes()>0').bind(settled.tax)]);
 if(!result.meta.changes)return json({error:'Il posto non è più disponibile. Aggiorna la candidatura.'},409);
 }else if(data.action==='reject'){
 await d.prepare('UPDATE residents SET candidate=NULL WHERE username=?').bind(username).run();
 }else if(data.action==='collect'){
 const earned=payroll(r,now);if(earned.amount<=0)return json({error:'Non c’è ancora una moneta da riscuotere. Lo stipendio matura durante l’orario di lavoro, dal lunedì al venerdì, 09:00–17:00 nel gioco.'},400);
 const [result]=await d.batch([d.prepare('UPDATE residents SET wallet=wallet+?,job_ms=job_ms+?,paid_at=?,pay_credit=? WHERE username=? AND paid_at=? AND job=? AND pay_credit=?').bind(earned.net,earned.workMs,now,earned.credit,username,r.paidAt,r.job,r.payCredit||0),d.prepare('UPDATE town_settings SET coins=coins+? WHERE id=1 AND changes()>0').bind(earned.tax)]);
 if(!result.meta.changes)return json({error:'Stipendio già riscosso. Aggiorna la città.'},409);
 }else if(data.action==='avatar'){
 const color=String(data.color);if(!colors.includes(color))return json({error:'Colore non valido.'},400);
 await d.prepare('UPDATE residents SET avatar=? WHERE username=?').bind(color,username).run();
 }else if(data.action==='appearance'){
 if(!validAppearance(data.appearance))return json({error:'Aspetto non valido. Scegli le opzioni del guardaroba.'},400);
 await d.prepare('UPDATE residents SET appearance=? WHERE username=?').bind(JSON.stringify(data.appearance),username).run();
 }else if(data.action==='paint'){
 const color=String(data.color);if(!colors.includes(color))return json({error:'Colore non valido.'},400);
 await d.batch([d.prepare('UPDATE home_units SET color=? WHERE username=?').bind(color,username),d.prepare('UPDATE buildings SET color=? WHERE username=?').bind(color,username)]);
 }else if(data.action==='buy'){
 const item=SHOP.find(i=>i.id===data.item);if(!item)return json({error:'Articolo non valido.'},400);
 const house=await d.prepare('SELECT u.id,u.building_id AS buildingId,b.kind FROM home_units u JOIN buildings b ON b.id=u.building_id WHERE u.username=?').bind(username).first<{id:string;buildingId:string;kind:string}>();if(!house)return json({error:'Casa non trovata.'},404);
 let target:{id:string;buildingId:string;kind:string}|null=null;
 const moving=item.id==='apartment-move'||(item.id==='villa-upgrade'&&house.kind==='apartment');
 if(moving){const targetKind=item.id==='apartment-move'?'apartment':'villa';if(house.kind===targetKind)return json({error:'Abiti già in questo tipo di alloggio.'},400);
 target=await d.prepare('SELECT u.id,u.building_id AS buildingId,b.kind FROM home_units u JOIN buildings b ON b.id=u.building_id WHERE u.username IS NULL AND b.kind=? ORDER BY u.building_id,u.unit LIMIT 1').bind(targetKind).first();
 if(!target)return json({error:targetKind==='apartment'?'Non ci sono appartamenti liberi. Chiedi all’amministratore di costruire un palazzo.':'Non ci sono villette libere per il trasferimento.'},400);}
 if(house.kind==='apartment'&&['pergola','pool'].includes(item.id))return json({error:'Questa miglioria richiede una casa indipendente.'},400);
 let condition='1=1';if(item.id==='car')condition='car_level=0';if(item.id==='car-upgrade')condition='car_level=1';if(item.id==='villa-upgrade'&&!moving)condition="EXISTS(SELECT 1 FROM home_units u JOIN buildings b ON b.id=u.building_id WHERE u.username=residents.username AND b.kind<>'villa')";
 if(target)condition+=` AND EXISTS(SELECT 1 FROM home_units WHERE id=? AND username IS NULL)`;
 const id=crypto.randomUUID();const params:unknown[]=[item.price,username,item.price];if(target)params.push(target.id);params.push(house.id,username,username,item.id);
 const actions=[d.prepare(`UPDATE residents SET wallet=wallet-? WHERE username=? AND wallet>=? AND ${condition} AND EXISTS(SELECT 1 FROM home_units WHERE id=? AND username=?) AND NOT EXISTS(SELECT 1 FROM purchases WHERE username=? AND item=?)`).bind(...params),d.prepare('INSERT INTO purchases (id,username,item) SELECT ?,?,? WHERE changes()>0').bind(id,username,item.id)];
 if(moving&&target){actions.push(d.prepare('UPDATE home_units SET username=NULL WHERE id=? AND username=? AND EXISTS(SELECT 1 FROM purchases WHERE id=?)').bind(house.id,username,id),d.prepare('UPDATE home_units SET username=? WHERE id=? AND username IS NULL AND EXISTS(SELECT 1 FROM purchases WHERE id=?)').bind(username,target.id,id),d.prepare('UPDATE buildings SET username=NULL WHERE id=? AND username=? AND EXISTS(SELECT 1 FROM purchases WHERE id=?)').bind(house.buildingId,username,id));if(target.kind!=='apartment')actions.push(d.prepare('UPDATE buildings SET username=? WHERE id=? AND EXISTS(SELECT 1 FROM purchases WHERE id=?)').bind(username,target.buildingId,id));}
 if(item.bit)actions.push(d.prepare('UPDATE residents SET house_decor=house_decor|? WHERE username=? AND EXISTS(SELECT 1 FROM purchases WHERE id=?)').bind(item.bit,username,id));
 if(item.id==='car'||item.id==='car-upgrade')actions.push(d.prepare('UPDATE residents SET car_level=? WHERE username=? AND EXISTS(SELECT 1 FROM purchases WHERE id=?)').bind(item.id==='car'?1:2,username,id));
 if(item.id==='villa-upgrade'&&!moving)actions.push(d.prepare("UPDATE buildings SET kind='villa' WHERE id=? AND EXISTS(SELECT 1 FROM purchases WHERE id=?)").bind(house.buildingId,id));
 const result=await d.batch(actions);if(!result[0].meta.changes)return json({error:'Saldo insufficiente, articolo già posseduto o alloggio non più disponibile.'},400);
 }else if(data.action==='contribute'){
 const item=GARDEN_ITEMS.find(i=>i.id===data.item);if(!item)return json({error:'Arredo non valido.'},400);const gardenId=String(data.gardenId),id=crypto.randomUUID();
 const result=await d.batch([d.prepare("UPDATE residents SET wallet=wallet-? WHERE username=? AND wallet>=? AND EXISTS(SELECT 1 FROM buildings WHERE id=? AND kind='garden') AND NOT EXISTS(SELECT 1 FROM garden_decorations WHERE garden_id=? AND item=?) AND NOT EXISTS(SELECT 1 FROM neighborhood_projects WHERE garden_id=? AND item=? AND completed_at IS NULL)").bind(item.price,username,item.price,gardenId,gardenId,item.id,gardenId,item.id),d.prepare('INSERT INTO garden_decorations (id,garden_id,username,item) SELECT ?,?,?,? WHERE changes()>0').bind(id,gardenId,username,item.id)]);
 if(!result[0].meta.changes)return json({error:'Saldo insufficiente, giardino non disponibile o arredo già presente.'},400);
 }
 return json(await snapshot(req));
 }
 if(data.action==='build'){
 const kind=String(data.kind);if(kind==='townhall'&&await d.prepare("SELECT id FROM buildings WHERE kind='townhall'").first())return json({error:'La città ha già il suo municipio.'},400);if(!CATALOG.some(c=>c.id===kind))return json({error:'Edificio non valido.'},400);
 let x=Number(data.x),y=Number(data.y);const settings=await d.prepare('SELECT map_size AS size FROM town_settings WHERE id=1').first<{size:number}>();if(!buildingCells({kind:kind as typeof CATALOG[number]['id'],x,y}).every(c=>buildable(c.x,c.y,settings?.size||24)))return json({error:'L’edificio deve entrare interamente in terreni edificabili, senza occupare strade o bordi della mappa.'},400);
 if(kind==='station'&&y!==1)return json({error:'Costruisci le stazioni nella fila 1, accanto alla ferrovia.'},400);
 let roadGuard='',bridgeAxis:'x'|'y'|null=null,bridgeSpan:number|null=null;const roadParams:unknown[]=[];
 if(TRANSPORT_KINDS.includes(kind)){const existing=await d.prepare('SELECT *,bridge_axis AS bridgeAxis,bridge_span AS bridgeSpan FROM buildings').all<Building>(),roads=existing.results.filter(b=>TRANSPORT_KINDS.includes(b.kind)),size=settings?.size||24;let groups:RoadCell[][]=[];
 if(kind==='bridge'){const plan=planBridge(x,y,size,existing.results);if(!plan)return json({error:'Il ponte deve collegare due strade allineate, con tutto lo spazio intermedio libero (massimo 12 lotti).'},400);x=plan.x;y=plan.y;bridgeAxis=plan.bridgeAxis;bridgeSpan=plan.bridgeSpan;groups=plan.ends.map(p=>[p]);}
 else {if(!canConnectRoad(x,y,size,roads))return json({error:'Collega la strada alla rete o a una rampa del ponte, senza entrare dai parapetti laterali.'},400);const links=new Map(transportCells(roads).map(b=>[cellKey(b.x,b.y),b]));groups=[roadNeighbors({x,y},roadCells(size,roads),links)];}
 for(const neighbors of groups){if(neighbors.some(c=>isRoad(c.x,c.y)))continue;roadGuard+=" AND EXISTS(SELECT 1 FROM buildings b JOIN building_tiles t ON t.building_id=b.id WHERE b.kind IN ('road','bridge') AND ("+neighbors.map(()=>"(t.x=? AND t.y=? AND (b.kind!='bridge' OR b.bridge_axis IS NULL OR b.bridge_axis=?))").join(' OR ')+'))';for(const c of neighbors)roadParams.push(c.x,c.y,bridgeAxis||(c.x===x?'y':'x'));}}

 const reserved=await d.prepare("SELECT item AS kind,x,y FROM neighborhood_projects WHERE kind='civic' AND completed_at IS NULL").all<Building>(),reservedCells=new Set(reserved.results.flatMap(p=>buildingCells(p).map(c=>cellKey(c.x,c.y))));
 if(buildingCells({kind:kind as typeof CATALOG[number]['id'],x,y,bridgeAxis,bridgeSpan}).some(c=>reservedCells.has(cellKey(c.x,c.y))))return json({error:'Questo lotto è riservato a un progetto civico in corso.'},400);
 if(!homes.includes(kind))username='';
 const color=homes.includes(kind)?(colors.includes(String(data.color))?String(data.color):colors[0]):CATALOG.find(c=>c.id===kind)!.color,price=cost(kind),id=crypto.randomUUID();
 const result=await d.batch([d.prepare('INSERT INTO buildings (id,x,y,kind,username,color,bridge_axis,bridge_span) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT coins FROM town_settings WHERE id=1)>=?'+roadGuard).bind(id,x,y,kind,kind==='apartment'?null:username||null,color,bridgeAxis,bridgeSpan,price,...roadParams),...buildingCells({kind:kind as typeof CATALOG[number]['id'],x,y,bridgeAxis,bridgeSpan}).map(c=>d.prepare('INSERT INTO building_tiles (id,building_id,x,y) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM buildings WHERE id=?)').bind(id+':'+c.x+','+c.y,id,c.x,c.y,id)),d.prepare('UPDATE town_settings SET coins=coins-? WHERE id=1 AND EXISTS(SELECT 1 FROM buildings WHERE id=?)').bind(price,id),...(homes.includes(kind)?Array.from({length:kind==='apartment'?6:1},(_,i)=>d.prepare('INSERT INTO home_units (id,building_id,unit,username,color) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM buildings WHERE id=?)').bind(kind==='apartment'?id+'-unit-'+(i+1):id,id,i+1,i===0?username||null:null,color,id)):[])]);
 if(!result[0].meta.changes)return json({error:'Fondi insufficienti o strada di collegamento non più disponibile.'},400);
 }else if(data.action==='assign'){
 const id=String(data.id),unit=await d.prepare('SELECT u.id,u.building_id AS buildingId,u.username,b.kind FROM home_units u JOIN buildings b ON b.id=u.building_id WHERE u.id=?').bind(id).first<{id:string;buildingId:string;username:string|null;kind:string}>();if(!unit)return json({error:'Scegli un alloggio da assegnare.'},400);
 if(unit.username&&unit.username!==username&&await d.prepare('SELECT id FROM resident_shops WHERE owner=? AND closed_at IS NULL').bind(unit.username).first())return json({error:'Chiudi prima il negozio di questo abitante.'},400);
 const color=colors.includes(String(data.color))?String(data.color):colors[0];if(unit.username&&unit.username!==username&&await d.prepare('SELECT username FROM player_accounts WHERE username=?').bind(unit.username).first())return json({error:'Questa casa è collegata a un giocatore. La sua assegnazione è protetta.'},400);
 const actions=[d.prepare('UPDATE home_units SET username=?,color=? WHERE id=? AND (username IS ? OR NOT EXISTS(SELECT 1 FROM player_accounts WHERE player_accounts.username=home_units.username))').bind(username||null,color,id,username||null)];
 if(unit.kind!=='apartment')actions.push(d.prepare('UPDATE buildings SET username=?,color=? WHERE id=? AND EXISTS(SELECT 1 FROM home_units WHERE id=? AND username IS ?)').bind(username||null,color,unit.buildingId,id,username||null));
 const changed=await d.batch(actions);if(!changed[0].meta.changes)return json({error:'Assegnazione cambiata: aggiorna gli alloggi prima di continuare.'},409);
 }else if(data.action==='remove'){
 const id=String(data.id),b=await d.prepare('SELECT kind,username FROM buildings WHERE id=?').bind(id).first<{kind:string;username:string|null}>();if(!b)return json({error:'Edificio non trovato.'},404);
 if(b.username)return json({error:'Libera la casa prima di rimuoverla. Il portafoglio dell’abitante sarà conservato.'},400);
 const job=JOBS.find(j=>j.service===b.kind);
 let condition="NOT EXISTS(SELECT 1 FROM town_polls WHERE building_id=buildings.id AND closed_at IS NULL AND closes_at>"+now+") AND NOT EXISTS(SELECT 1 FROM resident_shops WHERE building_id=buildings.id AND closed_at IS NULL) AND NOT EXISTS(SELECT 1 FROM town_parties WHERE building_id=buildings.id AND cancelled_at IS NULL AND ends_at>"+now+") AND NOT EXISTS(SELECT 1 FROM neighborhood_projects WHERE garden_id=buildings.id) AND NOT EXISTS(SELECT 1 FROM daily_missions WHERE building_id=buildings.id AND claimed_at IS NULL AND expires_at>"+now+") AND NOT EXISTS(SELECT 1 FROM home_units WHERE building_id=buildings.id AND username IS NOT NULL) AND NOT EXISTS(SELECT 1 FROM garden_decorations WHERE garden_id=buildings.id) AND NOT EXISTS(SELECT 1 FROM town_messages WHERE building_id=buildings.id)";
 if(TRANSPORT_KINDS.includes(b.kind)){const roads=await d.prepare("SELECT id,x,y,kind,bridge_axis AS bridgeAxis,bridge_span AS bridgeSpan FROM buildings WHERE kind IN ('road','bridge')").all<Building>(),settings=await d.prepare('SELECT map_size AS size FROM town_settings WHERE id=1').first<{size:number}>(),remaining=roads.results.filter(r=>r.id!==id),connected=connectedRoadCells(settings?.size||24,remaining);const cells=roadCells(settings?.size||24,remaining);if(remaining.some(r=>r.kind==='bridge'&&r.bridgeSpan&&bridgeEnds(r).some(p=>!cells.has(cellKey(p.x,p.y)))))return json({error:'Questa strada è una delle due estremità di un ponte. Rimuovi prima il ponte.'},400);if(remaining.some(r=>!connected.cells.has(cellKey(r.x,r.y))))return json({error:'Questo tratto collega altre strade. Rimuovi prima le estremità.'},400);condition+=` AND (SELECT COUNT(*) FROM buildings WHERE kind IN ('road','bridge'))=${roads.results.length}`;}
 if(job)condition+=` AND (SELECT COUNT(*) FROM residents WHERE job='${job.id}' AND username IN (SELECT username FROM home_units)) <= ${job.slots}*((SELECT COUNT(*) FROM buildings WHERE kind='${job.service}')-1)`;
 const result=await d.batch([d.prepare(`DELETE FROM buildings WHERE id=? AND username IS NULL AND ${condition}`).bind(id),d.prepare('UPDATE town_settings SET coins=coins+? WHERE id=1 AND changes()>0').bind(Math.floor(cost(b.kind)/2))]);
 if(!result[0].meta.changes)return json({error:'Questo spazio ospita lavoratori, missioni, progetti, votazioni, arredi o messaggi e non può essere rimosso.'},400);
 }else return json({error:'Azione non valida.'},400);
 await ensureUnits();await ensureResidents();return json(await snapshot(req));
 }catch(e){if(e instanceof CommunityError)return json({error:e.message},e.status);const msg=String(e);if(msg.includes('UNIQUE')&&(msg.includes('player_accounts')||msg.includes('resident_invites')))return json({error:'Questo account o abitante è già collegato a un giocatore.'},409);if(msg.includes('UNIQUE')&&msg.includes('buildings.kind'))return json({error:'La città ha già il suo municipio.'},409);if(msg.includes('UNIQUE'))return json({error:msg.includes('username')?'Questo follower ha già una casa.':'Terreno o articolo già occupato. Scegline un altro.'},409);if(e instanceof SyntaxError)return json({error:'Richiesta non valida.'},400);console.error('town write',e);return json({error:'Modifica non salvata. Riprova tra poco.'},500);}
}

return {GET,POST};
}
