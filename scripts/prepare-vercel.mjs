import {cp,mkdir,readdir,readFile,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),target=path.join(root,'deploy/vercel'),generated=path.join(target,'.generated');
await rm(generated,{recursive:true,force:true});await mkdir(generated,{recursive:true});
await cp(path.join(root,'app'),path.join(generated,'ui'),{recursive:true,filter:src=>!['chatgpt-auth.ts'].includes(path.basename(src))&&src!==path.join(root,'app/api/town/route.ts')});
await cp(path.join(root,'lib'),path.join(generated,'lib'),{recursive:true});
const sql=[];for(const dir of ['drizzle','deploy/vercel/drizzle'])for(const f of (await readdir(path.join(root,dir))).filter(f=>f.endsWith('.sql')).sort())sql.push({id:dir+'/'+f,sql:await readFile(path.join(root,dir,f),'utf8')});
await writeFile(path.join(generated,'migrations.json'),JSON.stringify(sql));
await cp(path.join(root,'public'),path.join(target,'public'),{recursive:true});
const page=path.join(generated,'ui/page.tsx');let source=await readFile(page,'utf8');
source=source.replaceAll('/signin-with-chatgpt?return_to=','/sign-in?return_to=').replaceAll('Accedi con ChatGPT','Accedi al tuo account').replaceAll('accedere con il proprio account ChatGPT','accedere con il proprio account FollowVille').replace('Questa città è ancora privata.','Un account per ogni cittadino.').replace('L’accesso al sito resta privato.','Accedi con il tuo account FollowVille.').replace('Il codice assegna l’abitante, ma non cambia chi può aprire il sito. Il destinatario deve avere accesso a FollowVille e accedere con il proprio account FollowVille.','Il codice collega il tuo account personale all’abitante. Registrati o accedi prima di utilizzarlo.');
source=source.replace('<span className="dock-separator"/><button aria-label="Come si gioca"','<span className="dock-separator"/><button aria-label="Gestisci account" onClick={()=>window.location.assign(\'/account\')}><span className="dock-icon"><UserRound size={19}/></span><span>Account</span></button><button aria-label="Come si gioca"');
await writeFile(page,source);
// The Vercel layout lists the game stylesheets itself: fail the build if one added to app/layout.tsx is missing there.
const css=s=>[...s.matchAll(/import '(?:\.\.\/\.generated\/ui\/|\.\/)([\w-]+\.css)'/g)].map(m=>m[1]),vercelCss=css(await readFile(path.join(target,'app/layout.tsx'),'utf8')),missingCss=css(await readFile(path.join(root,'app/layout.tsx'),'utf8')).filter(f=>!vercelCss.includes(f));
if(missingCss.length)throw Error('deploy/vercel/app/layout.tsx must import '+missingCss.map(f=>'../.generated/ui/'+f).join(', '));
console.log('FollowVille: shared game source and migrations prepared for Vercel.');
