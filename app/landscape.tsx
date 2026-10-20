import React,{memo} from 'react';
import {cellSurface} from '../lib/map-geometry';
import {GARDEN_COLOR} from '../lib/terrain';
import {buildingCells,type Building} from '../lib/town';
export function MeadowTree({pine=false}:{pine?:boolean}){return <g><ellipse cy="3" rx="12" ry="5" fill="#20384b" opacity=".12"/><path d="M-1 2v-28h3V2z" fill="#a38970"/>{pine?<><path d="M0-51-16-17h8l-12 10h40L8-17h8z" fill="#729885"/><path d="M0-51v44h-20l12-10h-8z" fill="#8aaf95"/></>:<><path d="M0-49c-12 0-20 9-20 22 0 12 9 18 20 18s20-6 20-18c0-13-8-22-20-22" fill="#78a088"/><path d="M0-49c-12 0-20 9-20 22 0 12 9 18 20 18z" fill="#94b69a"/></>}</g>}
export const Landscape=memo(function Landscape({size,buildings}:{size:number;buildings:Building[]}){
 const gardens=buildings.filter(b=>b.kind==='garden').flatMap(buildingCells);
 return gardens.length>0?<g aria-label="Giardini della città" pointerEvents="none"><path data-terrain="garden" d={cellSurface(gardens,size)} fill={GARDEN_COLOR} stroke={GARDEN_COLOR} strokeWidth=".4"/></g>:null;
});
