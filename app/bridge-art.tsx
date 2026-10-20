import {MAP} from '../lib/terrain';
import {bridgeHeight,BRIDGE_RISE} from '../lib/bridges';
type Axis='x'|'y'|'cross';
export function BridgeArt({color='#adad98',axis='x',span=1}:{color?:string;axis?:Axis;span?:number}){
 const half=span/2,ramp=span===1?.34:.75,steps=[-half,-half+ramp*.2,-half+ramp*.5,-half+ramp*.8,-half+ramp,...Array.from({length:Math.max(0,span-2)},(_,i)=>-half+1.5+i),half-ramp,half-ramp*.8,half-ramp*.5,half-ramp*.2,half].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b);
 const project=(u:number,v:number,z=0,a:Axis=axis)=>{v*=1-.2*bridgeHeight(u,span)/BRIDGE_RISE;const x=a==='y'?v:u,y=a==='y'?u:v;return `${((x-y)*30).toFixed(2)} ${((x+y)*15-z).toFixed(2)}`;},line=(v:number,a:Axis=axis,rail=false)=>'M'+steps.map(u=>project(u,v,bridgeHeight(u,span)+(rail?3.5*Math.min(1,(half-Math.abs(u))/.3):0),a)).join('L'),ribbon=(a:number,b:number)=>'M'+[...steps.map(u=>project(u,a,bridgeHeight(u,span))),...steps.slice().reverse().map(u=>project(u,b,bridgeHeight(u,span)))].join('L')+'Z';
 if(axis==='cross'){const grid=[-.5,-.34,-.16,.16,.34,.5],p=(x:number,y:number)=>`${(x-y)*30} ${(x+y)*15-Math.min(bridgeHeight(x),bridgeHeight(y))}`;return <g className="bridge-art" data-bridge-axis="cross">{grid.slice(0,-1).flatMap((x,i)=>grid.slice(0,-1).map((y,j)=><path key={`${i}-${j}`} d={'M'+[p(x,y),p(grid[i+1],y),p(grid[i+1],grid[j+1]),p(x,grid[j+1])].join('L')+'Z'} fill={MAP.road}/>))}{(['x','y'] as const).map(a=><path key={a} d={line(0,a)} stroke={MAP.lane} strokeWidth="1" strokeDasharray="3 3" fill="none"/>)}</g>}
 const posts=steps.filter(u=>Math.abs(u)<half-.08),arches=Array.from({length:span},(_,i)=>i-(span-1)/2).filter(u=>bridgeHeight(u,span)>4);
 return <g className="bridge-art" data-bridge-axis={axis} data-bridge-span={span}>
 <path d={'M'+[project(-half,-.5),project(half,-.5),project(half,.5),project(-half,.5)].join('L')+'Z'} fill="#a7c9c4"/>
 <path d={line(.5)+'L'+project(half,.5)+'L'+project(-half,.5)+'Z'} fill={color}/>
 {arches.map(u=><path key={u} d={'M'+project(u-.18,.5)+'L'+project(u-.18,.5,1.1)+'Q'+project(u,.5,5)+' '+project(u+.18,.5,1.1)+'L'+project(u+.18,.5)+'Z'} fill="#8dbab9"/>)}
 <path d={ribbon(-.5,.5)} fill="#dce5eb"/><path d={ribbon(-.36,.36)} fill={MAP.road}/>
 <path d={line(0)} fill="none" stroke={MAP.lane} strokeWidth="1" strokeDasharray="3 3"/>
 {[-.46,.46].map(v=><g key={v}><path d={line(v,axis,true)} fill="none" stroke="#58768b" strokeWidth="1.1" strokeLinejoin="round"/>{posts.map(u=><path key={u} d={'M'+project(u,v,bridgeHeight(u,span))+'L'+project(u,v,bridgeHeight(u,span)+3.5*Math.min(1,(half-Math.abs(u))/.3))} stroke="#91a9ba" strokeWidth="1"/>)}</g>)}
 </g>
}
