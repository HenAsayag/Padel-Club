// Shared desktop / Android presentation. Camera preferences remain local online.
const CAMERA_NAMES=['Rally view','Chase','Full court','Overhead','Player eyes'];
let experience={camera:0,largeControls:false,calm:false,best:0};
try{const v=JSON.parse(localStorage.getItem('padel-experience')||'{}');if(Number.isInteger(v.camera)&&v.camera>=0&&v.camera<5)experience.camera=v.camera;experience.largeControls=v.largeControls===true;experience.calm=v.calm===true;experience.best=Number.isFinite(v.best)?Math.max(0,Math.floor(v.best)):0;}catch{}
function saveExperience(){try{localStorage.setItem('padel-experience',JSON.stringify(experience));}catch{}}
function selectCamera(index){cameraMode=index;experience.camera=index;saveExperience();document.querySelectorAll('[data-camera]').forEach(b=>{b.classList.toggle('active',Number(b.dataset.camera)===index);b.setAttribute('aria-pressed',String(Number(b.dataset.camera)===index));});$('camera-cycle').textContent='CAM · '+CAMERA_NAMES[index];$('camera-label').textContent=CAMERA_NAMES[index].toUpperCase();}
for(const button of document.querySelectorAll('[data-camera]'))button.onclick=()=>selectCamera(Number(button.dataset.camera));
$('camera-cycle').onclick=()=>selectCamera((cameraMode+1)%CAMERA_NAMES.length);
$('quick-play').onclick=()=>{if(!$('start').disabled)startMatch();};
experience.calm=experience.calm||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
$('large-controls').checked=experience.largeControls;$('calm-camera').checked=experience.calm;
function applyExperience(){document.body.classList.toggle('large-controls',experience.largeControls);document.body.classList.toggle('calm-camera',experience.calm);$('personal-best').textContent=experience.best+' shots';}
$('large-controls').onchange=e=>{experience.largeControls=e.target.checked;applyExperience();saveExperience();};
$('calm-camera').onchange=e=>{experience.calm=e.target.checked;applyExperience();saveExperience();};
applyExperience();selectCamera(experience.camera);
document.querySelector('.experience-panel').appendChild($('cycle-looks'));
let rallyMilestone=0,previousRally=0;
function updateExperience(){
  if(document.body.classList.contains('phone')){const detail=$('message-detail');if(detail.textContent.includes(' · Z to serve'))detail.textContent=detail.textContent.replace(' · Z to serve',' · hold HIT, release to serve');if($('status-pill').textContent.startsWith('Z ·'))$('status-pill').textContent='HOLD HIT → RELEASE TO SERVE';}
  const live=game.mode!=='menu'&&game.mode!=='match';$('rally-card').hidden=!live||game.paused;
  const hits=game.rallyHits||0;if(hits<previousRally)rallyMilestone=0;previousRally=hits;
  const goal=hits<8?8:hits<16?16:hits<24?24:Math.ceil((hits+1)/8)*8;
  $('rally-count').textContent=hits;$('rally-goal').textContent='RALLY / TARGET '+goal;
  $('rally-progress').max=goal;$('rally-progress').value=hits;
  if(hits>experience.best){experience.best=hits;saveExperience();$('personal-best').textContent=hits+' shots';}
  $('rally-card').classList.toggle('achieved',hits>=8);
  if(hits>=8&&Math.floor(hits/8)>rallyMilestone){rallyMilestone=Math.floor(hits/8);$('status-pill').textContent=hits+' SHOT RALLY · KEEP IT GOING!';}
}
// Stable eye height and opponent-facing view keep swipe/stick directions predictable.
function setEyePose(position,target,p,b,side){position.set(p.x,1.68,p.z-side*.06);target.set(p.x+THREE.MathUtils.clamp((b.x-p.x)*.55,-3.5,3.5),THREE.MathUtils.clamp(b.y*.55,.55,3.2),p.z-side*Math.max(3,Math.abs(p.z-b.z)));}
function renderEyeView(view,id){const hidden=[],arm=models[id].limbs.right.arm;models[id].root.traverse(node=>{if(!node.isMesh)return;let parent=node;while(parent&&parent!==arm)parent=parent.parent;if(!parent){hidden.push([node,node.visible]);node.visible=false;}});try{renderer.render(scene,view);}finally{for(const [node,visible]of hidden)node.visible=visible;}}
// All gameplay views face the other half, preserving the arrow/stick axes.
function updatePlayCamera(p,b,dt){
  const side=game.team(game.controlled)===0?1:-1,high=Math.max(0,b.y-2.5);
  if(cameraMode===0){desired.set(p.x*.16,10.5+high*.06,side*17.5+p.z*.03);targetLook.set(p.x*.10,.45,side*2.8);}
  else if(cameraMode===1){desired.set(p.x*.65,5.8+high*.16,p.z+side*7);targetLook.set(p.x*.4+b.x*.08,.7+high*.18,p.z-side*7);}
  else if(cameraMode===2){desired.set(side*.01,15,side*22);targetLook.set(0,.3,0);}
  else if(cameraMode===3){desired.set(p.x*.15,23,side*.4);targetLook.set(p.x*.15,0,-side*.4);}
  else{setEyePose(desired,targetLook,p,b,side);}
  const base=[44,55,49,53,78][cameraMode],fov=camera.aspect<1.6?base+8:base;
  if(Math.abs(camera.fov-fov)>.01){camera.fov+=(fov-camera.fov)*(1-Math.exp(-dt*7));camera.updateProjectionMatrix();}
}
function fitViewport(){const width=Math.max(1,Math.round(window.visualViewport?.width||innerWidth)),height=Math.max(1,Math.round(window.visualViewport?.height||innerHeight));document.documentElement.style.setProperty('--screen-h',height+'px');camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));}
window.addEventListener('resize',fitViewport);window.visualViewport?.addEventListener('resize',fitViewport);fitViewport();
