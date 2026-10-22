import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{build}=createRequire(require.resolve('wrangler/package.json'))('esbuild');
const code=(await build({stdin:{contents:"export * from './lib/railway';export {prepareResident,sampleResident,simulationIndex,driveSpan,CAR_LANE} from './lib/simulation';export {roadCells} from './lib/roads';",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'neutral'})).outputFiles[0].text;
const api=await import('data:text/javascript,'+encodeURIComponent(code));

// Trips: one per dead end, each starting at the west end of the main line and running cell to cell.
const branch=[{x:5,y:1},{x:5,y:2},{x:6,y:2}],trips=api.trainTrips(24,branch);
assert.equal(trips.length,2,'main line end and branch end');
for(const trip of trips){assert.deepEqual(trip[0],{x:0,y:0});trip.slice(1).forEach((c,i)=>assert.equal(Math.abs(c.x-trip[i].x)+Math.abs(c.y-trip[i].y),1,'adjacent cells'));}
assert.ok(trips.some(t=>t.at(-1).x===6&&t.at(-1).y===2)&&trips.some(t=>t.at(-1).x===23&&t.at(-1).y===0));
assert.equal(api.connectedRails(branch).size,3);assert.equal(api.connectedRails([{x:5,y:1},{x:6,y:2}]).size,1,'a gap orphans the far piece');
assert.ok(api.railConnects(9,1,[])&&api.railConnects(6,3,branch)&&!api.railConnects(8,4,branch));

// Timetable: the train reaches every track cell, stops at stations, and moves continuously with no jumps.
const table=api.trainTimetable(24,branch,[{x:14,y:1}]),visited=new Set();let prev=null,stopped=0;
for(let t=0;t<table.cycleMs;t+=100){const cars=api.trainFrame(table,t);assert.equal(cars.length,3);for(const c of cars)visited.add(Math.round(c.x)+','+Math.round(c.y));if(prev){for(let k=0;k<3;k++)assert.ok(Math.hypot(cars[k].x-prev[k].x,cars[k].y-prev[k].y)<.4,'smooth at '+t);if(cars[0].x===prev[0].x&&cars[0].y===prev[0].y&&Math.round(cars[0].x)===14&&cars[0].y===0)stopped++;}assert.equal(cars.filter(c=>c.lead).length,1,'one locomotive');prev=cars;}
for(const c of branch)assert.ok(visited.has(c.x+','+c.y),'train runs over '+c.x+','+c.y);assert.ok(stopped>10,'pauses at the station');
assert.equal(api.trainFrame({legs:[],cycleMs:0},0),null);

// Cars: on screen only along streets, in the right-hand lane.
const buildings=[{id:'h',x:2,y:2,kind:'cottage',username:'ada',color:'#fff'},{id:'w',x:9,y:9,kind:'cafe',username:null,color:'#fff'},{id:'r',x:1,y:1,kind:'road',username:null,color:'#fff'}],index=api.simulationIndex(buildings),plan=api.prepareResident({username:'ada',job:'barista',carLevel:1,paidAt:0,wallet:0,candidate:null,avatar:'#fff',houseDecor:0,pendingPay:0},index,24),streets=api.roadCells(24,index.roads);
const stage=plan.stages[0],cycle={...plan,weekendStages:undefined,offset:0};assert.ok(stage.car&&stage.drive,'commute by car');let drove=0,inLane=0;
for(let t=0;t<stage.travelMs;t+=50){const f=api.sampleResident(cycle,t);if(!f.car)continue;drove++;const i=Math.min(stage.path.length-2,Math.floor(f.distance)),a=stage.path[i],b=stage.path[i+1],frac=f.distance-i;assert.ok(streets.has(a.x+','+a.y)&&streets.has(b.x+','+b.y),'car stays on the street');
 const dx=b.x-a.x,dy=b.y-a.y,side=(f.x-(a.x+dx*frac))*-dy+(f.y-(a.y+dy*frac))*dx;assert.ok(side>-1e-9,'never in the left lane');if(frac>.25&&frac<.75&&Math.abs(side-api.CAR_LANE)<1e-6)inLane++;}
assert.ok(drove>20&&inLane>5,'drives in the right lane');
console.log('PASS: train trips to every dead end, smooth timetable with station stops and one locomotive; tracks connect from row 1 and orphan checks; cars only on streets.');
