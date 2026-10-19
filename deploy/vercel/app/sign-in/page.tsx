import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {missingConfiguration} from '../../server/database';
import {userSession,safeReturnTo} from '../../server/auth';
import {SignInForm} from './sign-in-form';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{return_to?:string}>}){
 if(missingConfiguration().length)redirect('/');
 const target=safeReturnTo((await searchParams).return_to);if(await userSession(await headers()))redirect(target);
 return <main className="account-shell"><section className="account-card"><span className="account-brand">FOLLOWVILLE</span><h1>Il tuo posto in città.</h1><p>Accedi al tuo account per tornare nel quartiere o registrati per collegare il tuo abitante.</p><SignInForm returnTo={target}/><p className="account-note">Il collegamento a un abitante richiede l’invito personale dell’amministratore.</p></section></main>;
}
