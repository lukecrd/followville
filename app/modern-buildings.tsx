import React from 'react';

const p=(x:number,y:number,z=0)=>`${x-y},${(x+y)/2-z}`;
const poly=(points:number[][])=>points.map(([x,y,z=0])=>p(x,y,z)).join(' ');
function Volume({x,y,w,d,h,color='#f4f7fa',roof='#d8e3e8'}:{x:number;y:number;w:number;d:number;h:number;color?:string;roof?:string}){
 return <g strokeLinejoin="round"><polygon points={poly([[x,y+d],[x+w,y+d],[x+w,y+d,h],[x,y+d,h]])} fill={color}/><polygon points={poly([[x+w,y],[x+w,y+d],[x+w,y+d,h],[x+w,y,h]])} fill="#becdd7"/><polygon points={poly([[x,y,h],[x+w,y,h],[x+w,y+d,h],[x,y+d,h]])} fill={roof} stroke="#ffffff" strokeWidth=".6"/></g>;
}
function Glass({x,y,w,h,z=7,side=false}:{x:number;y:number;w:number;h:number;z?:number;side?:boolean}){
 const corners=side?[[x,y,z],[x,y+w,z],[x,y+w,z+h],[x,y,z+h]]:[[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]];
 return <g><polygon points={poly(corners)} fill={side?'#527e96':'#79aec5'} stroke="#f4f8fb" strokeWidth="1"/><path d={side?`M${p(x,y+w*.5,z)}L${p(x,y+w*.5,z+h)}`:`M${p(x+w*.5,y,z)}L${p(x+w*.5,y,z+h)}`} stroke="#d9edf4" strokeWidth=".8"/><path d={side?`M${p(x,y+2,z+h-3)}L${p(x,y+w-2,z+4)}`:`M${p(x+2,y,z+4)}L${p(x+w-2,y,z+h-3)}`} stroke="#d8edf4" strokeWidth="1.5" opacity=".45"/></g>;
}
function Planter({x,y}:{x:number;y:number}){return <g transform={`translate(${p(x,y)})`}><path d="M-5-5 0-2 5-5v6L0 4-5 1Z" fill="#d8dfdf"/><ellipse cy="-6" rx="6" ry="4" fill="#438c73"/><ellipse cx="-1" cy="-8" rx="4" ry="3" fill="#6aaf8a"/></g>;}
export function ModernHomeArt({kind,color,mini=false}:{kind:'cottage'|'villa'|'loft';color:string;mini?:boolean}){
 const villa=kind==='villa',loft=kind==='loft';
 return <g className="modern-home" transform={mini?'translate(0 10)':undefined}>
  <ellipse cx="5" cy="6" rx="34" ry="12" fill="#203d51" opacity=".13"/>
  <polygon points={poly([[-18,-17],[18,-17],[18,18],[-18,18]])} fill="#d5dcde"/>
  <Volume x={-14} y={-13} w={28} d={26} h={loft?43:34} roof={color}/>
  <Glass x={-11} y={13.1} w={15} h={17} z={8}/><Glass x={14.1} y={-9} w={17} h={18} z={8} side/>
  <polygon points={poly([[7,13.2,0],[12,13.2,0],[12,13.2,22],[7,13.2,22]])} fill="#324c61"/>
  <path d={`M${p(11,13.4,10)}L${p(11,13.4,13)}`} stroke="#e4ba6e" strokeWidth="1"/>
  <polygon points={poly([[-16,10,25],[16,10,25],[16,16,25],[-16,16,25]])} fill="#f8fbfc"/>
  {kind==='cottage'&&<><polygon points={poly([[-17,-16,34],[17,-16,34],[0,-16,48]])} fill="#d1e0e6"/><polygon points={poly([[17,-16,34],[17,16,34],[0,16,48],[0,-16,48]])} fill={color}/><polygon points={poly([[0,-16,48],[0,16,48],[-17,16,34],[-17,-16,34]])} fill={color}/><polygon points={poly([[-3,-10,46],[-3,6,46],[-12,6,38.5],[-12,-10,38.5]])} fill="#37566d" stroke="#9dc5d6" strokeWidth=".6"/><path d={`M${p(-7.5,-10,42.25)}L${p(-7.5,6,42.25)}`} stroke="#89b5c8" strokeWidth=".5"/></>}
  {villa&&<g transform="translate(-22 -7)"><Volume x={-9} y={-9} w={18} d={18} h={22} roof="#e7edef"/><Glass x={-6} y={9.1} w={12} h={11} z={5}/><path d="M-14-22 0-15 14-22" stroke={color} strokeWidth="2.5" fill="none"/></g>}
  {loft&&<><Volume x={-10} y={-9} w={20} d={15} h={52} roof="#eff4f6"/><Glass x={-8} y={6.1} w={16} h={9} z={40}/><polygon points={poly([[-8,-7,52],[-1,-7,52],[-1,3,52],[-8,3,52]])} fill="#32596f" stroke="#8db2c3" strokeWidth=".6"/></>}
  <polygon points={poly([[6,14],[14,14],[14,20],[6,20]])} fill="#f6f8f8"/>
  <Planter x={-12} y={19}/><Planter x={20} y={5}/>
 </g>;
}
export function ModernOfficeArt({color}:{color:string}){
 return <g><ellipse cy="6" rx="34" ry="12" fill="#203d51" opacity=".14"/><Volume x={-13} y={-13} w={26} d={26} h={95} roof={color}/>{[0,1,2,3,4].map(i=><g key={i}><Glass x={-11} y={13.1} w={22} h={12} z={9+i*17}/><Glass x={13.1} y={-11} w={22} h={12} z={9+i*17} side/><path d={`M${p(-14,14,6+i*17)}L${p(14,14,6+i*17)}L${p(14,-14,6+i*17)}`} fill="none" stroke="#eef4f7" strokeWidth="1.5"/></g>)}<g transform="translate(0 -95)"><Volume x={-7} y={-6} w={12} d={12} h={5} roof="#dbe5e9"/></g><polygon points={poly([[-17,9,7],[9,9,7],[9,17,7],[-17,17,7]])} fill="#eff6f8"/><Planter x={-17} y={15}/><Planter x={18} y={8}/></g>;
}

export function ModernCafeArt({color}:{color:string}){
 return <g><ellipse cy="7" rx="35" ry="13" fill="#203d51" opacity=".13"/><Volume x={-14} y={-13} w={28} d={26} h={33} roof={color}/><Glass x={-11} y={13.1} w={22} h={21} z={3}/><Glass x={14.1} y={-10} w={18} h={19} z={5} side/><polygon points={poly([[-17,9,26],[17,9,26],[17,19,23],[-17,19,23]])} fill="#f7f3e8"/>{[-12,-2,8].map(x=><polygon key={x} points={poly([[x,9,26],[x+4,9,26],[x+4,19,23],[x,19,23]])} fill={color}/>)}<g transform="matrix(1 .5 0 1 -24 -38)"><rect width="25" height="8" rx="2" fill="#263f53"/><text x="12.5" y="5.8" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="5" fontWeight="700" letterSpacing="1" fill="#fff">CAFÉ</text></g><g transform="translate(27 5)"><path d="M0 0v10" stroke="#647f91" strokeWidth="1.5"/><ellipse rx="8" ry="4" fill="#e0ba86"/><path d="M-8 8v6M8 8v6" stroke="#547483" strokeWidth="1.5"/><ellipse cx="-9" cy="6" rx="3" ry="2" fill="#6d96a2"/><ellipse cx="9" cy="6" rx="3" ry="2" fill="#6d96a2"/></g><Planter x={-17} y={17}/></g>;
}
