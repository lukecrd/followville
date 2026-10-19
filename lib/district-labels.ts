import {Building,buildingCenter,buildingCells,buildingFootprint,footprint,buildingScale} from './town';
import {point,terrainFor,terrainSeed} from './terrain';
import {cellKey,roadCells,networkRoads,RoadCell} from './roads';
export type LabelRect={x:number;y:number;width:number;height:number};
export const DISTRICTS=[{name:'BORGO VERDE',x:2,y:11},{name:'QUARTIERE STAZIONE',x:16,y:7},{name:'GIARDINI DEL SOLE',x:8,y:20},{name:'NUOVO ORIZZONTE',x:18,y:22}] as const;
export function overlapArea(a:LabelRect,b:LabelRect){return Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));}
export function districtObstacles(buildings:Building[],size:number,roadCuts:RoadCell[]=[]){const scale=24/size,rects:LabelRect[]=[],occupied=new Set(buildings.flatMap(buildingCells).map(c=>cellKey(c.x,c.y))),roads=roadCells(size,networkRoads(buildings,roadCuts));
 for(const b of buildings){if(b.kind==='road')continue;const c=buildingCenter(b),p=point(c.x,c.y,size);if(b.kind==='bridge'&&(b.bridgeSpan||1)>1){const reach=((b.bridgeSpan||1)+1)*15*scale;rects.push({x:p.x-reach-7,y:p.y-reach/2-15*scale,width:reach*2+14,height:reach+24*scale});continue;}const large=footprint(b.kind).width>1,artScale=buildingScale(b.kind)*(b.plotSpan?b.plotSpan/footprint(b.kind).width:1),width=b.kind==='tree'?26:large?67:51,height=b.kind==='townhall'?120:b.kind==='tree'?57:b.kind==='office'?126:b.kind==='apartment'?112:large?101:b.kind==='bridge'?26:100;rects.push({x:p.x-width*artScale*scale-7,y:p.y-height*artScale*scale-7,width:width*artScale*2*scale+14,height:(height*artScale+buildingFootprint(b).width*18)*scale+14});}
 // Include the decorative park trees, which are not stored as buildings.
 for(let x=0;x<size;x++)for(let y=0;y<size;y++)if(!occupied.has(cellKey(x,y))&&!roads.has(cellKey(x,y))&&terrainFor(x,y,size)==='park'&&terrainSeed(x,y)%19===0){const p=point(x,y,size);rects.push({x:p.x-19*scale,y:p.y-42*scale,width:38*scale,height:49*scale});}
 return rects;
}
export function layoutDistrictLabels(buildings:Building[],size:number,roadCuts:RoadCell[]=[]){const obstacles=districtObstacles(buildings,size,roadCuts),placed:LabelRect[]=[],candidates:{x:number;y:number}[]=[];for(let x=1.5;x<size-1;x++)for(let y=2.5;y<size-1;y++)candidates.push(point(x,y,size));
 return DISTRICTS.map(d=>{const anchor=point(d.x*size/24,d.y*size/24,size),width=Math.ceil(d.name.length*7.1+24),height=24,avoid=[...obstacles,...placed];let best={x:anchor.x-width/2,y:anchor.y-height/2,width,height},score=Infinity;
 for(const p of [anchor,...candidates]){const rect={x:p.x-width/2,y:p.y-height/2,width,height};if(rect.x<45||rect.x+width>1555||rect.y<150||rect.y+height>870)continue;const overlap=avoid.reduce((sum,o)=>sum+overlapArea(rect,o),0),distance=(p.x-anchor.x)**2+(p.y-anchor.y)**2,value=(overlap>0?1e8+overlap*10000:0)+distance;if(value<score){score=value;best=rect;}}
 placed.push({x:best.x-9,y:best.y-8,width:best.width+18,height:best.height+16});return {name:d.name,...best};
 });
}
