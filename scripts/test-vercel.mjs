import {createRequire} from 'node:module';
import {mkdir,rm} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const root=process.cwd(),app=path.join(root,'deploy/vercel'),require=createRequire(import.meta.url),w=createRequire(require.resolve('wrangler/package.json'));
const fixture=path.join(root,'.sites-runtime/vercel-test-'+randomBytes(8).toString('hex')+'.db');
await mkdir(path.dirname(fixture),{recursive:true});
Object.assign(process.env,{NODE_ENV:'test',TURSO_DATABASE_URL:'file:'+fixture,TURSO_AUTH_TOKEN:'test-local-only',BETTER_AUTH_SECRET:randomBytes(32).toString('hex'),BETTER_AUTH_URL:'https://game.test',FOLLOWVILLE_ADMIN_EMAIL:'owner@example.test',FOLLOWVILLE_ADMIN_PASSWORD:'owner-test-password-long-enough'});
const output=path.join(app,'.generated/vercel-check.mjs');
await w('esbuild').build({stdin:{contents:"export * from './server/database';export * from './server/auth';export * from './server/owner-recovery';export {GET,POST} from './app/api/town/route';",resolveDir:app},bundle:true,packages:'external',platform:'node',format:'esm',outfile:output,jsx:'automatic'});
const api=await import(pathToFileURL(output).href),client=api.databaseClient();
try{
 const authCall=async(endpoint,data,cookie='')=>{
  const res=await api.auth().handler(new Request('https://game.test/api/auth/'+endpoint,{method:data?'POST':'GET',headers:{origin:'https://game.test',...(data?{'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{})},...(data?{body:JSON.stringify(data)}:{})}));
  let body;try{body=await res.json();}catch{body=null;}return {status:res.status,data:body,cookies:res.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ')};
 };
 const game=async(data,cookie='',spoof={})=>{const req=new Request('https://game.test/api/town',{method:data?'POST':'GET',headers:{origin:'https://game.test',...spoof,...(data?{'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{})},...(data?{body:JSON.stringify(data)}:{})});const res=await (data?api.POST(req):api.GET(req));return {status:res.status,data:await res.json()};};
 const ok=async(data,cookie)=>{const res=await game(data,cookie);assert.equal(res.status,200,JSON.stringify(res));return res.data;};
 const ownerId=await api.ensureAuth();assert.ok(ownerId);assert.equal((await client.execute('SELECT COUNT(*) AS n FROM auth_user')).rows[0].n,1);assert.equal((await client.execute('SELECT COUNT(*) AS n FROM auth_session')).rows[0].n,0,'owner bootstrap cannot sign visitors in as the owner');
 await api.ensureSchema();const count=(await client.execute('SELECT COUNT(*) AS n FROM followville_migrations')).rows[0].n;assert.equal(count,18,'all game and auth migrations applied once');
 const spoof={'oai-authenticated-user-id':ownerId,'oai-authenticated-user-email':'owner@example.test'};assert.equal((await game(undefined,'',spoof)).status,401);assert.equal((await game({action:'rename',name:'Intrusion'},'',spoof)).status,401);
 const login=await authCall('sign-in/email',{email:'owner@example.test',password:process.env.FOLLOWVILLE_ADMIN_PASSWORD});assert.equal(login.status,200,JSON.stringify(login.data));assert.ok(login.cookies);const ownerCookie=login.cookies;
 let town=await ok(undefined,ownerCookie);assert.equal(town.session.canAdmin,true);
 const signup=await authCall('sign-up/email',{email:'alice@example.test',password:'alice-test-password-long',name:'Alice'});assert.equal(signup.status,200,JSON.stringify(signup.data));assert.ok(!signup.cookies.includes('session_token'),'signup never inherits owner authentication');
 const aliceLogin=await authCall('sign-in/email',{email:'alice@example.test',password:'alice-test-password-long'});assert.equal(aliceLogin.status,200,JSON.stringify(aliceLogin.data));const aliceCookie=aliceLogin.cookies;
 assert.equal((await game(undefined,aliceCookie,spoof)).data.session.canAdmin,false,'identity headers cannot elevate an authenticated player');assert.equal((await game({action:'rename',name:'Intrusion'},aliceCookie,spoof)).status,403);
 const free=town.units.find(u=>!u.username);await ok({action:'assign',id:free.id,username:'alice'},ownerCookie);const invite=await ok({action:'invite',username:'alice'},ownerCookie);town=await ok({action:'claim',token:invite.inviteCode},aliceCookie);assert.equal(town.session.self,'alice');
 assert.equal((await game({action:'appearance',username:'other',appearance:{}},aliceCookie)).status,403);
 await client.execute("UPDATE residents SET wallet=1000 WHERE username='alice'");
 const buys=await Promise.all([game({action:'buy',username:'alice',item:'car'},aliceCookie),game({action:'buy',username:'alice',item:'car'},aliceCookie)]);assert.deepEqual(buys.map(r=>r.status).sort(),[200,400]);town=await ok(undefined,aliceCookie);assert.equal(town.residents.find(r=>r.username==='alice').wallet,650);assert.equal(town.residents.find(r=>r.username==='alice').carLevel,1);assert.equal(town.purchases.filter(p=>p.username==='alice'&&p.item==='car').length,1);
 // The game's conditional multi-statement money transfers rely on one SQLite transaction and changes().
 const d=api.asD1(client);await client.execute('CREATE TABLE adapter_test (id TEXT PRIMARY KEY,n INTEGER NOT NULL)');await d.prepare('INSERT INTO adapter_test VALUES (?,?)').bind('row',10).run();
 const moved=await d.batch([d.prepare('UPDATE adapter_test SET n=n-? WHERE id=? AND n>=?').bind(3,'row',3),d.prepare('INSERT INTO adapter_test SELECT ?,? WHERE changes()>0').bind('credit',3)]);assert.equal(moved[0].meta.changes,1);assert.equal(moved[1].meta.changes,1);
 await assert.rejects(()=>d.batch([d.prepare('UPDATE adapter_test SET n=999 WHERE id=?').bind('row'),d.prepare('INSERT INTO adapter_test VALUES (?,?)').bind('row',2)]));assert.equal((await d.prepare('SELECT n FROM adapter_test WHERE id=?').bind('row').first()).n,7,'failed batch rolls back every statement');
 const untrusted=await api.gameRequest(new Request('https://game.test/api/town',{headers:{cookie:aliceCookie,...spoof}}));assert.equal(untrusted.headers.get('oai-authenticated-user-id'),aliceLogin.data.user.id);assert.equal(untrusted.headers.get('oai-authenticated-user-email'),null);
 const logout=await authCall('sign-out',{},aliceCookie);assert.equal(logout.status,200);assert.equal((await game(undefined,aliceCookie)).status,401,'revoked sessions stop authorizing game requests');
 assert.equal(api.safeReturnTo('//evil.test'),'/');assert.equal(api.safeReturnTo('/\\evil.test'),'/');assert.equal(api.safeReturnTo('/?invite=abc'),'/?invite=abc');
 // Owner recovery is opt-in, one-time, and never changes another player's account or city.
 const playerSession=await authCall('sign-in/email',{email:'alice@example.test',password:'alice-test-password-long'});assert.equal(playerSession.status,200);
 assert.equal(await api.recoverOwnerPassword(client,ownerId,'unused-recovery-password'),false);
 const recoveredPassword='owner-recovered-test-password-long';
 assert.equal(await api.recoverOwnerPassword(client,ownerId,recoveredPassword,'1'),true);
 assert.equal((await game(undefined,ownerCookie)).status,401,'recovery revokes existing owner sessions');
 assert.equal((await authCall('sign-in/email',{email:'owner@example.test',password:process.env.FOLLOWVILLE_ADMIN_PASSWORD})).status,401,'previous owner password no longer works');
 const recovered=await authCall('sign-in/email',{email:'owner@example.test',password:recoveredPassword});assert.equal(recovered.status,200);assert.equal((await game(undefined,recovered.cookies)).data.session.canAdmin,true);
 assert.equal((await game(undefined,playerSession.cookies)).status,200,'other player sessions survive owner recovery');
 assert.equal(await api.recoverOwnerPassword(client,ownerId,'must-not-replace-password','1'),false,'cold starts do not repeat a recovery');
 assert.equal(await api.recoverOwnerPassword(client,ownerId,'second-recovery-password-long','2'),true);
 assert.equal(await api.recoverOwnerPassword(client,ownerId,recoveredPassword,'1'),false,'older deployments cannot roll the password back');
 assert.equal((await authCall('sign-in/email',{email:'owner@example.test',password:'second-recovery-password-long'})).status,200);
 await assert.rejects(()=>api.recoverOwnerPassword(client,'missing-owner','rollback-test-password-long','1'));
 assert.equal((await client.execute("SELECT COUNT(*) AS n FROM followville_owner_recovery WHERE user_id='missing-owner'")).rows[0].n,0,'failed recovery rolls back its version marker');
 assert.equal((await client.execute("SELECT wallet FROM residents WHERE username='alice'")).rows[0].wallet,650,'recovery preserves city progress');
 await assert.rejects(()=>api.recoverOwnerPassword(client,ownerId,'unused-recovery-password','0'));
 console.log('PASS: owner recovery changes only the owner password, revokes owner sessions, preserves players and city, runs once per version, rejects stale versions and rolls back failures.');
 console.log('PASS: autonomous SQLite migrations and owner bootstrap without session leakage; persistent email/password accounts and signed sessions; spoofed identity rejection; admin/player roles; invitations and resident isolation; concurrent purchases charged once; transactional changes() and full rollback; persistent game reload; logout and safe redirects.');
}finally{client.close();await rm(fixture,{force:true});await rm(fixture+'-wal',{force:true});await rm(fixture+'-shm',{force:true});}
