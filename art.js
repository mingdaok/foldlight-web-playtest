import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/addons/loaders/GLTFLoader.js';
import {OBJLoader} from './vendor/addons/loaders/OBJLoader.js';
import {clone as cloneSkeleton} from './vendor/addons/utils/SkeletonUtils.js';

const dungeonNames=['pillar_decorated','wall_arched','wall_broken','torch_mounted','shelf_small_candles','table_small_decorated_A','barrel_large_decorated','barrel_small_stack','candle_triple','rubble_large','wall_archedwindow_open','shelves'];
const modelNames=['SM_Stone','SM_Arch','SM_BrokenArch','SM_Crystal','SM_Ring','SM_Pedestal','SM_Gear','SM_Root','SM_Leaf','SM_Grass','SM_Banner','SM_Flame'];
const stone=[.16,.28,.30],gold=[.74,.47,.14],ice=[.27,.72,1];
export class OriginalArt {
 constructor(){this.models=new Map();this.dungeon=new Map();this.materials=new Map();this.scenery={}}
 async load(){
  const gltf=new GLTFLoader(),obj=new OBJLoader();
  await Promise.all([
   gltf.loadAsync('assets/Mage.glb').then(asset=>this.mage=asset),
   ...dungeonNames.map(async name=>{const asset=await gltf.loadAsync('assets/dungeon/'+name+'.glb');asset.scene.traverse(n=>{if(n.isMesh){n.geometry.userData.shared=true;n.castShadow=false;n.receiveShadow=true;n.material.roughness=.85}});this.dungeon.set(name,asset.scene)}),
   ...modelNames.map(async name=>{const asset=await obj.loadAsync('assets/models/'+name+'.obj');let geo;asset.traverse(n=>{if(n.isMesh)geo=n.geometry});geo.scale(.01,.01,.01);geo.computeVertexNormals();geo.userData.shared=true;this.models.set(name,geo)}),
   ...['courtyard','confluence'].map(async name=>{const response=await fetch('assets/'+name+'-scenery.json');if(!response.ok)throw Error(name+' scenery missing');this.scenery[name]=await response.json()})
  ]);
 }
 material(color,glow=0){const key=JSON.stringify([color,glow]);if(!this.materials.has(key)){const c=Array.isArray(color)?new T.Color().setRGB(...color):new T.Color(color);this.materials.set(key,new T.MeshStandardMaterial({color:c,roughness:.82,metalness:color===gold?.35:0,emissive:c,emissiveIntensity:glow+.04,flatShading:true}))}return this.materials.get(key)}
 part(group,name,p,size,color=stone,glow=0){let geo=this.models.get(name);if(!geo){if(name==='Cone'){geo=new T.CylinderGeometry(.08,.5,1,7);geo.rotateX(Math.PI/2)}else if(name==='Cylinder'){geo=new T.CylinderGeometry(.5,.5,1,12);geo.rotateX(Math.PI/2)}else geo=new T.BoxGeometry(1,1,1)}const m=new T.Mesh(geo,this.material(color,glow));m.position.set(...p);m.scale.set(...size);m.castShadow=m.receiveShadow=true;group.add(m);return m}
 imported(group,name,p,scale=1,yaw=0){const wrap=new T.Group(),asset=this.dungeon.get(name).clone(true);asset.rotation.x=Math.PI/2;asset.scale.setScalar(scale);wrap.rotation.z=yaw;wrap.position.set(...p);wrap.add(asset);group.add(wrap);return wrap}
 makeHero(){const root=new T.Group(),model=cloneSkeleton(this.mage.scene);model.rotation.x=Math.PI/2;model.scale.setScalar(.65);model.traverse(n=>{if(n.isMesh){n.castShadow=n.receiveShadow=true;n.frustumCulled=false;n.material.roughness=.85}});root.add(model);const mixer=new T.AnimationMixer(model),actions=new Map();
  for(const clip of this.mage.animations){const action=mixer.clipAction(clip);actions.set(clip.name,action)}
  actions.get('Idle').play();return {root,model,mixer,actions,current:'Idle',previous:null,air:0,land:0,wasGround:true,cast:0,lastCast:0};
 }
 animate(hero,game,dt){const p=game.player.p,prev=hero.previous,speed=prev&&dt>0?Math.hypot(p[0]-prev[0],p[1]-prev[1])/dt:0;hero.previous=[...p];
  if(!game.player.ground)hero.air+=dt;else hero.air=0;
  if(game.player.ground&&!hero.wasGround)hero.land=.22;hero.wasGround=game.player.ground;hero.land=Math.max(0,hero.land-dt);
  if((game.castSerial||0)!==hero.lastCast){hero.cast=.65;hero.lastCast=game.castSerial||0}hero.cast=Math.max(0,hero.cast-dt);
  const state=hero.cast>0||game.channelling?'Spellcast_Shoot':!game.player.ground?(hero.air<.14?'Jump_Start':'Jump_Idle'):hero.land>0?'Jump_Land':speed>2.3?'Running_A':speed>.12?'Walking_A':'Idle';
  if(state!==hero.current){const old=hero.actions.get(hero.current),next=hero.actions.get(state);next.reset().play();old.crossFadeTo(next,.13,false);hero.current=state}
  hero.mixer.update(dt);const target=Math.atan2(game.player.face[1],game.player.face[0])+Math.PI/2;let delta=target-hero.root.rotation.z;delta=Math.atan2(Math.sin(delta),Math.cos(delta));hero.root.rotation.z+=delta*Math.min(1,dt*14);
 }
 object(o,game){const g=new T.Group(),s=o.size,top=s[2]/2;let color=game.campaign===3?(o.exclude?[.46,.49,.50]:[.72,.74,.72]):game.campaign===1?[.22,.30,.37]:game.campaign===2?(game.index===2||game.index===3?[.42,.62,.68]:[.16,.20,.23]):stone;
  const part=(name,p,size,c=color,glow=0)=>this.part(g,name,p,size,c,glow);
  if(['Platform','Pillar'].includes(o.kind)){
   part('SM_Stone',[0,0,0],s);part('SM_Stone',[0,0,top-.09],[s[0],s[1],.18],game.campaign===3?[.77,.78,.76]:[.36,.49,.45]);
   if(s[0]>1&&s[1]>1&&!o.exclude){
    part('SM_Stone',[0,0,-top+.1],[s[0]*.96,s[1]*.96,.2],color.map(v=>v*.7));
    for(const sign of [-1,1]){part('Cube',[0,sign*s[1]*.5,top-.23],[s[0]*.92,.025,.03],gold,.15);part('Cube',[sign*s[0]*.5,0,top-.23],[.025,s[1]*.92,.03],gold,.15)}
    const cols=Math.min(14,Math.ceil(s[0]/2.2)),rows=Math.min(10,Math.ceil(s[1]/2.2));
    for(let i=1;i<cols;i++)part('Cube',[-s[0]/2+s[0]*i/cols,0,top+.005],[.015,s[1]*.9,.005],color.map(v=>v*.45));
    for(let i=1;i<rows;i++)part('Cube',[0,-s[1]/2+s[1]*i/rows,top+.006],[s[0]*.92,.015,.005],color.map(v=>v*.45));
    part('SM_Ring',[0,0,top+.008],[.9,.9,.012],gold,.12);
    if(game.campaign<3)for(const x of [-.4,.4])for(const y of [-.39,.39]){part('SM_Grass',[s[0]*x,s[1]*y,top+.03],[.48,.48,.16],[.13,.24,.14]);part('SM_Stone',[s[0]*x+.15,s[1]*y+.1,top+.025],[.2,.14,.05],color.map(v=>v*.55))}
   }
   if(o.kind==='Pillar'){const mark=part('SM_Crystal',[0,s[1]/2+.05,top-.5],[.35,.1,.4],gold,.7);mark.rotation.y=.4}
  }else if(o.kind==='Vine'){
   for(let i=0;i<7;i++){const y=(i-3)*s[1]/7;const root=part('SM_Root',[Math.sin(i*2)*.12,y,0],[1.05,1.05,s[2]],[.24,.10,.055]);root.rotation.x=(i%2?13:-13)*Math.PI/180;for(let k=0;k<3;k++)part('SM_Leaf',[.18,y+.12,s[2]*(k*.23-.25)],[.28,.45,.25],[.27,.36,.12])}
   for(const z of [-.3,.2])part('SM_Root',[0,0,s[2]*z],[s[0],s[1],.18],[.19,.075,.04]);
  }else if(o.kind==='Receiver'){
   part('SM_Pedestal',[0,0,-.18],[1,1,.38]);part('SM_Ring',[0,0,.07],[.75,.75,.06],gold,.3);
   const core=part('SM_Crystal',[0,0,.3],[.43,.43,.65],gold,.4);core.name='core';for(let i=0;i<4;i++){const a=i*Math.PI/2;part('SM_Crystal',[Math.cos(a)*.33,Math.sin(a)*.33,.2],[.14,.14,.48],gold,.2)}
  }else if(o.kind==='Exit'){
   part('SM_Pedestal',[0,0,-.08],[2.05,2.05,.26]);for(const x of [-1.04,1.04]){part('SM_Pedestal',[x,0,.75],[.42,.42,1.5]);part('SM_Crystal',[x,0,1.64],[.25,.25,.5],ice,1)}
   for(const [diameter,col]of [[2.8,gold],[2.41,ice]]){const ring=part('SM_Ring',[0,-.1,1.65],[diameter,diameter,.08],col,.8);ring.rotation.x=Math.PI/2}
   part('SM_Crystal',[0,-.08,2.64],[.24,.24,.42],gold,1.5);
  }else if(o.kind==='IceWheel'){
   part('SM_Pedestal',[0,0,-.75],[1.55,1.55,.5]);part('Cube',[0,.15,-.15],[.25,.3,1],gold);
   const wheel=part('SM_Gear',[0,-.15,.1],[1.45,1.45,.2],gold,.12);wheel.rotation.x=Math.PI/2;wheel.name='wheel';part('SM_Crystal',[0,-.32,.1],[.25,.25,.3],ice,.6);
  }else if(o.kind==='Fragile'){
   for(let row=0;row<5;row++)for(let col=0;col<6;col++)part('SM_Stone',[(col%2)*.02,(col-2.5)*s[1]/6,(row-2)*s[2]/5],[s[0],s[1]/6-.05,s[2]/5-.05],[.47,.48,.44]);
   for(let i=0;i<5;i++){const crack=part('Cube',[-s[0]/2-.01,0,(i-2)*.65],[.02,.9,.03],ice,.7);crack.rotation.x=(i%2?24:-24)*Math.PI/180}
  }else if(o.kind==='IceGate'){
   for(let i=0;i<12;i++)part('Cube',[0,(i-5.5)*s[1]/12,0],[.35,.18,s[2]],gold,.1);
   for(const z of [-.4,.4])part('SM_Stone',[0,0,z*s[2]],[.45,s[1],.24]);
  }
  return g;
 }
 environment(game){const g=new T.Group();
  if(game.campaign>=2){
   const rows=this.scenery[game.campaign===3?'courtyard':'confluence'];
   for(const row of rows.filter(r=>game.campaign===3||r.zone===game.index)){const m=this.part(g,row.shape,row.p,row.size,row.color,row.color[0]>.8?.15:0);m.rotation.z=(row.yaw||0)*Math.PI/180;if(row.flip)m.rotation.x=Math.PI}
  }else{
   // Reuse the source FDArt arcade, reflected behind the browser camera's handedness.
   for(let i=-4;i<=4;i++){
    const x=i*6.5;this.imported(g,'pillar_decorated',[x-3.25,13.7,-4.85],1.2);this.imported(g,'pillar_decorated',[x-3.25,13.7,-.05],1.2);
    this.part(g,'SM_Arch',[x,13.3,6.35],[6.5,1.3,6.5]);
    if(i%2===0)this.imported(g,game.index===2?'wall_broken':game.index===4?'wall_archedwindow_open':'wall_arched',[x,16.5,-4.85],1.6);
    this.imported(g,'torch_mounted',[x+2.3,12.1,1.85],1.5);
    if(i%2){this.part(g,'SM_Stone',[x,12.8,-3.25],[4.1,2.5,.6]);
     if(game.index===1||game.index===3){this.imported(g,'barrel_large_decorated',[x-.75,13.1,-2.95],1.1);this.imported(g,'barrel_small_stack',[x+1,12.5,-2.95],.9);this.imported(g,'shelves',[x,14.6,-.1],1.25)}
     else if(game.index===2)this.imported(g,'rubble_large',[x,12.6,-2.95],.6);
     else{this.imported(g,'table_small_decorated_A',[x-.85,12.6,-2.95],1.55);this.imported(g,'candle_triple',[x+1.15,12.6,-2.95],1.35);this.imported(g,'shelf_small_candles',[x,14.5,1.5],1.7)}
    }
   }
  }
  return g;
 }
}
