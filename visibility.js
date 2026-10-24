// Segment/AABB test for orthographic camera sightlines; independent of collision.
export function crossesBox(from,to,min,max){
 let enter=0,leave=1;
 for(let axis=0;axis<3;axis++){
  const delta=to[axis]-from[axis];
  if(Math.abs(delta)<1e-8){if(from[axis]<min[axis]||from[axis]>max[axis])return false;continue}
  let a=(min[axis]-from[axis])/delta,b=(max[axis]-from[axis])/delta;
  if(a>b)[a,b]=[b,a];enter=Math.max(enter,a);leave=Math.min(leave,b);
  if(enter>leave)return false;
 }
 return leave>.001&&enter<.999;
}
export function blocksPlayerView(min,max,feet,towardCamera,cameraPosition=null){
 // Protect the body and nearby walking space, not just a pinhole at the head.
 const samples=[[0,0,.2],[0,0,1],[0,0,1.9]];
 for(let i=0;i<8;i++){const a=i*Math.PI/4;samples.push([Math.cos(a)*2.4,Math.sin(a)*2.4,.35])}
 return samples.some(offset=>{
  const from=feet.map((x,i)=>x+offset[i]);
  const to=cameraPosition??from.map((x,i)=>x+towardCamera[i]*100);
  return crossesBox(from,to,min,max);
 });
}
