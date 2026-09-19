// Fullscreen must begin inside a user gesture; orientation lock is best effort.
let screenBusy=false,browserPlay=false;
try{browserPlay=localStorage.getItem('padel-browser-play')==='1';}catch{}
function setBrowserPlay(value){browserPlay=value;try{localStorage.setItem('padel-browser-play',value?'1':'0');}catch{}refreshGameScreen();}
function playWithoutFullscreen(){setBrowserPlay(true);if(!matchMedia('(orientation:portrait)').matches&&game.mode==='menu')$('quick-play').click();}
$('iphone-play').onclick=playWithoutFullscreen;$('rotate-browser').onclick=playWithoutFullscreen;
async function enterGameScreen(){
  if(!isPhone||screenBusy||browserPlay)return;screenBusy=true;
  try{
    if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
    if(screen.orientation?.lock)await screen.orientation.lock('landscape');
  }catch{/* Portrait guard remains available on browsers without locking. */}
  finally{screenBusy=false;refreshGameScreen();}
}
function refreshGameScreen(){
  const portrait=isPhone&&matchMedia('(orientation:portrait)').matches;
  $('browser-fullscreen').hidden=!isPhone||!browserPlay;$('iphone-play').hidden=!isPhone;$('iphone-play').textContent=browserPlay?'iPhone mode ✓ · Play in browser':'Using iPhone? Play without full screen';$('rotate-fullscreen').hidden=browserPlay;$('rotate-browser').textContent=browserPlay?'iPhone mode ready · rotate to play':'Using iPhone? Play in browser';
  $('fullscreen-play').hidden=browserPlay||!isPhone||!!document.fullscreenElement||matchMedia('(display-mode:fullscreen)').matches||matchMedia('(display-mode:standalone)').matches;
  if(portrait){resetTouch();if(game.mode!=='menu'&&game.mode!=='match'&&!game.paused)pause();}
}
function requestGameFullscreen(){setBrowserPlay(false);return enterGameScreen();}
$('browser-fullscreen').onclick=requestGameFullscreen;$('fullscreen-play').onclick=requestGameFullscreen;$('rotate-fullscreen').onclick=requestGameFullscreen;
for(const id of ['start','quick-play','create-room','join-room','resume','rematch'])$(id).addEventListener('click',enterGameScreen);
document.addEventListener('fullscreenchange',refreshGameScreen);
window.addEventListener('resize',refreshGameScreen);
document.addEventListener('visibilitychange',()=>{if(document.hidden)window.padelSuspend();});
refreshGameScreen();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
