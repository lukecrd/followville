'use client';
import {useState} from 'react';
import {authClient} from '../../server/auth-client';
export function SignInForm({returnTo}:{returnTo:string}){
 const [register,setRegister]=useState(false),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function submit(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError('');try{
  if(register){const result=await authClient.signUp.email({name,email,password});if(result.error){setError(result.error.code==='USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'?'Esiste già un account con questa email. Prova ad accedere.':'Registrazione non riuscita. Verifica i dati e riprova.');return;}}
  const result=await authClient.signIn.email({email,password});if(result.error){setError(result.error.status===429?'Troppi tentativi. Attendi un minuto e riprova.':'Email o password non valide.');return;}
  window.location.assign(returnTo);
 }catch{setError('Connessione non disponibile. Riprova tra poco.');}finally{setBusy(false);}}
 return <><div className="account-tabs"><button aria-pressed={!register} disabled={busy} onClick={()=>{setRegister(false);setError('');}}>Accedi</button><button aria-pressed={register} disabled={busy} onClick={()=>{setRegister(true);setError('');}}>Registrati</button></div><form onSubmit={submit}>
  {register&&<label>Come ti chiami?<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" required maxLength={80}/></label>}
  <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required maxLength={254}/></label>
  <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={register?'new-password':'current-password'} required minLength={register?12:1} maxLength={128}/></label>
  {register&&<small>Usa almeno 12 caratteri per la password.</small>}{error&&<p className="account-error" role="alert">{error}</p>}
  <button className="account-primary" disabled={busy}>{busy?'Attendi…':register?'Crea account ed entra':'Entra in città'}</button>
 </form></>;
}
