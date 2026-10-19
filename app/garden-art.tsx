import React from 'react';

const p=(x:number,y:number,z=0)=>`${x-y},${(x+y)*.5-z}`;
const poly=(points:number[][])=>points.map(([x,y,z=0])=>p(x,y,z)).join(' ');
function Surface({points,fill}:{points:number[][];fill:string}){return <polygon points={poly(points)} fill={fill}/>;}
function Line({points,color,width=1}:{points:number[][];color:string;width?:number}){return <polyline points={poly(points)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"/>;}
function Shrub({x,y,small=false}:{x:number;y:number;small?:boolean}){
 return <g transform={`translate(${p(x,y,1.5)}) scale(${small?.7:1})`}>
  <ellipse cy="1" rx="6" ry="2.7" fill="#3b7359" opacity=".14"/>
  <ellipse cy="-2" rx="5.5" ry="3.6" fill="#508b69"/>
  <ellipse cx="-1.4" cy="-3.7" rx="3.6" ry="2.5" fill="#80ab7c"/>
 </g>;
}
function GardenTree(){return <g transform={`translate(${p(-10,-10,1.5)})`}>
 <ellipse cy="2" rx="10" ry="4.2" fill="#41684e" opacity=".17"/>
 <path d="M-1.2 0v-20h2.8V0Z" fill="#9e8566"/>
 <path d="M0-11-5-17M1-16l5-5" fill="none" stroke="#9e8566" strokeWidth="1.6" strokeLinecap="round"/>
 <path d="M0-37c-8-1-12 4-12 10-6 8 0 17 10 17 9 2 17-3 16-11 2-8-4-15-14-16Z" fill="#4f8c69"/>
 <path d="M-2-36c-7 0-10 4-10 10-4 6 0 12 5 13 5-2 7-7 6-12 4-4 3-8-1-11Z" fill="#78a879"/>
 <ellipse cx="3" cy="-31" rx="6" ry="4.3" fill="#6a9d71"/>
 <path d="M-6-29q-4 2-3 6" fill="none" stroke="#9fbe8c" strokeWidth="1.2" strokeLinecap="round" opacity=".65"/>
 </g>;}
function FlowerBed(){return <g className="garden-flowers">
 <title>Aiuole in fiore</title>
 <Surface points={[[8,9,1.5],[18,9,1.5],[18,18,1.5],[8,18,1.5]]} fill="#d7d8c2"/>
 <Surface points={[[9,10,1.6],[17,10,1.6],[17,17,1.6],[9,17,1.6]]} fill="#77956b"/>
 {[[10,11],[14,11],[16,14],[12,14],[10,16],[15,17]].map(([x,y],i)=><g key={i} transform={`translate(${p(x,y,3)})`}>
  <path d="M0 1v-3m0 2-2-1" stroke="#4b845c" strokeWidth=".8"/>
  <ellipse cy="-2.5" rx="2.3" ry="1.7" fill={['#e7aeaa','#f1d48a','#c7b8d4'][i%3]}/>
  <circle cy="-2.7" r=".6" fill="#fff0bc"/>
 </g>)}
 </g>;}
function Bench(){return <g className="garden-bench">
 <title>Panchina comune in legno</title>
 {[-15,-5].map(x=><g key={x}>
  <Line points={[[x,11,1.5],[x,11,5],[x,16,5],[x,16,1.5]]} color="#48675e" width={1.1}/>
  <Line points={[[x,11,5],[x,11,10]]} color="#48675e" width={1}/>
 </g>)}
 {[11,13,15].map(y=><Surface key={y} points={[[-17,y,5],[-3,y,5],[-3,y+1.4,5],[-17,y+1.4,5]]} fill={y===13?'#d4b18a':'#c49a70'}/>)}
 {[7.1,9.4].map(z=><Surface key={z} points={[[-17,10.6,z],[-3,10.6,z],[-3,10.6,z+1.5],[-17,10.6,z+1.5]]} fill="#d5b18b"/>)}
 </g>;}
function GardenLights(){return <g className="garden-lights">
 <title>Lampioni del giardino</title>
 {[[17,-18],[-18,17]].map(([x,y],i)=><g key={i} transform={`translate(${p(x,y,1.5)})`}>
  <ellipse cy=".5" rx="5" ry="2.6" fill="#eac982" opacity=".18"/>
  <ellipse rx="2.1" ry="1" fill="#617970"/>
  <path d="M0 0v-25" stroke="#48665e" strokeWidth="1.1"/>
  <path d="M-2.5-26 0-27.2 2.5-26v5L0-20-2.5-21Z" fill="#f4deb2" stroke="#8c9e87" strokeWidth=".5"/>
  <path d="M-3-26 0-28 3-26Z" fill="#48665e"/>
  <path d="M0-25v4" stroke="#fff5d0" strokeWidth="1.2"/>
 </g>)}
 </g>;}
function Gazebo(){return <g className="garden-gazebo">
 <title>Gazebo con pergola e seduta</title>
 <Surface points={[[6,-18,1.5],[19,-18,1.5],[19,-3,1.5],[6,-3,1.5]]} fill="#d4c5aa"/>
 {[-15,-11,-7].map(y=><Line key={y} points={[[7,y,1.6],[18,y,1.6]]} color="#bdac90" width={.55}/>)}
 {[[7,-16],[18,-16],[7,-4],[18,-4]].map(([x,y],i)=><Line key={i} points={[[x,y,2],[x,y,23]]} color={i===0?'#b29470':'#8f785d'} width={1.25}/>)}
 <Surface points={[[8,-15,6],[17,-15,6],[17,-12,6],[8,-12,6]]} fill="#cfac7f"/>
 <Line points={[[9,-14,2],[9,-14,6],[16,-14,6],[16,-14,2]]} color="#8f785d" width={.8}/>
 <Surface points={[[5,-19,23],[20,-19,23],[20,-2,23],[5,-2,23]]} fill="#dde6d6"/>
 {[6,9,12,15,18].map(x=><Surface key={x} points={[[x,-19,23.4],[x+1.2,-19,23.4],[x+1.2,-2,23.4],[x,-2,23.4]]} fill="#769382"/>)}
 <Line points={[[5,-2,23],[20,-2,23],[20,-19,23]]} color="#537967" width={1.9}/>
 <Line points={[[5,-19,23],[20,-19,23]]} color="#8aa58d" width={1.4}/>
 </g>;}

export function GardenArt({items=[]}:{items?:string[]}){
 return <g className="garden-art" strokeLinejoin="round">
  <title>Giardino comune con prato, vialetti e aiuole</title>
  <ellipse cy="4" rx="39" ry="15" fill="#345c45" opacity=".10"/>
  <Surface points={[[-21,-21,0],[21,-21,0],[21,21,0],[-21,21,0]]} fill="#a4b49a"/>
  <Surface points={[[-21,21,0],[21,21,0],[21,21,1.5],[-21,21,1.5]]} fill="#a5b49c"/>
  <Surface points={[[21,-21,0],[21,21,0],[21,21,1.5],[21,-21,1.5]]} fill="#8fa58c"/>
  <Surface points={[[-21,-21,1.5],[21,-21,1.5],[21,21,1.5],[-21,21,1.5]]} fill="#d7ddc9"/>
  <Surface points={[[-19,-19,1.6],[19,-19,1.6],[19,19,1.6],[-19,19,1.6]]} fill="#a8c48d"/>
  <Surface points={[[-18,-18,1.7],[-2,-18,1.7],[-2,-2,1.7],[-18,-2,1.7]]} fill="#91b580"/>
  <Surface points={[[7,8,1.7],[18,8,1.7],[18,18,1.7],[7,18,1.7]]} fill="#9dbc84"/>
  <Surface points={[[-21,1,1.8],[21,1,1.8],[21,6,1.8],[-21,6,1.8]]} fill="#f1e8d6"/>
  <Surface points={[[0,-21,1.8],[5,-21,1.8],[5,21,1.8],[0,21,1.8]]} fill="#f1e8d6"/>
  {[-14,-7,12].map(x=><Line key={x} points={[[x,1,1.9],[x,6,1.9]]} color="#d9d2bd" width={.5}/>)}
  {[-13,-6,12,18].map(y=><Line key={y} points={[[0,y,1.9],[5,y,1.9]]} color="#d9d2bd" width={.5}/>)}
  {[-15,-10,-5].map(x=><Shrub key={x} x={x} y={18} small/>)}
  {[-15,-9].map(y=><Shrub key={y} x={-18} y={y} small/>)}
  {!items.includes('gazebo')&&<><Shrub x={14} y={-14}/><Shrub x={16} y={-7} small/></>}
  {items.includes('lights')&&<GardenLights/>}
  <GardenTree/>
  {items.includes('gazebo')&&<Gazebo/>}
  {items.includes('bench')&&<Bench/>}
  {items.includes('flowers')&&<FlowerBed/>}
  <g transform={`translate(${p(14,14,1.8)})`}>
   {!items.includes('flowers')&&<><ellipse cy="-1" rx="3.5" ry="2" fill="#719b68"/><circle cx="-1.2" cy="-2.4" r="1.3" fill="#e5b4a5"/><circle cx="1.4" cy="-1.4" r="1.2" fill="#edcf8f"/></>}
  </g>
 </g>;
}
