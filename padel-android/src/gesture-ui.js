// Pointer gestures feed the same authoritative shot and movement APIs as buttons.
const gestureUI=document.createElement('div');gestureUI.id='gesture-ui';gestureUI.innerHTML='<div id="gesture-help">Auto-run · swipe to hit</div><div id="gesture-power" hidden><b id="gesture-power-text">SWIPE TO HIT</b><progress id="gesture-power-bar" max="1" value="0"></progress><small id="gesture-quality">Estimated landing area</small></div><div id="gesture-shot-choice" role="group" aria-label="Choose your next shot"><button id="gesture-drive" aria-pressed="true">DRIVE</button><button id="gesture-lob" aria-pressed="false">LOB ↑</button></div>';document.body.appendChild(gestureUI);
const gestureOption=document.createElement('label');gestureOption.className='skill-settings';gestureOption.innerHTML='<input id="gesture-mode" type="checkbox" checked> Swipe controls (instead of buttons)';document.querySelector('[data-club-panel=settings]').appendChild(gestureOption);
let swipeEnabled=true;try{swipeEnabled=localStorage.getItem('padel-swipe-mode')!=='0';}catch{}
let swipe=null,lobGesture=false,swipeFeedback=null,gesturePreviewClock=0,gesturePointNumber=-1;
const gestureRay=new THREE.Raycaster(),gesturePlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),gestureNdc=new THREE.Vector2();
const moveMarker=new THREE.Mesh(new THREE.RingGeometry(.19,.22,24),new THREE.MeshBasicMaterial({color:0xa8dcde,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide}));moveMarker.rotation.x=-Math.PI/2;scene.add(moveMarker);
const landingArea=new THREE.Mesh(new THREE.RingGeometry(.85,1,32),new THREE.MeshBasicMaterial({color:0xdff493,transparent:true,opacity:.65,depthWrite:false,side:THREE.DoubleSide}));landingArea.rotation.x=-Math.PI/2;scene.add(landingArea);landingArea.visible=moveMarker.visible=false;
const swipeArrow=new THREE.ArrowHelper(new THREE.Vector3(0,0,-1),new THREE.Vector3(),1,0x74e4da,.5,.23);scene.add(swipeArrow);swipeArrow.visible=false;
for(const part of [swipeArrow.line,swipeArrow.cone]){part.material.transparent=true;part.material.opacity=.5;part.material.depthWrite=false;}

