export type Camera={zoom:number;pan:{x:number;y:number}};
export type MapPoint={x:number;y:number};
export const MIN_ZOOM=.25,MAX_ZOOM=6;
export const clampZoom=(z:number)=>Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,z));
export function screenPoint(client:MapPoint,rect:{left:number;top:number;width:number;height:number}):MapPoint{const scale=Math.max(rect.width/1600,rect.height/1080);return {x:(client.x-rect.left-(rect.width-1600*scale)/2)/scale,y:(client.y-rect.top-(rect.height-1080*scale)/2)/scale};}
export function zoomCamera(camera:Camera,zoom:number,anchor:MapPoint={x:800,y:450},destination:MapPoint=anchor):Camera{const next=clampZoom(zoom),ratio=next/camera.zoom;return {zoom:next,pan:{x:destination.x-800-(anchor.x-800-camera.pan.x)*ratio,y:destination.y-450-(anchor.y-450-camera.pan.y)*ratio}};}
export function pinchMetric(points:MapPoint[]){return {center:{x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2},distance:Math.max(1,Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y))};}

export function fitCamera(rect:{left:number;top:number;width:number;height:number}):Camera{const scale=Math.max(rect.width/1600,rect.height/1080),zoom=clampZoom(Math.min(.98,(rect.width-32)/scale/1500,Math.max(120,rect.height-230)/scale/950)),center=screenPoint({x:rect.left+rect.width/2,y:rect.top+(110+rect.height-120)/2},rect);return {zoom,pan:{x:center.x-800,y:center.y-450-25*zoom}};}
