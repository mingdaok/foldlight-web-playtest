import * as T from './vendor/three.module.js?v=stick1';
const direction=new T.Vector3(-15,-20,35).normalize();
const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize();
const up=new T.Vector3().crossVectors(direction,right).normalize();
// Keep the shadow grid fixed in light space while the follow camera moves.
export function stableShadowTarget(position,size=36,resolution=2048){
 const p=new T.Vector3(...position),step=size/resolution;
 const x=Math.round(p.dot(right)/step)*step,y=Math.round(p.dot(up)/step)*step;
 return right.clone().multiplyScalar(x).addScaledVector(up,y).addScaledVector(direction,p.dot(direction));
}


