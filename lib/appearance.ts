export const SKIN_TONES=['#f4d5b5','#e2bc96','#c99369','#a97049','#815033','#553525'] as const;
export const HAIR_COLORS=['#302c2a','#655343','#a36b3c','#d8b66e','#a94f47','#d5d4cf'] as const;
export const CLOTH_COLORS=['#d88162','#76938b','#b89ac0','#8aabc1','#c5a15b','#425a76','#f1e8d6','#35463f'] as const;
export const PANTS_COLORS=['#52635a','#435b79','#393e48','#a48d74','#e5ded0'] as const;
export const SHOE_COLORS=['#34483d','#faf5e9','#9a6048','#343540'] as const;
export const HAIR_STYLES={short:'Corti',bob:'Caschetto',curls:'Ricci',long:'Lunghi',shaved:'Rasati'} as const;
export const OUTFITS={tee:'T-shirt',hoodie:'Felpa',jacket:'Giacca'} as const;
export const HATS={none:'Nessuno',cap:'Cappellino',beanie:'Berretto'} as const;
export type CharacterAppearance={skin:string;hairColor:string;hairStyle:keyof typeof HAIR_STYLES;shirt:string;outfit:keyof typeof OUTFITS;pants:string;shoes:string;hat:keyof typeof HATS;glasses:boolean};
export function defaultAppearance(color='#76938b'):CharacterAppearance{return {skin:'#e2bc96',hairColor:'#655343',hairStyle:'short',shirt:(CLOTH_COLORS as readonly string[]).includes(color)?color:'#76938b',outfit:'tee',pants:'#52635a',shoes:'#34483d',hat:'none',glasses:false};}
const choices:Record<Exclude<keyof CharacterAppearance,'glasses'>,readonly string[]>={skin:SKIN_TONES,hairColor:HAIR_COLORS,hairStyle:Object.keys(HAIR_STYLES),shirt:CLOTH_COLORS,outfit:Object.keys(OUTFITS),pants:PANTS_COLORS,shoes:SHOE_COLORS,hat:Object.keys(HATS)};
export function validAppearance(value:unknown):value is CharacterAppearance{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return Object.keys(v).length===9&&typeof v.glasses==='boolean'&&Object.entries(choices).every(([key,options])=>typeof v[key]==='string'&&options.includes(v[key] as string));
}
// Old residents keep their original shirt, even before their first wardrobe save.
export function readAppearance(value:unknown,color?:string):CharacterAppearance{
 let v=value;if(typeof v==='string'){try{v=JSON.parse(v);}catch{return defaultAppearance(color);}}
 return validAppearance(v)?v:defaultAppearance(color);
}
