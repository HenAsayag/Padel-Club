const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),load=require('./game-helper.cjs');
function game(){const api=load(),g=new api.MobileGame(()=>{});g.configure({format:'singles'});g.start();g.mode='rally';g.time=2;g.lastHitter=1;return g;}
test('Joystick mode disables automatic chase while auto mode still runs',()=>{const g=game();g.setMovementMode(0,'joystick');g.updateAutoRun();assert.equal(g.controls[0].moveTarget,null);g.setMovementMode(0,'auto');g.updateAutoRun();assert.ok(g.controls[0].autoRunTarget);g.setMovementMode(0,'joystick');assert.equal(g.controls[0].moveTarget,null);assert.equal(g.setMovementMode(0,'bad'),false);});
test('Two phone movement modes remain independent',()=>{const g=game();g.networkMode='duel';g.networkRole='host';g.remoteId=1;g.setMovementMode(0,'auto');g.setMovementMode(1,'joystick');g.updateAutoRun();assert.ok(g.controls[0].autoRunTarget);assert.equal(g.controls[1].moveTarget,null);g.start();assert.equal(g.movementModes[1],'joystick');});
test('Eye camera centers low, overhead, sideways and behind-player balls at both ends',async()=>{
 const THREE=await import('../public/three.module.js'),source=fs.readFileSync('padel-android/src/experience.js','utf8');
 const part=source.slice(source.indexOf('function setEyePose'),source.indexOf('const eyeGazeStates'));
 const pose=new Function(part+'return setEyePose;')();
 for(const side of [1,-1])for(const aspect of [2.16,1.08]){
  const p={x:2,z:side*6},view=new THREE.PerspectiveCamera(78,aspect,.01,180),target=new THREE.Vector3();
  for(const ball of [{x:-4,y:.1,z:-side*8},{x:2,y:9,z:side*6},{x:4,y:1,z:side*9},{x:-4,y:2,z:side*6},{x:2.02,y:1.7,z:side*6}]){
   pose(view.position,target,p,ball,side);view.lookAt(target);view.updateMatrixWorld(true);
   assert.equal(view.position.y,1.68);assert.equal(view.position.x,p.x);assert.ok(Math.abs(view.position.z-p.z)<.1);
   assert.deepEqual(target.toArray(),[ball.x,ball.y,ball.z]);
   const projected=new THREE.Vector3(ball.x,ball.y,ball.z).project(view);
   assert.ok(Math.abs(projected.x)<1e-8&&Math.abs(projected.y)<1e-8,'ball stays at the center, including rear glass and lobs');
   assert.ok(projected.z>-1&&projected.z<1);
  }
 }
});
test('Eye rendering restores arm poses and visibility even when drawing fails',()=>{
 const source=fs.readFileSync('padel-android/src/experience.js','utf8'),part=source.slice(source.indexOf('function renderEyeView'),source.indexOf('function updatePlayCamera'));
 for(const fails of [false,true]){
  const joint=()=>({quaternion:{value:1,clone(){return {value:this.value};},copy(q){this.value=q.value;}}});
  const limb={arm:joint(),forearm:joint(),hand:joint()},head={isMesh:true,visible:true},hand={isMesh:true,visible:true,parent:limb.arm};let called=0,updated=0;
  const model={limbs:{right:limb},root:{traverse:fn=>[head,hand].forEach(fn),updateMatrixWorld(){updated++;}}};
  const render=new Function('models','renderer','scene','poseEyeRacket',part+'return renderEyeView;')([model],{render(){called++;assert.equal(head.visible,false);assert.equal(hand.visible,true);assert.equal(limb.arm.quaternion.value,2);if(fails)throw Error('draw failed');}},{},()=>{limb.arm.quaternion.value=2;});
  if(fails)assert.throws(()=>render({},0),/draw failed/);else render({},0);
  assert.equal(called,1);assert.equal(head.visible,true);assert.equal(hand.visible,true);assert.equal(limb.arm.quaternion.value,1);assert.equal(updated,1);
 }
});
test('Eye racket has a visible ready pose, animates misses and preserves ball contact',async()=>{
 const THREE=await import('../public/three.module.js'),source=fs.readFileSync('padel-android/src/experience.js','utf8');
 const part=source.slice(source.indexOf('function poseEyeRacket'),source.indexOf('function renderEyeView'));let call;
 const pose=new Function('THREE','game','experience','solveRacketContact',part+'return poseEyeRacket;')(THREE,{players:[{vx:0,vz:0}]},{calm:false},(model,point,side,stroke,weight)=>{call={point,stroke,weight};});
 const view=new THREE.PerspectiveCamera(78,2,.1,100),m={clock:10,contactAt:-100,gait:0};pose(view,m,0);
 assert.equal(call.weight,1);assert.ok(call.point.z<-.5);const ready=call.point.clone().project(view);assert.ok(Math.abs(ready.x)<.65&&Math.abs(ready.y)<.65);
 m.airSwingAt=9.77;m.airSwingKind='lob';pose(view,m,0);assert.equal(call.stroke,'lob');assert.ok(call.point.y>0);assert.ok(call.point.x<0);
 call=null;m.contactPoint={x:0,y:1,z:0};m.contactAt=9.95;pose(view,m,0);assert.equal(call,null,'actual impact rig must not be overridden');
 m.contactAt=9.7;pose(view,m,0);assert.ok(call.weight>0&&call.weight<1);
});

