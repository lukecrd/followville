import {createRequire} from 'node:module';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),w=createRequire(require.resolve('wrangler/package.json')),{build}=w('esbuild'),{Miniflare}=w('miniflare');
await mkdir('.sites-runtime',{recursive:true});
await build({stdin:{contents:"export * from './lib/appearance';export {walkerPose} from './lib/walking';export {WalkingAvatar} from './app/character-art';export {LifePanel} from './app/life-panel';",resolveDir:process.cwd()},bundle:true,packages:'external',platform:'node',format:'cjs',outfile:'.sites-runtime/appearance-check.cjs',jsx:'automatic'});
const api=require('../.sites-runtime/appearance-check.cjs'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const built=await build({stdin:{contents:"import {GET,POST} from './app/api/town/route.ts';export default {fetch(r){return r.method==='POST'?POST(r):GET(r);}}",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser',external:['cloudflare:workers'],define:{'import.meta.env.DEV':'false'}});
const mf=new Miniflare({modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-05-15',d1Databases:['DB'],bindings:{SITE_OWNER_EMAIL:'owner@example.test'},inspectorPort:0});
try{
 const d=await mf.getD1Database('DB');
 // Exercise the actual upgrade of an existing resident before applying 0015.
 const migrations=(await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort();
 for(const file of migrations.filter(f=>!f.startsWith('0015_')))for(const sql of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await d.prepare(sql.trim()).run();
 await d.prepare("INSERT INTO residents (username,avatar,wallet) VALUES ('legacy','#d88162',731)").run();
 for(const file of migrations.filter(f=>f.startsWith('0015_')))for(const sql of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint'))if(sql.trim())await d.prepare(sql.trim()).run();
 const upgraded=await d.prepare("SELECT appearance,wallet FROM residents WHERE username='legacy'").first();assert.deepEqual(upgraded,{appearance:'{}',wallet:731});
 const call=async(data,user='owner')=>{const headers=user==='owner'?{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test'}:{'oai-authenticated-user-id':user+'-account'};const r=await mf.dispatchFetch('https://game.test/api/town',{method:data?'POST':'GET',headers:{...headers,...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:r.status,data:await r.json()};};
 const ok=async(data,user='owner')=>{const r=await call(data,user);assert.equal(r.status,200,JSON.stringify(r));return r.data;};
 let town=await ok();const free=town.units.filter(u=>!u.username);for(const [i,user]of ['legacy','bob'].entries()){await ok({action:'assign',id:free[i].id,username:user});const invite=await ok({action:'invite',username:user});await ok({action:'claim',token:invite.inviteCode},user);}
 town=await ok();const resident=town.residents.find(r=>r.username==='legacy'),wallet=resident.wallet,coins=town.coins,originalCarColor=resident.avatar;
 assert.deepEqual(resident.appearance,api.defaultAppearance('#d88162'),'legacy shirt retained');
 const appearance={skin:api.SKIN_TONES[5],hairColor:api.HAIR_COLORS[4],hairStyle:'long',shirt:api.CLOTH_COLORS[5],outfit:'jacket',pants:api.PANTS_COLORS[1],shoes:api.SHOE_COLORS[1],hat:'cap',glasses:true};
 const payload={action:'appearance',username:'legacy',appearance};
 assert.equal((await call(payload,'visitor')).status,403);assert.equal((await call(payload,'bob')).status,403);
 for(const invalid of [null,{},[],{...appearance,skin:'url(https://example.test)'},{...appearance,hairStyle:'<script>'},{...appearance,glasses:1},{...appearance,admin:true}])assert.equal((await call({...payload,appearance:invalid},'legacy')).status,400);
 town=await ok(payload,'legacy');const saved=town.residents.find(r=>r.username==='legacy');assert.deepEqual(saved.appearance,appearance);assert.equal(saved.wallet,wallet);assert.equal(saved.avatar,originalCarColor,'wardrobe does not recolor the car');assert.equal(town.coins,coins);
 assert.deepEqual((await ok(undefined,'legacy')).residents.find(r=>r.username==='legacy').appearance,appearance,'new request reloads persisted appearance');assert.equal((await ok()).residents.find(r=>r.username==='bob').appearance.hat,'none','other residents unaffected');
 const actual=await d.prepare("SELECT appearance FROM residents WHERE username='legacy'").first();assert.deepEqual(JSON.parse(actual.appearance),appearance);
 await d.prepare("UPDATE residents SET appearance='broken' WHERE username='legacy'").run();assert.deepEqual((await ok()).residents.find(r=>r.username==='legacy').appearance,api.defaultAppearance(originalCarColor),'damaged old JSON falls back safely');await ok(payload,'legacy');
 const props={town,section:'people',active:'legacy',canPreview:false,busy:false,garden:'',onSelect(){},onSection(){},onClose(){},onInvite(){},onFocus(){},onAction:async()=>null,onGarden(){},onClaim(){}};
 const panel=renderToStaticMarkup(React.createElement(api.LifePanel,props));assert.ok(panel.includes('Personalizza il personaggio'));assert.ok(panel.includes('data-hair-style="long"'));assert.ok(panel.includes('aria-expanded="false"'),'wardrobe starts collapsed');
 let figures='';const styles=Object.keys(api.HAIR_STYLES);
 for(const [i,hairStyle]of styles.entries())for(let back=0;back<2;back++){
  const a={...appearance,hairStyle,skin:api.SKIN_TONES[i],hairColor:api.HAIR_COLORS[i],hat:i===0?'none':i===1?'cap':i===2?'beanie':'none',outfit:i%3===0?'tee':i%3===1?'hoodie':'jacket'};
  const pose=api.walkerPose(.11,back?{x:-1,y:0}:{x:1,y:0},1),art=renderToStaticMarkup(React.createElement(api.WalkingAvatar,{appearance:a,pose}));
  assert.ok(!/NaN|undefined/.test(art));assert.ok(art.includes(`translate(${pose.head.x} ${pose.head.y})`),'accessories follow the actual gait head');assert.ok(art.includes(`data-avatar-facing="${back?'back':'front'}" display="inline"`));
  figures+=`<g transform="translate(${80+i*150} ${back?410:170}) scale(3.5)">${art}</g><text x="${80+i*150}" y="${back?450:210}" text-anchor="middle" fill="#3b564a" font-size="13">${api.HAIR_STYLES[hairStyle]} · ${back?'retro':'fronte'}</text>`;
 }
 await writeFile('.sites-runtime/appearance-gallery.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="760" height="480" viewBox="0 0 760 480"><rect width="760" height="480" fill="#edf3ee"/>${figures}</svg>`);
 const sharp=createRequire(w.resolve('miniflare/package.json'))('sharp');await sharp('.sites-runtime/appearance-gallery.svg').png().toFile('.sites-runtime/appearance-gallery.png');
 console.log('PASS: schema upgrade preserves existing residents and funds; legacy looks; linked-account ownership; validated complete wardrobe; atomic persistent save and reload; no charge or car recoloring; safe JSON fallback; collapsed player editor; all hairstyles, outfits and accessories rendered in front/back walking poses.');
}finally{await mf.dispose();}
