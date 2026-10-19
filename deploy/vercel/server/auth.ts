import {betterAuth} from 'better-auth';
import {drizzleAdapter} from 'better-auth/adapters/drizzle';
import {nextCookies} from 'better-auth/next-js';
import {drizzle} from 'drizzle-orm/libsql';
import {databaseClient,ensureDatabase} from './database';
import * as schema from './auth-schema';
import {recoverOwnerPassword} from './owner-recovery';

let instance:ReturnType<typeof makeAuth>|undefined;
function makeAuth(){return betterAuth({
 database:drizzleAdapter(drizzle(databaseClient(),{schema}),{provider:'sqlite',schema,transaction:true}),
 secret:process.env.BETTER_AUTH_SECRET,
 ...(process.env.BETTER_AUTH_URL?{baseURL:process.env.BETTER_AUTH_URL}:{}),
 emailAndPassword:{enabled:true,autoSignIn:false,minPasswordLength:12,maxPasswordLength:128},
 rateLimit:{enabled:true,storage:'database',window:60,max:60,customRules:{'/sign-in/email':{window:60,max:8},'/sign-up/email':{window:60,max:4}}},
 session:{expiresIn:60*60*24*30,updateAge:60*60*24},
 advanced:{database:{generateId:()=>crypto.randomUUID()}},
 plugins:[nextCookies()],
});}
export function auth(){return instance??=makeAuth();}
let initialized:Promise<string>|undefined;
async function bootstrapOwner(){
 await ensureDatabase();const db=databaseClient(),email=process.env.FOLLOWVILLE_ADMIN_EMAIL!.trim().toLowerCase();
 let existing=await db.execute({sql:'SELECT id FROM auth_user WHERE email=?',args:[email]});
 if(!existing.rows.length){
  try{await auth().api.signUpEmail({body:{email,password:process.env.FOLLOWVILLE_ADMIN_PASSWORD!,name:'Amministratore'}});}catch(error){existing=await db.execute({sql:'SELECT id FROM auth_user WHERE email=?',args:[email]});if(!existing.rows.length)throw error;}
  existing=await db.execute({sql:'SELECT id FROM auth_user WHERE email=?',args:[email]});
 }
 if(!existing.rows.length)throw new Error('Unable to initialize owner.');
 const ownerId=String(existing.rows[0].id);
 await recoverOwnerPassword(db,ownerId,process.env.FOLLOWVILLE_ADMIN_PASSWORD!);
 return ownerId;
}
export function ensureAuth(){return initialized??=bootstrapOwner().catch(error=>{initialized=undefined;throw error;});}
export async function userSession(headers:Headers){await ensureAuth();return auth().api.getSession({headers});}
// Only server-verified sessions become game identities. Incoming identity headers are discarded.
export async function gameRequest(request:Request){
 const session=await userSession(request.headers);if(!session)return null;
 const ownerId=await ensureAuth(),headers=new Headers(request.headers);
 for(const key of [...headers.keys()])if(key.toLowerCase().startsWith('oai-authenticated-'))headers.delete(key);
 headers.set('oai-authenticated-user-id',session.user.id);
 if(session.user.id===ownerId)headers.set('oai-authenticated-user-email',process.env.FOLLOWVILLE_ADMIN_EMAIL!.trim().toLowerCase());
 return new Request(request,{headers});
}
export function safeReturnTo(value:string|null|undefined){if(!value||!value.startsWith('/')||value.startsWith('//'))return '/';try{const url=new URL(value,'https://followville.local');return url.origin==='https://followville.local'&&url.pathname==='/'?url.pathname+url.search:'/';}catch{return '/';}}
