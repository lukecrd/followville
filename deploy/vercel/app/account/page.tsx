import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {userSession} from '../../server/auth';
import {AccountForm} from './account-form';
export const dynamic='force-dynamic';
export default async function Page(){const session=await userSession(await headers());if(!session)redirect('/sign-in');return <main className="account-shell"><section className="account-card"><span className="account-brand">FOLLOWVILLE</span><h1>Il tuo account</h1><p>{session.user.email}</p><AccountForm/><a className="account-back" href="/">Torna alla città →</a></section></main>;}
