import {useEffect,useState} from 'react';
import {Vote,Check,Clock,Plus,Minus,LockKeyhole} from 'lucide-react';
import type {Town} from '../lib/town';
import {pollIsOpen,pollOutcome,POLL_DURATIONS,MAX_ACTIVE_POLLS,type CivicPoll} from '../lib/voting';
type Action=(data:Record<string,unknown>,message:string)=>Promise<unknown>;
const dateLabel=(time:number)=>new Date(time).toLocaleString('it-IT',{timeZone:'Europe/Rome',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
function PollCard({poll,now,canAdmin,canVote,busy,onAction}:{poll:CivicPoll;now:number;canAdmin:boolean;canVote:boolean;busy:boolean;onAction:Action}){
 const [choice,setChoice]=useState<number|null>(null),[closing,setClosing]=useState(false),open=pollIsOpen(poll,now),voted=poll.ownChoice!==null,editable=canVote&&open&&!voted;
 return <article className={`poll-card ${open?'open':'closed'}`} aria-label={poll.title}>
  <div className="poll-card-meta"><span className={open?'poll-open':''}><i/>{open?'Votazione aperta':'Conclusa'}</span><span>{poll.total} {poll.total===1?'voto':'voti'}</span></div>
  <h3>{poll.title}</h3>{poll.body&&<p className="poll-description">{poll.body}</p>}
  <p className="poll-deadline"><Clock size={12}/>{open?'Scade il ':poll.closedAt?'Chiusa il ':'Scaduta il '}<time dateTime={new Date(poll.closedAt||poll.closesAt).toISOString()}>{dateLabel(poll.closedAt||poll.closesAt)}</time> · ora italiana</p>
  <fieldset className="poll-options" disabled={busy||!editable}><legend className="sr-only">Scegli un’opzione per {poll.title}</legend>{poll.options.map((option,i)=>{const percent=poll.total?Math.round(option.votes/poll.total*100):0,selected=(voted?poll.ownChoice:choice)===i;return <label key={i} className={`poll-option ${selected?'selected':''}`}>
   <span className="poll-option-fill" style={{width:`${percent}%`}} aria-hidden="true"/>
   <span className="poll-option-content">{editable?<input type="radio" name={`poll-${poll.id}`} value={i} checked={choice===i} onChange={()=>setChoice(i)}/>:selected?<Check size={14} aria-label="Il tuo voto"/>:null}<span>{option.label}{voted&&selected&&<small>Il tuo voto</small>}</span><b>{percent}%<small>{option.votes} {option.votes===1?'voto':'voti'}</small></b></span>
  </label>;})}</fieldset>
  {!open&&<p className="poll-outcome">{pollOutcome(poll)}</p>}
  {open&&(voted?<p className="poll-voted"><Check size={14}/>Voto registrato. Grazie per aver partecipato!</p>:editable?<><p className="poll-vote-note">Puoi esprimere un solo voto. Dopo la conferma non potrai cambiarlo.</p><button className="primary full" disabled={busy||choice===null} onClick={()=>onAction({action:'poll-vote',id:poll.id,choice},'Voto registrato. La tua scelta conta!')}><Vote size={15}/>Conferma il voto</button></>:<p className="poll-vote-note">Per votare serve il tuo abitante collegato a un account.</p>)}
  {canAdmin&&open&&<div className="poll-close">{closing?<><p>Chiudere ora? I voti raccolti resteranno nello storico.</p><div><button className="small-button" disabled={busy} onClick={()=>setClosing(false)}>Torna indietro</button><button className="small-button" disabled={busy} onClick={()=>onAction({action:'poll-close',id:poll.id},'Votazione chiusa. Risultati conservati nello storico.')} >Chiudi votazione</button></div></>:<button className="text-link" disabled={busy} onClick={()=>setClosing(true)}>Termina prima della scadenza</button>}</div>}
 </article>;
}
function CreatePoll({busy,disabled,onAction}:{busy:boolean;disabled:boolean;onAction:Action}){
 const [title,setTitle]=useState(''),[body,setBody]=useState(''),[options,setOptions]=useState(['','']),[hours,setHours]=useState(24);
 async function create(e:React.FormEvent){e.preventDefault();if(disabled||busy)return;const result=await onAction({action:'poll-create',title,body,options,hours,requestId:crypto.randomUUID()},'Votazione aperta: i cittadini possono partecipare.');if(result){setTitle('');setBody('');setOptions(['','']);}}
 const valid=title.trim().length>=5&&options.every(o=>o.trim().length>=2)&&new Set(options.map(o=>o.trim().toLocaleLowerCase('it-IT'))).size===options.length;
 return <details className="poll-create"><summary><Plus size={15}/>Apri una votazione</summary><form onSubmit={create}><fieldset disabled={busy||disabled}>
  <label className="field-label" htmlFor="poll-title">La domanda alla città</label><input id="poll-title" className="text-input" placeholder="Quale servizio vorremmo nel quartiere?" value={title} onChange={e=>setTitle(e.target.value)} required minLength={5} maxLength={100}/>
  <label className="field-label" htmlFor="poll-body">Spiega la proposta <small>(facoltativo)</small></label><textarea id="poll-body" className="text-input" rows={2} maxLength={400} value={body} onChange={e=>setBody(e.target.value)} placeholder="Spazi, idee e priorità da scegliere insieme…"/>
  <div className="poll-create-options">{options.map((option,i)=><div key={i}><label className="sr-only" htmlFor={`poll-option-${i}`}>Opzione {i+1}</label><input id={`poll-option-${i}`} className="text-input" placeholder={`Opzione ${i+1}`} value={option} required minLength={2} maxLength={60} onChange={e=>setOptions(old=>old.map((v,index)=>index===i?e.target.value:v))}/>{options.length>2&&<button type="button" aria-label={`Rimuovi opzione ${i+1}`} onClick={()=>setOptions(old=>old.filter((_,index)=>index!==i))}><Minus size={14}/></button>}</div>)}</div>
  {options.length<4&&<button type="button" className="text-link" onClick={()=>setOptions(old=>[...old,''])}><Plus size={12}/>Aggiungi opzione</button>}
  <label className="field-label" htmlFor="poll-duration">Durata in ore reali</label><select id="poll-duration" className="text-input" value={hours} onChange={e=>setHours(Number(e.target.value))}>{POLL_DURATIONS.map(h=><option key={h} value={h}>{h===1?'1 ora':h===72?'3 giorni':`${h} ore`}</option>)}</select>
  <p className="poll-vote-note">Dopo l’apertura domanda e opzioni restano fisse. Il risultato orienta le decisioni dell’amministrazione.</p><button className="primary full" disabled={!valid||busy||disabled}>Apri votazione</button>
 </fieldset></form></details>;
}
export function VotingPanel({town,canAdmin,busy,onAction,onClaim}:{town:Town;canAdmin:boolean;busy:boolean;onAction:Action;onClaim:()=>void}){
 const [clock,setClock]=useState(town.now);
 useEffect(()=>{setClock(Date.now());const timer=setInterval(()=>setClock(Date.now()),10000);return()=>clearInterval(timer);},[]);
 const now=Math.max(town.now,clock),polls=town.polls||[],active=polls.filter(p=>pollIsOpen(p,now)),past=polls.filter(p=>!pollIsOpen(p,now)),hall=town.buildings.some(b=>b.kind==='townhall'),canVote=!!town.session.self&&town.residents.some(r=>r.username===town.session.self);
 return <section className="voting-panel" aria-label="Votazioni cittadine"><div className="poll-summary"><span><Vote size={24}/></span><div><b>La città sceglie insieme</b><p>{active.length} {active.length===1?'votazione aperta':'votazioni aperte'} · un voto per cittadino</p></div></div><p className="panel-intro">Scegli le priorità della community. Le votazioni sono consultive: le scelte più votate guidano il Comune nei prossimi progetti.</p><div className="poll-privacy"><LockKeyhole size={14}/><span>Risultati aggiornati automaticamente. Il tuo voto resta riservato: nessun nome viene mostrato.</span></div>
  {!hall&&<div className="note">Per aprire nuove votazioni serve il municipio. Lo storico resta consultabile.</div>}
  {canVote?<p className="poll-identity">Voti con <b>@{town.session.self}</b></p>:hall&&<div className="note"><p>Collega il tuo abitante per partecipare alle votazioni.</p><button className="small-button" onClick={onClaim}>Collega abitante</button></div>}
  {canAdmin&&hall&&<><CreatePoll busy={busy} disabled={active.length>=MAX_ACTIVE_POLLS} onAction={onAction}/>{active.length>=MAX_ACTIVE_POLLS&&<p className="quiet-text">Sono già aperte 3 votazioni. Attendi una scadenza o chiudine una.</p>}</>}
  <div className="life-section-title">SI VOTA ORA <span>{active.length}</span></div><div className="poll-list">{active.map(p=><PollCard key={p.id} poll={p} now={now} canAdmin={canAdmin} canVote={canVote} busy={busy} onAction={onAction}/>)}</div>{!active.length&&<div className="poll-empty"><Vote size={27}/><p>Nessuna votazione aperta.{canAdmin&&hall?' Apri la prima proposta per ascoltare i cittadini.':' Le nuove proposte del Comune appariranno qui.'}</p></div>}
  {past.length>0&&<><div className="life-section-title">STORICO DELLE VOTAZIONI <span>{past.length}</span></div><div className="poll-list">{past.map(p=><PollCard key={p.id} poll={p} now={now} canAdmin={canAdmin} canVote={canVote} busy={busy} onAction={onAction}/>)}</div></>}
  {polls.length===30&&<p className="quiet-text">Sono mostrate le votazioni aperte e quelle concluse più recenti, fino a 30.</p>}
 </section>;
}
