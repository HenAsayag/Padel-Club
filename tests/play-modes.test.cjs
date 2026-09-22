const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),load=require('./game-helper.cjs');
function game(){const api=load(),g=new api.MobileGame(()=>{});g.configure({format:'singles'});g.start();g.mode='rally';g.time=2;g.lastHitter=1;return g;}
test('Joystick mode disables automatic chase while auto mode still runs',()=>{const g=game();g.setMovementMode(0,'joystick');g.updateAutoRun();assert.equal(g.controls[0].moveTarget,null);g.setMovementMode(0,'auto');g.updateAutoRun();assert.ok(g.controls[0].autoRunTarget);g.setMovementMode(0,'joystick');assert.equal(g.controls[0].moveTarget,null);assert.equal(g.setMovementMode(0,'bad'),false);});
test('Two phone movement modes remain independent',()=>{const g=game();g.networkMode='duel';g.networkRole='host';g.remoteId=1;g.setMovementMode(0,'auto');g.setMovementMode(1,'joystick');g.updateAutoRun();assert.ok(g.controls[0].autoRunTarget);assert.equal(g.controls[1].moveTarget,null);g.start();assert.equal(g.movementModes[1],'joystick');});
test('Eye camera stays at player height and faces the opponent at both ends',()=>{const source=fs.readFileSync('padel-android/src/experience.js','utf8'),part=source.slice(source.indexOf('function setEyePose'),source.indexOf('function renderEyeView')),pose=new Function('THREE',part+'return setEyePose;')({MathUtils:{clamp:(x,a,b)=>Math.max(a,Math.min(b,x))}}),vec=()=>({set(x,y,z){Object.assign(this,{x,y,z});}});for(const side of [1,-1]){const p={x:2,z:side*6},position=vec(),target=vec();pose(position,target,p,{x:-2,y:1,z:-side*5},side);assert.equal(position.x,p.x);assert.equal(position.y,1.68);assert.ok(Math.abs(position.z-p.z)<.1);assert.ok((target.z-position.z)*side<0);}});
test('Eye rendering restores arm poses and visibility even when drawing fails',()=>{
 const source=fs.readFileSync('padel-android/src/experience.js','utf8'),part=source.slice(source.indexOf('function renderEyeView'),source.indexOf('// All gameplay views'));
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