test('Eye gaze offers a court view for own serve and smoothly follows flight for each player',async()=>{
 const THREE=await import('../public/three.module.js'),source=fs.readFileSync('padel-android/src/experience.js','utf8');
 const part=source.slice(source.indexOf('function setEyePose'),source.indexOf('// Pose the existing'));
 const state={mode:'ready',serverPlayer:0,paused:false};
 const update=new Function('THREE','game','experience',part+'return updateEyeCamera;')(THREE,state,{calm:false});
 const p={x:2,z:8},ball={x:2,y:.5,z:7.8},view=new THREE.PerspectiveCamera(78,2,.01,180);
 for(let i=0;i<60;i++)update(view,p,ball,1,0,1/60);
 const direction=view.getWorldDirection(new THREE.Vector3());assert.ok(direction.z<-.98);assert.ok(direction.y>-.1,'own serve keeps horizon visible');
 state.mode='drop';update(view,p,ball,1,0,1/60);assert.ok(view.getWorldDirection(new THREE.Vector3()).y>-.1);
 const other=new THREE.PerspectiveCamera(78,1,.01,180);update(other,p,ball,1,2,1/60);
 assert.ok(other.quaternion.angleTo(view.quaternion)>.01,'receiver follows the serving ball independently');
 state.mode='rally';ball.x=-4;ball.y=6;ball.z=9;
 for(let i=0;i<180;i++){const before=view.quaternion.clone();update(view,p,ball,1,0,1/60);assert.ok(before.angleTo(view.quaternion)<=3.4/60+1e-7);}
 const projected=new THREE.Vector3(ball.x,ball.y,ball.z).project(view);assert.ok(Math.abs(projected.x)<.002&&Math.abs(projected.y)<.002);
 state.paused=true;const before=view.quaternion.clone();ball.x=4;update(view,p,ball,1,0,.05);assert.ok(before.angleTo(view.quaternion)<1e-7);
});
test('Eye gaze converges consistently across frame rates and new sessions default to eyes',async()=>{
 const THREE=await import('../public/three.module.js'),source=fs.readFileSync('padel-android/src/experience.js','utf8');
 const part=source.slice(source.indexOf('function setEyePose'),source.indexOf('// Pose the existing'));
 const update=new Function('THREE','game','experience',part+'return updateEyeCamera;')(THREE,{mode:'rally',paused:false},{calm:false}),results=[];
 for(const fps of [30,60,120]){const view=new THREE.PerspectiveCamera();for(let i=0;i<fps;i++)update(view,{x:0,z:8},{x:3,y:2,z:0},1,0,1/fps);results.push(view.quaternion.clone());}
 assert.ok(results[0].angleTo(results[2])<.001);
 const prefix=source.slice(source.indexOf('let experience='),source.indexOf('function saveExperience'));
 const experience=new Function('localStorage',prefix+'return experience;')({getItem:()=>JSON.stringify({camera:0,calm:true,best:8})});
 assert.equal(experience.camera,4);assert.equal(experience.calm,true);assert.equal(experience.best,8);
});
