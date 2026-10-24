import {campaigns} from './levels.js';
import {Game} from './engine.js';
import {View} from './render.js';
const $=id=>document.getElementById(id),game=new Game(campaigns),keys=new Set();
let view,playing=false,selected=0,last=performance.now(),acc=0,toastTime=0,sound=true,audio,ready=false;
let progress={};try{progress=JSON.parse(localStorage.getItem('foldlight-web-v1')||'{}')}catch{}
function save(){try{localStorage.setItem('foldlight-web-v1',JSON.stringify(progress))}catch{toast('浏览器禁止存档，本次仍可正常游玩。')}}
function beep(freq=440){if(!sound)return;try{audio??=new AudioContext();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.5,audio.currentTime+.2);g.gain.setValueAtTime(.055,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.25);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.25)}catch{}}
function toast(t){$('toast').textContent=t;$('toast').style.opacity=1;toastTime=6}
function load(c,i){game.load(c,i);view.build(game);selected=c;updateHud();keys.clear()}
function start(i=0){load(selected,Math.min(i,campaigns[selected].rooms.length-1));playing=true;$('menu').hidden=true;$('hud').hidden=false;closeDialog();beep(660);toast(game.room.hint)}
function menu(){if(document.pointerLockElement)document.exitPointerLock();playing=false;keys.clear();closeDialog();$('menu').hidden=false;$('hud').hidden=true;load(selected,0);campaignButtons()}
function campaignButtons(){$('campaigns').replaceChildren();campaigns.forEach((c,i)=>{const b=document.createElement('button');b.className=i===selected?'active':'';b.innerHTML=c.name+'<small>'+c.subtitle+'</small>';b.onclick=()=>{selected=i;load(i,0);campaignButtons()};$('campaigns').append(b)});$('start').innerHTML='从头开始 <span>↗</span>';$('continue').hidden=!(progress[selected]?.room>0);$('continue').textContent='继续存档 · '+(campaigns[selected].rooms[progress[selected]?.room]?.name||'');$('saved').textContent=progress[selected]?.finished?'此旅程已通关 · 可选择任意关卡重玩':progress[selected]?.room>0?'已保存至 '+campaigns[selected].rooms[progress[selected].room].name:'本地独立存档 · 无需安装游戏客户端'}
function showDialog(html){if(document.pointerLockElement)document.exitPointerLock();keys.clear();$('dialogContent').innerHTML=html;if(!$('dialog').open)$('dialog').showModal()}
function captureMouse(){
 if(!playing||$('dialog').open||!matchMedia('(pointer: fine)').matches||document.pointerLockElement)return;
 try{const request=$('scene').requestPointerLock?.();request?.catch?.(()=>{});}catch{}
}
function closeDialog(){keys.clear();if($('dialog').open)$('dialog').close();captureMouse()}
function levels(){showDialog('<div class="eyebrow">CHAPTER SELECT</div><h2>'+campaigns[selected].name+'</h2><p>选择关卡会重置该关机关。通关后自动保存检查点。</p><div class="level-grid">'+campaigns[selected].rooms.map((r,i)=>'<button data-level="'+i+'"><small>0'+(i+1)+'</small>　'+r.name+'</button>').join('')+'</div>');document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>start(Number(b.dataset.level)))}
function help(){showDialog('<div class="eyebrow">HOW TO PLAY</div><h2>换一个维度，找到另一条路。</h2><div class="help-grid"><kbd>W A S D</kbd><span>三维按镜头方向移动；二维 A/D 左右移动。</span><kbd>鼠标 / 触摸</kbd><span>开始或继续游戏后，直接移动鼠标转动视角，无需按住按键。Esc 释放鼠标并暂停；点击场景可重新锁定。手机拖动画面空白处转镜头。</span><kbd>Space</kbd><span>跳跃，跨越断开的石台。</span><kbd>V</kbd><span>站稳后折叠／展开。展开回到脚下平台的真实深度。</span><kbd>Q / E</kbd><span>三维中选择南、东、北、西四个方向。</span><kbd>F</kbd><span>火：三维低火印／二维高火墙。冰：三维按住冻结齿轮／二维冰线破薄石板。</span><kbd>Tab</kbd><span>融合地图切换冰火魔法。</span><kbd>G</kbd><span>三维靠近轨道石柱或出口晶石后交互。</span><kbd>R / H / L</kbd><span>重置本关／路线提示／选择关卡。</span><kbd>Esc</kbd><span>暂停、继续。手机使用画面下方触屏按钮。</span></div><p class="credits">网页版复用原项目的 KayKit 法师、骨骼动画、贴图和场景源模型。山腹叠院保留完整地图与六个连续检查点，霜烬浮岛按检查点分区加载。图形库：Three.js（MIT）；音效由 Web Audio 实时合成。KayKit 素材作者为 Kay Lousberg，许可 CC0；项目自建模型及布景源数据一并复用。UE 材质和特效采用网页渲染适配。</p>')}
function pause(){if(!playing){help();return}if($('dialog').open){closeDialog();return}showDialog('<div class="eyebrow">TAKE A BREATH</div><h2>时间暂时停在这里。</h2><p>'+game.room.name+' · '+(game.flat?'二维折叠':'三维探索')+'</p><div class="actions"><button class="primary" id="resume">继续旅程</button><button id="retry">重试本关</button><button id="back">返回主菜单</button></div>');$('resume').onclick=closeDialog;$('retry').onclick=()=>{game.reset();view.build(game);closeDialog()};$('back').onclick=menu}
function finish(){progress[game.campaign]={room:game.index,finished:true};save();showDialog('<div class="eyebrow">JOURNEY COMPLETE</div><h2>遗迹重新亮起了光。</h2><p>'+campaigns[game.campaign].name+' 已完成。<br>折叠 '+game.switches+' 次 · 重试 '+game.falls+' 次 · 游玩 '+Math.floor(game.elapsed/60)+' 分 '+Math.floor(game.elapsed%60)+' 秒</p><div class="actions"><button class="primary" id="again">再玩一次</button><button id="next">下一段旅程</button><button id="home">主菜单</button></div>');$('again').onclick=()=>start(0);$('next').onclick=()=>{selected=(selected+1)%campaigns.length;start(0)};$('home').onclick=menu;beep(880)}
function action(k){if(!ready)return;if(k==='escape'){pause();return}if(!playing||$('dialog').open){if(k==='enter'&&!$('dialog').open)start();return}if(k==='space')game.jump();if(k==='v'){if(game.fold()){if(!game.flat)view.resetLook(game);beep(330)}}if(k==='q'&&game.turn(-1))view.resetLook(game);if(k==='e'&&game.turn(1))view.resetLook(game);if(k==='f'){game.cast();beep(game.element==='ice'?920:180)}if(k==='g')game.use();if(k==='tab')game.switchElement();if(k==='r'){game.reset();view.build(game)}if(k==='h')toast(game.room.hint);if(k==='l')levels();updateHud()}
function updateHud(){const c=campaigns[game.campaign];$('chapter').textContent=c.name+' / '+String(game.index+1).padStart(2,'0')+' — '+String(c.rooms.length).padStart(2,'0');$('roomname').textContent=game.room.name;$('objective').textContent=game.room.hint;$('mode').textContent=game.flat?'2D':'3D';const dirs=['南','东','北','西'];$('direction').textContent=dirs[game.view]+'视 · '+(game.flat?'纵深已折叠':'空间探索');$('compassName').textContent=dirs[game.view];$('spell').textContent=game.element==='ice'?(game.flat?'冰 · 聚冰线':'冰 · 按住 F 释放寒流'):(game.flat?'火 · 竖直火墙':'火 · 地面火印');const relevant=game.activeObjects().filter(o=>['Vine','Receiver','IceWheel','Fragile','Pillar'].includes(o.kind));const done=relevant.filter(o=>o.burned||o.broken||o.active||o.moved).length;const frozen=game.objects.find(o=>o.frozen>0);$('tasks').textContent=(relevant.length?'机关 '+done+' / '+relevant.length:game.used2D?'✓ 已完成折叠':'◇ 尝试折叠空间')+(frozen?'　❄ 冻结 '+frozen.frozen.toFixed(1)+' 秒':'')+(game.solved()?'　→ 前往出口，展开按 G':'')}
window.addEventListener('keydown',e=>{const k=e.code==='Space'?'space':e.key.toLowerCase();if(['space','tab','escape','w','a','s','d','q','e','v','f','g','r','h','l','enter'].includes(k))e.preventDefault();if(!e.repeat)action(k);if(playing&&!$('dialog').open)keys.add(k)});
window.addEventListener('keyup',e=>keys.delete(e.code==='Space'?'space':e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();if(playing&&!$('dialog').open&&!game.done)pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(playing&&!$('dialog').open&&!game.done)pause()}});
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>action(b.dataset.action)));
document.querySelectorAll('[data-hold]').forEach(b=>{const key=b.dataset.hold;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(key);if(key==='f')action(key)});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(key))});
$('start').onclick=()=>start(0);$('continue').onclick=()=>start(progress[selected]?.room||0);$('select').onclick=levels;$('help').onclick=help;$('pause').onclick=pause;$('brand').onclick=e=>{e.preventDefault();menu()};$('close').onclick=closeDialog;$('dialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog()});$('sound').onclick=()=>{sound=!sound;$('sound').textContent='音效 · '+(sound?'开':'关');if(sound)beep()};
try{view=new View($('scene'));$('loading').textContent='正在加载原项目模型与动画…';await view.loadAssets();view.build(game);ready=true;campaignButtons();$('loading').hidden=true}catch(err){$('loading').textContent='游戏或原模型加载失败，请刷新重试并确认本地服务正在运行。'+err.message;throw err}
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(playing&&!$('dialog').open){acc+=dt;while(acc>=1/120){game.tick(1/120,{x:(keys.has('d')?1:0)-(keys.has('a')?1:0),y:(keys.has('s')?1:0)-(keys.has('w')?1:0),cast:keys.has('f'),lookYaw:view.orbit.yaw});acc-=1/120;if(game.completed){if(game.done){finish();break}progress[game.campaign]={room:game.index+1,finished:false};save();if(!game.advanceCheckpoint())load(game.campaign,game.index+1);beep(740);toast('检查点已保存 · '+game.room.name);break}}updateHud();while(game.events.length)toast(game.events.shift());if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('toast').style.opacity=0}}else acc=0;view.render(game,playing&&$('dialog').open?0:dt,!playing);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
// Read-only diagnostics, useful for reproducing browser issues without changing progression.
window.foldlightSnapshot=()=>({campaign:game.campaign,room:game.index,flat:game.flat,view:game.view,position:[...game.player.p],ground:game.player.ground,solved:game.solved(),paused:$('dialog').open,camera:{mode:view.camera.type,yaw:view.orbit.yaw,pitch:view.orbit.pitch,arm:view.arm}});

