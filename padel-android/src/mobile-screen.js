// Fullscreen must begin inside a user gesture; orientation lock is best effort.
let screenBusy=false;
async function enterGameScreen(){
  if(!isPhone||screenBusy)return;screenBusy=true;
  try{
    if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();
    if(screen.orientation?.lock)await screen.orientation.lock('landscape');
  }catch{/* Portrait guard remains available on browsers without locking. */}
  finally{screenBusy=false;refreshGameScreen();}
}
function refreshGameScreen(){
  const portrait=isPhone&&matchMedia('(orientation:portrait)').matches;
  $('fullscreen-play').hidden=!isPhone||!!document.fullscreenElement||matchMedia('(display-mode:fullscreen)').matches||matchMedia('(display-mode:standalone)').matches;
  if(portrait){resetTouch();if(game.mode!=='menu'&&game.mode!=='match'&&!game.paused)pause();}
}
$('fullscreen-play').onclick=enterGameScreen;$('rotate-fullscreen').onclick=enterGameScreen;
for(const id of ['start','quick-play','create-room','join-room','resume','rematch'])$(id).addEventListener('click',enterGameScreen);
document.addEventListener('fullscreenchange',refreshGameScreen);
window.addEventListener('resize',refreshGameScreen);
document.addEventListener('visibilitychange',()=>{if(document.hidden)window.padelSuspend();});
refreshGameScreen();
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
