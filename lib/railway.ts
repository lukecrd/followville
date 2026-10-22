import {cellKey,ROAD_DIRECTIONS} from './roads';
import {stageMotion,roundedPosition,type Cell} from './simulation';
// The main line runs along row 0; built tracks ('rail' buildings) branch off it from row 1.
export const railConnects=(x:number,y:number,rails:Cell[])=>y===1||rails.some(r=>Math.abs(r.x-x)+Math.abs(r.y-y)===1);
// Built tracks still reachable from the main line, so a removal never leaves an orphan piece.
export function connectedRails(rails:Cell[]){const all=new Set(rails.map(r=>cellKey(r.x,r.y))),seen=new Set<string>(),queue=rails.filter(r=>r.y===1);for(const r of queue)seen.add(cellKey(r.x,r.y));for(let i=0;i<queue.length;i++)for(const d of ROAD_DIRECTIONS){const n={x:queue[i].x+d.x,y:queue[i].y+d.y},k=cellKey(n.x,n.y);if(all.has(k)&&!seen.has(k)){seen.add(k);queue.push(n);}}return seen;}
// One trip from the west end of the main line to each dead end, so the train eventually runs over every track.
export function trainTrips(size:number,rails:Cell[]):Cell[][]{
 const cells=new Set([...Array.from({length:size},(_,x)=>cellKey(x,0)),...rails.map(r=>cellKey(r.x,r.y))]),parents=new Map<string,Cell|null>([[cellKey(0,0),null]]),queue:Cell[]=[{x:0,y:0}],children=new Set<string>();
 for(let i=0;i<queue.length;i++)for(const d of ROAD_DIRECTIONS){const n={x:queue[i].x+d.x,y:queue[i].y+d.y},k=cellKey(n.x,n.y);if(cells.has(k)&&!parents.has(k)){parents.set(k,queue[i]);children.add(cellKey(queue[i].x,queue[i].y));queue.push(n);}}
 return queue.filter(c=>!children.has(cellKey(c.x,c.y))&&(c.x||c.y)).map(leaf=>{const path:Cell[]=[];for(let c:Cell|null=leaf;c;c=parents.get(cellKey(c.x,c.y))||null)path.push(c);return path.reverse();});
}
export const TRAIN_SPEED=1.6,TRAIN_GAP=1.12,TRAIN_STOP_MS=2500,TRAIN_CARS=3;
type Leg={path:Cell[];from:number;distance:number;speed:number;rampMs:number;travelMs:number;durationMs:number;inbound:boolean};
// Each trip runs out and back; the train eases into every station on the main line (a station sits in row 1 above its rail cell).
export function trainTimetable(size:number,rails:Cell[],stations:Cell[]){
 const stops=new Set(stations.filter(s=>s.y===1).map(s=>cellKey(s.x,0))),legs:Leg[]=[],tail=(TRAIN_CARS-1)*TRAIN_GAP;
 for(const trip of trainTrips(size,rails))for(const inbound of [false,true]){
  const path=inbound?[...trip].reverse():trip,start=Math.min(tail,path.length-1),marks=[start,...path.map((c,i)=>i).filter(i=>i>start&&i<path.length-1&&stops.has(cellKey(path[i].x,path[i].y))),path.length-1];
  for(let i=1;i<marks.length;i++){const distance=marks[i]-marks[i-1];if(distance<=0)continue;const rampMs=Math.min(1800,distance/TRAIN_SPEED*500),travelMs=distance/TRAIN_SPEED*1000+rampMs;legs.push({path,from:marks[i-1],distance,speed:TRAIN_SPEED,rampMs,travelMs,durationMs:travelMs+TRAIN_STOP_MS,inbound});}
 }
 return {legs,cycleMs:legs.reduce((s,l)=>s+l.durationMs,0)};
}
// Car positions along the track at a shared wall-clock time; on the way back the locomotive stays at the rear and pushes.
export function trainFrame(table:ReturnType<typeof trainTimetable>,now:number){
 if(!table.cycleMs)return null;let elapsed=now%table.cycleMs,leg=table.legs[0];for(const l of table.legs){if(elapsed<l.durationMs){leg=l;break;}elapsed-=l.durationMs;}
 const head=leg.from+stageMotion(leg,elapsed).distance,end=leg.path.length-1;
 const cars=Array.from({length:TRAIN_CARS},(_,k)=>{const at=Math.max(0,head-k*TRAIN_GAP),p=roundedPosition(leg.path,at),q=roundedPosition(leg.path,Math.min(end,at+.05)),r=at+.05>end?roundedPosition(leg.path,at-.05):p;return {...p,direction:{x:q.x-r.x,y:q.y-r.y},lead:leg.inbound?k===TRAIN_CARS-1:k===0};});
 // Reversed on the way back so each rendered car keeps its physical place when the train changes direction.
 return leg.inbound?cars.reverse():cars;
}
