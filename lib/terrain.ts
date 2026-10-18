import {BASE_SIZE} from './town';
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
