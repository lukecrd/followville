import React from 'react';

// The long axis follows the map's railway (x); the platform faces negative y.
const p=(x:number,y:number,z=0)=>`${x-y},${(x+y)*.5-z}`;
const polygon=(points:number[][])=>points.map(([x,y,z=0])=>p(x,y,z)).join(' ');
function Face({points,fill,stroke}:{points:number[][];fill:string;stroke?:string}){
 return <polygon points={polygon(points)} fill={fill} stroke={stroke} strokeWidth={stroke?.6:undefined} strokeLinejoin="round"/>;
}
function Line({points,color,width=1}:{points:number[][];color:string;width?:number}){
 return <polyline points={polygon(points)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"/>;
}

export function StationArt({color='#7f9697'}:{color?:string}){
 return <g className="station-art" strokeLinejoin="round">
  <title>Stazione ferroviaria con atrio vetrato e banchina coperta</title>
  <ellipse cx="5" cy="5" rx="43" ry="16" fill="#25465b" opacity=".12"/>

  {/* A low stone plinth, with a clear railway-facing platform edge. */}
  <Face points={[[-27,-29,0],[27,-29,0],[27,19,0],[-27,19,0]]} fill="#c4d1d8"/>
  <Face points={[[-27,19,0],[27,19,0],[27,19,3],[-27,19,3]]} fill="#adbec8"/>
  <Face points={[[27,-29,0],[27,19,0],[27,19,3],[27,-29,3]]} fill="#91a9b8"/>
  <Face points={[[-27,-29,3],[27,-29,3],[27,19,3],[-27,19,3]]} fill="#e6edf0"/>
  <Face points={[[-26,-28,3.1],[26,-28,3.1],[26,-26.7,3.1],[-26,-26.7,3.1]]} fill="#ebbf64"/>
  {[-20,-10,0,10,20].map(x=><Line key={x} points={[[x,-25.5,3.1],[x,-13,3.1]]} color="#d0dce1" width={.55}/>)}

  {/* Slim steel posts hold one continuous canopy parallel to the rails. */}
  {[-22,1,23].map(x=><g key={x}>
   <Line points={[[x,-20,3],[x,-20,24]]} color="#52788c" width={1.5}/>
   <Line points={[[x,-20,19],[x,-25,24],[x,-14,24]]} color="#7e9dac" width={.8}/>
  </g>)}
  <Face points={[[-28,-29,24],[28,-29,24],[28,-12,24],[-28,-12,24]]} fill="#f3f7f9" stroke="#cedce3"/>
  <Face points={[[-28,-12,22],[28,-12,22],[28,-12,24],[-28,-12,24]]} fill={color}/>
  <Face points={[[28,-29,22],[28,-12,22],[28,-12,24],[28,-29,24]]} fill="#54788b"/>
  <Face points={[[-24,-24,24.1],[24,-24,24.1],[24,-19,24.1],[-24,-19,24.1]]} fill="#a9cbd9"/>
  {[-13,0,13].map(x=><Line key={x} points={[[x,-24,24.2],[x,-19,24.2]]} color="#e9f3f7" width={.8}/>)}
  <g transform={`matrix(1 .5 0 1 ${p(19,-12,17)})`}>
   <rect x="-4" y="-4" width="8" height="8" rx="1" fill="#284d65"/>
   <text y="2" textAnchor="middle" fontFamily="system-ui,sans-serif" fontWeight="700" fontSize="5.5" fill="#fff">1</text>
  </g>

  {/* A compact glass concourse leaves the platform visible on the right. */}
  <Face points={[[-22,14,3],[9,14,3],[9,14,30],[-22,14,30]]} fill="#f4f7f9"/>
  <Face points={[[9,-10,3],[9,14,3],[9,14,30],[9,-10,30]]} fill="#c0d0da"/>
  <Face points={[[-19,14.1,6],[6,14.1,6],[6,14.1,23],[-19,14.1,23]]} fill="#78aec6"/>
  <Face points={[[9.1,-7,6],[9.1,11,6],[9.1,11,24],[9.1,-7,24]]} fill="#578da9"/>
  <Face points={[[-18,14.2,7],[-12,14.2,7],[-3,14.2,22],[-9,14.2,22]]} fill="#cee8f1"/>
  <Face points={[[9.2,-5,7],[9.2,-1,7],[9.2,9,23],[9.2,5,23]]} fill="#8bb7cc"/>
  {[-11,-3].map(x=><Line key={x} points={[[x,14.3,6],[x,14.3,23]]} color="#e7f0f4" width={1.1}/>)}
  {[-1,6].map(y=><Line key={y} points={[[9.3,y,6],[9.3,y,24]]} color="#bed8e5" width={.9}/>)}
  <Face points={[[0,14.4,3],[7,14.4,3],[7,14.4,20],[0,14.4,20]]} fill="#355e77" stroke="#e4eef3"/>
  <Line points={[[3.5,14.6,4],[3.5,14.6,19]]} color="#a6c8d9" width={.65}/>
  <Line points={[[2.4,14.7,10],[2.4,14.7,13]]} color="#f4e1ad" width={.8}/>
  <Line points={[[4.6,14.7,10],[4.6,14.7,13]]} color="#f4e1ad" width={.8}/>
  <Face points={[[-24,-12,30],[11,-12,30],[11,16,30],[-24,16,30]]} fill="#f9fbfc" stroke="#d7e3e9"/>
  <Face points={[[-24,16,27],[11,16,27],[11,16,30],[-24,16,30]]} fill={color}/>
  <Face points={[[11,-12,27],[11,16,27],[11,16,30],[11,-12,30]]} fill="#57798b"/>
  <Face points={[[-18,-7,30.1],[-2,-7,30.1],[-2,3,30.1],[-18,3,30.1]]} fill="#6b94a9"/>
  <Line points={[[-10,-7,30.2],[-10,3,30.2]]} color="#cce2ec" width={.6}/>

  <g transform={`matrix(1 .5 0 1 ${p(-22,14.6,23.5)})`}>
   <rect width="30" height="6" rx=".8" fill="#284d65"/>
   <text x="15" y="4.2" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="3.5" fontWeight="700" letterSpacing=".7" fill="#f7fbfd">STAZIONE</text>
  </g>
  <g transform={`matrix(1 -.5 0 1 ${p(9.5,2,28)})`}>
   <circle r="4.4" fill="#f9faf3" stroke="#3e6277" strokeWidth=".8"/>
   <path d="M0-2.8V0L2 1" fill="none" stroke="#3e6277" strokeWidth=".8" strokeLinecap="round"/>
   <circle r=".6" fill="#3e6277"/>
  </g>

  {/* Furniture and step-free access stay inside the station forecourt. */}
  <Line points={[[17,-5,3],[17,-5,7],[25,-5,7],[25,-5,3]]} color="#607c8b" width={1}/>
  <Face points={[[16,-7,7],[26,-7,7],[26,-3,7],[16,-3,7]]} fill="#c79f71"/>
  <Line points={[[16,-7,10],[26,-7,10]]} color="#d6b48a" width={2}/>
  <g transform={`translate(${p(18,8,3)})`}>
   <path d="M-3-11 2-9 5-10V0L1 2-3 0Z" fill="#527b91"/>
   <path d="M-2-10 1-9V-5L-2-6Z" fill="#b9dfeb"/>
   <path d="M-1-3 1-2" stroke="#eac16b" strokeWidth="1.2"/>
  </g>
  <Face points={[[-1,15,3],[9,15,3],[9,19,3],[-1,19,3]]} fill="#f8fafb"/>
  <Face points={[[-1,19,3],[9,19,3],[9,25,0],[-1,25,0]]} fill="#d8e4ea"/>
  <Line points={[[10,16,3],[10,16,7],[10,24,4]]} color="#8aa4b3" width={.7}/>
  <g transform={`translate(${p(-18,18,3)})`}>
   <path d="M-4-4 0-2 4-4V1L0 3-4 1Z" fill="#b4c5cf"/>
   <ellipse cy="-5" rx="4.6" ry="2.8" fill="#679a83"/>
   <ellipse cx="-1" cy="-6" rx="3" ry="2" fill="#8eb69a"/>
  </g>
 </g>;
}
