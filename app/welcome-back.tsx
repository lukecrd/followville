import {useEffect,useState} from 'react';
import {Sparkles,X} from 'lucide-react';
import {Town,salary} from '../lib/town';

// Remembers the last visit in this browser only: a per-viewer convenience, so a missing value just hides the card.
const key=(name:string)=>'followville:last-seen:'+name;
function readSeen(name:string){try{const v=Number(localStorage.getItem(key(name)));return v>0?v:null;}catch{return null;}}

export function welcomeBackLines(town:Town,name:string,since:number){
 const s=town.social,c=town.community,r=town.residents.find(p=>p.username===name),lines:string[]=[];
 const sales=s?.orders.filter(o=>o.seller===name&&o.createdAt>since)||[];
 if(sales.length)lines.push(`Hai venduto ${sales.length} ${sales.length===1?'prodotto':'prodotti'} nel tuo negozio: ✦ ${sales.reduce((n,o)=>n+o.price,0)}.`);
 const requests=s?.friendships.filter(f=>f.acceptedAt===null&&f.requester!==name&&(f.first===name||f.second===name)&&f.createdAt>since)||[];
 if(requests.length)lines.push(`${requests.length===1?'Una nuova richiesta':`${requests.length} nuove richieste`} di amicizia.`);
 const accepted=s?.friendships.filter(f=>f.acceptedAt!==null&&f.acceptedAt>since&&f.requester===name)||[];
 for(const f of accepted)lines.push(`@${f.first===name?f.second:f.first} ha accettato la tua amicizia.`);
 const built=c?.projects.filter(p=>p.completedAt!==null&&p.completedAt>since)||[];
 if(built.length)lines.push(`Realizzati dal quartiere: ${built.map(p=>p.title).join(', ')}.`);
 const opened=c?.projects.filter(p=>!p.completedAt&&p.createdAt>since&&p.createdBy!==name)||[];
 if(opened.length)lines.push(`${opened.length===1?'Un nuovo progetto cerca':`${opened.length} nuovi progetti cercano`} sostenitori.`);
 const parties=s?.parties.filter(p=>p.active&&p.createdAt>since)||[];
 if(parties.length)lines.push(`${parties.length===1?'Una nuova festa in programma':`${parties.length} nuove feste in programma`}.`);
 const rewards=s?.attendees.filter(a=>a.username===name&&!a.rewardDay&&s.parties.some(p=>p.id===a.partyId&&!p.cancelledAt&&p.endsAt<=town.now))||[];
 if(rewards.length)lines.push('Il premio di una festa ti aspetta nella sezione Quartiere.');
 const pay=r?salary(r,town.now):0;
 if(pay>0)lines.push(`Stipendio da riscuotere: ✦ ${pay}.`);
 return lines;
}

export function WelcomeBack({town,name}:{town:Town;name:string}){
 const [since]=useState(()=>readSeen(name)),[open,setOpen]=useState(true);
 useEffect(()=>{try{localStorage.setItem(key(name),String(town.now));}catch{}},[name,town.now]);
 const lines=since?welcomeBackLines(town,name,since):[];
 if(!open||!lines.length)return null;
 return <div className="welcome-back" role="status"><div className="welcome-back-head"><Sparkles size={16}/><b>Mentre eri via</b><button aria-label="Chiudi riepilogo" onClick={()=>setOpen(false)}><X size={14}/></button></div><ul>{lines.map(l=><li key={l}>{l}</li>)}</ul></div>;
}
