import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import Game from '../.generated/ui/page';
import {missingConfiguration} from '../server/database';
import {safeReturnTo,userSession} from '../server/auth';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{invite?:string}>}){
 const missing=missingConfiguration();if(missing.length)return <main className="account-shell"><section className="account-card"><span className="account-brand">FOLLOWVILLE</span><h1>Prepariamo la città</h1><p>Aggiungi queste variabili nelle impostazioni del progetto Vercel, poi esegui un nuovo deploy.</p><ul>{missing.map(key=><li key={key}><code>{key}</code></li>)}</ul><p>Trovi la procedura completa nel file <code>deploy/vercel/README.md</code> del repository.</p></section></main>;
 const session=await userSession(await headers());if(!session){const params=await searchParams;const target=safeReturnTo(params.invite?'/?invite='+encodeURIComponent(params.invite):'/');redirect('/sign-in?return_to='+encodeURIComponent(target));}
 return <Game/>;
}
