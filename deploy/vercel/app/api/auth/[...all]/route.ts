import {auth,ensureAuth} from '../../../../server/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handle(request:Request){try{await ensureAuth();return await auth().handler(request);}catch{return Response.json({error:'Accesso non disponibile. Controlla la configurazione del server.'},{status:503});}}
export const GET=handle,POST=handle;
