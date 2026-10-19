import {CommunityError} from './community';
import {MAX_ACTIVE_POLLS,POLL_DURATIONS,type CivicPoll} from '../../../lib/voting';

type PollRow=Omit<CivicPoll,'options'|'total'|'ownChoice'>&{options:string};
export async function votingSnapshot(d:D1Database,userId:string,now:number):Promise<CivicPoll[]>{
 const rows=await d.prepare('SELECT id,building_id AS buildingId,title,body,options,created_at AS createdAt,closes_at AS closesAt,closed_at AS closedAt FROM town_polls ORDER BY (closed_at IS NULL AND closes_at>?) DESC,created_at DESC,id DESC LIMIT 30').bind(now).all<PollRow>();
 if(!rows.results.length)return [];
 const slots=rows.results.map(()=>'?').join(','),ids=rows.results.map(p=>p.id);
 const counts=await d.prepare(`SELECT poll_id AS pollId,choice,COUNT(*) AS votes,MAX(CASE WHEN user_id=? THEN 1 ELSE 0 END) AS own FROM poll_ballots WHERE poll_id IN (${slots}) GROUP BY poll_id,choice`).bind(userId,...ids).all<{pollId:string;choice:number;votes:number;own:number}>();
 const totals=new Map(counts.results.map(c=>[c.pollId+':'+c.choice,c.votes])),choices=new Map(counts.results.filter(v=>v.own).map(v=>[v.pollId,v.choice]));
 return rows.results.map(p=>{const options=(JSON.parse(p.options) as string[]).map((label,i)=>({label,votes:totals.get(p.id+':'+i)||0}));return {...p,options,total:options.reduce((sum,o)=>sum+o.votes,0),ownChoice:choices.get(p.id)??null};});
}
const actions=new Set(['poll-create','poll-vote','poll-close']);
export async function votingAction(d:D1Database,data:Record<string,unknown>,identity:{canAdmin:boolean;self:string|null},userId:string,now:number){
 const action=String(data.action);if(!actions.has(action))return false;
 if(action==='poll-create'||action==='poll-close'){
  if(!identity.canAdmin||data.view==='player')throw new CommunityError('Solo l’amministratore può gestire le votazioni.',403);
  if(action==='poll-close'){
   const result=await d.prepare('UPDATE town_polls SET closed_at=? WHERE id=? AND closed_at IS NULL AND closes_at>?').bind(now,String(data.id||''),now).run();
   if(!result.meta.changes)throw new CommunityError('Votazione già chiusa o non disponibile.',409);return true;
  }
  const title=String(data.title||'').trim(),body=String(data.body||'').trim(),hours=Number(data.hours),id=String(data.requestId||'');
  const options=Array.isArray(data.options)&&data.options.every(o=>typeof o==='string')?data.options.map(o=>(o as string).trim()):[];
  if(title.length<5||title.length>100||body.length>400||options.length<2||options.length>4||options.some(o=>o.length<2||o.length>60)||new Set(options.map(o=>o.toLocaleLowerCase('it-IT'))).size!==options.length||!(POLL_DURATIONS as readonly number[]).includes(hours)||!/^[a-f0-9-]{36}$/.test(id))throw new CommunityError('Inserisci un titolo di 5–100 caratteri, da 2 a 4 opzioni diverse (2–60 caratteri) e una durata valida. Il testo può avere fino a 400 caratteri.');
  const result=await d.prepare("INSERT OR IGNORE INTO town_polls (id,building_id,title,body,options,created_at,closes_at) SELECT ?,b.id,?,?,?,?,? FROM buildings b WHERE b.kind='townhall' AND (SELECT COUNT(*) FROM town_polls WHERE closed_at IS NULL AND closes_at>?)<?").bind(id,title,body,JSON.stringify(options),now,now+hours*3600000,now,MAX_ACTIVE_POLLS).run();
  if(!result.meta.changes)throw new CommunityError('Costruisci il municipio. Sono ammesse al massimo 3 votazioni aperte; la proposta potrebbe essere già stata inviata.',409);return true;
 }
 // The signed-in account casts its own vote, including when the owner previews a player.
 if(!userId||!identity.self||(data.username!==undefined&&data.username!==identity.self))throw new CommunityError('Collega il tuo abitante per votare. Non puoi votare per altri cittadini.',403);
 const choice=data.choice;if(typeof choice!=='number'||!Number.isInteger(choice)||choice<0||choice>3)throw new CommunityError('Scegli una delle opzioni della votazione.');
 const result=await d.prepare("INSERT OR IGNORE INTO poll_ballots (id,poll_id,user_id,username,choice,created_at) SELECT ?,p.id,a.user_id,a.username,?,? FROM town_polls p JOIN player_accounts a ON a.user_id=? AND a.username=? WHERE p.id=? AND p.closed_at IS NULL AND p.closes_at>? AND ?<json_array_length(p.options) AND EXISTS(SELECT 1 FROM home_units WHERE username=a.username) AND EXISTS(SELECT 1 FROM buildings WHERE id=p.building_id AND kind='townhall')").bind(crypto.randomUUID(),choice,now,userId,identity.self,String(data.id||''),now,choice).run();
 if(!result.meta.changes)throw new CommunityError('Hai già votato oppure la votazione è chiusa o non disponibile. Il voto non può essere modificato.',409);return true;
}
