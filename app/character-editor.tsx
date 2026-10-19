import {useEffect,useState} from 'react';
import {Check,Paintbrush,RotateCcw,Footprints} from 'lucide-react';
import {SKIN_TONES,HAIR_COLORS,CLOTH_COLORS,PANTS_COLORS,SHOE_COLORS,HAIR_STYLES,OUTFITS,HATS,defaultAppearance,readAppearance,type CharacterAppearance} from '../lib/appearance';
import type {Resident,Town} from '../lib/town';
import {walkerPose} from '../lib/walking';
import {WalkingAvatar} from './character-art';

function CharacterPreview({appearance}:{appearance:CharacterAppearance}){
 const [back,setBack]=useState(false),[walking,setWalking]=useState(false),[distance,setDistance]=useState(0);
 useEffect(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(!walking||preference.matches)return;
  let frame=0,lastPaint=0;const start=performance.now();
  const paint=(time:number)=>{if(time-lastPaint>33&&!document.hidden){setDistance((time-start)*.00028);lastPaint=time;}frame=requestAnimationFrame(paint);};
  const stop=()=>{if(preference.matches)cancelAnimationFrame(frame);};
  frame=requestAnimationFrame(paint);preference.addEventListener('change',stop);
  return()=>{cancelAnimationFrame(frame);preference.removeEventListener('change',stop);};
 },[walking]);
 return <div className="character-preview"><div className="character-preview-art"><svg viewBox="-24 -53 48 62" role="img" aria-label={`Anteprima del personaggio, ${back?'di spalle':'di fronte'}`}><WalkingAvatar appearance={appearance} pose={walkerPose(distance,back?{x:-1,y:0}:{x:1,y:0},walking?1:0)}/></svg><span>IL TUO ALTER EGO</span></div><div className="character-preview-controls"><button type="button" className="small-button" aria-pressed={back} onClick={()=>setBack(v=>!v)}><RotateCcw size={13}/>{back?'Mostra il volto':'Mostra di spalle'}</button><button type="button" className="small-button" aria-pressed={walking} onClick={()=>setWalking(v=>!v)}><Footprints size={13}/>{walking?'Ferma':'Cammina'}</button></div></div>;
}
function Palette({label,values,value,onChange}:{label:string;values:readonly string[];value:string;onChange:(value:string)=>void}){
 return <fieldset className="character-field"><legend>{label}</legend><div className="swatches">{values.map((color,i)=><button type="button" key={color} style={{background:color}} aria-label={`${label}, tonalità ${i+1}`} aria-pressed={value===color} className={value===color?'selected':''} onClick={()=>onChange(color)}>{value===color&&<Check size={14}/>}</button>)}</div></fieldset>;
}
function Choices<T extends string>({label,values,value,onChange}:{label:string;values:Record<T,string>;value:T;onChange:(value:T)=>void}){
 return <fieldset className="character-field"><legend>{label}</legend><div className="character-options">{(Object.entries(values) as [T,string][]).map(([id,name])=><button type="button" key={id} aria-pressed={value===id} className={value===id?'selected':''} onClick={()=>onChange(id)}>{name}</button>)}</div></fieldset>;
}
export function CharacterEditor({resident,busy,onAction}:{resident:Resident;busy:boolean;onAction:(data:Record<string,unknown>,message:string)=>Promise<Town|null>}){
 const [open,setOpen]=useState(false),[draft,setDraft]=useState(()=>readAppearance(resident.appearance,resident.avatar));
 const saved=readAppearance(resident.appearance,resident.avatar),dirty=JSON.stringify(draft)!==JSON.stringify(saved);
 function change<K extends keyof CharacterAppearance>(key:K,value:CharacterAppearance[K]){setDraft(v=>({...v,[key]:value}));}
 async function save(){const town=await onAction({action:'appearance',username:resident.username,appearance:draft},'Il tuo nuovo look è visibile in città!');if(town){setDraft(readAppearance(town.residents.find(r=>r.username===resident.username)?.appearance,resident.avatar));setOpen(false);}}
 return <section className="character-editor" aria-label="Personalizzazione del personaggio">
  <button className="character-editor-toggle" aria-expanded={open} aria-controls="character-wardrobe" disabled={busy} onClick={()=>{if(!open)setDraft(saved);setOpen(v=>!v);}}><Paintbrush size={18}/><span><b>Personalizza il personaggio</b><small>Il tuo stile, dalla testa ai piedi</small></span><span>{open?'−':'+'}</span></button>
  {open&&<div id="character-wardrobe"><CharacterPreview appearance={draft}/><p className="character-help">Prova il tuo look e salvalo per indossarlo in città. Tutte le opzioni sono gratuite.</p><fieldset disabled={busy} className="character-fields">
   <Palette label="Carnagione" values={SKIN_TONES} value={draft.skin} onChange={v=>change('skin',v)}/>
   <Choices label="Taglio di capelli" values={HAIR_STYLES} value={draft.hairStyle} onChange={v=>change('hairStyle',v)}/>
   <Palette label="Colore dei capelli" values={HAIR_COLORS} value={draft.hairColor} onChange={v=>change('hairColor',v)}/>
   <Choices label="Abbigliamento" values={OUTFITS} value={draft.outfit} onChange={v=>change('outfit',v)}/>
   <Palette label="Colore dell’abito" values={CLOTH_COLORS} value={draft.shirt} onChange={v=>change('shirt',v)}/>
   <Palette label="Pantaloni" values={PANTS_COLORS} value={draft.pants} onChange={v=>change('pants',v)}/>
   <Palette label="Scarpe" values={SHOE_COLORS} value={draft.shoes} onChange={v=>change('shoes',v)}/>
   <Choices label="Copricapo" values={HATS} value={draft.hat} onChange={v=>change('hat',v)}/>
   <label className="character-glasses"><input type="checkbox" checked={draft.glasses} onChange={e=>change('glasses',e.target.checked)}/><span>Occhiali</span></label>
   <button type="button" className="text-link" onClick={()=>setDraft(defaultAppearance(resident.avatar))}><RotateCcw size={12}/> Ripristina il look iniziale</button>
  </fieldset><div className="character-save"><button className="small-button" disabled={busy} onClick={()=>{setDraft(saved);setOpen(false);}}>Annulla</button><button className="primary" disabled={busy||!dirty} onClick={save}>{busy?'Salvataggio…':'Salva il look'}</button></div></div>}
 </section>;
}
