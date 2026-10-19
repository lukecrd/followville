import {createClient,type Client,type InStatement,type ResultSet} from '@libsql/client';
import {createHash} from 'node:crypto';
import migrations from '../.generated/migrations.json';

function cell(value:unknown):unknown{if(typeof value==='bigint'){const n=Number(value);if(!Number.isSafeInteger(n))throw new Error('Database integer exceeds the supported range.');return n;}return value;}
function result<T>(r:ResultSet){return {success:true,results:r.rows.map(row=>Object.fromEntries(r.columns.map(name=>[name,cell(row[name])]))) as T[],meta:{changes:r.rowsAffected,last_row_id:Number(r.lastInsertRowid||0),duration:0,changed_db:r.rowsAffected>0,size_after:0,rows_read:r.rows.length,rows_written:r.rowsAffected}};}
class Statement{
 constructor(readonly client:Client,readonly sql:string,readonly values:unknown[]=[]){ }
 bind(...values:unknown[]){return new Statement(this.client,this.sql,values);}
 input():InStatement{return {sql:this.sql,args:this.values as never[]};}
 async all<T=Record<string,unknown>>(){return result<T>(await this.client.execute(this.input()));}
 async run<T=Record<string,unknown>>(){return this.all<T>();}
 async first<T=Record<string,unknown>>(column?:string):Promise<T|null>{const r=await this.all<Record<string,unknown>>();return (r.results.length?(column?r.results[0][column]:r.results[0]):null) as T|null;}
}
export function asD1(client:Client):D1Database{
 return {prepare:(sql:string)=>new Statement(client,sql),batch:async(statements:Statement[])=>{
  if(statements.some(s=>s.client!==client))throw new Error('Mixed database batch.');
  const rows=await client.batch(statements.map(s=>s.input()),'write');return rows.map(r=>result(r));
 }} as unknown as D1Database;
}
export function missingConfiguration(){return ['TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','BETTER_AUTH_SECRET','FOLLOWVILLE_ADMIN_EMAIL','FOLLOWVILLE_ADMIN_PASSWORD'].filter(key=>!process.env[key]);}
let client:Client|undefined;
export function databaseClient(){
 const missing=missingConfiguration();if(missing.length)throw new Error('Missing configuration: '+missing.join(', '));
 if((process.env.BETTER_AUTH_SECRET||'').length<32)throw new Error('BETTER_AUTH_SECRET must have at least 32 characters.');
 if((process.env.FOLLOWVILLE_ADMIN_PASSWORD||'').length<16)throw new Error('FOLLOWVILLE_ADMIN_PASSWORD must have at least 16 characters.');
 const url=process.env.TURSO_DATABASE_URL!;
 if(process.env.NODE_ENV!=='test'&&!/^(libsql|https):\/\//.test(url))throw new Error('Use a remote libSQL database URL.');
 return client??=createClient({url,authToken:process.env.TURSO_AUTH_TOKEN,intMode:'number'});
}
let ready:Promise<void>|undefined;
export async function ensureSchema(db:Client=databaseClient()){
 await db.execute('CREATE TABLE IF NOT EXISTS followville_migrations (id TEXT PRIMARY KEY NOT NULL, hash TEXT NOT NULL)');
 const tx=await db.transaction('write');
 try{
  const applied=await tx.execute('SELECT id,hash FROM followville_migrations'),known=new Map(applied.rows.map(r=>[String(r.id),String(r.hash)]));
  const pending:InStatement[]=[];
  for(const migration of migrations){
   const hash=createHash('sha256').update(migration.sql).digest('hex');
   if(known.has(migration.id)){if(known.get(migration.id)!==hash)throw new Error('An applied migration was modified: '+migration.id);continue;}
   for(const sql of migration.sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean))pending.push(sql);
   pending.push({sql:'INSERT INTO followville_migrations (id,hash) VALUES (?,?)',args:[migration.id,hash]});
  }
  if(pending.length)await tx.batch(pending);
  await tx.commit();
 }catch(error){await tx.rollback();throw error;}finally{tx.close();}
}
export function ensureDatabase(){return ready??=ensureSchema().catch(error=>{ready=undefined;throw error;});}
