import React,{memo} from 'react';
import {cellSurface} from '../lib/map-geometry';
import {GARDEN_COLOR} from '../lib/terrain';
import {buildingCells,type Building} from '../lib/town';
export function MeadowTree({pine=false}:{pine?:boolean}){return <g><ellipse cy="3" rx="12" ry="5" fill="#1d3a1a" opacity=".2"/><path d="M-1 2v-28h3V2z" fill="#8a5a2b" stroke="#4a2e12" strokeWidth="1"/>{pine?<><path d="M0-51-16-17h8l-12 10h40L8-17h8z" fill="#2f8a3a" stroke="#1d5222" strokeWidth="1.5" strokeLinejoin="round"/><path d="M0-51v44h-20l12-10h-8z" fill="#4fb548"/></>:<><path d="M0-49c-12 0-20 9-20 22 0 12 9 18 20 18s20-6 20-18c0-13-8-22-20-22" fill="#3c9a2e" stroke="#1f5a18" strokeWidth="1.5"/><path d="M0-49c-12 0-20 9-20 22 0 12 9 18 20 18z" fill="#69c73f"/></>}</g>}
export const Landscape=memo(function Landscape({size,buildings}:{size:number;buildings:Building[]}){
 const gardens=buildings.filter(b=>b.kind==='garden').flatMap(buildingCells);
 return gardens.length>0?<g aria-label="Giardini della città" pointerEvents="none"><path data-terrain="garden" d={cellSurface(gardens,size)} fill={GARDEN_COLOR} stroke={GARDEN_COLOR} strokeWidth=".4"/></g>:null;
});
