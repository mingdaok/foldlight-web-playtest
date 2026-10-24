// Keep each finger independent, including two fingers on the same held button.
export class HeldInput {
 constructor(){this.keyboard=new Set();this.pointers=new Map()}
 add(key){this.keyboard.add(key)}
 delete(key){this.keyboard.delete(key)}
 has(key){return this.keyboard.has(key)||[...this.pointers.values()].includes(key)}
 clear(){this.keyboard.clear();this.pointers.clear()}
}
export function bindGameButton(button,input,action,enabled=()=>true){
 const hold=button.dataset.hold,key=hold||button.dataset.action;
 let suppressClickUntil=0;
 button.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  if(!enabled())return;
  e.preventDefault();
  suppressClickUntil=performance.now()+800;
  button.setPointerCapture(e.pointerId);
  if(hold)input.pointers.set(e.pointerId,key);
  if(!hold||key==='f')action(key);
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{
  input.pointers.delete(e.pointerId);
  suppressClickUntil=performance.now()+800;
 });
 // Keyboard/assistive activation only. Touch actions already fire on pointerdown,
 // since a secondary finger does not reliably produce a browser click.
 button.addEventListener('click',e=>{
  if(e.pointerType||e.detail!==0||performance.now()<suppressClickUntil)return;
  if(!hold&&enabled())action(key);
 });
 button.addEventListener('contextmenu',e=>e.preventDefault());
}
export const DEFAULT_TOUCH_SENSITIVITY=2.5;
export function touchSensitivity(value){
 const n=Number(value);
 return Number.isFinite(n)&&n>=0.5&&n<=6?n:DEFAULT_TOUCH_SENSITIVITY;
}
