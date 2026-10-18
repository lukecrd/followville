import {createRequire} from 'node:module';
import {readFile,readdir,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),w=createRequire(require.resolve('wrangler/package.json')),{build}=w('esbuild'),{Miniflare}=w('miniflare');
await mkdir('.sites-runtime',{recursive:true});
await build({stdin:{contents:"export {MapScene} from './app/town-art';export * from './lib/community';export {CommunityPanel} from './app/community-panel';export {prepareResident,sampleResident,simulationIndex} from './lib/simulation';export {buildable,buildingCells,payroll,seniority} from './lib/town';",resolveDir:process.cwd()},bundle:true,packages:'external',platform:'node',format:'cjs',outfile:'.sites-runtime/community-check.cjs',jsx:'automatic'});
const api=require('../.sites-runtime/community-check.cjs');
for(const [instant,day,reset]of [
 ['2026-10-18T21:59:59Z','2026-10-18','2026-10-18T22:00:00Z'],['2026-10-18T22:00:00Z','2026-10-19','2026-10-19T22:00:00Z'],
 ['2026-03-28T23:30:00Z','2026-03-29','2026-03-29T22:00:00Z'],['2026-10-24T22:30:00Z','2026-10-25','2026-10-25T23:00:00Z']
]){const value=api.dailyWindow(Date.parse(instant));assert.equal(value.day,day);assert.equal(new Date(value.resetsAt).toISOString(),new Date(reset).toISOString());assert.equal(new Set(api.dailyMissionIds(day)).size,3);}
const built=await build({stdin:{contents:"import {GET,POST} from './app/api/town/route.ts';export default {fetch(r){return r.method==='POST'?POST(r):GET(r);}}",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers'],define:{'import.meta.env.DEV':'false'}});
const mf=new Miniflare({modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-05-15',d1Databases:['DB'],bindings:{SITE_OWNER_EMAIL:'owner@example.test'},inspectorPort:0});
try{
 const d=await mf.getD1Database('DB');for(const file of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const sql of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await d.prepare(sql.trim()).run();
 const headers={owner:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test'},alice:{'oai-authenticated-user-id':'alice-account'},bob:{'oai-authenticated-user-id':'bob-account'},visitor:{'oai-authenticated-user-id':'visitor'}};
 const call=async(data,user='owner')=>{const r=await mf.dispatchFetch('https://game.test/api/town',{method:data?'POST':'GET',headers:{...headers[user],...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,data:await r.json()};};
 const ok=async(data,user='owner')=>{const r=await call(data,user);assert.equal(r.status,200,JSON.stringify(r));return r.data;};
 let town=await ok(),free=town.units.filter(u=>!u.username);
 for(const [i,name]of ['alice','bob'].entries()){await ok({action:'assign',id:free[i].id,username:name});const invited=await ok({action:'invite',username:name});await ok({action:'claim',token:invited.inviteCode},name);}
 town=await ok();assert.equal(town.community.dailyIds.length,3);assert.equal(town.community.missions.length,0);
 assert.equal((await call({action:'mission-start',username:'alice',missionId:town.community.dailyIds[0]},'visitor')).status,403);
 assert.equal((await call({action:'mission-start',username:'bob',missionId:town.community.dailyIds[0]},'alice')).status,403);
 const daily=town.community.dailyIds,wallet=town.residents.find(r=>r.username==='alice').wallet;
 const starts=await Promise.all(daily.slice(0,2).map(missionId=>call({action:'mission-start',username:'alice',missionId,reward:99999},'alice')));assert.deepEqual(starts.map(x=>x.status).sort(),[200,409]);
 town=await ok();let run=town.community.missions[0];assert.equal(run.reward,api.MISSION_CATALOG.find(m=>m.id===run.missionId).reward);assert.ok(run.readyAt>run.startedAt+40000);
 assert.equal((await call({action:'mission-claim',username:'alice',id:run.id},'alice')).status,409);
 assert.equal((await call({action:'mission-claim',username:'bob',id:run.id},'bob')).status,409);
 assert.equal((await call({action:'remove',id:run.buildingId})).status,400,'active destination is protected');
 const resident=town.residents.find(r=>r.username==='alice'),plan=api.prepareResident(resident,api.simulationIndex(town.buildings,town.units),town.size),frame=api.sampleResident(plan,run.readyAt);assert.equal(frame.destination,run.buildingId);assert.equal(frame.moving,false);assert.match(frame.label,/riscuoti/);
 await d.prepare('UPDATE daily_missions SET ready_at=? WHERE id=?').bind(Date.now()-1,run.id).run();
 const claims=await Promise.all([call({action:'mission-claim',username:'alice',id:run.id},'alice'),call({action:'mission-claim',username:'alice',id:run.id},'alice')]);assert.deepEqual(claims.map(x=>x.status).sort(),[200,409]);assert.equal((await ok()).residents.find(r=>r.username==='alice').wallet,wallet+run.reward);
 assert.equal((await call({action:'mission-start',username:'alice',missionId:run.missionId},'alice')).status,409);
 let rewards=run.reward;for(const missionId of daily.filter(id=>id!==run.missionId)){town=await ok({action:'mission-start',username:'alice',missionId},'alice');const next=town.community.missions.find(m=>m.missionId===missionId);await d.prepare('UPDATE daily_missions SET ready_at=? WHERE id=?').bind(Date.now()-1,next.id).run();await ok({action:'mission-claim',username:'alice',id:next.id},'alice');rewards+=next.reward;}
 town=await ok();assert.equal(town.residents.find(r=>r.username==='alice').wallet,wallet+rewards);assert.equal(town.community.missions.filter(m=>m.claimedAt!==null).length,3);assert.ok(rewards<=18);
 // Previous-day rows cannot be claimed and do not block the next day.
 await d.prepare("UPDATE daily_missions SET day='2000-01-01',expires_at=?,claimed_at=NULL WHERE username='alice'").bind(Date.now()-1).run();assert.equal((await call({action:'mission-claim',username:'alice',id:run.id},'alice')).status,409);town=await ok({action:'mission-start',username:'alice',missionId:daily[0]},'alice');assert.equal(town.community.missions.length,1);
 const garden=town.buildings.find(b=>b.kind==='garden');
 assert.equal((await call({action:'project-create',gardenId:garden.id,item:'flowers'},'alice')).status,403);assert.equal((await call({action:'project-create',gardenId:garden.id,item:'flowers',view:'player'})).status,403);
 for(const item of ['flowers','bench','lights'])town=await ok({action:'project-create',gardenId:garden.id,item,goal:1});
 assert.equal((await call({action:'project-create',gardenId:garden.id,item:'gazebo'})).status,409);assert.equal((await call({action:'contribute',username:'alice',gardenId:garden.id,item:'bench'},'alice')).status,400,'direct donations cannot overwrite a funded project');
 const project=town.community.projects.find(p=>p.item==='flowers');assert.equal(project.goal,40);assert.equal((await call({action:'project-create',gardenId:garden.id,item:'flowers'})).status,409);assert.equal((await call({action:'remove',id:garden.id})).status,400);
 const requestId=crypto.randomUUID(),payload={action:'project-contribute',username:'alice',projectId:project.id,amount:10,requestId};
 const balancesBefore=(await ok()).residents.reduce((n,r)=>n+r.wallet,0),donations=await Promise.all([call(payload,'alice'),call(payload,'alice')]);assert.deepEqual(donations.map(r=>r.status).sort(),[200,409]);
 town=await ok();assert.equal(town.community.projects.find(p=>p.id===project.id).raised,10);assert.equal(town.residents.reduce((n,r)=>n+r.wallet,0),balancesBefore-10);
 assert.equal((await call(payload,'alice')).status,409);assert.equal((await ok()).community.projects.find(p=>p.id===project.id).raised,10,'replay cannot increment project progress');
 assert.equal((await call({...payload,requestId:crypto.randomUUID(),username:'bob'},'alice')).status,403);
 for(const amount of [-1,0,51,1.5,'x'])assert.equal((await call({...payload,requestId:crypto.randomUUID(),amount},'alice')).status,400);
 const finish=await Promise.all(['alice','bob'].map(username=>call({action:'project-contribute',username,projectId:project.id,amount:50,requestId:crypto.randomUUID()},username)));assert.deepEqual(finish.map(r=>r.status).sort(),[200,409]);
 town=await ok();const completed=town.community.projects.find(p=>p.id===project.id);assert.equal(completed.raised,40);assert.ok(completed.completedAt);assert.equal(town.residents.reduce((n,r)=>n+r.wallet,0),balancesBefore-40,'only the remaining 30 coins were debited');assert.equal(town.community.contributions.filter(c=>c.projectId===project.id).reduce((n,c)=>n+c.amount,0),40);assert.equal(town.decorations.filter(d=>d.id==='project-'+project.id).length,1,'shared artwork appears exactly once');
 assert.equal((await call({...payload,requestId:crypto.randomUUID()},'alice')).status,409);await ok({action:'project-create',gardenId:garden.id,item:'gazebo'});
 const bench=town.community.projects.find(p=>p.item==='bench'),bobWallet=town.residents.find(r=>r.username==='bob').wallet;await d.prepare("UPDATE residents SET wallet=2 WHERE username='bob'").run();assert.equal((await call({action:'project-contribute',username:'bob',projectId:bench.id,amount:5,requestId:crypto.randomUUID()},'bob')).status,409);assert.equal((await ok()).residents.find(r=>r.username==='bob').wallet,2);await d.prepare("UPDATE residents SET wallet=? WHERE username='bob'").bind(bobWallet).run();
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 for(const section of ['missions','projects']){const html=renderToStaticMarkup(React.createElement(api.CommunityPanel,{town,section,admin:false,active:'alice',busy:false,onClose(){},onSelect(){},onLocate(){},onClaim(){},onAction(){}}));assert.ok(html.includes(section==='missions'?'Le tue missioni':'REALIZZATO'));assert.ok(!html.includes('Avvia un progetto'));}
 const adminHtml=renderToStaticMarkup(React.createElement(api.CommunityPanel,{town,section:'projects',admin:true,active:'alice',busy:false,onClose(){},onSelect(){},onLocate(){},onClaim(){},onAction(){}}));assert.ok(adminHtml.includes('Avvia un progetto'));assert.ok(!adminHtml.includes('project-donate'));
 const map=renderToStaticMarkup(React.createElement('svg',null,React.createElement(api.MapScene,{projects:town.community.projects,buildings:town.buildings,units:town.units,selected:null,highlight:null,tool:null,zoom:1,pan:{x:0,y:0},onPlot(){},onBuilding(){},size:town.size,decorations:town.decorations})));assert.match(map,/PROGETTO|REALIZZATO/);
 // Civic projects: residents fund a public building on a reserved plot.
 await d.prepare('UPDATE neighborhood_projects SET completed_at=? WHERE completed_at IS NULL').bind(Date.now()).run();
 town=await ok();const taken=new Set(town.buildings.flatMap(b=>api.buildingCells(b).map(c=>c.x+','+c.y)));let plot;for(let y=2;!plot&&y<town.size-1;y++)for(let x=2;x<town.size-1;x++)if(api.buildable(x,y,town.size)&&!taken.has(x+','+y)){plot={x,y};break;}
 assert.equal((await call({action:'project-create',kind:'cafe',...plot},'alice')).status,403);assert.equal((await call({action:'project-create',kind:'cottage',...plot})).status,400,'homes are not civic');
 town=await ok({action:'project-create',kind:'cafe',...plot});const civic=town.community.projects.find(p=>p.kind==='civic');assert.equal(civic.goal,180);assert.equal(civic.x,plot.x);
 assert.equal((await call({action:'project-create',kind:'market',...plot})).status,400,'plot already reserved');assert.equal((await call({action:'build',kind:'tree',...plot})).status,400,'mayor cannot build on a reserved plot');
 await d.prepare("UPDATE residents SET wallet=1000 WHERE username IN ('alice','bob')").run();const cafes=town.buildings.filter(b=>b.kind==='cafe').length;
 const final=await Promise.all([0,1,2,3,4].map(i=>call({action:'project-contribute',username:i%2?'bob':'alice',projectId:civic.id,amount:50,requestId:crypto.randomUUID()},i%2?'bob':'alice')));assert.ok(final.filter(r=>r.status===200).length>=1);
 for(let i=0;i<4&&!(await ok()).community.projects.find(p=>p.id===civic.id).completedAt;i++)await ok({action:'project-contribute',username:'alice',projectId:civic.id,amount:50,requestId:crypto.randomUUID()},'alice');
 town=await ok();assert.ok(town.community.projects.find(p=>p.id===civic.id).completedAt);assert.equal(town.buildings.filter(b=>b.kind==='cafe').length,cafes+1,'building appears exactly once');assert.ok(town.buildings.some(b=>b.id==='project-'+civic.id&&b.x===plot.x&&b.y===plot.y));
 assert.equal(town.residents.filter(r=>['alice','bob'].includes(r.username)).reduce((n,r)=>n+r.wallet,0),2000-180,'only the goal is debited');
 assert.ok(renderToStaticMarkup(React.createElement(api.CommunityPanel,{town,section:'projects',admin:true,active:'alice',busy:false,onClose(){},onSelect(){},onLocate(){},onClaim(){},onAction(){}})).includes('Edificio pubblico'));
 // Seniority: +1 coin per hour at 40, 120 and 240 worked hours.
 assert.deepEqual([0,39,40,120,240,999].map(h=>api.seniority(h*450000).bonus),[0,0,1,2,3,3]);assert.equal(api.payroll({job:'barista',paidAt:Date.now()-7*24*450000,payCredit:0,jobMs:120*450000},Date.now()).amount,40*5);
 console.log('PASS: civic projects reserve plots, block mayor builds, cap competing donations and build once; seniority bonus levels.');
 console.log('PASS: Rome midnight and DST resets; three rotating daily missions; linked-account isolation; one active assignment; real avatar destination; timed and single reward claims; expired tasks and next-day availability.');
 console.log('PASS: admin projects; active limit; shared artwork; atomic capped contributions; idempotent request replays; competing final donations; balances and contributor totals; protected targets; persistence and role-specific panels.');
}finally{await mf.dispose();}
