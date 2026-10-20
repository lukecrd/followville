import {BASE_SIZE} from './town';
// Map palette: cool sage ground, slate roads, one navy ink for text and shadows, teal for selection.
// Rules: contact shadows use MAP.shadow at .12 opacity; labels are white pills with a .8 MAP.line
// outline and MAP.ink text; no CSS filters or blur inside the map SVG (it repaints while panning).
export const GROUND_COLOR='#e4ebdf',GARDEN_COLOR='#b5d1a5';
export const MAP={ink:'#243c51',shadow:'#20384b',line:'#d3dee6',accent:'#137e88',select:'#79ded3',road:'#899ba6',roadEdge:'#7d909c',curb:'#f3f6f3',lane:'#eef3f6',rail:'#c3cfd6',sleeper:'#6f8391',railEdge:'#536d80',
 // Buildings and parks. Light comes from the top: top faces lightest, left (+y) walls `wall`, right (+x) walls `wallSide`.
 wall:'#f3f7f9',wallSide:'#c6d4dd',steel:'#52788c',glass:'#79aec5',glassSide:'#527e96',paving:'#dfe7e6',
 lawn:'#a9c792',lawnSide:'#8fae7f',leaf:'#4f8c69',leafLight:'#78a879',water:'#8ec3cc',amber:'#ebbf64',amberDark:'#b98a3e',blossom:'#e7aeaa'} as const;
export const point=(x:number,y:number,size=BASE_SIZE)=>({x:800+(x-y)*720/size,y:110+(x+y)*360/size});
export const terrainMargin=(size:number)=>Math.max(6,Math.round(size/4));
export function terrainSeed(x:number,y:number){return (Math.imul(x+83,73428767)^Math.imul(y+61,912931))>>>0;}
export function terrainFor(x:number,y:number,size:number):'park'|'wild'|'lot'|'reserve'{
 const u=x/size,v=y/size,outer=x<0||y<0||x>=size||y>=size;
 if(outer){if((x<0&&v>.25&&v<.8)||(y>=size&&u>.16&&u<.62))return 'park';if(x>=size&&v>.1&&v<.52)return 'reserve';return 'wild';}
 if((u>.2&&u<.45&&v>.62&&v<.86)||(u>.61&&u<.82&&v>.3&&v<.47))return 'park';
 if((u<.25&&v>.84)||(u>.75&&v>.66)||(u>.55&&v<.2))return 'wild';
 return 'lot';
}
