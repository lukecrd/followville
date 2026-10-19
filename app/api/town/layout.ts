import {Building,buildingCells} from '../../../lib/town';
import {RoadCell} from '../../../lib/roads';
import {baseRoad,movableBaseRoad,moveTarget} from '../../../lib/city-layout';
import {CommunityError} from './community';

export async function moveBuilding(d:D1Database,data:Record<string,unknown>){
 const id=String(data.id||''),base=baseRoad(id);
 const [settings,all,cuts,reserved]=await Promise.all([
  d.prepare('SELECT map_size AS size,layout_revision AS revision FROM town_settings WHERE id=1').first<{size:number;revision:number}>(),
  d.prepare('SELECT *,bridge_axis AS bridgeAxis,bridge_span AS bridgeSpan,plot_span AS plotSpan FROM buildings').all<Building>(),
  d.prepare('SELECT x,y FROM road_cuts').all<RoadCell>(),
  d.prepare("SELECT item AS kind,x,y FROM neighborhood_projects WHERE kind='civic' AND completed_at IS NULL").all<Building>(),
 ]);
 if(!settings)throw new CommunityError('Città non disponibile.',503);
 const source=base&&movableBaseRoad(base.x,base.y,settings.size,cuts.results)?{id,x:base.x,y:base.y,kind:'road' as const,username:null,color:'#a0aaa1'}:all.results.find(b=>b.id===id);
 if(!source)throw new CommunityError('La strada o l’edificio non è più disponibile.',404);
 if(source.x!==data.fromX||source.y!==data.fromY)throw new CommunityError('La posizione è cambiata. Seleziona di nuovo la struttura.',409);
 const target=moveTarget(source,Number(data.x),Number(data.y),settings.size,all.results,cuts.results,reserved.results.flatMap(buildingCells));
 if(!target)throw new CommunityError('Scegli un terreno libero e adatto. Lo spostamento deve conservare i collegamenti stradali e le due rampe dei ponti.',400);
 const token=crypto.randomUUID(),b=target.building,buildingId=base?crypto.randomUUID():id;
 const guard='(SELECT layout_token FROM town_settings WHERE id=1)=?';
 const statements=[d.prepare('UPDATE town_settings SET layout_revision=layout_revision+1,layout_token=? WHERE id=1 AND layout_revision=?').bind(token,settings.revision)];
 if(base){
  statements.push(d.prepare(`INSERT INTO road_cuts (x,y) SELECT ?,? WHERE ${guard}`).bind(source.x,source.y,token));
  statements.push(d.prepare(`INSERT INTO buildings (id,x,y,kind,username,color) SELECT ?,?,?,'road',NULL,? WHERE ${guard}`).bind(buildingId,b.x,b.y,b.color,token));
 }else{
  statements.push(d.prepare(`UPDATE buildings SET x=?,y=?,bridge_axis=?,bridge_span=?,plot_span=NULL WHERE id=? AND ${guard}`).bind(b.x,b.y,b.bridgeAxis||null,b.bridgeSpan||null,id,token));
  statements.push(d.prepare(`DELETE FROM building_tiles WHERE building_id=? AND ${guard}`).bind(id,token));
 }
 for(const c of target.cells)statements.push(d.prepare(`INSERT INTO building_tiles (id,building_id,x,y) SELECT ?,?,?,? WHERE ${guard}`).bind(buildingId+':'+c.x+','+c.y,buildingId,c.x,c.y,token));
 const result=await d.batch(statements);
 if(!result[0].meta.changes)throw new CommunityError('La mappa è cambiata durante lo spostamento. Aggiorna e riprova.',409);
}