// Desktop free mouse look; touch keeps explicit dragging.
const canvas=$('scene');let lookPointer=null,lookX=0,lookY=0;
const canLook=()=>playing&&!game.flat&&!$('dialog').open&&!game.done;
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
 if(!canLook()||e.pointerType!=='touch')return;
 lookPointer=e.pointerId;lookX=e.clientX;lookY=e.clientY;
 canvas.setPointerCapture(e.pointerId);e.preventDefault();
});
canvas.addEventListener('pointermove',e=>{
 if(!canLook()||document.pointerLockElement===canvas)return;
 if(e.pointerType==='mouse'){
  // Embedded browsers may deny pointer lock: hovering still rotates without a button.
  view.look(e.movementX,e.movementY);return;
 }
 if(e.pointerId!==lookPointer)return;
 view.look(e.clientX-lookX,e.clientY-lookY);lookX=e.clientX;lookY=e.clientY;
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>{if(e.pointerId===lookPointer)lookPointer=null});
canvas.addEventListener('click',e=>{if(e.pointerType!=='touch'&&canLook())captureMouse()});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&canLook())view.look(e.movementX,e.movementY)});
document.addEventListener('pointerlockchange',()=>{
 if(!document.pointerLockElement&&playing&&!$('dialog').open&&!game.done)pause();
});
document.addEventListener('pointerlockerror',()=>toast('当前浏览器未允许锁定鼠标，直接在场景内移动鼠标仍可转动视角。'));
