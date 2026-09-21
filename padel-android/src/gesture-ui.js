// Pointer gestures feed the same authoritative shot and movement APIs as buttons.
const gestureUI=document.createElement('div');gestureUI.id='gesture-ui';gestureUI.innerHTML='<div id="gesture-help">Tap your court to move · swipe up to hit</div><div id="gesture-power" hidden><b id="gesture-power-text">SWIPE TO HIT</b><progress id="gesture-power-bar" max="1" value="0"></progress><small id="gesture-quality">Estimated landing area</small></div><button id="gesture-lob" aria-pressed="false">LOB OFF</button>';document.body.appendChild(gestureUI);
const gestureOption=document.createElement('label');gestureOption.className='skill-settings';gestureOption.innerHTML='<input id="gesture-mode" type="checkbox" checked> Swipe shots + tap to move';document.querySelector('[data-club-panel=settings]').appendChild(gestureOption);
let swipeEnabled=true;try{swipeEnabled=localStorage.getItem('padel-swipe-mode')!=='0';}catch{}
let swipe=null,lobGesture=false,swipeFeedback=null,gesturePreviewClock=0;
const gestureRay=new THREE.Raycaster(),gesturePlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),gestureNdc=new THREE.Vector2();
const moveMarker=new THREE.Mesh(new THREE.RingGeometry(.19,.22,24),new THREE.MeshBasicMaterial({color:0xa8dcde,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide}));moveMarker.rotation.x=-Math.PI/2;scene.add(moveMarker);
const landingArea=new THREE.Mesh(new THREE.RingGeometry(.85,1,32),new THREE.MeshBasicMaterial({color:0xdff493,transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide}));landingArea.rotation.x=-Math.PI/2;scene.add(landingArea);landingArea.visible=moveMarker.visible=false;
function cancelSwipe(){swipe=null;swipeFeedback=null;landingArea.visible=false;}
function setSwipeMode(){swipeEnabled=$('gesture-mode').checked;document.body.classList.toggle('swipe-controls',swipeEnabled);cancelSwipe();game.cancelAllShots();const heading=document.querySelector('.club-tip b');if(heading)heading.textContent=swipeEnabled?'TAP TO MOVE. SWIPE TO HIT.':'TWO BUTTONS. ALL THE SHOTS.';document.querySelectorAll('.controls-strip').forEach(el=>{el.textContent=swipeEnabled?'Tap court · move / Swipe up · hit / LOB · high return':'Arrows · move / Hold Z or X · release to hit';});const tip=document.querySelector('.club-tip p');if(tip)tip.textContent=swipeEnabled?'Tap your court to move. Swipe up to hit. Use LOB for height.':'Move with arrows or joystick. Hold HIT / LOB and release.';try{localStorage.setItem('padel-swipe-mode',swipeEnabled?'1':'0');}catch{}}
$('gesture-mode').checked=swipeEnabled;$('gesture-mode').onchange=setSwipeMode;setSwipeMode();
$('gesture-lob').onclick=()=>{lobGesture=!lobGesture;$('gesture-lob').textContent=lobGesture?'LOB ON':'LOB OFF';$('gesture-lob').setAttribute('aria-pressed',String(lobGesture));};
function gestureView(x,y){const r=renderer.domElement.getBoundingClientRect();if(isLocalCoop()&&experience.coopView==='split'){const left=x<r.left+r.width/2;return {id:left?0:2,camera:coopCameras[left?0:1],left:r.left+(left?0:r.width/2),top:r.top,width:r.width/2,height:r.height};}return {id:game.controlled,camera,left:r.left,top:r.top,width:r.width,height:r.height};}
function gesturePoint(x,y,view){gestureNdc.set((x-view.left)/view.width*2-1,-(y-view.top)/view.height*2+1);gestureRay.setFromCamera(gestureNdc,view.camera);const point=new THREE.Vector3();return gestureRay.ray.intersectPlane(gesturePlane,point)?{x:point.x,z:point.z}:null;}
function liveGesture(){return swipeEnabled&&!game.paused&&['ready','rally'].includes(game.mode)&&document.getElementById('online-panel')?.hidden!==false;}
function swipeSample(e){const end={x:e.clientX,y:e.clientY,time:e.timeStamp},sample=window.PadelGesture.sample(swipe.start,end,swipe.view),side=game.team(swipe.view.id)===0?-1:1;
  const horizontal=new THREE.Vector3().setFromMatrixColumn(swipe.view.camera.matrixWorld,0);const aim={x:THREE.MathUtils.clamp(swipe.originX+sample.direction*4.8*horizontal.x,-4.4,4.4),z:side*sample.depth};return {...sample,aim,kind:lobGesture?'lob':'drive'};
}
renderer.domElement.style.touchAction='none';
renderer.domElement.addEventListener('pointerdown',e=>{if(!liveGesture()||swipe||e.button!==0)return;e.preventDefault();audioStart();const view=gestureView(e.clientX,e.clientY);swipe={pointer:e.pointerId,start:{x:e.clientX,y:e.clientY,time:e.timeStamp},view,originX:game.mode==='ready'?-game.serveX():game.ball.x,last:null};renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!swipe||swipe.pointer!==e.pointerId)return;e.preventDefault();if(!liveGesture()){cancelSwipe();return;}swipe.last=swipeSample(e);});
renderer.domElement.addEventListener('pointerup',e=>{if(!swipe||swipe.pointer!==e.pointerId)return;e.preventDefault();const active=swipe,result=swipeSample(e);swipe=null;if(!liveGesture())return;
  if(result.tap){const point=gesturePoint(e.clientX,e.clientY,active.view);if(point)game.setMoveTarget(active.view.id,point);landingArea.visible=false;return;}
  if(result.valid&&result.forward>0){const accepted=game.commitGesture(active.view.id,result.kind,result.power,result.aim);swipeFeedback={...result,invalid:!accepted,id:active.view.id,until:performance.now()+650};}else{swipeFeedback={invalid:true,until:performance.now()+650};}
});
for(const event of ['pointercancel','lostpointercapture'])renderer.domElement.addEventListener(event,e=>{if(swipe?.pointer===e.pointerId)cancelSwipe();});
window.addEventListener('blur',cancelSwipe);window.addEventListener('resize',cancelSwipe);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelSwipe();});
function estimateGesture(id,shot){
  const original=game.ball,context=game.shotContext,q={...original},quality=game.shotDifficulty(id,shot.kind,shot.power);let risk=false;
  try{game.ball=q;game.shotContext={id,power:shot.power*quality.powerScale};game.shotVelocity(id,shot.aim.x+quality.dx,shot.aim.z+quality.dz,shot.power,game.mode==='ready'?'serve':shot.kind==='drive'?game.driveKind(id):shot.kind);
    for(let i=0;i<420;i++){const oldZ=q.z;game.integrate(q,1/120);if(oldZ*q.z<=0&&q.y<.96)risk=true;if(Math.abs(q.x)>4.9675||Math.abs(q.z)>9.9675){risk=true;break;}if(q.y<=.0325)break;}
  }finally{game.ball=original;game.shotContext=context;}
  return {x:THREE.MathUtils.clamp(q.x,-4.85,4.85),z:THREE.MathUtils.clamp(q.z,-9.85,9.85),radius:.22+quality.spread,risk:risk||q.z*(game.team(id)===0?-1:1)<0};
}
function updateGestureUI(dt){
  const live=swipeEnabled&&!game.paused&&!['menu','match'].includes(game.mode);gestureUI.hidden=!live;
  if(!live){cancelSwipe();moveMarker.visible=false;return;}
  if(swipe&&!liveGesture())cancelSwipe();const shot=swipe?.last||((swipeFeedback?.until>performance.now())?swipeFeedback:null),id=swipe?.view.id??swipeFeedback?.id??game.controlled;
  const mover=game.players[game.controlled],control=game.controls[game.controlled];if(control.moveTarget&&Math.hypot(mover.x-control.moveTarget.x,mover.z-control.moveTarget.z)<window.PADEL_TUNING.movement.arrival)control.moveTarget=null;const target=control.moveTarget;moveMarker.visible=!!target;if(target)moveMarker.position.set(target.x,.027,target.z);
  if(game.mode==='ready'){$('status-pill').textContent='SWIPE UP TO SERVE';$('message-detail').textContent=$('message-detail').textContent.replace('hold Z, release to serve','swipe up to serve');}
  $('gesture-help').hidden=game.mode!=='ready';$('gesture-help').textContent=game.mode==='ready'?'Swipe up to serve · tap your court to move':'Tap to move · swipe up to hit';
  $('gesture-power').hidden=!shot||(!shot.valid&&!shot.invalid);landingArea.visible=!!shot&&shot.valid;
  if(shot){$('gesture-power-text').textContent=shot.invalid?'Swipe up to hit':Math.round(shot.power*100)+'% · '+(shot.power<.24?'SOFT':shot.power>.86?'RISKY':shot.kind==='lob'?'LOB':'DRIVE');$('gesture-power-bar').value=shot.power||0;
    gesturePreviewClock+=dt;if(shot.valid&&gesturePreviewClock>1/24){gesturePreviewClock=0;const estimate=estimateGesture(id,shot);landingArea.position.set(estimate.x,.035,estimate.z);landingArea.scale.setScalar(estimate.radius);landingArea.material.color.setHex(estimate.risk?0xff997b:0xdff493);$('gesture-quality').textContent=estimate.risk?'Net / wall risk':'Estimated landing area';}}
  // Skill HUD is for the optional buttons mode; a swipe has no separate charge timer.
  $('skill-hud').hidden=true;$('desktop-shots').hidden=true;reticle.visible=false;
}
