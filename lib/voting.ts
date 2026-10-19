export const POLL_DURATIONS=[1,6,24,72] as const;
export const MAX_ACTIVE_POLLS=3;
export type CivicPoll={id:string;buildingId:string|null;title:string;body:string;createdAt:number;closesAt:number;closedAt:number|null;options:{label:string;votes:number}[];total:number;ownChoice:number|null};
export function pollIsOpen(p:Pick<CivicPoll,'closesAt'|'closedAt'>,now:number){return p.closedAt===null&&p.closesAt>now;}
export function pollOutcome(p:CivicPoll){
 if(p.total===0)return 'Nessun voto espresso';
 const high=Math.max(...p.options.map(o=>o.votes)),leaders=p.options.filter(o=>o.votes===high).map(o=>o.label);
 return leaders.length===1?`Scelta più votata: ${leaders[0]}`:`Parità: ${leaders.join(' · ')}`;
}
