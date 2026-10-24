import {interpolatedPosition} from './motion.js';
import * as T from './vendor/three.module.js';
import {RIGHT,DEPTH,dot} from './engine.js';
import {blocksPlayerView} from './visibility.js';
import {cameraPreset,verticalFov,springArmDistance} from './camera.js';
import {OriginalArt} from './art.js';
const palette={Platform:0x617779,Pillar:0x9b9674,Vine:0x61876a,Receiver:0xe7bb70,IceWheel:0x76b8c7,IceGate:0x78969d,Fragile:0x9eafb3,Exit:0xf1cc86};
export class View {
 constructor(canvas){this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.scene=new T.Scene();this.scene.background=new T.Color(0x152732);this.scene.fog=new T.FogExp2(0x152732,.011);this.camera=new T.OrthographicCamera(-20,20,12,-12,.1,300);this.orthoCamera=this.camera;this.perspectiveCamera=new T.PerspectiveCamera(45,1,.08,300);this.perspectiveCamera.up.set(0,0,1);this.orbit={yaw:Math.PI/2,pitch:27*Math.PI/180};this.camera.up.set(0,0,1);this.focus=new T.Vector3();this.scene.add(new T.HemisphereLight(0xc0e1eb,0x28333d,1.3));const sun=new T.DirectionalLight(0xffd6a2,3);sun.position.set(-15,-20,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=18;sun.shadow.camera.bottom=-18;sun.shadow.camera.near=.5;sun.shadow.camera.far=90;sun.shadow.bias=-.0002;sun.shadow.normalBias=.035;this.sun=sun;this.scene.add(sun,sun.target);const rim=new T.DirectionalLight(0x9de7ff,2);rim.position.set(20,15,15);this.scene.add(rim);this.world=new T.Group();this.scene.add(this.world);this.decor=new T.Group();this.scene.add(this.decor);this.hero=this.makeHero();this.scene.add(this.hero);this.fx=new T.Group();this.scene.add(this.fx);this.materials=new Map();this.fanMaterial=new T.MeshBasicMaterial({color:0x81d9ef,transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false});this.beamMaterial=new T.LineBasicMaterial({color:0xc4f6ff});this.meshes=new Map();this.flatMix=0;this.viewAngle=0;this.clock=0;this.makeBackdrop();this.resize();window.addEventListener('resize',()=>this.resize())}
 mat(color,glow=0){const key=color+':'+glow;if(!this.materials.has(key))this.materials.set(key,new T.MeshStandardMaterial({color,roughness:.88,metalness:.08,emissive:color,emissiveIntensity:glow}));return this.materials.get(key)}
 box(parent,p,s,c,glow=0){const mesh=new T.Mesh(new T.BoxGeometry(...s),this.mat(c,glow));mesh.position.set(...p);parent.add(mesh);return mesh}
 crystal(parent,p,size,color){const m=new T.Mesh(new T.OctahedronGeometry(size,0),this.mat(color,.5));m.scale.set(.6,.6,1.5);m.position.set(...p);parent.add(m);return m}
 makeHero(){const g=new T.Group();const mat=(c)=>new T.MeshStandardMaterial({color:c,roughness:.8});const add=(geo,c,p)=>{const m=new T.Mesh(geo,mat(c));m.rotation.x=Math.PI/2;m.position.set(...p);g.add(m);return m};add(new T.ConeGeometry(.36,.8,7),0x354e70,[0,0,.65]);add(new T.SphereGeometry(.22,12,8),0xe1bc98,[0,0,1.15]);add(new T.CylinderGeometry(.48,.48,.07,9),0x314867,[0,0,1.36]);add(new T.ConeGeometry(.3,.58,7),0x466181,[.04,0,1.62]);add(new T.CylinderGeometry(.035,.035,1.4,6),0xc6ad78,[.43,0,.85]);add(new T.OctahedronGeometry(.13),0xffd489,[.43,0,1.61]);add(new T.BoxGeometry(.15,.22,.22),0x29343e,[-.15,0,.14]);add(new T.BoxGeometry(.15,.22,.22),0x29343e,[.15,0,.14]);const shadow=new T.Mesh(new T.CircleGeometry(.5,24),new T.MeshBasicMaterial({color:0x05151c,transparent:true,opacity:.3,depthWrite:false}));shadow.position.z=.012;g.add(shadow);return g}
 makeBackdrop(){const geo=new T.BufferGeometry(),pts=[];for(let i=0;i<260;i++){const n=i*2.399;pts.push(Math.sin(n)*70,Math.cos(n*1.7)*65,Math.sin(n*2.4)*30+12)}geo.setAttribute('position',new T.Float32BufferAttribute(pts,3));this.stars=new T.Points(geo,new T.PointsMaterial({color:0xb6d3ce,size:.055,transparent:true,opacity:.65}));this.decor.add(this.stars);for(let i=0;i<22;i++){const a=i*2.399,r=32+i%7*5;const m=new T.Mesh(new T.ConeGeometry(3+i%4,8+i%7,5),new T.MeshStandardMaterial({color:i%2?0x253f4b:0x304b54,roughness:1}));m.rotation.x=-Math.PI/2;m.position.set(Math.sin(a)*r,Math.cos(a)*r,-14-i%5*2);this.decor.add(m)}const grid=new T.GridHelper(500,500,0xa7bbc0,0xc4d0d2);grid.rotation.x=Math.PI/2;grid.material.transparent=true;grid.material.opacity=.35;this.grid=grid;this.scene.add(grid);grid.visible=false}
 clear(group){for(const child of [...group.children]){child.traverse(n=>{if(n.geometry&&!n.geometry.userData.shared)n.geometry.dispose();if(n.userData.fadeMaterial)n.userData.fadeMaterial.dispose()});group.remove(child)}}
 async loadAssets(){this.art=new OriginalArt();await this.art.load();this.clear(this.hero);this.scene.remove(this.hero);this.heroRig=this.art.makeHero();this.hero=this.heroRig.root;this.scene.add(this.hero)}
 build(game){this.loadSerial=game.loadSerial;this.clear(this.world);this.meshes.clear();if(this.environment){this.clear(this.environment);this.scene.remove(this.environment)}if(this.art){this.environment=this.art.environment(game);this.scene.add(this.environment);this.heroRig.previous=null;this.heroRig.air=0;this.heroRig.land=0;this.heroRig.cast=0;this.heroRig.lastCast=game.castSerial||0}for(const o of game.objects){if(this.art){const group=this.art.object(o,game);group.position.set(...o.p);this.world.add(group);this.meshes.set(o.id,group);continue}const g=new T.Group(),s=o.size,c=palette[o.kind];g.position.set(...o.p);this.world.add(g);this.meshes.set(o.id,g);
 if(o.kind==='Platform'||o.kind==='Pillar'){this.box(g,[0,0,0],s,c);if(s[2]<5&&s[0]>.8&&s[1]>.8){this.box(g,[0,0,s[2]/2+.025],[s[0]+.04,s[1]+.04,.05],0x9baaa3);for(let j=0;j<Math.min(12,Math.floor(s[0]/2));j++)this.box(g,[-s[0]/2+(j+1)*s[0]/(Math.floor(s[0]/2)+1),0,s[2]/2+.054],[.018,s[1],.006],0x657d7b)}if(o.kind==='Pillar'){this.box(g,[0,0,s[2]/2+.07],[s[0]*.65,.13,.05],0xe7bb70,1);this.crystal(g,[0,0,s[2]/2+.6],.22,0xffd489)}}
 if(o.kind==='Vine'){for(let j=0;j<Math.max(4,Math.ceil(s[1]*2));j++){const y=-s[1]/2+j*s[1]/Math.ceil(s[1]*2);const m=this.box(g,[Math.sin(j)*.14,y,0],[.12,.12,s[2]],j%2?0x69946d:0x8dac79);m.rotation.x=Math.sin(j*2)*.07;this.crystal(g,[.1,y,Math.sin(j)*s[2]*.3],.16,0x9bb77b)}}
 if(o.kind==='Fragile'){for(let x=0;x<6;x++)for(let z=0;z<5;z++)this.box(g,[0,(x-2.5)*s[1]/6,(z-2)*s[2]/5],[s[0],s[1]/6-.045,s[2]/5-.045],0x9baaaa);for(let z=0;z<5;z++)this.box(g,[-s[0]/2-.01,0,(z-2)*s[2]/6],[.02,s[1]*.7,.035],0x9ce5ff,1)}
 if(o.kind==='IceGate'){for(let j=0;j<12;j++)this.box(g,[0,(j-5.5)*s[1]/12,0],[s[0],.12,s[2]],0xb5b2a0);this.box(g,[0,0,s[2]/2-.1],[s[0]*1.3,s[1],.2],0x6f8588)}
 if(o.kind==='IceWheel'){this.box(g,[0,0,-.72],[1.55,1.55,.55],0x647b80);const wheel=new T.Group();wheel.name='wheel';for(let j=0;j<12;j++){const a=j*Math.PI/6,m=this.box(wheel,[Math.cos(a)*.6,-.12,Math.sin(a)*.6],[.28,.28,.28],0xc0b88f);m.rotation.y=-a}const ring=new T.Mesh(new T.TorusGeometry(.47,.16,6,12),this.mat(0xc0b88f));ring.rotation.x=Math.PI/2;wheel.add(ring);g.add(wheel);this.crystal(g,[0,-.35,0],.23,0x9ce5ff)}
 if(o.kind==='Receiver'){const pedestal=this.box(g,[0,0,-s[2]/3],[s[0],s[1],s[2]/3],0x8b9485);this.crystal(g,[0,0,.1],.28,0xf3cd87);if(o.view>=0){const ring=new T.Mesh(new T.TorusGeometry(.5,.025,4,32),this.mat(0xecc486,.7));ring.rotation.x=Math.PI/2;g.add(ring)}}
 if(o.kind==='Exit'){this.box(g,[0,0,0],[1.8,1.8,.16],0x839a96);this.box(g,[-1,0,1.5],[.22,.4,3],0xb9ad8d);this.box(g,[1,0,1.5],[.22,.4,3],0xb9ad8d);this.box(g,[0,0,3],[2.2,.4,.2],0xb9ad8d);this.crystal(g,[0,0,1.4],.6,0xffd698);const light=new T.PointLight(0xffc77d,5,8);light.position.z=2;g.add(light)}
 }
 this.orbit={yaw:game.room.spawn?game.room.spawn.cameraYaw*Math.PI/180:(game.campaign>=2?0:Math.PI/2),pitch:cameraPreset(game.campaign).pitch};this.arm=cameraPreset(game.campaign).distance;this.focus.set(...game.player.p).add(new T.Vector3(0,0,cameraPreset(game.campaign).targetHeight));this.flatMix=game.flat?1:0;this.viewAngle=game.view*Math.PI/2;
 }
 fadeGroup(group,blocked,dt){
 const goal=blocked?.08:1;
 const old=group.userData.visibilityAlpha??1;
 let alpha=old+(goal-old)*Math.min(1,dt*(blocked?22:8));
 if(Math.abs(alpha-goal)<.002)alpha=goal;
 group.userData.visibilityAlpha=alpha;
 group.traverse(mesh=>{
  if(!mesh.isMesh)return;
  if(alpha<1&&!mesh.userData.fadeMaterial){
   mesh.userData.solidMaterial=mesh.material;
   mesh.userData.fadeMaterial=mesh.material.clone();
   mesh.userData.fadeMaterial.transparent=true;
   mesh.userData.fadeMaterial.depthWrite=false;
  }
  if(alpha<1){mesh.material=mesh.userData.fadeMaterial;mesh.material.opacity=alpha}
  else if(mesh.userData.solidMaterial)mesh.material=mesh.userData.solidMaterial;
 });
 }
 updateVisibility(game,dt,menu){
 this.world.updateMatrixWorld(true);this.decor.updateMatrixWorld(true);this.environment?.updateMatrixWorld(true);
 const toward=this.camera.position.clone().sub(this.focus).normalize().toArray();
 const feet=this.hero.position.toArray(),box=new T.Box3();
 const blocked=group=>{box.setFromObject(group);return blocksPlayerView(box.min.toArray(),box.max.toArray(),feet,toward,this.camera.isPerspectiveCamera?this.camera.position.toArray():null)};
 for(const o of game.objects){
  const group=this.meshes.get(o.id);
  const canFade=!menu&&!game.flat&&group.visible&&o.kind==='Platform'&&o!==game.player.support&&!/step\d+$/.test(o.id);
  this.fadeGroup(group,canFade&&blocked(group),dt);
 }
 for(const group of this.environment?.children??[]){this.fadeGroup(group,!menu&&!game.flat&&blocked(group),dt)}
 for(const group of this.decor.children){
  if(group.isMesh)this.fadeGroup(group,!menu&&!game.flat&&blocked(group),dt);
 }
 }
 look(dx,dy){this.orbit.yaw-=dx*.003;this.orbit.pitch=Math.max(-10*Math.PI/180,Math.min(65*Math.PI/180,this.orbit.pitch+dy*.0025))}
 resetLook(game){const d=DEPTH[game.view];this.orbit.yaw=game.campaign===3?Math.atan2(-d[1],-d[0]):Math.atan2(d[1],d[0]);this.orbit.pitch=cameraPreset(game.campaign).pitch}
 updateCamera(game,dt,menu){
  const preset=cameraPreset(game.campaign);
  const target=menu?new T.Vector3(-.5,0,2):this.hero.position.clone().add(new T.Vector3(0,0,preset.targetHeight));
  if(menu)this.focus.lerp(target,1-Math.exp(-dt*12));else this.focus.copy(target);
  if(menu||game.flat){
   this.camera=this.orthoCamera;
   const yaw=this.viewAngle+(menu?.22:0);
   const offset=new T.Vector3(-Math.sin(yaw)*32,-Math.cos(yaw)*32,menu?25:0);
   this.camera.position.copy(this.focus).add(offset);this.camera.lookAt(this.focus);
   const width=menu?26*this.aspect:Math.max(14,8*this.aspect),height=width/this.aspect;
   this.camera.left=-width/2;this.camera.right=width/2;this.camera.top=height/2;this.camera.bottom=-height/2;
  }else{
   this.camera=this.perspectiveCamera;
   const {yaw,pitch}=this.orbit;
   const direction=new T.Vector3(-Math.cos(yaw)*Math.cos(pitch),-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch));
   const safe=springArmDistance(this.focus.toArray(),direction.clone().multiplyScalar(preset.distance).toArray(),game.objects);
   this.arm=safe<this.arm?safe:this.arm+(safe-this.arm)*(1-Math.exp(-dt*12));
   this.camera.position.copy(this.focus).addScaledVector(direction,this.arm);this.camera.lookAt(this.focus);
   this.camera.aspect=this.aspect;this.camera.fov=verticalFov(preset.horizontalFov,Math.max(1,this.aspect));
  }
  this.camera.updateProjectionMatrix();
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.aspect=w/h}
 worldPos(p,g,offset=0){const b=RIGHT[g.view],d=DEPTH[g.view],depth=dot(p,d)*(1-this.flatMix)+dot(g.player.p,d)*this.flatMix;return new T.Vector3(b[0]*dot(p,b)+d[0]*depth,b[1]*dot(p,b)+d[1]*depth,p[2]+offset)}
 render(game,dt,menu=false,alpha=1){if(this.loadSerial!==game.loadSerial)this.build(game);this.clock+=dt;const target=game.flat?1:0;this.flatMix+=(target-this.flatMix)*Math.min(1,dt*9);let angle=game.view*Math.PI/2;while(angle-this.viewAngle>Math.PI)angle-=Math.PI*2;while(angle-this.viewAngle< -Math.PI)angle+=Math.PI*2;this.viewAngle+=(angle-this.viewAngle)*Math.min(1,dt*8);this.scene.background.lerp(new T.Color(game.flat?0xd8e3e4:0x152732),Math.min(1,dt*6));this.scene.fog.color.copy(this.scene.background);this.decor.visible=!game.flat&&!this.art;if(this.environment)this.environment.visible=!game.flat;this.grid.visible=game.flat;if(game.flat){const d=DEPTH[game.view];this.grid.rotation.set(0,0,-game.view*Math.PI/2);this.grid.position.set(game.player.p[0]+d[0]*12,game.player.p[1]+d[1]*12,0)}
 for(const o of game.objects){const m=this.meshes.get(o.id);m.visible=!o.burned&&!o.broken&&!(game.flat&&(o.exclude||(game.campaigns[game.campaign].worldObjects&&o.zone!==game.index)));m.position.copy(this.worldPos(o.p,game,o.open?o.size[2]+1:0));if(o.kind==='Receiver'){const core=m.getObjectByName('core')??m.children[1];core.rotation.z=this.clock*.7;core.visible=o.active||Math.sin(this.clock*2)>-.5}if(o.kind==='IceWheel'){const wheel=m.getObjectByName('wheel');if(!o.frozen){if(this.art)wheel.rotation.z+=dt;else wheel.rotation.y+=dt}}if(o.burning)m.scale.setScalar(1+Math.sin(this.clock*25)*.025);else m.scale.set(1,1,1)}
 const position=interpolatedPosition(game.previousPosition,game.player.p,alpha);this.hero.position.copy(this.worldPos(position,game));if(this.heroRig)this.art.animate(this.heroRig,game,dt);else{this.hero.rotation.z=Math.atan2(game.player.face[1],game.player.face[0])*.12;this.hero.children[0].rotation.z=Math.sin(this.clock*7)*.025;}
 this.clear(this.fx);
 if(game.fire){const f=game.fire,center=this.worldPos(f.p,game);const fireGroup=new T.Group();fireGroup.position.copy(center);this.fx.add(fireGroup);const r=RIGHT[game.view],dep=DEPTH[game.view],flat=game.flat;for(let i=0;i<25;i++){const a=i*2.399,rad=.3+(i%5)*.38,x=flat?r[0]*Math.sin(a)*.55:Math.cos(a)*rad,y=flat?r[1]*Math.sin(a)*.55:Math.sin(a)*rad,h=(flat?3.5:.55)*( .6+.4*Math.sin(i+this.clock*9));const flame=new T.Mesh(new T.ConeGeometry(flat?.11:.14,h,5),this.mat(i%3?0xff9c43:0xffdb87,1.3));flame.rotation.x=Math.PI/2;flame.position.set(x,y,h/2+.1);fireGroup.add(flame)}const ring=new T.Mesh(new T.RingGeometry(1.85,2,48),this.mat(0xffad57,.8));ring.position.z=.03;ring.visible=!flat;fireGroup.add(ring)}
 if(game.channelling){const p=game.player,angle=Math.atan2(p.face[1],p.face[0]),center=this.worldPos(p.p,game,.09);const fan=new T.Mesh(new T.CircleGeometry(6,32,angle-.698,1.396),this.fanMaterial);fan.position.copy(center);this.fx.add(fan);for(let i=0;i<20;i++){const a=angle-.65+(i%7)/6*1.3,r=(i*.31+this.clock*4)%6;this.crystal(this.fx,[center.x+Math.cos(a)*r,center.y+Math.sin(a)*r,center.z+.05],.07,0xa8edff)}}
 if(game.beam){const b=game.beam,from=this.worldPos(b.p,game),to=from.clone().add(new T.Vector3(...b.dir,0).multiplyScalar(b.length));const geo=new T.BufferGeometry().setFromPoints([from,to]);this.fx.add(new T.Line(geo,this.beamMaterial))}
 this.updateCamera(game,dt,menu);
 this.sun.position.copy(this.focus).add(new T.Vector3(-15,-20,35));this.sun.target.position.copy(this.focus);
 this.updateVisibility(game,dt,menu);this.renderer.render(this.scene,this.camera);

 }
}


