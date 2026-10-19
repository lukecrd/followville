import {Building,buildable,buildingCells} from './town';
import {RoadCell,cellKey,roadCells,roadConnection,transportCells,networkRoads} from './roads';
export type BridgeAxis='x'|'y';
export const BRIDGE_RISE=5.5;
// Flat deck and smoothly eased ramps meet the adjacent roads at exactly zero height.
export function bridgeHeight(along:number,span=1){const t=Math.max(0,Math.min(1,(span/2-Math.abs(along))/(span===1?.34:.75)));return BRIDGE_RISE*t*t*(3-2*t);}
export function bridgeElevation(x:number,y:number,bridges:RoadCell[]){let height=0;for(const b of bridges){const span=Math.max(1,b.bridgeSpan||1),dx=x-b.x-(b.bridgeAxis==='y'?0:(span-1)/2),dy=y-b.y-(b.bridgeAxis==='y'?(span-1)/2:0);if(Math.abs(dx)>(b.bridgeAxis==='y'?.5:span/2)||Math.abs(dy)>(b.bridgeAxis==='y'?span/2:.5))continue;const h=b.bridgeAxis==='x'?bridgeHeight(dx,span):b.bridgeAxis==='y'?bridgeHeight(dy,span):Math.min(bridgeHeight(dx),bridgeHeight(dy));height=Math.max(height,h);}return height;}
export type BridgePlan={x:number;y:number;kind:'bridge';bridgeAxis:BridgeAxis;bridgeSpan:number;ends:RoadCell[]};
export function bridgeEnds(b:RoadCell){const span=Math.max(1,b.bridgeSpan||1),dx=b.bridgeAxis==='y'?0:1,dy=b.bridgeAxis==='y'?1:0;return [{x:b.x-dx,y:b.y-dy},{x:b.x+dx*span,y:b.y+dy*span}];}
// Only offer complete clear spans with a usable road on each bank.
export function bridgePlanner(size:number,buildings:Building[],roadCuts:RoadCell[]=[]){const roads=networkRoads(buildings,roadCuts),cells=roadCells(size,roads),links=new Map(transportCells(roads).map(c=>[cellKey(c.x,c.y),c])),occupied=new Set(buildings.flatMap(buildingCells).map(c=>cellKey(c.x,c.y)));
 return (x:number,y:number):BridgePlan|null=>{if(!buildable(x,y,size,roadCuts)||occupied.has(cellKey(x,y)))return null;let best:BridgePlan|null=null;
 for(const axis of ['x','y'] as const){const dx=axis==='x'?1:0,dy=axis==='y'?1:0,ends:RoadCell[]=[];for(const sign of [-1,1]){for(let n=1;n<=12;n++){const p={x:x+dx*sign*n,y:y+dy*sign*n};if(p.x<1||p.y<1||p.x>=size-1||p.y>=size-1)break;if(cells.has(cellKey(p.x,p.y))){const inside={x:p.x-dx*sign,y:p.y-dy*sign};if(roadConnection(inside,p,links))ends.push(p);break;}if(!buildable(p.x,p.y,size,roadCuts)||occupied.has(cellKey(p.x,p.y)))break;}}
 if(ends.length!==2)continue;const span=Math.abs(ends[1].x-ends[0].x)+Math.abs(ends[1].y-ends[0].y)-1;if(span<1||span>12)continue;const plan:BridgePlan={x:ends[0].x+dx,y:ends[0].y+dy,kind:'bridge',bridgeAxis:axis,bridgeSpan:span,ends};if(!best||span<best.bridgeSpan)best=plan;
 }return best;};
}
export function planBridge(x:number,y:number,size:number,buildings:Building[],roadCuts:RoadCell[]=[]){return bridgePlanner(size,buildings,roadCuts)(x,y);}
export function canConnectRoad(x:number,y:number,size:number,roads:RoadCell[]){const cells=roadCells(size,roads),links=new Map(transportCells(roads).map(b=>[cellKey(b.x,b.y),b])),c={x,y};return [{x:x-1,y},{x:x+1,y},{x,y:y-1},{x,y:y+1}].some(p=>cells.has(cellKey(p.x,p.y))&&roadConnection(c,p,links));}
