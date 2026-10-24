// Metres, adapted from FDCharacter.cpp: 65° horizontal FOV, -27° UE pitch,
// capsule-centre + 45cm target offset, 720/1080/650cm spring arms.
export const cameraPreset=campaign=>({distance:campaign===3?6.5:campaign===0?7.2:10.8,pitch:27*Math.PI/180,horizontalFov:65,targetHeight:1.31});
export function cameraMovement(yaw){return {right:[Math.sin(yaw),-Math.cos(yaw)],back:[-Math.cos(yaw),-Math.sin(yaw)]}}
export function verticalFov(horizontal,aspect){return 2*Math.atan(Math.tan(horizontal*Math.PI/360)/aspect)*180/Math.PI}
export function springArmDistance(pivot,offset,objects,radius=.18){
 const length=Math.hypot(...offset);let fraction=1;
 for(const o of objects){
  if(!['Platform','Pillar'].includes(o.kind))continue;
  let lo=0,hi=1;
  for(let i=0;i<3;i++){
   const min=o.p[i]-o.size[i]/2-radius,max=o.p[i]+o.size[i]/2+radius,d=offset[i];
   if(Math.abs(d)<1e-8){if(pivot[i]<min||pivot[i]>max){hi=-1;break}}
   else {let a=(min-pivot[i])/d,b=(max-pivot[i])/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b)}
  }
  if(lo<=hi&&hi>=0)fraction=Math.min(fraction,lo);
 }
 return Math.max(.15,length*fraction-.03);
}
