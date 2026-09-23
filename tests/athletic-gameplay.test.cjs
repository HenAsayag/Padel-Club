const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),load=require('./game-helper.cjs');
function setup(){const api=load(),g=new api.MobileGame(()=>{});g.configure({format:'singles'});g.start('normal');g.mode='rally';g.time=2;g.lastHitter=0;g.gaussian=()=>0;return {g,api};}
test('Bot perception delay holds position, then accelerates and splits without teleporting',()=>{
 const {g,api}=setup(),p=g.players[1];Object.assign(p,{x:-2,z:-7,vx:0,vz:0});g.predictTeam=()=>({id:1,x:3,z:-5});g.tactics.coordinate();
 const reaction=g.tactics.brains[1].perceiveAt;assert.ok(reaction>g.time);assert.equal(p.splitStart,g.time);
 while(g.time<reaction-1/120){g.time+=1/120;g.tactics.coordinate();g.moveToward(p,3,-5,1/120);assert.equal(p.x,-2);assert.equal(p.z,-7);}
 g.time=reaction+.01;g.tactics.coordinate();g.moveToward(p,g.targets[1].x,g.targets[1].z,1/120);
 assert.ok(p.x>-2&&p.x<-1.98);assert.ok(Math.hypot(p.vx,p.vz)<=api.PADEL_TUNING.movement.acceleration/120+.001);
});
test('Doubles partners cover separate lanes and retreat together against a lob',()=>{
 const {g}=setup();g.configure({format:'doubles'});g.lastHitter=1;g.ball.x=0;g.ball.z=-4;g.ball.y=1;g.lastShotSpeed=13;
 const a=g.tactics.recoveryTarget(1,null),b=g.tactics.recoveryTarget(3,null);assert.ok(Math.abs(a.x-b.x)>3.5);assert.equal(a.z,b.z);assert.ok(Math.abs(a.z)<4);
 g.lastHitter=0;g.ball.y=5;g.ball.vy=3;assert.ok(Math.abs(g.tactics.recoveryTarget(3,{x:3}).z)>7);
});
test('Bots vary repeated lobs and reserve smash for a high attacking ball',()=>{
 const {g}=setup();Object.assign(g.players[1],{x:0,z:-6,vx:0,vz:0});Object.assign(g.players[0],{x:0,z:2});Object.assign(g.ball,{x:0,y:1,z:-6});
 const first=g.tactics.choose(1);assert.equal(first.kind,'lob');const brain=g.tactics.brains[1];brain.history=Array.from({length:4},(_,i)=>({key:'lane'+i,kind:'lob',lane:'left'}));assert.notEqual(g.tactics.choose(1).kind,'lob');
 for(const height of [.5,1.4,2]){g.ball.y=height;assert.notEqual(g.tactics.choose(1).kind,'smash');}
});
test('Bot facing and lateral footwork are simulated without renderer updates',()=>{
 const {g}=setup(),p=g.players[1];Object.assign(p,{x:0,z:-6,vx:0,vz:0,facing:Math.PI});g.ball.x=0;g.ball.z=6;
 for(let i=0;i<40;i++)g.moveToward(p,3,-6,1/120);
 assert.equal(p.locomotion,'shuffle');assert.ok(Math.abs(p.facing)<=Math.PI);assert.ok(Number.isFinite(p.turnRate));
 const old={x:p.x,z:p.z};g.moveToward(p,0,-6,1/120);assert.ok(Math.hypot(p.x-old.x,p.z-old.z)<.06);
});
test('Foot placement reaches ground target without moving body or racket joints',async()=>{
 const THREE=await import('../public/three.module.js'),src=fs.readFileSync('padel-android/src/athletic-motion.js','utf8');
 const plant=new Function('THREE',src.slice(0,src.indexOf('function refineAthleteMotion'))+'return plantAthleteFoot;')(THREE);
 const root=new THREE.Group(),hips=new THREE.Group(),thigh=new THREE.Group(),shin=new THREE.Group(),foot=new THREE.Group();root.add(hips);hips.position.y=.84;hips.add(thigh);thigh.add(shin);shin.position.y=-.405;shin.add(foot);foot.position.y=-.395;root.updateMatrixWorld(true);
 const target=new THREE.Vector3(.12,.09,-.19),before=root.position.clone();plant({root,hips},{thigh,shin,foot},target,1);
 assert.ok(foot.getWorldPosition(new THREE.Vector3()).distanceTo(target)<1e-6);assert.ok(root.position.equals(before));assert.ok(foot.getWorldQuaternion(new THREE.Quaternion()).angleTo(new THREE.Quaternion())<1e-6);
});
test('Match camera shows the player and opponent from either end on phone landscape',async()=>{
 const THREE=await import('../public/three.module.js'),src=fs.readFileSync('padel-android/src/experience.js','utf8'),part=src.slice(src.indexOf('function setMatchPose'),src.indexOf('// Court views'));
 const pose=new Function('THREE',part+'return setMatchPose;')(THREE);
 for(const side of [1,-1]){const view=new THREE.PerspectiveCamera(62,844/390,.08,180),p={x:2,z:side*8},target=new THREE.Vector3();pose(view.position,target,p,{x:0,y:1,z:-side*6},side);view.lookAt(target);view.updateMatrixWorld(true);for(const xyz of [[p.x,1.6,p.z],[0,1,-side*6]]){const v=new THREE.Vector3(...xyz).project(view);assert.ok(Math.abs(v.x)<.9&&Math.abs(v.y)<.9);}}
});
