import type {Client} from '@libsql/client';
import {hashPassword} from 'better-auth/crypto';

// Recovery is controlled exclusively by the deployment owner, never by a request.
// Increasing versions prevent cold starts and older deployments from restoring an old password.
export async function recoverOwnerPassword(db:Client,ownerId:string,password:string,setting=process.env.FOLLOWVILLE_ADMIN_PASSWORD_RESET_VERSION){
 if(!setting)return false;
 const version=Number(setting);
 if(!/^[1-9]\d*$/.test(setting)||!Number.isSafeInteger(version)||version>2147483647)throw new Error('FOLLOWVILLE_ADMIN_PASSWORD_RESET_VERSION must be an integer between 1 and 2147483647.');
 await db.execute('CREATE TABLE IF NOT EXISTS followville_owner_recovery (user_id TEXT PRIMARY KEY NOT NULL, version INTEGER NOT NULL, updated_at INTEGER NOT NULL)');
 const applied=await db.execute({sql:'SELECT version FROM followville_owner_recovery WHERE user_id=?',args:[ownerId]});
 if(version<=Number(applied.rows[0]?.version??0))return false;
 if(password.length<16||password.length>128)throw new Error('The administrator password must have between 16 and 128 characters.');
 const passwordHash=await hashPassword(password),now=Date.now(),tx=await db.transaction('write');
 try{
  const current=await tx.execute({sql:'SELECT version FROM followville_owner_recovery WHERE user_id=?',args:[ownerId]});
  if(version<=Number(current.rows[0]?.version??0)){await tx.commit();return false;}
  const updated=await tx.execute({sql:"UPDATE auth_account SET password=?,updated_at=? WHERE user_id=? AND provider_id='credential'",args:[passwordHash,now,ownerId]});
  if(updated.rowsAffected!==1)throw new Error('The administrator credential account was not found.');
  await tx.batch([
   {sql:'DELETE FROM auth_session WHERE user_id=?',args:[ownerId]},
   {sql:'INSERT INTO followville_owner_recovery (user_id,version,updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET version=excluded.version,updated_at=excluded.updated_at',args:[ownerId,version,now]},
  ]);
  await tx.commit();return true;
 }catch(error){await tx.rollback();throw error;}finally{tx.close();}
}
