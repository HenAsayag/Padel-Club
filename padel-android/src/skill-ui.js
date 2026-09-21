let progressStorage;try{progressStorage=localStorage;}catch{}
game.progress=null;
let rewardSeen=0,lastSkillMode='',lastSweetToken='';
const labels={control:'Power control',accuracy:'Accuracy',timing:'Timing',consistency:'Consistency',placement:'Placement',defense:'Defense',net:'Net play',stamina:'Stamina',sweet:'Sweet spots',technique:'Technique'};
const skillSettings=document.createElement('label');skillSettings.className='skill-settings';skillSettings.innerHTML='<input type="checkbox" id="left-handed"> Left-handed touch layout';document.querySelector('[data-club-panel=settings]').appendChild(skillSettings);
try{$('left-handed').checked=localStorage.getItem('padel-left-handed')==='1';}catch{}
function applyHand(){document.body.classList.toggle('left-handed',$('left-handed').checked);try{localStorage.setItem('padel-left-handed',$('left-handed').checked?'1':'0');}catch{}}
$('left-handed').onchange=applyHand;applyHand();
const progressionSummary=document.createElement('div');progressionSummary.className='progress-summary';progressionSummary.hidden=true;$('result-description').after(progressionSummary);
function syncCharacterKeys(){game.characterKeys=game.players.map((p,i)=>clubhouse.style<0?'classic':['rio','alex'][(clubhouse.style+i%2)%2]);}
syncCharacterKeys();
function shotKey(code){if(code==='KeyZ'||code==='KeyX')return {id:game.controlled,kind:code==='KeyX'?'lob':'drive'};if(game.coop&&(code==='KeyN'||code==='KeyM'))return {id:2,kind:code==='KeyM'?'lob':'drive'};return null;}
window.addEventListener('keydown',e=>{const shot=shotKey(e.code);if(!shot||game.mode==='menu'||game.mode==='match'||game.paused||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat){audioStart();game.beginShot(shot.id,shot.kind);}},true);
window.addEventListener('keyup',e=>{const shot=shotKey(e.code);if(!shot)return;game.releaseShot(shot.id,shot.kind);keys[e.code]=false;},true);
function bindShotButton(button,kind){let pointer=null;button.addEventListener('pointerdown',e=>{if(pointer!==null)return;e.preventDefault();pointer=e.pointerId;button.setPointerCapture(pointer);button.classList.add('held');audioStart();game.beginShot(game.controlled,kind);});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,e=>{if(pointer!==e.pointerId)return;pointer=null;button.classList.remove('held');if(event==='pointerup')game.releaseShot(game.controlled,kind);else game.cancelShot(game.controlled);});}
bindShotButton($('mouse-hit'),'drive');bindShotButton($('mouse-lob'),'lob');
function renderProgress(){const rows=[];for(const [key,gains]of Object.entries(game.progress.gains))for(const [ability,gain]of Object.entries(gains))if(gain>=.005)rows.push(key.toUpperCase()+' · '+labels[ability]+' +'+gain.toFixed(2));progressionSummary.textContent=rows.length?'PRACTICE PAID OFF · '+rows.join(' / '):'Keep practicing: controlled, legal returns develop your character.';}
function updateSkillUI(dt){
  syncCharacterKeys();if(!document.body.classList.contains('phone')){const detail=$("message-detail");if(detail.textContent.includes(' · Z to serve'))detail.textContent=detail.textContent.replace(' · Z to serve',' · hold Z, release to serve');if($("status-pill").textContent.startsWith('Z ·'))$("status-pill").textContent='HOLD Z → RELEASE TO SERVE';}const phone=document.body.classList.contains('phone'),live=!['menu','match'].includes(game.mode)&&!game.paused;
  const shotActive=!!game.chargeStates?.[game.controlled]||game.lastRelease?.[game.controlled]&&game.time-game.lastRelease[game.controlled].at<.65;document.body.classList.toggle('mobile-playing',phone&&live);document.body.classList.toggle('mobile-rally',phone&&game.mode==='rally');$('skill-hud').hidden=!live||(phone&&!shotActive);$('desktop-shots').hidden=!live||phone;
  if(game.networkRole==='guest'){game.advanceCharge(dt);for(const reward of game.rewardEvents||[]){if(reward.seq>rewardSeen&&reward.id===game.controlled)game.progress?.award(game.characterKeys[game.controlled],reward.weights);rewardSeen=Math.max(rewardSeen,reward.seq);}}
  if(lastSkillMode==='menu'&&game.mode!=='menu')rewardSeen=0;
  lastSkillMode=game.mode;
  for(const slot of [0,2]){const id=slot===0?game.controlled:2,node=$('skill-meter-'+slot);node.hidden=slot===2&&!game.coop;const charge=game.chargeStates?.[id],release=game.lastRelease?.[id],recent=release&&game.time-release.at<.8,power=charge?.power??(recent?release.power:0),kind=charge?.kind??release?.kind??'drive',zone=game.powerZone(id,kind,power),spec=game.powerSpec(id,kind);
    node.classList.toggle('sweet',(!!charge||recent)&&zone==='sweet');node.classList.toggle('strong',zone==='strong');node.classList.toggle('weak',!!charge&&zone==='weak');node.querySelector('.meter-needle').style.left=(power*100)+'%';const sweet=node.querySelector('.sweet-zone');sweet.style.left=spec.low*100+'%';sweet.style.width=(spec.high-spec.low)*100+'%';
    node.querySelector('.power-value').textContent=charge?Math.round(power*100)+'% · '+(zone==='weak'?'SOFT':zone.toUpperCase()):recent?(zone==='weak'?'SOFT':zone.toUpperCase()):'HOLD → RELEASE';node.querySelector('.meter-hint').textContent=charge?'Aim with movement · release to hit':phone?'Hold HIT / LOB · release to hit':slot===2?'Hold N / M · release to hit':'Hold Z / X or mouse buttons below';
  }
  const release=game.lastRelease?.[game.controlled],token=release?release.at+':'+release.power:'';
  if(release?.zone==='sweet'&&token!==lastSweetToken){lastSweetToken=token;sound('racket',7);if(navigator.vibrate)navigator.vibrate(18);}
  const c=game.chargeStates?.[game.controlled];reticle.visible=live&&!!c;if(c){game.keyboardAim(game.controlled);reticle.position.set(game.aim.x,.023,game.aim.z);}
}
// Explain the changed input contract in the existing menus.
document.querySelectorAll('.controls-strip').forEach(el=>{el.innerHTML='<span>↑ ↓ ← → move / aim</span><span>Z hold + release · HIT</span><span>X hold + release · LOB</span>';});
const playCopy=document.querySelector('[data-club-panel=club]');if(playCopy){for(const p of playCopy.querySelectorAll('p'))if(p.textContent.includes('position decides'))p.textContent='Hold HIT or LOB, aim with movement, then release in the sweet spot.';}


