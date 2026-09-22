// Shared view is automatic for two humans on this computer. Online players
// keep their own full-screen camera. Split view renders the same simulation.
function isLocalCoop(){return game.coop&&(!game.networkMode||game.networkMode==='offline');}
const coopCameras=[new THREE.PerspectiveCamera(62,1,.08,180),new THREE.PerspectiveCamera(62,1,.08,180)];
const fitCamera=new THREE.PerspectiveCamera(55,1,.08,180),fitPoint=new THREE.Vector3();
function fitCoopView(view,target,offset,points,aspect,fov=55){
  view.aspect=aspect;view.near=.08;view.fov=fov;view.updateProjectionMatrix();let scale=1;
  for(let i=0;i<24;i++){
    view.position.copy(target).addScaledVector(offset,scale);view.lookAt(target);view.updateMatrixWorld(true);
    const fits=points.every(p=>{fitPoint.set(p.x,p.y,p.z).project(view);return Math.abs(fitPoint.x)<.82&&Math.abs(fitPoint.y)<.70&&fitPoint.z<1;});
    if(fits)break;scale*=1.10;
  }
}
function updateCoopCamera(){
  const a=game.players[0],b=game.players[2],ball=game.ball;
  targetLook.set((a.x+b.x)*.25,.85,(a.z+b.z)*.25-2);
  const points=[{x:a.x,y:0,z:a.z},{x:a.x,y:2.05,z:a.z},{x:b.x,y:0,z:b.z},{x:b.x,y:2.05,z:b.z},{x:0,y:1,z:-7},{x:ball.x,y:Math.min(ball.y,6),z:ball.z}];
  fitCoopView(fitCamera,targetLook,new THREE.Vector3(0,13,19),points,camera.aspect,55);desired.copy(fitCamera.position);camera.fov=55;camera.updateProjectionMatrix();
}
try{const saved=JSON.parse(localStorage.getItem('padel-coop-view')||'null');experience.coopView=saved==='split'?'split':'shared';}catch{experience.coopView='shared';}
function selectCoopView(value){experience.coopView=value==='split'?'split':'shared';try{localStorage.setItem('padel-coop-view',JSON.stringify(experience.coopView));}catch{}document.querySelectorAll('[data-coop-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.coopView===experience.coopView)));$('coop-view-toggle').textContent=experience.coopView==='split'?'VIEW · Split screen':'VIEW · Both players';}
document.querySelectorAll('[data-coop-view]').forEach(b=>b.onclick=()=>selectCoopView(b.dataset.coopView));$('coop-view-toggle').onclick=()=>selectCoopView(experience.coopView==='split'?'shared':'split');selectCoopView(experience.coopView);
const secondPlayerRing=playerRing.clone();secondPlayerRing.material=playerRing.material.clone();secondPlayerRing.material.color.set('#83d9ff');scene.add(secondPlayerRing);
let previousCoopLayout='';
function renderCourt(){
  const local=isLocalCoop(),live=game.mode!=='menu',split=local&&live&&(experience.coopView==='split'||cameraMode===4);
  $('coop-view-toggle').hidden=!local;$('camera-cycle').hidden=local;$('split-labels').hidden=!split;document.body.classList.toggle('split-screen',split);
  const a=game.players[0],b=game.players[2];secondPlayerRing.visible=local&&live;secondPlayerRing.position.set(b.x,.025,b.z);
  if(local&&live){playerRing.position.set(a.x,.025,a.z);$('camera-cycle').textContent=split?'CAM · Individual':'CAM · Team centered';}
  const layout=split?'split':local&&live?'shared':'single';
  if(layout==='shared'){camera.position.copy(desired);look.copy(targetLook);camera.lookAt(look);}
  if(previousCoopLayout!==layout&&layout==='single')selectCamera(cameraMode);previousCoopLayout=layout;
  const size=renderer.getSize(new THREE.Vector2()),width=size.x,height=size.y;
  if(!split){renderer.setScissorTest(false);renderer.setViewport(0,0,width,height);if(live&&cameraMode===4){camera.position.copy(desired);look.copy(targetLook);camera.lookAt(look);renderEyeView(camera,game.controlled);}else renderer.render(scene,camera);return;}
  renderer.setScissorTest(true);const leftWidth=Math.floor(width/2);
  for(let slot=0;slot<2;slot++){
    const id=slot===0?0:2,p=game.players[id],ball=game.ball,view=coopCameras[slot],w=slot===0?leftWidth:width-leftWidth;
    const target=new THREE.Vector3(p.x*.85,.95,p.z-3),points=[{x:p.x,y:0,z:p.z},{x:p.x,y:2.05,z:p.z},{x:ball.x,y:Math.min(6,ball.y),z:ball.z}];
    if(cameraMode===4){const eyeTarget=new THREE.Vector3();setEyePose(view.position,eyeTarget,p,ball,1);view.aspect=w/height;view.near=.01;view.fov=86;view.updateProjectionMatrix();view.lookAt(eyeTarget);}else fitCoopView(view,target,new THREE.Vector3(0,6.5,10),points,w/height,62);
    renderer.setViewport(slot*leftWidth,0,w,height);renderer.setScissor(slot*leftWidth,0,w,height);if(cameraMode===4)renderEyeView(view,id);else renderer.render(scene,view);
  }
  renderer.setScissorTest(false);renderer.setViewport(0,0,width,height);
}