function cancelSwipe(){swipe=null;swipeFeedback=null;landingArea.visible=false;swipeArrow.visible=false;}
function setSwipeMode(){swipeEnabled=$('gesture-mode').checked;document.body.classList.toggle('swipe-controls',swipeEnabled);cancelSwipe();game.cancelAllShots();const heading=document.querySelector('.club-tip b');if(heading)heading.textContent=swipeEnabled?'AUTO RUN. YOUR SHOT.':'TWO BUTTONS. ALL THE SHOTS.';document.querySelectorAll('.controls-strip').forEach(el=>{el.textContent=swipeEnabled?'Auto-run / Swipe · direction + power / Choose LOB · high return':'Arrows · move / Hold Z or X · release to hit';});const tip=document.querySelector('.club-tip p');if(tip)tip.textContent=swipeEnabled?'We run to the ball. Swipe to aim and set power. Choose LOB for the next return.':'Auto-run. Hold HIT / LOB and release; arrows override movement.';try{localStorage.setItem('padel-swipe-mode',swipeEnabled?'1':'0');}catch{}}
$('gesture-mode').checked=swipeEnabled;$('gesture-mode').onchange=setSwipeMode;setSwipeMode();
function selectGestureShot(kind){lobGesture=kind==='lob';$('gesture-lob').setAttribute('aria-pressed',String(lobGesture));$('gesture-drive').setAttribute('aria-pressed',String(!lobGesture));}
$('gesture-lob').onclick=()=>selectGestureShot(lobGesture?'drive':'lob');$('gesture-drive').onclick=()=>selectGestureShot('drive');
function gestureView(x,y){const r=renderer.domElement.getBoundingClientRect();if(isLocalCoop()&&experience.coopView==='split'){const left=x<r.left+r.width/2;return {id:left?0:2,camera:coopCameras[left?0:1],left:r.left+(left?0:r.width/2),top:r.top,width:r.width/2,height:r.height};}return {id:game.controlled,camera,left:r.left,top:r.top,width:r.width,height:r.height};}
function gesturePoint(x,y,view){gestureNdc.set((x-view.left)/view.width*2-1,-(y-view.top)/view.height*2+1);gestureRay.setFromCamera(gestureNdc,view.camera);const point=new THREE.Vector3();return gestureRay.ray.intersectPlane(gesturePlane,point)?{x:point.x,z:point.z}:null;}
function liveGesture(){return swipeEnabled&&!game.paused&&['ready','rally'].includes(game.mode)&&document.getElementById('online-panel')?.hidden!==false;}
function swipeSample(e){const end={x:e.clientX,y:e.clientY,time:e.timeStamp},sample=window.PadelGesture.sample(swipe.start,end,swipe.view),side=game.team(swipe.view.id)===0?-1:1;
  const horizontal=new THREE.Vector3().setFromMatrixColumn(swipe.view.camera.matrixWorld,0);const aim={x:THREE.MathUtils.clamp(swipe.originX+sample.direction*window.PADEL_TUNING.gesture.lateralReach*horizontal.x,-4.4,4.4),z:side*(game.mode==='ready'?Math.min(6.2,sample.depth):sample.depth)};return {...sample,aim,kind:lobGesture?'lob':'drive'};
}
renderer.domElement.style.touchAction='none';
renderer.domElement.addEventListener('pointerdown',e=>{if(!liveGesture()||swipe||e.button!==0)return;e.preventDefault();audioStart();const view=gestureView(e.clientX,e.clientY);swipe={pointer:e.pointerId,start:{x:e.clientX,y:e.clientY,time:e.timeStamp},view,originX:game.mode==='ready'?-game.serveX():game.ball.x,last:null};renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!swipe||swipe.pointer!==e.pointerId)return;e.preventDefault();if(!liveGesture()){cancelSwipe();return;}swipe.last=swipeSample(e);});
renderer.domElement.addEventListener('pointerup',e=>{if(!swipe||swipe.pointer!==e.pointerId)return;e.preventDefault();const active=swipe,result=swipeSample(e);swipe=null;if(!liveGesture())return;
  if(result.tap){const point=gesturePoint(e.clientX,e.clientY,active.view);if(point)game.setMoveTarget(active.view.id,point);landingArea.visible=false;return;}
  if(result.valid&&result.forward>0){const estimate=estimateGesture(active.view.id,result),p=game.players[active.view.id],origin={x:p.x,z:p.z};const accepted=game.commitGesture(active.view.id,result.kind,result.power,result.aim);if(accepted)selectGestureShot('drive');swipeFeedback={...result,estimate,origin,invalid:!accepted,id:active.view.id,until:performance.now()+360};}else{swipeFeedback={invalid:true,until:performance.now()+650};}
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
  if(gesturePointNumber!==game.pointNumber){gesturePointNumber=game.pointNumber;selectGestureShot('drive');}
  $('gesture-lob').disabled=game.mode!=='rally';
  if(swipe&&!liveGesture())cancelSwipe();const shot=swipe?.last||((swipeFeedback?.until>performance.now())?swipeFeedback:null),id=swipe?.view.id??swipeFeedback?.id??game.controlled;
  const mover=game.players[game.controlled],control=game.controls[game.controlled];if(control.moveTarget&&Math.hypot(mover.x-control.moveTarget.x,mover.z-control.moveTarget.z)<window.PADEL_TUNING.movement.arrival)control.moveTarget=null;const target=control.moveTarget;moveMarker.visible=!!target&&!control.autoRunTarget;if(target)moveMarker.position.set(target.x,.027,target.z);
  if(game.mode==='ready'){$('status-pill').textContent='SWIPE UP TO SERVE';$('message-detail').textContent=$('message-detail').textContent.replace('hold Z, release to serve','swipe up to serve');}
  $('gesture-help').hidden=game.mode!=='ready';$('gesture-help').textContent=game.mode==='ready'?'Swipe to serve · running is automatic':'Auto-run · choose DRIVE or LOB, then swipe';
  $('gesture-power').hidden=!shot||(!shot.valid&&!shot.invalid);landingArea.visible=!!shot&&shot.valid&&!shot.invalid;swipeArrow.visible=landingArea.visible;
  if(shot){$('gesture-power-text').textContent=shot.invalid?'Swipe up to hit':(shot.power>window.PADEL_TUNING.power.over?'WALL RISK':shot.kind==='lob'?'LOB':shot.power<.48?'GENTLE':shot.power>.82?'FIRM':'DRIVE');$('gesture-power-bar').value=shot.power||0;
    gesturePreviewClock+=dt;if(shot.valid&&!shot.invalid){
      if(swipe&&(gesturePreviewClock>1/15||!swipe.estimate)){gesturePreviewClock=0;swipe.estimate=estimateGesture(id,shot);}
      const estimate=swipe?.estimate||shot.estimate;
      if(estimate){landingArea.position.set(estimate.x,.035,estimate.z);landingArea.scale.setScalar(estimate.radius);landingArea.material.color.setHex(estimate.risk?0xeeb786:0x74e4da);$('gesture-quality').textContent=estimate.risk?'Net / wall risk':'Estimated landing area';}
      const origin=shot.origin||game.players[id],direction=new THREE.Vector3(shot.aim.x-origin.x,0,shot.aim.z-origin.z),length=direction.length();
      swipeArrow.position.set(origin.x,.07,origin.z);if(length>.1){swipeArrow.setDirection(direction.normalize());swipeArrow.setLength(length,.45,.20);}else swipeArrow.visible=false;
    }}
  // Skill HUD is for the optional buttons mode; a swipe has no separate charge timer.
  $('skill-hud').hidden=true;$('desktop-shots').hidden=true;reticle.visible=false;
}
