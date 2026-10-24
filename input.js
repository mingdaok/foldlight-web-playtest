// Keep each finger independent, including two fingers on the same held button.
export class HeldInput {
 constructor(){this.keyboard=new Set();this.pointers=new Map();this.stick={x:0,y:0};this.resetHandlers=new Set()}
 add(key){this.keyboard.add(key)}
 delete(key){this.keyboard.delete(key)}
 has(key){return this.keyboard.has(key)||[...this.pointers.values()].includes(key)}
 movement(){return {x:(this.has('d')?1:0)-(this.has('a')?1:0)+this.stick.x,y:(this.has('s')?1:0)-(this.has('w')?1:0)+this.stick.y}}
 clear(){this.keyboard.clear();this.pointers.clear();this.stick={x:0,y:0};for(const reset of this.resetHandlers)reset()}
}
export function joystickVector(dx,dy,radius){
 const length=Math.hypot(dx,dy),fraction=Math.min(1,length/radius);
 const speed=Math.max(0,(fraction-.12)/.88);
 return {x:length?dx/length*speed:0,y:length?dy/length*speed:0,
  thumbX:length?dx/length*fraction*radius:0,thumbY:length?dy/length*fraction*radius:0};
}
export function bindJoystick(base,thumb,input,enabled=()=>true){
 let pointer=null;
 const reset=()=>{const old=pointer;pointer=null;input.stick={x:0,y:0};thumb.style.transform='translate(-50%,-50%)';base.classList.remove('engaged');if(old!==null&&base.hasPointerCapture(old))base.releasePointerCapture(old)};
 input.resetHandlers.add(reset);
 const update=e=>{const rect=base.getBoundingClientRect();const radius=Math.max(1,(rect.width-thumb.offsetWidth)/2-4);
  const value=joystickVector(e.clientX-rect.left-rect.width/2,e.clientY-rect.top-rect.height/2,radius);
  input.stick={x:value.x,y:value.y};thumb.style.transform=`translate(calc(-50% + ${value.thumbX}px),calc(-50% + ${value.thumbY}px))`;
 };
 base.addEventListener('pointerdown',e=>{
  if(pointer!==null||!enabled()||(e.pointerType==='mouse'&&e.button!==0))return;
  e.preventDefault();pointer=e.pointerId;base.setPointerCapture(pointer);base.classList.add('engaged');update(e);
 });
 base.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;e.preventDefault();if(!enabled()){reset();return}update(e)});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])base.addEventListener(event,e=>{if(e.pointerId===pointer)reset()});
 base.addEventListener('contextmenu',e=>e.preventDefault());
 return reset;
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
