import {BridgeArt} from './bridge-art';
import React from 'react';
import {Kind} from '../lib/town';
import {MAP} from '../lib/terrain';
import {MeadowTree} from './landscape';
const p=(x:number,y:number,z=0)=>`${x-y},${(x+y)*.5-z}`;
const poly=(v:number[][])=>v.map(([x,y,z=0])=>p(x,y,z)).join(' ');
function Site({large=false,green=false}:{large?:boolean;green?:boolean}){const r=large?28:16;return <><ellipse cy={large?8:5} rx={large?50:30} ry={large?22:12} fill={MAP.shadow} opacity=".08"/><polygon points={poly([[-r,-r],[r,-r],[r,r],[-r,r]])} fill={green?MAP.lawn:MAP.paving}/></>}
function Block({x,y,w,d,h,roof=MAP.wallSide,wall=MAP.wall}:{x:number;y:number;w:number;d:number;h:number;roof?:string;wall?:string}){return <><polygon points={poly([[x,y+d,0],[x+w,y+d,0],[x+w,y+d,h],[x,y+d,h]])} fill={wall}/><polygon points={poly([[x+w,y,0],[x+w,y+d,0],[x+w,y+d,h],[x+w,y,h]])} fill={MAP.wallSide}/><polygon points={poly([[x,y,h],[x+w,y,h],[x+w,y+d,h],[x,y+d,h]])} fill={roof}/></>}
// Ribbon windows: one glass band per floor on each visible face.
function Windows({x,y,w,d,h,rows=2}:{x:number;y:number;w:number;d:number;h:number;rows?:number}){return <>{Array.from({length:rows},(_,r)=>{const top=h-6-r*10,bottom=top-6;return <React.Fragment key={r}><polygon points={poly([[x+3,y+d+.1,bottom],[x+w-3,y+d+.1,bottom],[x+w-3,y+d+.1,top],[x+3,y+d+.1,top]])} fill={MAP.glass}/><polygon points={poly([[x+w+.1,y+3,bottom],[x+w+.1,y+d-3,bottom],[x+w+.1,y+d-3,top],[x+w+.1,y+3,top]])} fill={MAP.glassSide}/></React.Fragment>;})}</>}
// Flat sign plates: `left` lies on a +y facing wall, otherwise on a +x facing wall.
const plate=(x:number,y:number,z:number,left=true)=>`matrix(1 ${left?.5:-.5} 0 1 ${p(x,y,z)})`;
const face=(points:number[][])=>`M${poly(points)}Z`;
export function TownHallArt({color='#a8b6a0'}:{color?:string}){return <g className="townhall-art"><title>Municipio · sede dell’amministratore e bacheca</title><Site large/><Block x={-8} y={-8} w={16} d={16} h={75} roof={MAP.steel}/><polygon points={poly([[-11,-11,75],[11,-11,75],[0,0,88]])} fill={MAP.steel}/><polygon points={poly([[11,-11,75],[11,11,75],[0,0,88]])} fill={MAP.ink}/><path d="M0-88V-103" stroke={MAP.sleeper} strokeWidth="1.3"/><path d="M0-103 14-98 0-94Z" fill={MAP.amber}/><g transform="translate(-8 -61)"><ellipse rx="5.8" ry="6.2" fill="#fff" stroke={MAP.line}/><path d="M0-4v4l3 2" stroke={MAP.ink} fill="none" strokeWidth=".9"/></g><Block x={-25} y={-22} w={50} d={44} h={30} roof={color}/><Windows x={-25} y={-22} w={50} d={44} h={30}/><polygon points={poly([[-28,23,22],[10,23,22],[13,30,22],[-28,30,22]])} fill={MAP.wall}/>{[-24,-13,-2,9].map(x=><path key={x} d={'M'+p(x,29,22)+'L'+p(x,29,1)} stroke="#fff" strokeWidth="2.8"/>)}<polygon points={poly([[-5,22,0],[5,22,0],[5,22,16],[-5,22,16]])} fill={MAP.ink}/><path d="M-32 13 -10 24 1 18M-34 16-12 27 1 20" stroke={MAP.paving} strokeWidth="2" fill="none"/><g transform="matrix(1 .5 0 1 -42 -22)"><rect width="36" height="6" rx="1" fill={MAP.ink}/><text x="18" y="4.6" fontSize="4.1" fontWeight="650" letterSpacing=".4" textAnchor="middle" fill="#fff">MUNICIPIO</text></g><g transform="translate(-31 17)"><title>Ufficio dell’amministratore</title><path d="M-1.2-5v5M1.2-5v5" stroke={MAP.ink} strokeWidth="1.6"/><path d="M-2-10h4l1 6h-6Z" fill={MAP.steel}/><path d="M0-10v4" stroke={MAP.amber} strokeWidth="1"/><circle cy="-12" r="2.1" fill="#e4bd97"/><path d="M-2-13q1-3 4 0" fill={MAP.ink}/></g><g transform="translate(31 13)"><path d="M-6-2v10M6-2V8" stroke={MAP.sleeper} strokeWidth="1.3"/><rect x="-8" y="-13" width="16" height="12" rx="1" fill={MAP.amberDark} stroke={MAP.wall}/><path d="M-5-10h4v6h-4ZM1-10h4v4H1Z" fill="#fff"/><circle cx="-3" cy="-10" r=".7" fill={MAP.red}/></g></g>}
function Mall({color}:{color:string}){return <g><Site large/><Block x={-25} y={-20} w={50} d={40} h={24} roof={color}/><Windows x={-25} y={-20} w={50} d={40} h={24} rows={1}/><path d={face([[-14,-10,24.1],[-2,-10,24.1],[-2,6,24.1],[-14,6,24.1]])+face([[4,-10,24.1],[16,-10,24.1],[16,6,24.1],[4,6,24.1]])} fill={MAP.glass}/><polygon points={poly([[-10,20.1,0],[4,20.1,0],[4,20.1,11],[-10,20.1,11]])} fill={MAP.glassSide}/><polygon points={poly([[-12,20,12],[6,20,12],[6,26,12],[-12,26,12]])} fill={MAP.wall}/><g transform={plate(25.1,-6,22,false)}><rect width="12" height="9" rx="1.5" fill={MAP.amber}/><path d="M4 0v-1.5q2-3 4 0V0" fill="none" stroke={MAP.ink} strokeWidth=".9"/></g></g>}
// Stadium: a rectangular bowl with raked stands, canopies over the two back stands and four low masts.
const ST={ox:24,oy:19,ix:16,iy:11};
const ring=(t:number)=>{const x=ST.ix+(ST.ox-ST.ix)*t,y=ST.iy+(ST.oy-ST.iy)*t,z=2+6*t;return face([[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]]);};
function Stadium({color}:{color:string}){const {ox,oy,ix,iy}=ST;return <g className="stadium-art"><title>Stadio con tribune coperte e campo da calcio</title><Site large/>
 <polygon points={poly([[-ox,oy,0],[ox,oy,0],[ox,oy,8],[-ox,oy,8]])} fill={MAP.wall}/><polygon points={poly([[ox,-oy,0],[ox,oy,0],[ox,oy,8],[ox,-oy,8]])} fill={MAP.wallSide}/>
 <path d={face([[-ox+4,oy,0],[-ox+8,oy,0],[-ox+8,oy,4],[-ox+4,oy,4]])+face([[-2,oy,0],[2,oy,0],[2,oy,4],[-2,oy,4]])+face([[ox-8,oy,0],[ox-4,oy,0],[ox-4,oy,4],[ox-8,oy,4]])} fill={MAP.ink}/>
 <path d={ring(1)+ring(0)} fillRule="evenodd" fill={color}/>
 <path d={ring(1/3)+ring(2/3)} fill="none" stroke={MAP.wall} strokeWidth=".6"/>
 <path d={face([[-ix,-iy,.5],[ix,-iy,.5],[ix,-iy,2],[-ix,-iy,2]])+face([[-ix,-iy,.5],[-ix,iy,.5],[-ix,iy,2],[-ix,-iy,2]])} fill={MAP.wallSide}/>
 <g transform="matrix(1 .5 -1 .5 0 -.5)"><path d={`M${-ix}${-iy}h${ix*2}v${iy*2}h${-ix*2}z`} fill={MAP.lawn}/><path d="M-16-11h4v22h-4zM-8-11h4v22h-4zM0-11h4v22h-4zM8-11h4v22h-4z" fill={MAP.lawnSide}/><path d="M-15-10h30v20h-30zM0-10v20M3 0a3 3 0 1 0-6 0a3 3 0 1 0 6 0M-15-5h5v10h-5M15-5h-5v10h5" fill="none" stroke="#fff" strokeWidth=".6"/></g>
 <path d={face([[-ox,-oy,8],[ox,-oy,8],[ox,-oy,15],[-ox,-oy,15]])+face([[-ox,-oy,8],[-ox,oy,8],[-ox,oy,15],[-ox,-oy,15]])+face([[-ox+6,-oy+6,14],[ox,-oy+6,14],[ox,-oy+6,15],[-ox+6,-oy+6,15]])+face([[-ox+6,-oy+6,14],[-ox+6,oy,14],[-ox+6,oy,15],[-ox+6,-oy+6,15]])} fill={MAP.wallSide}/>
 <path d={face([[-ox,-oy,15],[ox,-oy,15],[ox,-oy+6,15],[-ox+6,-oy+6,15],[-ox+6,oy,15],[-ox,oy,15]])} fill={MAP.wall}/>
 <path d={[[-1,-1],[1,-1],[-1,1]].map(([sx,sy])=>`M${p(sx*ox,sy*oy,8)}L${p(sx*ox,sy*oy,24)}`).join('')} stroke={MAP.road} strokeWidth="1"/>
 <path d={[[-1,-1],[1,-1],[-1,1]].map(([sx,sy])=>{const [x,y]=p(sx*ox,sy*oy,24).split(',').map(Number);return `M${x-3} ${y-2.5}h6v2.5h-6z`;}).join('')} fill="#fff" stroke={MAP.road} strokeWidth=".4"/>
</g>}
// Zoo and amusement park share one raised lawn plinth with a pale entrance path.
function ParkBase({path}:{path:number[][]}){const r=28;return <><ellipse cy="6" rx="46" ry="20" fill={MAP.shadow} opacity=".08"/><polygon points={poly([[-r,r,0],[r,r,0],[r,-r,0],[r,-r,2],[r,r,2],[-r,r,2]])} fill={MAP.lawnSide}/><polygon points={poly([[-r,-r,2],[r,-r,2],[r,r,2],[-r,r,2]])} fill={MAP.lawn}/><polyline points={poly(path)} fill="none" stroke={MAP.paving} strokeWidth="5" strokeLinejoin="round"/></>}
function Giraffe(){return <g><path d="M-8-13.5v8M-4-11.5v8M1-9v8M4-7.5v8M6-32v-3M8.5-31v-3" stroke={MAP.amberDark} strokeWidth="1.8" strokeLinecap="round"/><path d="M-10-20 5-12.5 5-5.5-10-13ZM1-14 5-12 9-29 5-31ZM4-32 12-29 12-26 6-27.5Z" fill={MAP.amber} strokeLinejoin="round"/><path d="M-7-16h3v2.5h-3zM-2-13.5h3v2.5h-3zM4.5-20h2v2h-2zM5.5-26h2v2h-2z" fill={MAP.amberDark}/></g>}
function Elephant(){return <g><path d="M-7-6v6M-1-5v6M4-6v6M12-11q2 7-2 10" stroke={MAP.roadEdge} strokeWidth="2.6" strokeLinecap="round" fill="none"/><ellipse cx="-2" cy="-11" rx="9.5" ry="6.5" fill={MAP.road}/><ellipse cx="8" cy="-13" rx="5" ry="5.5" fill={MAP.road}/><ellipse cx="5.5" cy="-13" rx="3.5" ry="4.5" fill={MAP.roadEdge}/></g>}
// Paddock fence: posts on the four corners and mid-sides, one rail ring on top.
const PADDOCK=[[-24,-24],[-10,-24],[4,-24],[4,-10],[4,4],[-10,4],[-24,4],[-24,-10]];
function Zoo(){return <g className="zoo-art"><title>Zoo con recinto delle giraffe, elefante e laghetto</title><ParkBase path={[[-28,10,2],[-4,10,2],[-4,28,2]]}/>
 <ellipse cx="24" cy="2" rx="12" ry="6" fill={MAP.water}/>
 <path d={PADDOCK.map(([x,y])=>`M${p(x,y,2)}L${p(x,y,8)}`).join('')} stroke={MAP.amberDark} strokeWidth="1.6" strokeLinecap="round"/>
 <polyline points={poly([...PADDOCK,PADDOCK[0]].map(([x,y])=>[x,y,7]))} fill="none" stroke={MAP.amberDark} strokeWidth="1.1" strokeLinejoin="round"/>
 <g transform={`translate(${p(-4,-22,2)}) scale(.55)`}><MeadowTree/></g>
 <g transform={`translate(${p(-12,-8,2)})`}><Giraffe/></g>
 <g transform={`translate(${p(16,18,2)})`}><Elephant/></g>
 <g transform={`matrix(1 .5 0 1 ${p(-26,28,9)})`}><rect width="18" height="7" rx="1" fill={MAP.ink}/><text x="9" y="5.1" textAnchor="middle" fontFamily="Inter,ui-sans-serif,system-ui,sans-serif" fontSize="4.5" fontWeight="700" letterSpacing=".8" fill="#fff">ZOO</text></g>
</g>}
// Ferris wheel: hub 32 above the lawn, radius 20, so the lowest cabin clears the ground; cabins are centred on the rim.
const WHEEL=Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3+Math.PI/6)*20,Math.sin(i*Math.PI/3+Math.PI/6)*20-32]);
function Amusement({color}:{color:string}){return <g className="amusement-art"><title>Parco divertimenti con ruota panoramica e giostra</title><ParkBase path={[[-28,12,2],[12,12,2],[12,28,2]]}/>
 <Block x={-24} y={16} w={10} d={8} h={10} roof={color}/>
 <g transform={`translate(${p(-14,-4,2)})`}>
  <circle cy="-32" r="20" fill="none" stroke={color} strokeWidth="2.2"/>
  <path d={WHEEL.slice(0,3).map(([x,y])=>`M${x} ${y}L${-x} ${-64-y}`).join('')} stroke={MAP.wallSide} strokeWidth=".9"/>
  {[0,1].map(k=><path key={k} d={WHEEL.filter((_,i)=>i%2===k).map(([x,y])=>`M${x-3} ${y-2.5}h6v5h-6z`).join('')} fill={k?MAP.amber:color} stroke={MAP.wall} strokeWidth=".6"/>)}
  <path d="M-9 0-1-32M9 0 1-32M-11 0h22" stroke={MAP.road} strokeWidth="2.2" strokeLinecap="round"/>
  <circle cy="-32" r="2.6" fill={MAP.wall} stroke={MAP.road}/>
 </g>
 <g transform={`translate(${p(18,-2,2)})`}>
  <ellipse cy="1" rx="14" ry="7" fill={MAP.wallSide}/><ellipse cy="-1" rx="14" ry="7" fill={MAP.wall}/>
  <path d="M-10-2v-14M10-2v-14M0 4v-14" stroke={MAP.steel} strokeWidth="1.2"/>
  <path d="M0-31-16-16Q-8-10 0-10Z" fill={color}/><path d="M0-31 16-16Q8-10 0-10Z" fill={MAP.amber}/>
 </g>
</g>}
function Hospital({color}:{color:string}){return <g><Site large/><Block x={-23} y={-22} w={34} d={34} h={49} roof={color}/><Windows x={-23} y={-22} w={34} d={34} h={49} rows={4}/><ellipse cx={-6-(-5)} cy={(-6-5)*.5-49} rx="11" ry="5.5" fill={MAP.wall}/><text x="1" y="-52.5" textAnchor="middle" fontFamily="Inter,ui-sans-serif,system-ui,sans-serif" fontSize="7" fontWeight="700" fill={MAP.ink}>H</text><Block x={11} y={-8} w={15} d={30} h={20} roof={MAP.wall}/><g transform={plate(11.1,-6,44,false)}><rect width="11" height="11" rx="2" fill="#fff"/><path d="M4.3 2h2.4v3.3H10v2.4H6.7V11H4.3V7.7H1V5.3h3.3z" fill={MAP.red}/></g><Block x={-6} y={19} w={16} d={7} h={8} roof={MAP.wall}/></g>}
function Sports({color}:{color:string}){return <g><Site large green/><polygon points={poly([[-25,-7,.2],[-1,-7,.2],[-1,23,.2],[-25,23,.2]])} fill={MAP.paving}/><polygon points={poly([[-22,-4,.3],[-4,-4,.3],[-4,20,.3],[-22,20,.3]])} fill={MAP.water}/><path d={[0,1,2].map(i=>`M${p(-20,-1+i*7,.3)}L${p(-6,-1+i*7,.3)}`).join('')} stroke={MAP.wall} strokeWidth=".8"/><polygon points={poly([[3,-5,.2],[25,-5,.2],[25,23,.2],[3,23,.2]])} fill={MAP.lawnSide}/><path transform="matrix(1 .5 -1 .5 0 -.2)" d="M3 9h22M6-2h16v22H6zM14-2v22" stroke="#fff" strokeWidth=".8" fill="none"/><Block x={-17} y={-25} w={37} d={15} h={18} roof={color}/><Windows x={-17} y={-25} w={37} d={15} h={18} rows={1}/></g>}
// Power plant: striped chimney, steaming cooling tower, turbine hall and a fenced transformer yard by the entrance.
const YARD=[[8,4],[26,4],[26,26],[8,26]];
function PowerPlant({color}:{color:string}){return <g className="powerplant-art"><title>Centrale elettrica con torre di raffreddamento e cabina di trasformazione</title><Site large/>
 <Block x={-24} y={-26} w={6} d={6} h={60}/><path d={face([[-24,-19.9,48],[-18,-19.9,48],[-18,-19.9,54],[-24,-19.9,54]])+face([[-17.9,-26,48],[-17.9,-20,48],[-17.9,-20,54],[-17.9,-26,54]])} fill={MAP.red}/>
 <g transform={`translate(${p(12,-14)})`}><ellipse rx="12" ry="5" fill={MAP.wallSide}/><path d="M-12 0Q-5-16-8-34H8Q5-16 12 0Z" fill={MAP.wall}/><path d="M0 0V-34H8Q5-16 12 0Z" fill={MAP.wallSide}/><ellipse cy="-34" rx="8" ry="3.4" fill={MAP.steel} stroke={MAP.wall}/><g fill="#fff" opacity=".85">{[[-2,-40,5],[4,-45,4.5],[0,-51,3.5]].map(([cx,cy,r])=><circle key={cy} cx={cx} cy={cy} r={r}/>)}</g></g>
 <Block x={-24} y={-8} w={28} d={30} h={24} roof={color}/><Windows x={-24} y={-8} w={28} d={30} h={24} rows={1}/><g transform={plate(-20,22.1,12)}><rect width="10" height="10" rx="1.5" fill={MAP.amber}/><path d="M6 1 2 5.5h3L4 9l4-4.6H5Z" fill={MAP.ink}/></g>
 <polygon points={poly(YARD.map(([x,y])=>[x,y,.2]))} fill={MAP.wallSide} opacity=".5"/>
 {[[11,8],[19,8],[11,16],[19,16]].map(([x,y])=><React.Fragment key={x+':'+y}><Block x={x} y={y} w={5} d={5} h={7} roof={MAP.steel}/><path d={[1.5,3.5].map(o=>`M${p(x+o,y+2.5,7)}L${p(x+o,y+2.5,10)}`).join('')} stroke={MAP.ink} strokeWidth=".9"/></React.Fragment>)}
 <path d={YARD.map(([x,y])=>`M${p(x,y,0)}L${p(x,y,5)}`).join('')} stroke={MAP.steel} strokeWidth="1"/><polyline points={poly([...YARD,YARD[0]].map(([x,y])=>[x,y,5]))} fill="none" stroke={MAP.steel} strokeWidth=".7"/>
</g>}
// Water tower: a round tank on four braced legs, with a small pump house at its foot.
const LEGS=[[-7,-7],[7,-7],[-7,7],[7,7]];
function WaterTower({color}:{color:string}){return <g className="watertower-art"><title>Acquedotto con serbatoio sopraelevato</title><Site/>
 <Block x={4} y={-14} w={9} d={7} h={8} roof={color}/>
 <path d={LEGS.map(([x,y])=>`M${p(x,y,0)}L${p(x*.7,y*.7,30)}`).join('')} stroke={MAP.steel} strokeWidth="1.6"/>
 <path d={`M${p(-7,7,3)}L${p(4.9,4.9,27)}M${p(7,7,3)}L${p(-4.9,4.9,27)}M${p(7,-7,3)}L${p(4.9,4.9,27)}M${p(7,7,3)}L${p(4.9,-4.9,27)}`} stroke={MAP.steel} strokeWidth=".7"/>
 <g transform={`translate(${p(0,0,30)})`}><path d="M-13 0V-15H13V0A13 6.5 0 0 1-13 0Z" fill={color}/><path d="M0 6.5V-15H13V0A13 6.5 0 0 1 0 6.5Z" fill={MAP.shadow} opacity=".16"/><path d="M-13-7A13 6.5 0 0 0 13-7" fill="none" stroke={MAP.wall} strokeWidth=".8" opacity=".6"/><path d="M-13-15A13 6.5 0 0 0 13-15L0-26Z" fill={MAP.steel}/><path d="M0-8.5A13 6.5 0 0 0 13-15L0-26Z" fill={MAP.ink} opacity=".25"/><path d="M-6-12q-3.5 4.5-3.5 6.5a3.5 3.5 0 0 0 7 0q0-2-3.5-6.5Z" fill="#fff"/></g>
</g>}
// Small civic buildings share one body; each kind adds a single recognisable feature.
function Temple({h}:{h:number}){return <><polygon points={poly([[-13,13.1,0],[13,13.1,0],[13,13.1,h-3],[-13,13.1,h-3]])} fill={MAP.wallSide}/><path d={[-10,-4,2,8].map(x=>`M${p(x+1,15,0)}L${p(x+1,15,h-3)}`).join('')} stroke="#fff" strokeWidth="2.6"/></>}
function Civic({kind,color}:{kind:Kind;color:string}){
 const h={school:30,market:20,clinic:30,library:26,cinema:26,museum:22,firestation:24,police:30,bank:30}[kind as string]||30;
 const rows=kind==='market'||kind==='cinema'?1:0,own=['school','clinic','library','police'].includes(kind);
 return <g><Site/>{!own&&<Block x={-14} y={-13} w={28} d={26} h={h} roof={color}/>}{rows>0&&<Windows x={-14} y={-13} w={28} d={26} h={h} rows={rows}/>}
 {/* School: low L of two wings around a playground, flag on the back wing. */}
 {kind==='school'&&<><Block x={-15} y={-13} w={30} d={12} h={18} roof={color}/><Windows x={-15} y={-13} w={30} d={12} h={18} rows={1}/><polygon points={poly([[-2,1,.2],[15,1,.2],[15,14,.2],[-2,14,.2]])} fill={MAP.lawn}/><path d={`M${p(6.5,1,.3)}L${p(6.5,14,.3)}`} stroke="#fff" strokeWidth=".8"/><Block x={-15} y={-1} w={12} d={14} h={18} roof={color}/><Windows x={-15} y={-1} w={12} d={14} h={18} rows={1}/><path d={`M${p(10,-8,18)}L${p(10,-8,34)}`} stroke={MAP.sleeper} strokeWidth="1.2"/><path d={`M${p(10,-8,34)}l12 3-12 4z`} fill={MAP.amber}/></>}
 {kind==='market'&&<><polygon points={poly([[-14,13,15],[14,13,15],[14,19,11],[-14,19,11]])} fill={color}/><path d={[-10,-3,4].map(x=>face([[x,13,15],[x+3.5,13,15],[x+3.5,19,11],[x,19,11]])).join('')} fill="#fff"/><path d={[-11,-2,7].map(x=>face([[x,20,0],[x+5,20,0],[x+5,20,3.5],[x,20,3.5]])).join('')} fill={MAP.amberDark}/></>}
 {/* Clinic: compact white block, low entrance canopy, large red cross on the side wall. */}
 {kind==='clinic'&&<><Block x={-11} y={-10} w={22} d={20} h={24} roof={color}/><Windows x={-11} y={-10} w={22} d={20} h={24} rows={1}/><polygon points={poly([[-5,10.1,0],[5,10.1,0],[5,10.1,8],[-5,10.1,8]])} fill={MAP.glassSide}/><polygon points={poly([[-7,10,9],[7,10,9],[7,16,9],[-7,16,9]])} fill="#fff"/><g transform={plate(11.1,6,13,false)}><path d="M4.5 0h4v4.5H13v4H8.5V13h-4V8.5H0v-4h4.5z" fill={MAP.red}/></g></>}
 {/* Library: classical front with steps, a tall glass ground floor, pediment and the book sign. */}
 {kind==='library'&&<><Block x={-14} y={-11} w={28} d={22} h={24} roof={color}/><polygon points={poly([[-11,11,1.5],[11,11,1.5],[11,16,1.5],[-11,16,1.5]])} fill={MAP.paving}/><polygon points={poly([[-11,16,0],[11,16,0],[11,16,1.5],[-11,16,1.5]])} fill={MAP.wallSide}/><polygon points={poly([[-9,11.1,1.5],[9,11.1,1.5],[9,11.1,15],[-9,11.1,15]])} fill={MAP.glass}/><path d={[-9,-3,3,9].map(x=>`M${p(x,11.3,1.5)}L${p(x,11.3,16)}`).join('')} stroke="#fff" strokeWidth="2.2"/><polygon points={poly([[-11,11.4,16],[11,11.4,16],[0,11.4,22]])} fill={color}/><g transform={plate(14.1,-1,19,false)}><path d="M0 1 6 2.2 12 1V9L6 10.2 0 9Z" fill="#fff"/><path d="M6 2.2v8M1.8 3.6l2.6.5M1.8 5.8l2.6.5M7.6 4.1l2.6-.5M7.6 6.3l2.6-.5" stroke={color} strokeWidth=".8"/></g></>}
 {kind==='cinema'&&<><polygon points={poly([[-4,13.1,0],[8,13.1,0],[8,13.1,9],[-4,13.1,9]])} fill={MAP.glassSide}/><g transform={plate(-13,13.2,h-3)}><rect width="26" height="8" rx="1" fill={MAP.ink}/><text x="13" y="5.6" textAnchor="middle" fontFamily="Inter,ui-sans-serif,system-ui,sans-serif" fontSize="4.6" fontWeight="700" letterSpacing="1" fill={MAP.amber}>CINEMA</text></g><polygon points={poly([[14.1,-8,4],[14.1,2,4],[14.1,2,19],[14.1,-8,19]])} fill={MAP.amber}/></>}
 {kind==='museum'&&<><Temple h={h}/><polygon points={poly([[-15,-13,h],[-15,14,h],[0,14,h+9],[0,-13,h+9]])} fill={color}/><polygon points={poly([[0,-13,h+9],[0,14,h+9],[15,14,h],[15,-13,h]])} fill={color}/><polygon points={poly([[0,-13,h+9],[0,14,h+9],[15,14,h],[15,-13,h]])} fill={MAP.shadow} opacity=".18"/><polygon points={poly([[-15,14,h],[15,14,h],[0,14,h+9]])} fill="#fff"/></>}
 {kind==='firestation'&&<><path d={face([[-11,13.1,0],[-3,13.1,0],[-3,13.1,14],[-11,13.1,14]])+face([[0,13.1,0],[8,13.1,0],[8,13.1,14],[0,13.1,14]])} fill={MAP.red}/><path d={[4.7,9.4].map(z=>`M${p(-11,13.2,z)}L${p(-3,13.2,z)}M${p(0,13.2,z)}L${p(8,13.2,z)}`).join('')} stroke="#fff" strokeWidth=".6"/><Block x={4} y={-12} w={8} d={8} h={44} roof={MAP.red}/></>}
 {/* Police: squat block with a navy band, badge on the front and a blue/red light on the roof. */}
 {kind==='police'&&<><Block x={-15} y={-13} w={30} d={26} h={20} roof={color}/><path d={face([[-15,13.1,13],[15,13.1,13],[15,13.1,17],[-15,13.1,17]])+face([[15.1,-13,13],[15.1,13,13],[15.1,13,17],[15.1,-13,17]])} fill={MAP.ink}/><Windows x={-15} y={-13} w={30} d={26} h={14} rows={1}/><g transform={`${plate(-3,13.2,12)} scale(.75)`}><path d="M0-1h10v6q0 5-5 7-5-2-5-7Z" fill={MAP.steel}/><path d="m5 1.5 1.2 2.4 2.6.4-1.9 1.8.5 2.6L5 7.5 2.6 8.7l.5-2.6-1.9-1.8 2.6-.4Z" fill={MAP.amber}/></g><path d={face([[-4,-2,22.5],[0,-2,22.5],[0,2,22.5],[-4,2,22.5]])} fill={MAP.glass}/><path d={face([[0,-2,22.5],[4,-2,22.5],[4,2,22.5],[0,2,22.5]])} fill={MAP.red}/></>}
 {kind==='bank'&&<><Temple h={h}/><g transform={plate(14.1,-3,h-5,false)}><circle cx="5" cy="4" r="5" fill={MAP.amber}/><text x="5" y="6.6" textAnchor="middle" fontFamily="Inter,ui-sans-serif,system-ui,sans-serif" fontSize="7" fontWeight="700" fill={MAP.ink}>€</text></g></>}
 </g>}
export function LandmarkArt({kind,color}:{kind:Kind;color:string}){if(kind==='townhall')return <TownHallArt color={color}/>;if(kind==='mall')return <Mall color={color}/>;if(kind==='stadium')return <Stadium color={color}/>;if(kind==='zoo')return <Zoo/>;if(kind==='amusement')return <Amusement color={color}/>;if(kind==='hospital')return <Hospital color={color}/>;if(kind==='sports')return <Sports color={color}/>;if(kind==='bridge')return <BridgeArt color={color}/>;if(kind==='powerplant')return <PowerPlant color={color}/>;if(kind==='watertower')return <WaterTower color={color}/>;return <Civic kind={kind} color={color}/>;}
