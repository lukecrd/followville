import {Building,buildingCells,canPlace,isRoad,TRANSPORT_KINDS} from './town';
import {bridgeEnds,planBridge} from './bridges';
import {cellKey,connectedRoadCells,networkRoads,roadCells,RoadCell} from './roads';

export const baseRoadId=(x:number,y:number)=>`base-road:${x},${y}`;
export function baseRoad(id:string):RoadCell|null{const m=/^base-road:(\d+),(\d+)$/.exec(id);return m?{x:Number(m[1]),y:Number(m[2])}:null;}
export type LayoutTarget={building:Building;roadCuts:RoadCell[];cells:RoadCell[];base:boolean};
// One placement rule serves both map previews and server validation.
export function moveTarget(source:Building,x:number,y:number,size:number,buildings:Building[],roadCuts:RoadCell[]=[],reserved:RoadCell[]=[]):LayoutTarget|null{
 if(!Number.isInteger(x)||!Number.isInteger(y)||(x===source.x&&y===source.y))return null;
 const base=!!baseRoad(source.id),remaining=buildings.filter(b=>b.id!==source.id),cuts=base?[...roadCuts,{x:source.x,y:source.y}]:roadCuts;
 const occupied=new Set([...remaining.flatMap(buildingCells),...reserved].map(c=>cellKey(c.x,c.y)));
 if(!canPlace(source.kind,x,y,size,occupied,cuts)||source.kind==='station'&&y!==1)return null;
 let building={...source,x,y,plotSpan:null};
 if(source.kind==='bridge'){
  const plan=planBridge(x,y,size,remaining,cuts);if(!plan)return null;
  building={...building,x:plan.x,y:plan.y,bridgeAxis:plan.bridgeAxis,bridgeSpan:plan.bridgeSpan};
  if(building.x===source.x&&building.y===source.y||buildingCells(building).some(c=>occupied.has(cellKey(c.x,c.y))))return null;
 }
 if(TRANSPORT_KINDS.includes(source.kind)){
  const next=[...remaining,building],roads=networkRoads(next,cuts),cells=roadCells(size,roads),connected=connectedRoadCells(size,roads);
  if([...cells].some(c=>!connected.cells.has(c)))return null;
  if(next.some(b=>b.kind==='bridge'&&bridgeEnds(b).some(c=>!cells.has(cellKey(c.x,c.y)))))return null;
 }
 return {building,roadCuts:cuts,cells:buildingCells(building),base};
}
export function movableBaseRoad(x:number,y:number,size:number,roadCuts:RoadCell[]){return x>0&&y>0&&x<size-1&&y<size-1&&isRoad(x,y)&&!roadCuts.some(c=>c.x===x&&c.y===y);}
