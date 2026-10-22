import {Building,buildingCells,canPlace,isRoad,TRANSPORT_KINDS} from './town';
import {bridgeEnds,bridgePlanner} from './bridges';
import {cellKey,connectedRoadCells,networkRoads,roadCells,roadNeighbors,transportCells,RoadCell} from './roads';

export const baseRoadId=(x:number,y:number)=>`base-road:${x},${y}`;
export function baseRoad(id:string):RoadCell|null{const m=/^base-road:(\d+),(\d+)$/.exec(id);return m?{x:Number(m[1]),y:Number(m[2])}:null;}
export type LayoutTarget={building:Building;roadCuts:RoadCell[];cells:RoadCell[];base:boolean};
// Prepare topology once for all candidate lots; server validation uses the same planner.
export function movePlanner(source:Building,size:number,buildings:Building[],roadCuts:RoadCell[]=[],reserved:RoadCell[]=[]){
 // Tracks are laid and lifted piece by piece instead of moved, so the line never breaks.
 if(source.kind==='rail')return ():LayoutTarget|null=>null;
 const base=!!baseRoad(source.id),remaining=buildings.filter(b=>b.id!==source.id),cuts=base?[...roadCuts,{x:source.x,y:source.y}]:roadCuts;
 const occupied=new Set([...remaining.flatMap(buildingCells),...reserved].map(c=>cellKey(c.x,c.y)));
 const roads=networkRoads(remaining,cuts),cells=roadCells(size,roads),links=new Map(transportCells(roads).map(c=>[cellKey(c.x,c.y),c]));
 const components=new Map<string,number>();let componentCount=0;
 const missingRamp=remaining.some(b=>b.kind==='bridge'&&bridgeEnds(b).some(c=>!cells.has(cellKey(c.x,c.y))));
 if(source.kind==='road')for(const key of cells){
  if(components.has(key))continue;const [x,y]=key.split(',').map(Number),queue=[{x,y}],id=componentCount++;components.set(key,id);
  for(let i=0;i<queue.length;i++)for(const next of roadNeighbors(queue[i],cells,links)){const k=cellKey(next.x,next.y);if(!components.has(k)){components.set(k,id);queue.push(next);}}
 }
 const bridgeAt=source.kind==='bridge'?bridgePlanner(size,remaining,cuts):null;
 return (x:number,y:number):LayoutTarget|null=>{
  if(!Number.isInteger(x)||!Number.isInteger(y)||(x===source.x&&y===source.y))return null;
  if(!canPlace(source.kind,x,y,size,occupied,cuts)||source.kind==='station'&&y!==1)return null;
  let building={...source,x,y,plotSpan:null};
  if(bridgeAt){const plan=bridgeAt(x,y);if(!plan)return null;building={...building,x:plan.x,y:plan.y,bridgeAxis:plan.bridgeAxis,bridgeSpan:plan.bridgeSpan};if(building.x===source.x&&building.y===source.y||buildingCells(building).some(c=>occupied.has(cellKey(c.x,c.y))))return null;}
  if(source.kind==='road'){
   const touched=new Set(roadNeighbors({x,y},cells,links).map(c=>components.get(cellKey(c.x,c.y))));
   if(missingRamp||touched.size!==componentCount)return null;
  }else if(source.kind==='bridge'){
   const next=[...remaining,building],network=networkRoads(next,cuts),allCells=roadCells(size,network),connected=connectedRoadCells(size,network);
   if([...allCells].some(c=>!connected.cells.has(c))||next.some(b=>b.kind==='bridge'&&bridgeEnds(b).some(c=>!allCells.has(cellKey(c.x,c.y)))))return null;
  }
  return {building,roadCuts:cuts,cells:buildingCells(building),base};
 };
}
export function moveTarget(source:Building,x:number,y:number,size:number,buildings:Building[],roadCuts:RoadCell[]=[],reserved:RoadCell[]=[]){return movePlanner(source,size,buildings,roadCuts,reserved)(x,y);}
export function movableBaseRoad(x:number,y:number,size:number,roadCuts:RoadCell[]){return x>0&&y>0&&x<size-1&&y<size-1&&isRoad(x,y)&&!roadCuts.some(c=>c.x===x&&c.y===y);}
