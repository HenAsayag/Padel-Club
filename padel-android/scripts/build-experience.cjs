// Build the shared v5 game from the immutable v4 snapshot.
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../..'),src=path.join(root,'padel-android/src');let s=fs.readFileSync(path.join(root,'padel-club-v4.html'),'utf8');
function replace(a,b){if(!s.includes(a))throw Error('Missing v5 anchor: '+a.slice(0,70));s=s.replace(a,b);}
replace('acceleration:25,deceleration:30,run:4.4,max:5.5,shuffle:.75,backpedal:.6,turn:12','acceleration:34,deceleration:39,run:5.2,max:6.3,shuffle:.88,backpedal:.79,turn:15');
replace("locomotion:'idle'});Object.assign(this.controls[i],{charge:0", "locomotion:'idle',nudgeX:0,nudgeZ:0,nudgeUntil:-100});Object.assign(this.controls[i],{charge:0");
replace("      let ix=this.input.x,iz=this.input.z,length=Math.hypot(ix,iz),automatic=false;", "      let ix=this.input.x,iz=this.input.z,length=Math.hypot(ix,iz),automatic=false;\n      if(this.time<p.nudgeUntil){ix=clamp(ix+p.nudgeX*.62,-1,1);iz=clamp(iz+p.nudgeZ*.62,-1,1);length=Math.hypot(ix,iz);}");
replace("    moveHuman(dt){", "    tapMove(id,x,z){const p=this.players[id];if(!p||!this.isHuman(id))return false;const d=Math.hypot(x,z);if(d<.01)return false;const nx=x/d,nz=z/d;p.nudgeX=nx;p.nudgeZ=nz;p.nudgeUntil=this.time+.16;p.vx+=nx*2.15;p.vz+=nz*2.15;this.emit('nudge',id,nx,nz);return true;}\n    moveHuman(dt){");
replace("      if(this.mode!=='rally')return;\n      this.keyboardAim(id);this.queueHitFor", "      if(this.mode!=='rally')return;\n      const p=this.players[id],dx=this.ball.x-p.x,dz=this.ball.z-p.z;this.tapMove(id,dx,dz);\n      this.keyboardAim(id);this.queueHitFor");
replace("  keys[e.code]=true;window.readSimpleInputs(game,keys);if(e.repeat)return;", "  const direction={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1],KeyA:[-1,0],KeyD:[1,0],KeyW:[0,-1],KeyS:[0,1]}[e.code];if(direction&&!e.repeat){const id=game.coop&&['KeyW','KeyA','KeyS','KeyD'].includes(e.code)?2:game.controlled;game.tapMove?.(id,direction[0],direction[1]);}keys[e.code]=true;window.readSimpleInputs(game,keys);if(e.repeat)return;");
replace('moveToward(p,x,z,dt,speed=5.5)','moveToward(p,x,z,dt,speed=6.0)');
replace('      const targetVX=length>.015?', '      if(!automatic)speed*=Math.min(1,length);\n      const targetVX=length>.015?');
// Keep bot facing authoritative in simulation, not in rendering.
const botFacingStart=s.indexOf('  if(game.isHuman(id))model.root.rotation.y=p.facing;else{'),botFacingEnd=s.indexOf('\n  const ax=',botFacingStart);
if(botFacingStart<0||botFacingEnd<0)throw Error('Bot facing anchor');s=s.slice(0,botFacingStart)+'  model.root.rotation.y=p.facing;'+s.slice(botFacingEnd);
replace('const model={root,hips,torso,neck,head,headMesh,hairMesh,skin,headMaterial,hairMaterial,limbs,racket,index,id,groundOffset,heightScale,','const model={root,hips,torso,neck,head,headMesh,hairMesh,skin,shirt,shorts,shoes,headMaterial,hairMaterial,limbs,racket,index,id,groundOffset,heightScale,');
// A continuous shirt silhouette and covered joints instead of disconnected capsules.
replace('taperedCapsule(.14,.45,.22),shirt,torso', 'new THREE.LatheGeometry([new THREE.Vector2(.115,-.29),new THREE.Vector2(.12,-.22),new THREE.Vector2(.132,-.08),new THREE.Vector2(.155,.07),new THREE.Vector2(.151,.14),new THREE.Vector2(.104,.225)],16),shirt,torso');
replace("const shin=joint(name+'Shin',thigh,0,-.405,0);", "const shin=joint(name+'Shin',thigh,0,-.405,0);ellipsoid(skin,shin,0,0,0,.046,.048,.047);");
replace("const forearm=joint(name+'Forearm',arm,0,-.295,0);", "const forearm=joint(name+'Forearm',arm,0,-.295,0);ellipsoid(skin,forearm,0,0,0,.039,.041,.04);");
replace('taperedCapsule(.045,.11,.05),skin,neck', 'taperedCapsule(.046,.15,.05),skin,neck');
replace('model.gait+=speed*dt*(shuffle?5.2:back?3.6:2.7)','model.gait+=speed*dt*(shuffle?5.5:back?4.1:3.0)');
replace('target[1]=sway*.008*(1-moving)','target[1]=sway*.020*(1-moving)');
replace('moving*(shuffle?.009:.018)','moving*(shuffle?.016:.028)');
replace('amplitude=moving*(shuffle?.13:back?.30:.58)','amplitude=moving*(shuffle?.21:back?.38:.66)');
// Real perforations remain crisp at first-person distance (coplanar hole decals flicker).
replace('holes.count=count;racket.add(holes);','holes.geometry.dispose();');
replace('const face=new THREE.ExtrudeGeometry(shape,',"for(let row=-3;row<=3;row++)for(let col=-3;col<=3;col++){if(col*col+row*row>11)continue;const hole=new THREE.Path();hole.absarc(col*.030,row*.034,.008,0,Math.PI*2,true);shape.holes.push(hole);}const face=new THREE.ExtrudeGeometry(shape,");
replace('</head>','<style>'+fs.readFileSync(path.join(src,'experience.css'),'utf8')+'</style></head>');
replace('<div class="menu-foot">',fs.readFileSync(path.join(src,'experience.html'),'utf8')+'<div class="menu-foot">');
replace('<div id="status-pill">','<div id="rally-card" hidden><span id="rally-goal">RALLY / TARGET 8</span><strong id="rally-count">0</strong><progress id="rally-progress" aria-label="Rally challenge" max="8" value="0"></progress></div><div id="status-pill">');
replace('<button id="sound"','<button id="camera-cycle" class="icon-button" aria-label="Change camera angle">CAM · Close follow</button><button id="sound"');
replace('cameraMode=0;previewing=false','cameraMode=experience.camera;previewing=false');
replace("$('camera-label').textContent=cameraMode?'BROADCAST VIEW':'PLAYER VIEW'","selectCamera(cameraMode)");
const cameraStart=s.indexOf('  else if(cameraMode){'),cameraEnd=s.indexOf('  for(const [original,material] of rearMaterials)',cameraStart);
if(cameraStart<0||cameraEnd<0)throw Error('Camera anchors missing');s=s.slice(0,cameraStart)+'  else updatePlayCamera(p,b,dt);\n'+s.slice(cameraEnd);
// Fade only the wall between the Match camera and the player, keeping the far enclosure visible.
replace('let rearWall=false,batchParent=scene;', 'const farWallMaterials=new Map([...rearMaterials].map(([original,material])=>[original,material.clone()]));let rearWall=false,batchParent=scene;');
replace('rearWall=sign===1;', 'rearWall=sign;');
replace('material=rearMaterials.get(material);', 'material=(rearWall<0?farWallMaterials:rearMaterials).get(material);');
replace('for(const [original,material] of rearMaterials){const opacity=inMenu?original.opacity:', 'for(const [wallSide,wallMaterials] of [[1,rearMaterials],[-1,farWallMaterials]])for(const [original,material] of wallMaterials){const opacity=inMenu?original.opacity:cameraMode===5?(camera.position.z*wallSide>9.3?0:original.opacity):');
// Keep the night court grounded: no glowing rail across the close camera.
replace('box(10,.025,.024,0,3,side*10,edge);','');
replace("sky:'#101e35',floor:'#566384'", "sky:'#0b1922',floor:'#5b7945'");
replace('const skyline=new THREE.MeshStandardMaterial', "for(const side of [-1,1])for(const z of [-14,14]){const x=side*8.8;cylinder(.13,.22,5.8,x,2.7,z,materials.wood,.06*side);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;const leaf=new THREE.ConeGeometry(.42,3.6,5);leaf.rotateZ(Math.PI/2);batch(leaf,materials.leaves,x+Math.cos(a)*1.35,5.3,z+Math.sin(a)*1.35,0,-a,.14);}}const skyline=new THREE.MeshStandardMaterial");
replace('const smooth=1-Math.exp(-dt*3.1)','const smooth=1-Math.exp(-dt*(inMenu?3.1:experience.calm?4.5:8))');
replace('if(impactKick>0&&!game.paused&&!inMenu)','if(impactKick>0&&!game.paused&&!inMenu&&!experience.calm)');
replace("game.lastHitter===1&&b.vy<0","game.lastHitter!==game.team(game.controlled)&&b.vy<0");
replace('  if(renderEnabled)renderer.render(scene,camera);','  updateExperience();if(renderEnabled)renderer.render(scene,camera);');
replace('window.__padel={',fs.readFileSync(path.join(src,'experience.js'),'utf8')+'\nwindow.__padel={');
replace("  if(type==='sound'){sound(a,b);return;}if(type==='skid'){const p=game.players[a];spawnImpact({x:p.x,y:.03,z:p.z},a,true);return;}", "  if(type==='sound'){sound(a,b);return;}if(type==='nudge'){const p=game.players[a];spawnImpact({x:p.x,y:.03,z:p.z},a,true);impactKick=Math.max(impactKick,.038);return;}if(type==='skid'){const p=game.players[a];spawnImpact({x:p.x,y:.03,z:p.z},a,true);impactKick=Math.max(impactKick,.028);return;}");
replace('width=device-width,initial-scale=1','width=device-width,initial-scale=1,viewport-fit=cover');
const characters=fs.readFileSync(path.join(root,'assets/characters/characters.json'),'utf8');
replace('</head>','<style>'+fs.readFileSync(path.join(src,'clubhouse.css'),'utf8')+'</style></head>');
replace('window.__padel={',fs.readFileSync(path.join(src,'clubhouse.js'),'utf8').replace('__CHARACTER_ASSETS__',characters)+'\nwindow.__padel={');
replace('for(const i of game.activePlayers)animatePlayer(models[i],game.players[i],i,game.paused?0:dt);','for(const i of game.activePlayers){animatePlayer(models[i],game.players[i],i,game.paused?0:dt);animateClubCharacter(models[i],game.players[i],i,game.paused?0:dt);refineAthleteMotion(models[i],game.players[i],i,game.paused?0:dt);}updateLocker(dt);');
replace("document.querySelector('.experience-panel').appendChild($('cycle-looks'));","document.querySelector('[data-club-panel=locker]').appendChild($('cycle-looks'));");
replace('window.__padel={',fs.readFileSync(path.join(src,'athletic-motion.js'),'utf8')+'\nwindow.__padel={');
s=require('./patch-flow.cjs')(s);
replace('<script>','<script>'+fs.readFileSync(path.join(src,'control-model.js'),'utf8')+'\n');
for(const key of ['acceleration','run','max','shuffle','backpedal'])s=s.replaceAll('MOVEMENT.'+key,'window.PADEL_TUNING.movement.'+key);
s=s.replaceAll('MOVEMENT.deceleration','window.PADEL_TUNING.movement.braking');
// Tap destinations brake before arrival, even at the faster run speed.
replace('      const targetVX=length>.015?', '      if(Number.isFinite(this.input.moveDistance))speed=Math.min(speed,Math.sqrt(2*window.PADEL_TUNING.movement.braking*Math.max(0,this.input.moveDistance-window.PADEL_TUNING.movement.arrival*.5)));\n      const targetVX=length>.015?');
replace("      if(kind==='drive'||kind==='smash')this.buildDrive(tx,tz,power,kind,bonus);", "      if(this.shotVelocity)this.shotVelocity(id,tx,tz,power,kind);else if(kind==='drive'||kind==='smash')this.buildDrive(tx,tz,power,kind,bonus);");
replace('  window.SimpleGame=SimpleGame;','  window.SimpleGame=SimpleGame;\n'+fs.readFileSync(path.join(src,'reach-game.js'),'utf8'));
replace('</script>\n<script type="module">','</script>\n<script>'+['progression.js','tactics.js','skill-game.js'].map(name=>fs.readFileSync(path.join(src,name),'utf8')).join('\n')+'</script>\n<script type="module">');
replace('</head>','<style>'+fs.readFileSync(path.join(src,'skill-ui.css'),'utf8')+fs.readFileSync(path.join(src,'gesture-ui.css'),'utf8')+'</style></head>');
replace('<div id="scene"></div>','<div id="scene"></div>'+fs.readFileSync(path.join(src,'skill-ui.html'),'utf8'));
replace('function clearLocalInputs(){','function clearLocalInputs(){game.cancelAllShots?.();for(const c of game.controls)c.moveTarget=null;');
replace('  updateExperience();','  updateSkillUI(dt);updateExperience();');
replace('window.__padel={',fs.readFileSync(path.join(src,'skill-ui.js'),'utf8')+'\nwindow.__padel={');
replace('function updatePlayCamera(p,b,dt){','function updatePlayCamera(p,b,dt){\n  if(isLocalCoop()){updateCoopCamera();return;}');
replace('if(renderEnabled)renderer.render(scene,camera);','if(renderEnabled)renderCourt(dt);');
replace('window.__padel={',fs.readFileSync(path.join(src,'coop-camera.js'),'utf8')+'\nwindow.__padel={');
replace('<button id="camera-cycle"','<button id="coop-view-toggle" class="icon-button" hidden>VIEW · Both players</button><button id="camera-cycle"');
replace('<div id="scene"></div>','<div id="scene"></div><div id="split-labels" hidden aria-label="Split screen players"><span>PLAYER 1 · ARROWS + Z / X</span><span>PLAYER 2 · WASD + N / M</span></div>');
replace('autoSwitch:setup.autoSwitch,racket:setup.racket','autoSwitch:setup.autoSwitch&&setup.format!==\'coop\',racket:setup.racket');
replace('window.__padel={',fs.readFileSync(path.join(src,'ball-visibility.js'),'utf8')+'\nwindow.__padel={');
replace('  updateSkillUI(dt);','  updateBallVisibility();updateSkillUI(dt);');
replace('window.__padel={',fs.readFileSync(path.join(src,'gesture-ui.js'),'utf8')+'\nwindow.__padel={');
replace('updateSkillUI(dt);updateExperience();','updateSkillUI(dt);updateGestureUI(dt);updateExperience();');
fs.writeFileSync(path.join(root,'padel.html'),s);fs.writeFileSync(path.join(src,'base.html'),s);console.log('Shared v6 desktop + Android base built');
