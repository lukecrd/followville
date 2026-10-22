import {BASE_SIZE} from './town';
// Map palette: game style (Clash/FarmVille) — saturated grass, dark asphalt, warm cream walls, gold selection.
// Rules: contact shadows use MAP.shadow at .12 opacity; labels are white pills with a .8 MAP.line
// outline and MAP.ink text; no CSS filters or blur inside the map SVG (it repaints while panning).
export const GROUND_COLOR='#8fcb52',GARDEN_COLOR='#6cb93f';
export const MAP={ink:'#243c51',shadow:'#1d3a1a',line:'#d3dee6',accent:'#e88a12',select:'#ffe14d',road:'#6d7987',roadEdge:'#5b6674',curb:'#f4e3b5',lane:'#fff8dc',rail:'#c9b48a',sleeper:'#7a5230',railEdge:'#5b4128',
 // Buildings and parks. Light comes from the top: top faces lightest, left (+y) walls `wall`, right (+x) walls `wallSide`.
 wall:'#fff6e4',wallSide:'#e3c79c',steel:'#4b6a8c',glass:'#6cc8f4',glassSide:'#3b8fc6',paving:'#ead9b0',
 lawn:'#7fd04b',lawnSide:'#57a332',leaf:'#3a9a35',leafLight:'#6fcf3f',water:'#4cc2f2',amber:'#ffc93c',amberDark:'#dd9318',blossom:'#ff9cb5',red:'#e9503c'} as const;
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
