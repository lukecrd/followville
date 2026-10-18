import {point} from './terrain';
export type MapCell={x:number;y:number};
// Merge neighboring cells into row strips, so large meadows need only a few SVG paths.
export function cellSurface(cells:MapCell[],size:number){const rows=new Map<number,number[]>();for(const c of cells){const row=rows.get(c.y)||[];row.push(c.x);rows.set(c.y,row);}const out:string[]=[];for(const [y,row]of rows){row.sort((a,b)=>a-b);for(let i=0;i<row.length;){const start=row[i];let end=start;while(i+1<row.length&&row[i+1]===end+1){end=row[++i];}const corners=[point(start-.5,y-.5,size),point(end+.5,y-.5,size),point(end+.5,y+.5,size),point(start-.5,y+.5,size)];out.push('M'+corners.map(p=>`${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join('L')+'Z');i++;}}return out.join('');}
