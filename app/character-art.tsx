import {readAppearance,type CharacterAppearance} from '../lib/appearance';
import {walkerPose,type WalkerPose} from '../lib/walking';

const RESTING_POSE=walkerPose(0,{x:1,y:0},0);
function Hair({style,back=false}:{style:CharacterAppearance['hairStyle'];back?:boolean}){
 if(style==='shaved')return null;
 if(style==='curls')return <path d={back?'M-6 2Q-9 -1 -6 -4Q-7 -8 -3 -7Q0 -10 3 -7Q8 -8 7 -3Q9 1 5 3Q0 6 -6 2Z':'M-5 1Q-9 0 -7 -4Q-7 -8 -3 -7Q0 -10 3 -7Q8 -8 7 -3Q9 1 5 2L4 -2Q1 0 -1 -3Q-4 0 -5 1Z'}/>;
 if(style==='bob'||style==='long')return <path d={back?`M-6 0Q-7 -8 0 -6.8Q7 -8 6 0L${style==='long'?'7 13Q0 16 -7 13':'6 6Q0 9 -6 6'}Z`:`M-6 0Q-7 -8 0 -6.8Q7 -8 6 0L${style==='long'?'7 13L4 12':'6 6L4 5'}L4 -3Q0 -1 -4 -3L-4 ${style==='long'?'12L-7 13':'5L-6 6'}Z`}/>;
 return <path d={back?'M-5.7 1Q-6.6 -7.8 0 -6.5Q6.6 -7.8 5.7 1Q0 5 -5.7 1Z':'M-5.8 0Q-6.5 -8.1 .5 -6.5Q7 -6 5.7 1L3.8 -3.5Q0 -2 -4.8 -3Z'}/>;
}
export function WalkingAvatar({color='#76938b',appearance,pose=RESTING_POSE}:{color?:string;appearance?:CharacterAppearance;pose?:WalkerPose}){
 const a=readAppearance(appearance,color),front=!!pose.face,headTransform=`translate(${pose.head.x} ${pose.head.y})`;
 return <g strokeLinecap="round" strokeLinejoin="round" data-character-style={a.outfit}>
  <ellipse cy="1.8" rx="7.5" ry="3.2" fill="#355342" opacity=".13"/>
  <path data-walk="farLeg" d={pose.farLeg} fill="none" stroke={a.pants} strokeWidth="3.3"/>
  <path data-walk="farShoe" d={pose.farShoe} fill="none" stroke={a.shoes} strokeWidth="2.7"/>
  <path data-walk="farArm" d={pose.farArm} fill="none" stroke={a.skin} strokeWidth="2.6"/>
  <path data-walk="torso" d={pose.torso} fill={a.shirt} stroke={a.outfit==='jacket'?'#283e3d':a.shirt} strokeWidth={a.outfit==='jacket'?'1':'.5'}/>
  <path data-walk="nearLeg" d={pose.nearLeg} fill="none" stroke={a.pants} strokeWidth="3.3"/>
  <path data-walk="nearShoe" d={pose.nearShoe} fill="none" stroke={a.shoes} strokeWidth="2.7"/>
  <path data-walk="nearArm" d={pose.nearArm} fill="none" stroke={a.skin} strokeWidth="2.6"/>
  {a.outfit!=='tee'&&<><path data-walk="farArm" d={pose.farArm} fill="none" stroke={a.shirt} strokeWidth="3.5"/><path data-walk="nearArm" d={pose.nearArm} fill="none" stroke={a.shirt} strokeWidth="3.5"/></>}
  <g data-avatar-anchor transform={headTransform}>
   {a.outfit==='hoodie'&&<path d="M-4.6 7Q0 15 4.6 7L3 10L0 14L-3 10Z" fill="#f1e8d6" opacity=".85"/>}
   {a.outfit==='jacket'&&<g data-avatar-facing="front" display={front?'inline':'none'}><path d="M-3.5 8L0 13L3.5 8M0 13V20" stroke="#f1e8d6" strokeWidth="1.2" fill="none"/></g>}
  </g>
  <path data-walk="neck" d={pose.neck} fill="none" stroke={a.skin} strokeWidth="3.1"/>
  <circle data-walk-head cx={pose.head.x} cy={pose.head.y} r="5.7" fill={a.skin}/>
  <g data-avatar-anchor transform={headTransform} fill={a.hairColor} color={a.hairColor} data-hair-style={a.hairStyle}>
   <g data-avatar-facing="front" display={front?'inline':'none'}><Hair style={a.hairStyle}/></g>
   <g data-avatar-facing="back" display={front?'none':'inline'}><Hair style={a.hairStyle} back/></g>
  </g>
  <path data-walk="face" d={pose.face} stroke="#302c2a" strokeWidth=".9" fill="none"/>
  {(a.glasses||a.hat!=='none')&&<g data-avatar-anchor transform={headTransform}>
   {a.glasses&&<g data-avatar-facing="front" display={front?'inline':'none'} stroke="#303c43" strokeWidth=".7" fill="#e9f2f2" fillOpacity=".35"><rect x="-4.4" y="-1.2" width="3.5" height="2.8" rx=".8"/><rect x=".9" y="-1.2" width="3.5" height="2.8" rx=".8"/><path d="M-.9 -.1H.9M-5.6 -.7H-4.4M4.4 -.7H5.6" fill="none"/></g>}
   {a.hat==='cap'&&<g fill={a.shirt} stroke="#35463f" strokeWidth=".5"><path d="M-6 -3Q-6 -9 0 -8Q6 -9 6 -3Z"/><path d="M-6 -3Q2 -5 9 -2L5 -.5L-6 -1.5Z"/></g>}
   {a.hat==='beanie'&&<g fill={a.shirt}><path d="M-6 -3Q-6 -10 0 -9Q6 -10 6 -3Z"/><rect x="-6.4" y="-4" width="12.8" height="3" rx="1.3"/><circle cy="-10" r="2"/></g>}
  </g>}
 </g>;
}
export function AvatarArt({color='#76938b',appearance}:{color?:string;appearance?:CharacterAppearance;moving?:boolean}){return <WalkingAvatar color={color} appearance={appearance}/>;}
