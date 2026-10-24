// Render between the two latest fixed physics states, shared by hero and camera.
export function interpolatedPosition(previous,current,alpha){
 const t=Math.max(0,Math.min(1,alpha));
 return current.map((v,i)=>previous?previous[i]+(v-previous[i])*t:v);
}
