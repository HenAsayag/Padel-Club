
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),src=path.join(root,'src'),out=path.join(root,'app/src/main/assets');const base=path.join(src,'base.html');if(!fs.existsSync(base))fs.copyFileSync(path.resolve('padel-club-v4.html'),base);let s=fs.readFileSync(base,'utf8');
function replace(a,b){if(!s.includes(a))throw Error('Missing anchor: '+a.slice(0,90));s=s.replace(a,b);}
replace('<script type="module">','<script src="./network-config.js"></script><script src="./peerjs.min.js"></script><script>\n'+fs.readFileSync(path.join(src,'mobile-engine.js'),'utf8')+'\n'+fs.readFileSync(path.join(src,'online.js'),'utf8')+'\n</script><script type="module">');
s=s.replaceAll('https://unpkg.com/three@0.160.0/build/three.module.js','./three.module.js');
replace('const game=new window.SimpleGame(','let online=null;\nconst game=new window.MobileGame(');
replace('</head>','<style>'+fs.readFileSync(path.join(src,'mobile-ui.css'),'utf8')+'</style></head>');
replace('<div id="court-view-bar">',fs.readFileSync(path.join(src,'mobile-ui.html'),'utf8')+'<div id="court-view-bar">');
replace('  window.readSimpleInputs(game,keys);','  readMobileInputs();online.tick(dt);updateMobileUI();');
replace('function updateModeUI(){',"function updateModeUI(){delete $('input-guide').dataset.mobileReady;");
replace('function pause(){','function pause(){if(online?.active){online.requestPause();return;}');
replace('function menu(){','function menu(){if(online?.active)online.leave();resetTouch();$(\'rematch\').disabled=false;');
replace("window.addEventListener('keydown',e=>{","window.addEventListener('keydown',e=>{if(!$('online-panel').hidden)return;");
// Shared camera derives its direction from the locally controlled player's team.
// Either phone can view the court from behind an end wall.
replace('rearWall=sign===1;','rearWall=true;');
replace('ballMesh.position.set(b.x,b.y,b.z);','if(game.networkRole===\'guest\'&&game.mode===\'rally\')ballMesh.position.lerp(new THREE.Vector3(b.x,b.y,b.z),1-Math.exp(-dt*30));else ballMesh.position.set(b.x,b.y,b.z);');
replace("window.__padel={",fs.readFileSync(path.join(src,'mobile-ui.js'),'utf8')+'\n'+fs.readFileSync(path.join(src,'mobile-screen.js'),'utf8')+'\nwindow.__padel={online,touch,');
s=s.replaceAll('Math.min(devicePixelRatio,1.8)','Math.min(devicePixelRatio,1.35)');
s=s.replaceAll('2048,2048','1024,1024');
replace("if(type==='hit'){avatarContact","if(type==='hit'){if(navigator.vibrate&&/Android/.test(navigator.userAgent))navigator.vibrate(12);avatarContact");
replace("This single HTML file needs an internet connection for Three.js and a browser with WebGL enabled.","The bundled 3D engine could not start. Update Android System WebView and reopen the app.");
replace("Still loading Three.js. Connect to the internet and reload. If your network blocks unpkg.com, allow it to load the 3D engine.","The bundled 3D engine is taking longer than expected. Reopen the app or update Android System WebView.");
s=s.replace('Arrows move. Your position decides the stroke.','Use the joystick to move. Your position decides the stroke.').replace('<kbd>Z</kbd> Hit / serve · <kbd>X</kbd> Lob','HIT / serve · LOB');


fs.copyFileSync(path.join(root,'../assets/characters/LICENSE-Kenney.txt'),path.join(out,'LICENSE-Kenney.txt'));
fs.writeFileSync(path.join(out,'index.html'),s);fs.writeFileSync(path.join(root,'build-module.mjs'),s.match(/<script type="module">([\s\S]*?)<\/script>/)[1]);console.log('Android assets assembled:',s.length);
