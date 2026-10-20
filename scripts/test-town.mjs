import {createRequire} from 'node:module';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const {build}=wranglerRequire('esbuild'),{Miniflare}=wranglerRequire('miniflare');
const built=await build({stdin:{contents:"import {GET,POST} from './app/api/town/route.ts'; export default {fetch(request){return request.method==='POST'?POST(request):GET(request);}}",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers'],define:{'import.meta.env.DEV':'false'}});
const mf=new Miniflare({modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-05-15',d1Databases:['DB'],bindings:{SITE_OWNER_EMAIL:'owner@example.test'},inspectorPort:0});
try{
 const d=await mf.getD1Database('DB');
 const migrations=(await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort();
 for(let i=0;i<migrations.length;i++){
  const sql=await readFile('drizzle/'+migrations[i],'utf8');for(const statement of sql.split('--> statement-breakpoint'))if(statement.trim())await d.prepare(statement.trim()).run();
  if(i===9)await d.prepare("INSERT INTO residents (username,wallet,job,paid_at,avatar) VALUES ('migration_worker',200,'barista',?,'#76938b')").bind(Date.now()-125000).run();
  if(i===0){await d.prepare("INSERT INTO town_settings (id,name,coins) VALUES (1,'Città conservata',777)").run();await d.prepare("INSERT INTO buildings (id,x,y,kind,username,color) VALUES ('legacy',2,2,'cottage','vecchio_vicino','#76938b')").run();}
 }
 const migratedWorker=await d.prepare("SELECT wallet,pay_credit FROM residents WHERE username='migration_worker'").first();assert.equal(migratedWorker.wallet,256,'already earned old wages preserved once');assert.equal(migratedWorker.pay_credit,0);
 const GAME_WEEK_MS=21*3600000;
 const call=async(body,headers={})=>{const r=await mf.dispatchFetch('https://game.test/api/town',{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':'site-scoped-owner-id','oai-authenticated-user-email':'owner@example.test',...(body?{'Content-Type':'application/json'}:{}),...headers},...body?{body:JSON.stringify(body)}:{}});return {status:r.status,data:await r.json()};};
 const action=async(body)=>{const r=await call(body);assert.equal(r.status,200,JSON.stringify(r));return r.data;};
 let t=(await call()).data;assert.equal(t.name,'Città conservata');assert.equal(t.session.canAdmin,true,'Site-scoped owner bootstrapped');assert.equal((await d.prepare('SELECT admin_user_id AS id FROM town_settings WHERE id=1').first()).id,'site-scoped-owner-id');assert.equal(t.coins,6777);assert.equal(t.buildings.length,27);assert.equal(t.residents[0].wallet,200);assert.equal(t.buildings.filter(b=>b.kind==='station').length,2);assert.equal(t.buildings.find(b=>b.id==='legacy').username,'vecchio_vicino');
 t=(await call()).data;assert.equal(t.coins,6777,'expansion grant occurs once');
 t=await action({action:'rename',name:'Vita di quartiere'});assert.equal(t.name,'Vita di quartiere');
 t=await action({action:'build',x:1,y:1,kind:'cottage',username:'secondo_vicino'});assert.equal(t.coins,6777);assert.equal(t.residents.length,2);assert.equal(t.residents.find(r=>r.username==='secondo_vicino').wallet,200);
 let r=await call({action:'build',x:1,y:1,kind:'cottage'});assert.equal(r.status,409);assert.equal((await call()).data.coins,6777);
 r=await call({action:'assign',id:'legacy',username:'secondo_vicino'});assert.equal(r.status,409);
 for(const cell of [{x:4,y:1},{x:12,y:5},{x:7,y:14},{x:9,y:21}])assert.equal((await call({action:'build',...cell,kind:'cottage'})).status,400);
 assert.equal((await call({action:'build',x:13,y:5,kind:'station'})).status,400);
 assert.equal((await call({action:'assign',id:'legacy',username:'bad name!'})).status,400);
 assert.equal((await call({action:'rename',name:'Hacked'},{'oai-authenticated-user-id':''})).status,401);
 assert.equal((await call({action:'rename',name:'Hacked'},{origin:'https://other.test'})).status,403);
 t=await action({action:'apply',username:'vecchio_vicino',job:'driver'});assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').candidate,'driver');assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').job,null);
 t=await action({action:'approve',username:'vecchio_vicino'});assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').job,'driver');assert.equal((await call({action:'collect',username:'vecchio_vicino'})).status,400);
 await d.prepare('UPDATE residents SET paid_at=? WHERE username=?').bind(Date.now()-GAME_WEEK_MS,'vecchio_vicino').run();const treasury=(await call()).data.coins;
 const claims=await Promise.all([call({action:'collect',username:'vecchio_vicino'}),call({action:'collect',username:'vecchio_vicino'})]);assert.equal(claims.filter(r=>r.status===200).length,1);t=(await call()).data;assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').wallet,370,'200 gross minus the 15% civic tax');assert.equal(t.coins,treasury+30,'tax reaches the treasury once');
 await d.prepare('UPDATE residents SET paid_at=? WHERE username=?').bind(Date.now()-100*GAME_WEEK_MS,'vecchio_vicino').run();t=await action({action:'collect',username:'vecchio_vicino'});assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').wallet,574,'offline income capped at seven virtual days, paid with the 40-hour seniority bonus, net of tax');assert.equal(t.coins,treasury+30+36);assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').jobMs,80*450000,'collections accumulate worked time');
 await d.prepare('UPDATE residents SET wallet=620 WHERE username=?').bind('vecchio_vicino').run();
 assert.equal((await call({action:'buy',username:'secondo_vicino',item:'car-upgrade'})).status,400);
 t=await action({action:'buy',username:'vecchio_vicino',item:'car'});assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').carLevel,1);assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').wallet,270);
 assert.equal((await call({action:'buy',username:'vecchio_vicino',item:'car'})).status,400);assert.equal((await call()).data.residents.find(r=>r.username==='vecchio_vicino').wallet,270);
 const buys=await Promise.all([call({action:'buy',username:'vecchio_vicino',item:'flower-box'}),call({action:'buy',username:'vecchio_vicino',item:'flower-box'})]);assert.equal(buys.filter(r=>r.status===200).length,1);t=(await call()).data;assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').wallet,180);assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').houseDecor,1);
 const garden=t.buildings.find(b=>b.kind==='garden');t=await action({action:'contribute',username:'vecchio_vicino',gardenId:garden.id,item:'flowers'});assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').wallet,140);assert.equal(t.decorations.length,1);assert.equal(t.decorations[0].username,'vecchio_vicino');
 assert.equal((await call({action:'contribute',username:'secondo_vicino',gardenId:garden.id,item:'flowers'})).status,400);assert.equal((await call()).data.residents.find(r=>r.username==='secondo_vicino').wallet,200);
 assert.equal((await call({action:'remove',id:garden.id})).status,400,'donated gardens protected');
 await d.prepare('UPDATE residents SET wallet=1500 WHERE username=?').bind('vecchio_vicino').run();t=await action({action:'buy',username:'vecchio_vicino',item:'car-upgrade'});assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').carLevel,2);t=await action({action:'buy',username:'vecchio_vicino',item:'villa-upgrade'});assert.equal(t.buildings.find(b=>b.id==='legacy').kind,'villa');assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').wallet,50);
 t=await action({action:'avatar',username:'vecchio_vicino',color:'#b89ac0'});assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').avatar,'#b89ac0');
 await action({action:'apply',username:'secondo_vicino',job:'teacher'});await action({action:'reject',username:'secondo_vicino'});assert.equal((await call()).data.residents.find(r=>r.username==='secondo_vicino').candidate,null);
 assert.equal((await call({action:'remove',id:'legacy'})).status,400);
 await action({action:'assign',id:'legacy',username:''});assert.ok(!(await call()).data.residents.some(r=>r.username==='vecchio_vicino'));
 t=await action({action:'assign',id:'legacy',username:'vecchio_vicino'});assert.equal(t.residents.find(r=>r.username==='vecchio_vicino').wallet,50,'wallet survives unassignment');
 // Fill the teacher role; simultaneous approvals must respect the last vacancy.
 for(const [i,user]of ['alice','bruno','carla'].entries())await action({action:'build',x:14+i,y:3,kind:'cottage',username:user});
 for(const user of ['alice','bruno','carla'])await action({action:'apply',username:user,job:'teacher'});
 await action({action:'approve',username:'alice'});const hired=await Promise.all([call({action:'approve',username:'bruno'}),call({action:'approve',username:'carla'})]);assert.deepEqual(hired.map(r=>r.status).sort(),[200,409]);
 const school=(await call()).data.buildings.find(b=>b.kind==='school');assert.equal((await call({action:'remove',id:school.id})).status,400,'cannot remove occupied employer');

 // Real roles: a player account can only mutate its own linked resident.
 const playerHeaders={'oai-authenticated-user-id':'player-account-1','oai-authenticated-user-email':'player@example.test'};
 for(const action of ['rename','build','assign','remove','expand','approve','invite'])assert.equal((await call({action,username:'secondo_vicino',role:'admin',view:'admin'},playerHeaders)).status,403,'player cannot '+action);
 assert.equal((await call({action:'rename',name:'Forbidden',view:'player'})).status,403,'admin preview has player menu semantics');
 let invitation=await action({action:'invite',username:'secondo_vicino'});assert.match(invitation.inviteCode,/^[a-f0-9]{64}$/);
 assert.equal((await call({action:'apply',username:'secondo_vicino',job:'barista'},playerHeaders)).status,403,'unlinked account has no character');
 let claim=await call({action:'claim',token:invitation.inviteCode},playerHeaders);assert.equal(claim.status,200);assert.equal(claim.data.session.self,'secondo_vicino');assert.equal(claim.data.session.canAdmin,false);assert.ok(!claim.data.linkedResidents.length,'players cannot inspect account links');
 assert.equal((await call({action:'claim',token:invitation.inviteCode},{'oai-authenticated-user-id':'player-account-2'})).status,400,'one-time code consumed');
 assert.equal((await call({action:'avatar',username:'vecchio_vicino',color:'#d88162'},playerHeaders)).status,403,'cannot act on another resident');
 assert.equal((await call({action:'avatar',username:'secondo_vicino',color:'#d88162'},playerHeaders)).status,200);
 assert.equal((await call({action:'paint',username:'secondo_vicino',color:'#b89ac0'},playerHeaders)).status,200);
 const linkedHouse=(await call()).data.buildings.find(b=>b.username==='secondo_vicino');assert.equal((await call({action:'assign',id:linkedHouse.id,username:''})).status,400,'bound home cannot be reassigned');
 invitation=await action({action:'invite',username:'alice'});assert.equal((await call({action:'claim',token:invitation.inviteCode},playerHeaders)).status,409,'one account cannot claim two residents');
 const older=await action({action:'invite',username:'bruno'}),newer=await action({action:'invite',username:'bruno'});assert.equal((await call({action:'claim',token:older.inviteCode},{'oai-authenticated-user-id':'player-account-3'})).status,400,'renewing invitation invalidates old code');
 await d.prepare('UPDATE resident_invites SET expires=0 WHERE username=?').bind('bruno').run();assert.equal((await call({action:'claim',token:newer.inviteCode},{'oai-authenticated-user-id':'player-account-3'})).status,400,'expired invitation denied');
 assert.equal((await call({action:'build',x:25,y:5,kind:'tree'})).status,400,'land locked before expansion');
 const expanded=await Promise.all([call({action:'expand',expectedSize:24}),call({action:'expand',expectedSize:24})]);assert.equal(expanded.filter(r=>r.status===200).length,1);t=(await call()).data;assert.equal(t.size,32);
 await action({action:'build',x:25,y:5,kind:'tree'});assert.equal((await call({action:'build',x:28,y:5,kind:'cottage'})).status,400,'new roads protected');
 const beforeLow=(await call()).data.coins;await d.prepare('UPDATE town_settings SET coins=10 WHERE id=1').run();assert.equal((await call({action:'expand',expectedSize:32})).status,400);assert.equal((await call()).data.size,32);await d.prepare('UPDATE town_settings SET coins=? WHERE id=1').bind(beforeLow).run();
 t=await action({action:'expand',expectedSize:32});assert.equal(t.size,40);assert.equal((await call({action:'expand',expectedSize:40})).status,400,'bounded expansion');
 await d.prepare('UPDATE town_settings SET coins=120 WHERE id=1').run();const simultaneous=await Promise.all([call({action:'build',x:1,y:4,kind:'cottage'}),call({action:'build',x:1,y:5,kind:'cottage'})]);assert.equal(simultaneous.filter(x=>x.status===200).length>=1,true);for(const result of simultaneous)assert.ok([200,409].includes(result.status));assert.equal((await call()).data.coins,120);
 // Apartments: independent occupancy, lower price, secure links and atomic moves.
 await d.prepare('UPDATE town_settings SET coins=5000 WHERE id=1').run();
 t=(await call()).data;const palazzo=t.buildings.find(b=>b.kind==='apartment'),apartments=t.units.filter(u=>u.buildingId===palazzo.id);
 assert.equal(apartments.length,6);assert.equal(palazzo.username,null);assert.equal(t.units.find(u=>u.id==='legacy').username,'vecchio_vicino');
 for(let i=0;i<6;i++)await action({action:'assign',id:apartments[i].id,username:'inquilino_'+i,color:'#b89ac0'});
 t=(await call()).data;assert.equal(t.units.filter(u=>u.buildingId===palazzo.id&&u.username).length,6);assert.equal(t.buildings.find(b=>b.id===palazzo.id).username,null);
 assert.equal((await call({action:'assign',id:'legacy',username:'inquilino_1'})).status,409,'one home across both types');
 const funds=t.coins;assert.equal((await call({action:'build',x:31,y:3,kind:'apartment',username:'inquilino_1'})).status,409);assert.equal((await call()).data.coins,funds,'failed construction rolls treasury back');
 assert.equal((await call({action:'remove',id:palazzo.id})).status,400,'occupied palazzo protected');
 await action({action:'paint',username:'inquilino_0',color:'#8aabc1'});t=(await call()).data;assert.equal(t.units.find(u=>u.username==='inquilino_0').color,'#8aabc1');assert.equal(t.units.find(u=>u.username==='inquilino_1').color,'#b89ac0');
 for(const item of ['pool','pergola'])assert.equal((await call({action:'buy',username:'inquilino_0',item})).status,400);
 invitation=await action({action:'invite',username:'inquilino_1'});const apartmentPlayer={'oai-authenticated-user-id':'apartment-player','oai-authenticated-user-email':'apt@example.test'};assert.equal((await call({action:'claim',token:invitation.inviteCode},apartmentPlayer)).data.session.self,'inquilino_1');assert.equal((await call({action:'assign',id:apartments[1].id,username:''})).status,400);
 assert.equal((await call({action:'apply',username:'inquilino_1',job:'barista'},apartmentPlayer)).status,200);
 await d.prepare('UPDATE residents SET wallet=1000 WHERE username=?').bind('inquilino_0').run();
 t=await action({action:'buy',username:'inquilino_0',item:'villa-upgrade'});assert.equal(t.residents.find(r=>r.username==='inquilino_0').wallet,100);assert.equal(t.buildings.find(b=>b.id===palazzo.id).kind,'apartment');assert.equal(t.units.find(u=>u.id===apartments[0].id).username,null);assert.equal(t.units.find(u=>u.username==='inquilino_1').buildingId,palazzo.id);assert.equal(t.buildings.find(b=>b.id===t.units.find(u=>u.username==='inquilino_0').buildingId).kind,'villa');
 await d.prepare('UPDATE residents SET wallet=300 WHERE username=?').bind('secondo_vicino').run();
 const oldHouse=t.units.find(u=>u.username==='secondo_vicino').id;
 const transfers=await Promise.all([call({action:'buy',username:'secondo_vicino',item:'apartment-move'},playerHeaders),call({action:'buy',username:'secondo_vicino',item:'apartment-move'},playerHeaders)]);assert.equal(transfers.filter(r=>r.status===200).length,1);
 t=(await call()).data;assert.equal(t.residents.find(r=>r.username==='secondo_vicino').wallet,0);assert.equal(t.units.find(u=>u.id===oldHouse).username,null);assert.equal(t.units.filter(u=>u.username==='secondo_vicino').length,1);assert.equal(t.session.canAdmin,true);assert.equal((await call(null,playerHeaders)).data.session.self,'secondo_vicino','account follows resident after moving');
 t=await action({action:'build',x:30,y:3,kind:'apartment'});const emptyPalazzo=t.buildings.find(b=>b.x===30&&b.y===3);await action({action:'remove',id:emptyPalazzo.id});assert.equal((await call()).data.units.filter(u=>u.buildingId===emptyPalazzo.id).length,0,'empty building deletion cascades units');
 t=await action({action:'build',x:31,y:3,kind:'apartment',username:'nuovo_inquilino'});const builtPalazzo=t.buildings.find(b=>b.x===31&&b.y===3);assert.equal(t.units.filter(u=>u.buildingId===builtPalazzo.id).length,6);assert.equal(t.units.filter(u=>u.buildingId===builtPalazzo.id&&u.username).length,1);
 // New services and real road construction.
 t=(await call()).data;assert.equal(t.buildings.filter(b=>b.kind==='bank').length,1);assert.equal(t.buildings.filter(b=>b.kind==='office').length,1);
 await d.prepare('UPDATE town_settings SET coins=5000 WHERE id=1').run();
 const beforeServices=(await call()).data.coins;
 t=await action({action:'build',x:30,y:9,kind:'bank'});assert.equal(t.coins,beforeServices);
 t=await action({action:'build',x:31,y:9,kind:'office'});assert.equal(t.coins,beforeServices);
 t=await action({action:'apply',username:'inquilino_2',job:'banker'});assert.equal(t.residents.find(r=>r.username==='inquilino_2').candidate,'banker');t=await action({action:'approve',username:'inquilino_2'});assert.equal(t.residents.find(r=>r.username==='inquilino_2').job,'banker');
 await d.prepare('UPDATE residents SET paid_at=? WHERE username=?').bind(Date.now()-GAME_WEEK_MS,'inquilino_2').run();const bankWallet=t.residents.find(r=>r.username==='inquilino_2').wallet;t=await action({action:'collect',username:'inquilino_2'});assert.equal(t.residents.find(r=>r.username==='inquilino_2').wallet,bankWallet+136,'160 gross minus the civic tax');
 await action({action:'apply',username:'inquilino_3',job:'employee'});t=await action({action:'approve',username:'inquilino_3'});assert.equal(t.residents.find(r=>r.username==='inquilino_3').job,'employee');
 assert.equal((await call({action:'build',x:32,y:10,kind:'road'})).status,400,'isolated road denied');
 const beforeRoads=(await call()).data.coins;
 t=await action({action:'build',x:29,y:10,kind:'road'});assert.equal(t.coins,beforeRoads);const firstRoad=t.buildings.find(b=>b.x===29&&b.y===10);
 t=await action({action:'build',x:30,y:10,kind:'road'});assert.equal(t.coins,beforeRoads);const branch=t.buildings.find(b=>b.x===30&&b.y===10);
 assert.equal((await call({action:'build',x:29,y:10,kind:'cottage'})).status,409,'roads cannot be overwritten by buildings');
 assert.equal((await call({action:'remove',id:firstRoad.id})).status,400,'road connection protected');
 assert.equal((await call({action:'build',x:31,y:11,kind:'road'},playerHeaders)).status,403,'players cannot build roads');
 t=await action({action:'remove',id:branch.id});assert.equal(t.coins,beforeRoads);t=await action({action:'remove',id:firstRoad.id});assert.equal(t.coins,beforeRoads);
 // Employer capacity protection applies to the new services too.
 const banks=t.buildings.filter(b=>b.kind==='bank');await action({action:'remove',id:banks[0].id});assert.equal((await call({action:'remove',id:banks[1].id})).status,400,'last bank with employees protected');
 // Landmarks reserve every plot, preserve old data, and expose their jobs.
 await d.prepare('UPDATE town_settings SET coins=30000 WHERE id=1').run();
 const legacyTiles=await d.prepare("SELECT COUNT(*) AS total FROM building_tiles WHERE building_id='legacy'").first();assert.equal(legacyTiles.total,1);
 const landmarks=[['mall',29,10,850,'sales-assistant',120],['stadium',22,8,1200,'stadium-staff',120],['zoo',29,16,1000,'zookeeper',160],['amusement',33,16,1400,'ride-operator',120],['hospital',30,24,1100,'doctor',240],['sports',33,24,720,'coach',160],['cinema',32,19,480,'cinema-staff',120],['museum',32,18,560,'museum-guide',160],['firestation',30,26,650,'firefighter',200],['police',33,26,600,'officer',200]];
 for(const [kind,x,y,price,job,wage]of landmarks){const before=(await call()).data.coins;t=await action({action:'build',kind,x,y});assert.equal(t.coins,before);const b=t.buildings.find(b=>b.x===x&&b.y===y),tiles=await d.prepare('SELECT COUNT(*) AS total FROM building_tiles WHERE building_id=?').bind(b.id).first();assert.equal(tiles.total,kind==='stadium'?25:['zoo','amusement'].includes(kind)?9:['mall','hospital','sports'].includes(kind)?4:1);await action({action:'apply',username:'inquilino_4',job});await action({action:'approve',username:'inquilino_4'});const wallet=(await call()).data.residents.find(r=>r.username==='inquilino_4').wallet;await d.prepare('UPDATE residents SET paid_at=? WHERE username=?').bind(Date.now()-GAME_WEEK_MS,'inquilino_4').run();t=await action({action:'collect',username:'inquilino_4'});assert.equal(t.residents.find(r=>r.username==='inquilino_4').wallet,wallet+wage-Math.floor(wage*.15),'salary net of the civic tax');}
 assert.equal(t.buildings.find(b=>b.kind==='mall'&&b.x===29).color,'#9aadb0','landmark color matches catalog preview');
 const reservedFunds=t.coins;
 assert.equal((await call({action:'build',kind:'cottage',x:30,y:11})).status,409,'non-origin landmark tile reserved');assert.equal((await call()).data.coins,reservedFunds);
 assert.equal((await call({action:'build',kind:'mall',x:35,y:31})).status,400,'whole footprint avoids roads');assert.equal((await call({action:'build',kind:'stadium',x:38,y:31})).status,400,'whole footprint respects bounds');
 const contested=await Promise.all([call({action:'build',kind:'mall',x:37,y:31}),call({action:'build',kind:'hospital',x:37,y:32})]);assert.deepEqual(contested.map(r=>r.status).sort(),[200,409],'overlapping footprints are atomic');const winner=contested.find(r=>r.status===200).data.buildings.find(b=>b.x===37&&(b.y===31||b.y===32));assert.equal((await call()).data.coins,reservedFunds,'failed footprint spends no money');
 const mall=(await call()).data.buildings.find(b=>b.kind==='mall'&&b.x===29);await action({action:'remove',id:mall.id});assert.equal((await d.prepare('SELECT COUNT(*) AS total FROM building_tiles WHERE building_id=?').bind(mall.id).first()).total,0,'deleting landmark frees all plots');await action({action:'build',kind:'cottage',x:30,y:11});
 const police=(await call()).data.buildings.find(b=>b.kind==='police');assert.equal((await call({action:'remove',id:police.id})).status,400,'new occupied employer protected');
 assert.equal((await call({action:'build',kind:'zoo',x:37,y:34},playerHeaders)).status,403,'landmarks are admin only');
 // Complete bridges span the clear gap and reserve every intermediate lot.
 assert.equal((await call({action:'build',kind:'bridge',x:1,y:1})).status,400,'bridge requires roads at both ends');
 const bridgeFunds=(await call()).data.coins;t=await action({action:'build',kind:'bridge',x:13,y:24});const span=t.buildings.find(b=>b.kind==='bridge'&&b.x===13&&b.y===24);assert.equal(span.bridgeAxis,'x');assert.equal(span.bridgeSpan,7);assert.equal(t.coins,bridgeFunds);assert.equal((await d.prepare('SELECT COUNT(*) AS n FROM building_tiles WHERE building_id=?').bind(span.id).first()).n,7);
 assert.equal((await call({action:'build',kind:'road',x:14,y:24})).status,409,'bridge span cannot be overwritten');assert.equal((await call({action:'build',kind:'road',x:16,y:25})).status,400,'bridge has no side entrance');assert.equal((await call()).data.coins,bridgeFunds,'invalid span edits spend nothing');
 await action({action:'remove',id:span.id});assert.equal((await d.prepare('SELECT COUNT(*) AS n FROM building_tiles WHERE building_id=?').bind(span.id).first()).n,0,'removal frees the entire span');
 await action({action:'build',kind:'road',x:29,y:32});t=await action({action:'build',kind:'bridge',x:30,y:32});const rampBridge=t.buildings.find(b=>b.x===30&&b.y===32);assert.equal(rampBridge.bridgeAxis,'x');assert.equal(rampBridge.bridgeSpan,6);
 const endpoint=t.buildings.find(b=>b.kind==='road'&&b.x===29&&b.y===32);assert.equal((await call({action:'remove',id:endpoint.id})).status,400,'both bridge endpoints stay connected');assert.equal((await call()).data.buildings.find(b=>b.id===rampBridge.id).bridgeSpan,6,'span survives reload');
 await action({action:'build',kind:'road',x:25,y:22});t=await action({action:'build',kind:'bridge',x:25,y:23});assert.equal(t.buildings.find(b=>b.x===25&&b.y===23).bridgeAxis,'y');assert.equal(t.buildings.find(b=>b.x===25&&b.y===23).bridgeSpan,6);
 await action({action:'build',kind:'cottage',x:17,y:25});await action({action:'build',kind:'cottage',x:16,y:24});await action({action:'build',kind:'road',x:17,y:22});await action({action:'build',kind:'road',x:17,y:23});const beforeBlocked=(await call()).data.coins;assert.equal((await call({action:'build',kind:'bridge',x:17,y:24})).status,400,'blocked spans cannot be built');assert.equal((await call()).data.coins,beforeBlocked);
 // Switching jobs and collecting preserves fractional coins from the old wage.
 await d.prepare('UPDATE residents SET paid_at=?,pay_credit=225000 WHERE username=?').bind(Date.now(),'inquilino_4').run();await action({action:'apply',username:'inquilino_4',job:'barista'});t=await action({action:'approve',username:'inquilino_4'});const changedWorker=t.residents.find(r=>r.username==='inquilino_4');assert.equal(changedWorker.job,'barista');assert.ok(changedWorker.payCredit>=225000&&changedWorker.payCredit<450000,'fractional earnings survive job change');
 await d.prepare('UPDATE residents SET paid_at=? WHERE username=?').bind(Date.now()-GAME_WEEK_MS,'inquilino_4').run();t=await action({action:'collect',username:'inquilino_4'});assert.equal(t.residents.find(r=>r.username==='inquilino_4').wallet,changedWorker.wallet+102,'120 gross minus the civic tax');assert.ok(t.residents.find(r=>r.username==='inquilino_4').payCredit>=225000,'fractional earnings survive payout');
 // Civic services: unique municipality, official notices and resident posts.
 assert.equal((await call({action:'board-post',buildingId:'missing',title:'Avviso',body:'Messaggio'})).status,400);
 const beforeHall=(await call()).data.coins;t=await action({action:'build',kind:'townhall',x:22,y:31});const hall=t.buildings.find(b=>b.kind==='townhall');assert.equal(t.coins,beforeHall);assert.equal((await d.prepare('SELECT COUNT(*) AS n FROM building_tiles WHERE building_id=?').bind(hall.id).first()).n,4);assert.equal((await call({action:'build',kind:'townhall',x:25,y:31})).status,400);
 assert.equal((await call({action:'board-post',buildingId:hall.id,title:'x',body:'Messaggio'})).status,400);
 t=await action({action:'board-post',buildingId:hall.id,title:'Avviso del Comune',body:'Benvenuti al municipio.',pinned:true});const official=t.boardMessages[0];assert.equal(official.official,true);assert.equal(official.pinned,true);assert.equal(official.authorLabel,'Amministrazione');assert.ok(!('authorUserId' in official),'account identifiers are not exposed');
 const visitor={'oai-authenticated-user-id':'visitor','oai-authenticated-user-email':'visitor@example.test'};assert.equal((await call({action:'board-post',buildingId:hall.id,title:'Un messaggio',body:'Ciao',username:'secondo_vicino'},visitor)).status,403);
 let playerPost=await call({action:'board-post',buildingId:hall.id,title:'Giardino comune',body:'Incontriamoci al parco!',pinned:true,official:true,username:'vecchio_vicino'},playerHeaders);assert.equal(playerPost.status,200);const message=playerPost.data.boardMessages.find(m=>!m.official);assert.equal(message.authorLabel,'@secondo_vicino','author comes from the linked account');assert.equal(message.pinned,false,'players cannot mark messages official or pin them');
 assert.equal((await call({action:'board-pin',id:message.id,pinned:true},playerHeaders)).status,403);assert.equal((await call({action:'board-delete',id:official.id},playerHeaders)).status,403);assert.equal((await call({action:'board-delete',id:message.id},apartmentPlayer)).status,403);assert.equal((await call({action:'remove',id:hall.id})).status,400,'board messages protect the municipality');
 t=await action({action:'board-pin',id:message.id,pinned:true});assert.equal(t.boardMessages.find(m=>m.id===message.id).pinned,true);assert.equal((await call({action:'board-delete',id:message.id},playerHeaders)).status,200,'players can delete their own posts');await action({action:'board-delete',id:official.id});t=await action({action:'remove',id:hall.id});assert.equal(t.boardMessages.length,0);
 console.log('PASS: unique four-lot town hall, official and citizen posts, pinned notices, persisted messages, linked authors, ownership checks and protected demolition.');
 console.log('PASS: complete spans in both axes, atomic multi-lot occupancy, protected endpoints, persistent length, blocked spans and balances.');
 console.log('PASS: ten new landmarks and jobs; four-plot occupancy; overlap and boundary validation; atomic competing footprints; complete plot release; bridge road connections; role and employer protections.');
 console.log('PASS: bank and office services persist; new jobs and wages; connected road building; road occupancy and permissions; branch protection and free construction/removal.');
 console.log('PASS: apartments have six independent units; duplicate homes rejected across building types; balcony colors isolated; account links preserved; occupied buildings protected; apartment purchase300 vs villa900; simultaneous moves charge once; empty palazzo deletion cascades.');
 console.log('PASS: migration preserves old town; expansion once; new residents; auth and validation; road and rail rules; applications and capacity; concurrent payroll, offline cap, purchases and donations; persistent upgrades and wallets; protected community spaces; account linking, role permissions and cross-resident isolation; one-time and expiring invitations; bounded atomic expansion; concurrent free construction.');
}finally{await mf.dispose();}
