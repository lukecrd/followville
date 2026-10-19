import {createTownApi} from '../../../.generated/ui/api/town/handlers';
import {asD1,databaseClient} from '../../../server/database';
import {gameRequest} from '../../../server/auth';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handle(request:Request){try{
 const trusted=await gameRequest(request);if(!trusted)return Response.json({error:'Accedi al tuo account FollowVille.'},{status:401,headers:{'Cache-Control':'no-store'}});
 const handlers=createTownApi({DB:asD1(databaseClient()),SITE_OWNER_EMAIL:process.env.FOLLOWVILLE_ADMIN_EMAIL!.trim().toLowerCase()});
 return request.method==='POST'?handlers.POST(trusted):handlers.GET(trusted);
}catch{return Response.json({error:'FollowVille non è ancora configurato. Verifica le variabili ambiente e il database.'},{status:503,headers:{'Cache-Control':'no-store'}});}}
export const GET=handle,POST=handle;
