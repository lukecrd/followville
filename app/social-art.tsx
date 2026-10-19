import type {ResidentShop,TownParty} from '../lib/social';
export function SocialBuildingDecor({shop,party,kind,size}:{shop?:ResidentShop;party?:TownParty;kind:string;size:number}){
 const y=kind==='office'?-88:kind==='mall'?-62:-49;
 return <g pointerEvents="none" transform={`scale(${24/size})`}>
  {shop&&<g transform={`translate(0 ${y})`}><title>{`${shop.name} · di @${shop.owner}`}</title><path d="M0 8V15" stroke="#607e90" strokeWidth="1.2"/><rect x="-29" y="-7" width="58" height="15" rx="4" fill="#fff" stroke={shop.color} strokeWidth="1.4"/><rect x="-29" y="-7" width="5" height="15" rx="2" fill={shop.color}/><text x="2" y="3" textAnchor="middle" fontSize="5.5" fontWeight="650" fontFamily="system-ui,sans-serif" fill="#34586e">{shop.name.length>16?shop.name.slice(0,15)+'…':shop.name}</text></g>}
  {party&&<g><title>{`${party.title} · ${party.live?'festa in corso':'festa in programma'}`}</title><path d="M-31-4v-31M31-4v-31" stroke="#809cab" strokeWidth="1"/><path d="M-31-31Q0-13 31-31" fill="none" stroke="#91adba" strokeWidth=".8"/>{[-24,-12,0,12,24].map((x,i)=><path key={x} d={`M${x-4} ${-25+Math.abs(x)*-.2}h8l-4 8Z`} fill={['#e8ad8c','#5db3ad','#d6b864'][i%3]}/>)}<rect x="-24" y="3" width="48" height="12" rx="5" fill={party.live?'#218c85':'#ecebfa'} stroke="#fff" strokeWidth=".6"/><text textAnchor="middle" y="11" fontFamily="system-ui,sans-serif" fontSize="5.5" fontWeight="650" fill={party.live?'#fff':'#8a88ae'}>{party.live?'FESTA IN CORSO':'FESTA IN ARRIVO'}</text></g>}
 </g>;
}
