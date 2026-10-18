import React,{memo} from 'react';
import {cellSurface} from '../lib/map-geometry';
import {point,terrainFor,terrainMargin,terrainSeed,GROUND_COLOR,GARDEN_COLOR} from '../lib/terrain';
import {buildingCells,type Building} from '../lib/town';
export function MeadowTree({pine=false}:{pine?:boolean}){return <g><ellipse cy="3" rx="12" ry="5" fill="#3f6958" opacity=".10"/><path d="M-1 2v-28h3V2z" fill="#a38970"/>{pine?<><path d="M0-51-16-17h8l-12 10h40L8-17h8z" fill="#729885"/><path d="M0-51v44h-20l12-10h-8z" fill="#8aaf95"/></>:<><path d="M0-49c-12 0-20 9-20 22 0 12 9 18 20 18s20-6 20-18c0-13-8-22-20-22" fill="#78a088"/><path d="M0-49c-12 0-20 9-20 22 0 12 9 18 20 18z" fill="#94b69a"/></>}</g>}
export function GroundDetails({kind,seed}:{kind:string;seed:number}){
 if(kind==='lot'||kind==='reserve')return <g opacity={kind==='reserve'?.48:.62}><path d="M0-11 22 0 0 11-22 0z" fill="none" stroke={kind==='reserve'?'#9fa97d':'#95a682'} strokeWidth=".8" strokeDasharray="3 3"/>{[[0,-11],[22,0],[0,11],[-22,0]].map(([x,y],i)=><path key={i} d={`M${x} ${y}v-2.5`} stroke="#f6f1da" strokeWidth="1.2"/>)}{kind==='lot'&&seed%4===0&&<path d="M-3 0h6M0-1.5v3" stroke="#aab391" strokeWidth=".7"/>}</g>;
 if(kind==='park')return <g><path d="m-15 1 5 2m13-9 4 2m9 4 3 1" stroke="#99b479" strokeWidth="1"/>{seed%4===0&&<g><circle cx="-10" cy="2" r="1.8" fill="#e5ba8d"/><circle cx="-7" cy="3" r="1.5" fill="#eddda1"/><circle cx="10" cy="-3" r="1.5" fill="#d8a3a2"/></g>}</g>;
 return <g strokeLinecap="round" opacity={.5+(seed%5)*.1} transform={`translate(${seed%5-2} ${seed%3-1})`}><path d="m-13 2-2-5m2 5 2-4m-2 4v-5M8 3 6-3m2 6 3-5m-3 5v-6M-1-5l-2-3m2 3 1-3" stroke={seed%2?'#a7ae74':'#aeb778'} strokeWidth="1"/>{seed%9===0&&<><ellipse cx="-6" cy="6" rx="4" ry="2" fill="#b2b495"/><ellipse cx="-7" cy="5" rx="3" ry="1.5" fill="#d0d0b2"/></>}</g>;
}
function CountryPark(){return <g><path d="M-112 3 0-54 111 2 0 59z" fill={GARDEN_COLOR} stroke={GARDEN_COLOR} strokeWidth="1"/><path d="M-91-5 0 40 91-6M-1-42v82" fill="none" stroke="#e4ddbb" strokeWidth="6" strokeLinejoin="round"/><ellipse cx="40" cy="-4" rx="30" ry="16" fill="#d3d6ae"/><ellipse cx="40" cy="-5" rx="25" ry="12" fill="#8fbcb5"/><path d="m27-7 12 1m2 5 12-1" stroke="#c6dfce" strokeWidth="1.4"/><g transform="translate(-55 -10)"><MeadowTree/></g><g transform="translate(4 -27)"><MeadowTree pine/></g><g transform="translate(75 15) scale(.8)"><MeadowTree/></g><g transform="translate(-25 21)"><path d="m-14-10 23 11v5l-23-11z" fill="#a98a5b"/><path d="m-14-1 23 11 5-3-23-11z" fill="#c8a475"/><path d="M-14-1v5m23 6v5" stroke="#7e8e68" strokeWidth="2"/></g>{[-50,-35,-20].map((x,i)=><g key={x} transform={`translate(${x} ${-24-i*3})`}><ellipse rx="8" ry="4" fill="#8eaa6a"/><circle cx="-3" cy="-3" r="2.8" fill="#e5b6a2"/><circle cx="3" cy="-1" r="2.5" fill="#ead88f"/></g>)}</g>}
export const Landscape=memo(function Landscape({size,layer,buildings}:{size:number;layer:'ground'|'foliage';buildings?:Building[]}){
 const margin=terrainMargin(size),scale=24/size;
 if(layer==='ground'){
  const min=-margin-.5,max=size+margin-.5;
  const outline=[[min,min],[max,min],[max,max],[min,max]].map(([x,y])=>point(x,y,size));
  const gardens=(buildings||[]).filter(b=>b.kind==='garden').flatMap(buildingCells);
  return <g aria-label="Terreno uniforme e giardini verdi" pointerEvents="none">
   <path data-terrain="ground" d={'M'+outline.map(p=>`${p.x} ${p.y}`).join('L')+'Z'} fill={GROUND_COLOR}/>
   {gardens.length>0&&<path data-terrain="garden" d={cellSurface(gardens,size)} fill={GARDEN_COLOR} stroke={GARDEN_COLOR} strokeWidth=".4"/>}
  </g>;
 }
 const cells=[];for(let x=-margin;x<size+margin;x++)for(let y=-margin;y<size+margin;y++)if(x<0||y<0||x>=size||y>=size)cells.push({x,y});cells.sort((a,b)=>a.x+a.y-b.x-b.y);
 const parks=[{x:-margin*.45,y:size*.6},{x:size*.42,y:size+margin*.45}];
 return <g pointerEvents="none">{cells.filter(({x,y})=>{const seed=terrainSeed(x,y),kind=terrainFor(x,y,size);return kind!=='reserve'&&seed%(kind==='park'?17:29)===0&&!parks.some(p=>Math.abs(x-p.x)+Math.abs(y-p.y)<4);}).map(({x,y})=>{const p=point(x,y,size),seed=terrainSeed(x,y);return <g key={`${x},${y}`} transform={`translate(${p.x} ${p.y}) scale(${scale*(.65+(seed%3)*.08)})`}><MeadowTree pine={seed%3===0}/></g>})}{parks.map((p,i)=>{const at=point(p.x,p.y,size);return <g key={i} transform={`translate(${at.x} ${at.y}) scale(${scale})`}><CountryPark/><text y="80" textAnchor="middle" fontSize="8" letterSpacing="2" fill="#708f7b">{i?'PARCO DELLE QUERCE':'GIARDINI DI CONFINE'}</text></g>})}{[{x:size+margin*.65,y:size*.34,label:'TERRENI DA SBLOCCARE'},{x:size*.75,y:-margin*.6,label:'PRATI SELVATICI'}].map(p=>{const at=point(p.x,p.y,size);return <text key={p.label} x={at.x} y={at.y} fontSize="8" textAnchor="middle" letterSpacing="2" fill="#879985" transform={`rotate(-26 ${at.x} ${at.y})`}>{p.label}</text>})}</g>
});
