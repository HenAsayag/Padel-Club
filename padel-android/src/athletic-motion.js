// Grounded footwork and clothing are presentation-only; racket contact stays authoritative.
const footDown=new THREE.Vector3(0,-1,0),footTarget=new THREE.Vector3(),kneePole=new THREE.Vector3(),legDirection=new THREE.Vector3(),kneePoint=new THREE.Vector3(),lowerLeg=new THREE.Vector3(),legQ=new THREE.Quaternion();
function plantAthleteFoot(model,limb,world,weight){
  const footRotation=limb.foot.getWorldQuaternion(new THREE.Quaternion());
  model.hips.updateWorldMatrix(true,false);footTarget.copy(world);model.hips.worldToLocal(footTarget);footTarget.sub(limb.thigh.position);
  const upper=.405,lower=.395,d=THREE.MathUtils.clamp(footTarget.length(),.06,.79);
  legDirection.copy(footTarget).normalize();kneePole.set(0,0,-1).addScaledVector(legDirection,legDirection.z).normalize();
  const along=(upper*upper+d*d-lower*lower)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
  kneePoint.copy(legDirection).multiplyScalar(along).addScaledVector(kneePole,height);
  legQ.setFromUnitVectors(footDown,kneePoint.clone().normalize());limb.thigh.quaternion.slerp(legQ,weight);
  lowerLeg.copy(legDirection).multiplyScalar(d).sub(kneePoint).applyQuaternion(legQ.invert()).normalize();
  legQ.setFromUnitVectors(footDown,lowerLeg);limb.shin.quaternion.slerp(legQ,weight);
  model.root.updateMatrixWorld(true);
  limb.shin.getWorldQuaternion(legQ);limb.foot.quaternion.copy(legQ.invert().multiply(footRotation));
  model.root.updateMatrixWorld(true);
}
function refineAthleteMotion(model,p,id,dt){
  if(dt<=0)return;const speed=Math.hypot(p.vx,p.vz),contact=model.clock-model.contactAt<.28,split=game.time-p.splitStart<.32;
  model.footPlants??={};
  for(const [index,name]of ['left','right'].entries()){
    const limb=model.limbs[name],phase=Math.sin(model.gait+index*Math.PI);
    const stance=game.mode==='rally'&&!contact&&!split&&model.preHop<.025&&speed>.25&&phase<-.08;
    let plant=model.footPlants[name];
    if(!stance){model.footPlants[name]=null;continue;}
    if(!plant){plant=limb.foot.getWorldPosition(new THREE.Vector3());plant.y=.09;model.footPlants[name]=plant;}
    if(Math.hypot(plant.x-p.x,plant.z-p.z)>.7){model.footPlants[name]=null;continue;}
    plantAthleteFoot(model,limb,plant,.82);
  }
  model.root.updateMatrixWorld(true);
}
function makeClubKit(id){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');
  c.fillStyle=id%2?'#862e29':'#202a24';c.fillRect(0,0,256,256);
  c.fillStyle=id%2?'#f2e6ce':'#d9f557';c.beginPath();c.moveTo(0,20);c.lineTo(256,146);c.lineTo(256,196);c.lineTo(0,72);c.fill();
  c.fillStyle='#ffffff';c.font='bold 17px Arial';c.textAlign='center';c.fillText('PADEL CLUB',128,58);
  c.globalAlpha=.13;c.fillStyle='#080d0b';for(let y=0;y<256;y+=5)for(let x=0;x<256;x+=5)c.fillRect(x,y,1,2);
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
for(const model of models){model.shirt.map=makeClubKit(model.id);model.shirt.color.set('#ffffff');model.shirt.roughness=.82;model.shirt.needsUpdate=true;}
const turfCanvas=document.createElement('canvas');turfCanvas.width=turfCanvas.height=256;const turfContext=turfCanvas.getContext('2d');
let turfSeed=7721;function turfRandom(){turfSeed=(turfSeed*1664525+1013904223)>>>0;return turfSeed/4294967296;}
turfContext.fillStyle='#b5b9af';turfContext.fillRect(0,0,256,256);
for(let i=0;i<18000;i++){const value=Math.floor(140+turfRandom()*110);turfContext.fillStyle='rgb('+value+','+value+','+value+')';turfContext.fillRect(turfRandom()*256,turfRandom()*256,.7,1+turfRandom()*2);}
const turfDetail=new THREE.CanvasTexture(turfCanvas);turfDetail.wrapS=turfDetail.wrapT=THREE.RepeatWrapping;turfDetail.anisotropy=4;turfDetail.colorSpace=THREE.SRGBColorSpace;
materials.turf.map=turfDetail;materials.turf.bumpMap=turfDetail;materials.turf.bumpScale=.006;materials.turf.needsUpdate=true;
scene.traverse(mesh=>{if(mesh.isMesh&&mesh.material===materials.turf){const positions=mesh.geometry.attributes.position,uv=new Float32Array(positions.count*2);for(let i=0;i<positions.count;i++){uv[i*2]=positions.getX(i)*1.5;uv[i*2+1]=positions.getZ(i)*1.5;}mesh.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));}});
