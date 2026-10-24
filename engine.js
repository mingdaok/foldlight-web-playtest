import {cameraMovement} from './camera.js?v=touch1';
// World coordinates follow the UE layout: X/Y ground plane, Z up, metres.
export const RIGHT=[[1,0],[0,-1],[-1,0],[0,1]];
export const DEPTH=[[0,1],[1,0],[0,-1],[-1,0]];
export const dot=(p,b)=>p[0]*b[0]+p[1]*b[1];
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export class Game {
 constructor(campaigns){this.campaigns=campaigns;this.events=[];this.campaign=0;this.index=0;this.falls=0;this.switches=0;this.elapsed=0;this.load(0,0)}
 say(text){this.events.push(text)}
 load(c,i){this.loadSerial=(this.loadSerial||0)+1;this.campaign=c;this.index=i;this.room=this.campaigns[c].rooms[i];this.objects=structuredClone(this.campaigns[c].worldObjects??this.room.objects);this.restoreCompletedZones();this.player={p:[...(this.room.spawn?.feet??this.room.start)],vz:0,face:[...(this.room.spawn?.face??[1,0])],support:null,ground:false};this.view=0;this.flat=false;this.used2D=false;this.fire=null;this.beam=null;this.cooldown=0;this.element=this.campaigns[c].element==='ice'?'ice':'fire';this.done=false;this.completed=false;this.furnace=0;this.coyote=0;this.jumpBuffer=0;this.channelling=false;this.castSerial=0;if(!this.room.spawn)this.player.p[2]+=.02;for(let n=0;n<8;n++)this.physics(1/120,{});this.events=[]}
 activeObjects(){return this.campaigns[this.campaign].worldObjects?this.objects.filter(o=>o.zone===this.index):this.objects}
 restoreCompletedZones(){if(!this.campaigns[this.campaign].worldObjects)return;for(const o of this.objects){if(o.zone>=this.index)continue;if(o.kind==='Vine')o.burned=true;if(o.kind==='Fragile')o.broken=true;if(['Receiver','IceWheel'].includes(o.kind))o.active=true;if(o.kind==='IceGate')o.open=true}}
 advanceCheckpoint(){if(!this.completed||this.done||!this.campaigns[this.campaign].worldObjects)return false;this.index++;this.room=this.campaigns[this.campaign].rooms[this.index];this.completed=false;this.used2D=false;this.fire=null;this.beam=null;this.channelling=false;this.cooldown=0;this.furnace=0;this.restoreCompletedZones();return true}
 reset(){this.falls++;this.load(this.campaign,this.index);this.say('已回到本区入口，机关复位。')}
 basis(){return RIGHT[this.view]}
 extent(o){return Math.abs(this.basis()[0])*o.size[0]/2+Math.abs(this.basis()[1])*o.size[1]/2}
 bounds(o,flat=this.flat){const p=o.p,s=o.size;return flat?[dot(p,this.basis())-this.extent(o),dot(p,this.basis())+this.extent(o),-1000,1000,p[2]-s[2]/2,p[2]+s[2]/2]:[p[0]-s[0]/2,p[0]+s[0]/2,p[1]-s[1]/2,p[1]+s[1]/2,p[2]-s[2]/2,p[2]+s[2]/2]}
 solid(o,flat=this.flat){return !o.broken&&!o.burned&&!o.open&&['Platform','Pillar','Vine','Fragile','IceGate','IceWheel'].includes(o.kind)&&!(flat&&(o.exclude||(this.campaigns[this.campaign].worldObjects&&o.zone!==this.index)))}
 colliders(){return this.objects.filter(o=>this.solid(o))}
 overlaps(p,o,flat=this.flat,margin=.001){const b=this.bounds(o,flat),x=flat?dot(p,this.basis()):p[0],y=flat?0:p[1];return x+.28>b[0]+margin&&x-.28<b[1]-margin&&y+.28>b[2]+margin&&y-.28<b[3]-margin&&p[2]+1.55>b[4]+margin&&p[2]<b[5]-margin}
 turn(dir){if(this.flat){this.say('先 V 展开，再选择折叠方向。');return false}this.view=(this.view+dir+4)%4;this.player.face=[...this.basis()];return true}
 fold(){const p=this.player;if(!p.ground||!p.support){this.say('需要站稳在平台上才能切换维度。');return false}if(this.objects.some(o=>o.moving)){this.say('请等待石柱停稳。');return false}const flat=!this.flat,target=[...p.p];if(!flat){const d=DEPTH[this.view],delta=dot(p.support.p,d)-dot(target,d);target[0]+=d[0]*delta;target[1]+=d[1]*delta}if(flat&&p.support.exclude){this.say('回到主路平台后再折叠。');return false}
 const blocked=this.objects.some(o=>o!==p.support&&this.solid(o,flat)&&!(flat&&(o.exclude||(this.campaigns[this.campaign].worldObjects&&o.zone!==this.index)))&&this.overlaps(target,o,flat,.035));if(blocked){this.say('目标空间被占用，换个位置再折叠。');return false}p.p=target;this.flat=flat;this.used2D ||=flat;this.switches++;this.channelling=false;p.face=[...this.basis()];return true}
 jump(){this.jumpBuffer=.16}
 physics(dt,input){const before=[...this.player.p];this.previousPosition=before;const axes=!this.flat&&Number.isFinite(input.lookYaw)?cameraMovement(input.lookYaw):null;const p=this.player,b=axes?.right??this.basis(),d=axes?.back??DEPTH[this.view];let h=input.x||0,v=this.flat?0:input.y||0;const len=Math.hypot(h,v);if(len>1){h/=len;v/=len}const dx=b[0]*h+d[0]*v,dy=b[1]*h+d[1]*v;if(len>.01)p.face=[dx,dy];if(p.ground)this.coyote=.12;else this.coyote=Math.max(0,this.coyote-dt);this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);if(this.jumpBuffer>0&&this.coyote>0){p.vz=7;this.jumpBuffer=0;this.coyote=0;p.ground=false}
 const canStep=p.ground&&p.vz<=0;const stepBase=p.p[2];const solids=this.colliders();const move=(axis,delta)=>{p.p[axis]+=delta;for(const o of solids){if(!this.overlaps(p.p,o))continue;const bb=this.bounds(o);
 if(canStep&&['Platform','Pillar'].includes(o.kind)&&bb[5]>stepBase+.001&&bb[5]<=stepBase+.32){
  const raised=[...p.p];raised[2]=bb[5];
  // Both the raised destination and vertical head clearance must be free.
  const liftBlocked=solids.some(other=>other!==o&&this.overlaps(raised,other));
  if(!liftBlocked){p.p=raised;p.vz=0;continue}
 }
 if(this.flat){const u=dot(p.p,b),sgn=delta*b[axis];const end=sgn>0?bb[0]-.281:bb[1]+.281;const diff=end-u;p.p[0]+=b[0]*diff;p.p[1]+=b[1]*diff}else p.p[axis]=delta>0?bb[axis*2]-.281:bb[axis*2+1]+.281}};
 if(dx)move(0,dx*5.8*dt);if(dy)move(1,dy*5.8*dt);
 const old=p.p[2];p.vz-=16*dt;p.p[2]+=p.vz*dt;p.ground=false;p.support=null;
 for(const o of solids){const bb=this.bounds(o),x=this.flat?dot(p.p,b):p.p[0],y=this.flat?0:p.p[1];if(x+.27<=bb[0]||x-.27>=bb[1]||y+.27<=bb[2]||y-.27>=bb[3])continue;
 if(p.vz<=0&&old>=bb[5]-.06&&p.p[2]<=bb[5]){p.p[2]=bb[5];p.vz=0;p.ground=true;p.support=o}
 else if(p.vz>0&&old+1.55<=bb[4]+.02&&p.p[2]+1.55>=bb[4]){p.p[2]=bb[4]-1.55;p.vz=0}}
 if(canStep&&!p.ground&&p.vz<=0){
  const candidates=solids.filter(o=>['Platform','Pillar'].includes(o.kind)).map(o=>({o,b:this.bounds(o)})).filter(({b})=>{
   const x=this.flat?dot(p.p,this.basis()):p.p[0],y=this.flat?0:p.p[1];
   return b[5]<=old+.001&&old-b[5]<=.32&&x+.27>b[0]&&x-.27<b[1]&&y+.27>b[2]&&y-.27<b[3];
  }).sort((a,b)=>b.b[5]-a.b[5]);
  if(candidates.length){const {o,b}=candidates[0];p.p[2]=b[5];p.vz=0;p.ground=true;p.support=o}
 }
 p.moveSpeed=Math.hypot(p.p[0]-before[0],p.p[1]-before[1])/dt;
 if(p.p[2]<this.room.start[2]-10)this.reset();
 }
 use(){if(this.flat){this.say('先 V 展开为三维，再按 G 交互。');return}const p=this.player.p;const pillar=this.objects.find(o=>o.kind==='Pillar'&&!o.moved&&!o.moving&&Math.hypot(p[0]-o.p[0],p[1]-o.p[1])<3.4);if(pillar){pillar.moving=true;this.say('轨道石柱正在移动…');return}
 const exit=this.activeObjects().find(o=>o.kind==='Exit'&&Math.hypot(p[0]-o.p[0],p[1]-o.p[1],p[2]-o.p[2])<2.4);if(!exit){this.say('靠近金色轨道石柱或出口晶石，再按 G。');return}if(!this.solved()){this.say('机关尚未全部完成。按 H 查看本区路线。');return}this.completed=true;if(this.index===this.campaigns[this.campaign].rooms.length-1)this.done=true;}
 solved(){const os=this.activeObjects();if(this.campaign===0){if(this.index===0)return this.used2D;if(this.index===1)return this.used2D&&os.find(o=>o.kind==='Pillar').moved;if(this.index===4&& !os.find(o=>o.kind==='Pillar').moved)return false}if(this.campaign===3&&[1,4].includes(this.index)&&!this.used2D)return false;return os.every(o=>o.kind==='Vine'?o.burned:o.kind==='Fragile'?o.broken:['Receiver','IceWheel'].includes(o.kind)?o.active:true)}
 switchElement(){if(this.campaigns[this.campaign].element!=='both'){this.say('当前教程只使用'+(this.element==='ice'?'冰魔法。':'火魔法。'));return}this.element=this.element==='ice'?'fire':'ice';this.channelling=false}
 cast(){if(this.cooldown>0)return;if(this.element==='fire'){if(this.campaign===0&&this.index<2){this.say('火魔法会在第三关解锁。');return}const p=this.player;this.fire={p:[p.p[0]+p.face[0]*2.3,p.p[1]+p.face[1]*2.3,p.p[2]],life:4};this.cooldown=.45;this.castSerial++}else if(this.flat){this.castSerial++;this.iceLine();this.cooldown=.65}}
 iceLine(){const b=this.basis(),p=this.player.p,u=dot(p,b),sign=dot(this.player.face,b)>=0?1:-1,z=p[2]+.8;const candidates=this.colliders().filter(o=>{const bb=this.bounds(o);return z>bb[4]&&z<bb[5]&&((bb[0]-u)*sign>=-.3||(bb[1]-u)*sign>=-.3)}).map(o=>({o,t:Math.max(0,sign>0?this.bounds(o)[0]-u:u-this.bounds(o)[1])})).filter(c=>c.t<=11).sort((a,b)=>a.t-b.t);const hit=candidates[0];this.beam={p:[p[0],p[1],z],dir:[b[0]*sign,b[1]*sign],length:hit?.t??11,life:.22};if(hit?.o.kind==='Fragile'){hit.o.broken=true;this.say('薄石板已击碎。')}else if(hit)this.say('冰线被坚固物体挡住。')}
 lineBlocked(from,to,target){const dx=to[0]-from[0],dy=to[1]-from[1],z=from[2]+.1;for(const o of this.colliders()){if(o===target)continue;const bb=this.bounds(o,false);if(z<=bb[4]||z>=bb[5])continue;let lo=0,hi=1;for(let a=0;a<2;a++){const delta=a===0?dx:dy;if(Math.abs(delta)<1e-6){if(from[a]<bb[a*2]||from[a]>bb[a*2+1]){hi=-1;break}}else{let t1=(bb[a*2]-from[a])/delta,t2=(bb[a*2+1]-from[a])/delta;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2)}}if(lo<=hi&&hi>0&&lo<.95)return true}return false}
 tick(dt,input={}){if(this.done)return;this.elapsed+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.channelling=!!input.cast&&this.element==='ice'&&!this.flat;if(input.cast)this.cast();if(this.beam){this.beam.life-=dt;if(this.beam.life<=0)this.beam=null}
 for(const o of this.objects){if(o.moving){const delta=o.target.map((x,i)=>x-o.p[i]),dist=Math.hypot(...delta),step=dt*5;if(dist<=step){o.p=[...o.target];o.moving=false;o.moved=true;this.say('石柱已就位。')}else o.p=o.p.map((x,i)=>x+delta[i]/dist*step)}
 if(o.kind==='IceWheel'){o.frozen=Math.max(0,(o.frozen||0)-dt);const p=this.player,dx=o.p[0]-p.p[0],dy=o.p[1]-p.p[1],dist=Math.hypot(dx,dy);const hit=(!this.campaigns[this.campaign].worldObjects||o.zone===this.index)&&this.channelling&&dist<6&&Math.abs(o.p[2]-o.size[2]/2-p.p[2])<.6&&(dx*p.face[0]+dy*p.face[1])/Math.max(.001,dist)>.766&&!this.lineBlocked(p.p,o.p,o);if(hit){o.chill=(o.chill||0)+dt;if(o.chill>=.75){if(!o.active)this.say('齿轮冻停！8 秒内穿过闸门。');o.active=true;o.frozen=8}}else{o.chill=Math.max(0,(o.chill||0)-dt*.25)}}
 if(o.burning){o.burning-=dt;if(o.burning<=0){o.burned=true;this.say('藤蔓封印已解除。')}}o.lit=Math.max(0,(o.lit||0)-dt);
 }
 if(this.fire){this.fire.life-=dt;if(this.fire.life<=0)this.fire=null;else for(const o of this.activeObjects()){if(!['Receiver','Vine'].includes(o.kind))continue;const f=this.fire.p,ex=o.size[0]/2,ey=o.size[1]/2,ez=o.size[2]/2;let hit;if(this.flat)hit=Math.abs(dot(o.p,this.basis())-dot(f,this.basis()))<.6+this.extent(o)&&Math.abs(o.p[2]-(f[2]+2.2))<2.2+ez;else hit=Math.hypot(Math.max(0,Math.abs(o.p[0]-f[0])-ex),Math.max(0,Math.abs(o.p[1]-f[1])-ey))<=2&&Math.abs(o.p[2]-(f[2]+.35))<.35+ez;if(!hit)continue;if(o.kind==='Vine'&&!o.burned&&!o.burning){const locked=(this.campaign===0&&this.index===3)||(this.campaign===2&&this.index===1);if(!locked||this.objects.filter(x=>x.kind==='Receiver'&&x.view===-1).every(x=>x.active))o.burning=1.5}else if(o.kind==='Receiver'){if(o.view===-1&&!this.flat)o.lit=.15;else if(o.view===this.view&&this.flat&&!o.active){o.active=true;this.say('方向印记已点亮。展开、换向，寻找下一段路。')}}}}
 const lows=this.activeObjects().filter(o=>o.kind==='Receiver'&&o.view===-1);if(lows.length&&lows.every(o=>o.lit>0)){this.furnace+=dt;if(this.furnace>=.65)for(const o of lows)o.active=true}else this.furnace=0;
 for(const gate of this.objects.filter(o=>o.kind==='IceGate')){const wheel=this.objects.find(o=>o.id===gate.link);const broken=this.campaign>=2&&this.objects.some(o=>o.kind==='Fragile'&&o.broken&&o.zone===gate.zone);const open=wheel?(wheel.frozen>0||broken):this.solved();gate.open=open||this.overlaps(this.player.p,gate)}
 this.physics(dt,input);
 }
}


