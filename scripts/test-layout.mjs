import {createRequire} from 'node:module';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),w=createRequire(require.resolve('wrangler/package.json'));
const {build}=w('esbuild'),{Miniflare}=w('miniflare');
await build({stdin:{contents:"export * from './lib/town';export * from './lib/city-layout';export * from './lib/roads';export * from './lib/bridges';export {streetRoute} from './lib/simulation';",resolveDir:process.cwd()},bundle:true,packages:'external',platform:'node',format:'cjs',outfile:'.sites-runtime/layout-check.cjs'});
const api=require('../.sites-runtime/layout-check.cjs');
const compiled=await build({stdin:{contents:"import {GET,POST} from './app/api/town/route';export default {fetch(r){return r.method==='POST'?POST(r):GET(r)}}",resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',format:'esm',external:['cloudflare:workers'],define:{'import.meta.env.DEV':'false'}});
const mf=new Miniflare({modules:true,script:compiled.outputFiles[0].text,compatibilityDate:'2026-05-15',d1Databases:['DB'],bindings:{SITE_OWNER_EMAIL:'owner@example.test'},inspectorPort:0});
try{
 const d=await mf.getD1Database('DB');
 for(const f of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort()){
  if(f.startsWith('0017')){
   await d.prepare("INSERT INTO buildings (id,x,y,kind,color) VALUES ('legacy-zoo',5,15,'zoo','#9aadb0')").run();
   for(let x=5;x<=6;x++)for(let y=15;y<=16;y++)await d.prepare('INSERT INTO building_tiles VALUES (?,?,?,?)').bind('legacy-zoo:'+x+','+y,'legacy-zoo',x,y).run();
  }
  if(f.startsWith('0018')){
   await d.prepare("INSERT INTO buildings (id,x,y,kind,color) VALUES ('legacy-stadium',13,7,'stadium','#a1b494')").run();
   for(let x=13;x<=14;x++)for(let y=7;y<=8;y++)await d.prepare('INSERT INTO building_tiles VALUES (?,?,?,?)').bind('legacy-stadium:'+x+','+y,'legacy-stadium',x,y).run();
  }
  for(const sql of (await readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint').filter(s=>s.trim()))await d.prepare(sql).run();
 }
 const call=async(data,headers={})=>{const response=await mf.dispatchFetch('https://game.test/api/town',{method:data?'POST':'GET',headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test',...headers,...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:response.status,data:await response.json()};};
 const ok=async(data)=>{const r=await call(data);assert.equal(r.status,200,JSON.stringify(r));return r.data;};
 let town=await ok();
 const plot=(kind,ignore)=>{const occupied=new Set(town.buildings.filter(b=>b.id!==ignore).flatMap(api.buildingCells).map(c=>api.cellKey(c.x,c.y)));for(let y=1;y<town.size-1;y++)for(let x=1;x<town.size-1;x++)if(api.canPlace(kind,x,y,town.size,occupied,town.roadCuts)&&(kind!=='station'||y===1)&&(kind!=='road'||api.canConnectRoad(x,y,town.size,api.networkRoads(town.buildings,town.roadCuts))))return {x,y};throw Error('No plot for '+kind);};
 const make=async(kind,username)=>{const at=plot(kind);town=await ok({action:'build',kind,...at,username});return town.buildings.find(b=>b.x===at.x&&b.y===at.y);};
 const targetFor=b=>{for(let y=1;y<town.size-1;y++)for(let x=1;x<town.size-1;x++){const target=api.moveTarget(b,x,y,town.size,town.buildings,town.roadCuts);if(target)return {x,y};}throw Error('No destination for '+b.kind);};
 const move=async(b,at=targetFor(b))=>{town=await ok({action:'move',id:b.id,fromX:b.x,fromY:b.y,...at});return town.buildings.find(v=>v.id===b.id);};
 await d.prepare('UPDATE town_settings SET coins=0 WHERE id=1').run();town=await ok();
 const house=await make('cottage','alice'),unitId=town.units.find(u=>u.username==='alice').id;
 await d.prepare("UPDATE residents SET wallet=937,house_decor=3 WHERE username='alice'").run();
 const invite=await ok({action:'invite',username:'alice'}),player={'oai-authenticated-user-id':'player','oai-authenticated-user-email':'player@example.test'};
 assert.equal((await call({action:'claim',token:invite.inviteCode},player)).status,200);
 town=await ok();const moved=await move(house);
 assert.notDeepEqual({x:moved.x,y:moved.y},{x:house.x,y:house.y});assert.equal(moved.username,'alice');assert.equal(town.units.find(u=>u.username==='alice').id,unitId);assert.equal(town.residents.find(r=>r.username==='alice').wallet,937);assert.equal(town.residents.find(r=>r.username==='alice').houseDecor,3);assert.equal((await call(undefined,player)).data.session.self,'alice');
 assert.equal(town.coins,0,'construction and movement need no treasury funds');
 const garden=await make('garden');await d.prepare("INSERT INTO garden_decorations VALUES ('kept-flowers',?,'alice','flowers')").bind(garden.id).run();town=await ok();await move(garden);assert.ok(town.decorations.some(g=>g.id==='kept-flowers'&&g.gardenId===garden.id));
 const apartment=town.buildings.find(b=>b.kind==='apartment');const units=town.units.filter(u=>u.buildingId===apartment.id).map(u=>u.id);await move(apartment);assert.deepEqual(town.units.filter(u=>u.buildingId===apartment.id).map(u=>u.id),units);
 const road=await make('road');await move(road);assert.equal(town.buildings.find(b=>b.id===road.id).kind,'road');
 const oldBase={x:4,y:10},at={x:5,y:13};town=await ok({action:'move',id:api.baseRoadId(oldBase.x,oldBase.y),fromX:oldBase.x,fromY:oldBase.y,...at});assert.ok(town.roadCuts.some(c=>c.x===4&&c.y===10));
 const network=api.networkRoads(town.buildings,town.roadCuts);assert.ok(!api.roadCells(town.size,network).has('4,10'));assert.ok(api.roadCells(town.size,network).has('5,13'));assert.ok(!api.streetRoute({x:4,y:9},{x:4,y:11},town.size,network).some(c=>c.x===4&&c.y===10),'residents use the new layout');
 town=await ok({action:'build',kind:'cottage',x:4,y:10});assert.ok(town.buildings.some(b=>b.kind==='cottage'&&b.x===4&&b.y===10),'vacated base road is buildable');
 assert.equal(api.buildingCells(town.buildings.find(b=>b.id==='legacy-stadium')).length,4,'migration preserves old stadium occupancy');const legacy=town.buildings.find(b=>b.id==='legacy-zoo');assert.equal(api.buildingCells(legacy).length,4,'migration preserves old zoo occupancy');await move(legacy);assert.equal(api.buildingCells(town.buildings.find(b=>b.id===legacy.id)).length,9,'moving an old zoo upgrades it to nine lots');
 const amusement=await make('amusement');assert.equal(api.buildingCells(amusement).length,9);assert.equal((await d.prepare('SELECT COUNT(*) AS n FROM building_tiles WHERE building_id=?').bind(amusement.id).first()).n,9);
 const station=town.buildings.find(b=>b.kind==='station');assert.equal((await call({action:'move',id:station.id,fromX:station.x,fromY:station.y,x:2,y:10})).status,400);
 const actual=town.buildings.find(b=>b.id===house.id);const moveRequest={action:'move',id:actual.id,fromX:actual.x,fromY:actual.y,...targetFor(actual)};
 assert.equal((await call(moveRequest,player)).status,403);assert.equal((await call({...moveRequest,view:'player'})).status,403);assert.equal((await call({...moveRequest,fromX:999})).status,409);
 assert.equal((await call({...moveRequest,x:amusement.x,y:amusement.y})).status,400);assert.equal((await call({...moveRequest,x:-1,y:2})).status,400);
 let bridgeAt;for(let y=1;y<town.size-1&&!bridgeAt;y++)for(let x=1;x<town.size-1;x++)if(api.planBridge(x,y,town.size,town.buildings,town.roadCuts)){bridgeAt={x,y};break;}
 assert.ok(bridgeAt);town=await ok({action:'build',kind:'bridge',...bridgeAt});const bridge=town.buildings.find(b=>b.kind==='bridge');await move(bridge);assert.ok(api.bridgeEnds(town.buildings.find(b=>b.id===bridge.id)).every(c=>api.roadCells(town.size,api.networkRoads(town.buildings,town.roadCuts)).has(api.cellKey(c.x,c.y))));
 const a=await make('tree'),b=await make('tree'),destination=plot('tree');
 const results=await Promise.all([call({action:'move',id:a.id,fromX:a.x,fromY:a.y,...destination}),call({action:'move',id:b.id,fromX:b.x,fromY:b.y,...destination})]);assert.equal(results.filter(r=>r.status===200).length,1);assert.ok(results.every(r=>[200,400,409].includes(r.status)));town=await ok();assert.equal(town.buildings.filter(b=>b.x===destination.x&&b.y===destination.y).length,1);assert.equal(town.buildings.filter(v=>v.id===a.id||v.id===b.id).length,2);
 for(const b of town.buildings){const n=await d.prepare('SELECT COUNT(*) AS n FROM building_tiles WHERE building_id=?').bind(b.id).first();assert.equal(n.n,api.buildingCells(b).length,'atomic occupied tiles for '+b.id);}
 town=await ok({action:'remove',id:a.id});assert.equal(town.coins,0,'free constructions never generate demolition refunds');
 console.log('PASS: free admin construction at zero funds; linked occupied homes and wallets preserved; apartment units and garden decor preserved; movable initial and custom roads; persistent road cuts and updated routes; bridge endpoints and station row protected; nine-lot zoo/amusement; safe legacy upgrade; authorization, stale positions, collisions, concurrent moves, atomic tile integrity and no refund farming.');
}finally{await mf.dispose();}
