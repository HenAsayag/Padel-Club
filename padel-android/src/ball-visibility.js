// Presentation only: the regulation ball and all contact/trajectory rules stay unchanged.
const ballGlowCanvas=document.createElement('canvas');ballGlowCanvas.width=ballGlowCanvas.height=64;
const ballGlowContext=ballGlowCanvas.getContext('2d');
const ballGlowGradient=ballGlowContext.createRadialGradient(32,32,0,32,32,32);
for(const [stop,color] of [[0,'rgba(255,255,210,0)'],[.46,'rgba(255,255,210,0)'],[.57,'rgba(255,255,190,.7)'],[.64,'rgba(15,45,28,.85)'],[.72,'rgba(230,255,85,.25)'],[1,'rgba(230,255,85,0)']])ballGlowGradient.addColorStop(stop,color);
ballGlowContext.fillStyle=ballGlowGradient;ballGlowContext.fillRect(0,0,64,64);
const ballGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(ballGlowCanvas),transparent:true,depthWrite:false,toneMapped:false}));scene.add(ballGlow);
ballMat.color.setHex(0xf1ff38);ballMat.emissive.setHex(0xc7ed35);ballMat.emissiveIntensity=.55;halo.visible=false;
const ballWake=Array.from({length:8},()=>{const dot=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),new THREE.MeshBasicMaterial({color:0xeaff78,transparent:true,opacity:0,depthWrite:false}));scene.add(dot);return dot;});
const ballVisualSize=new THREE.Vector2();
function updateBallVisibility(){
  const phone=document.body.classList.contains('phone'),live=game.mode!=='menu'&&game.mode!=='match';
  renderer.getSize(ballVisualSize);
  // A small minimum screen footprint keeps the far-court ball readable on phones.
  const distance=camera.position.distanceTo(ballMesh.position),pixelRadius=phone?3.5:2.5;
  const radius=THREE.MathUtils.clamp(pixelRadius*2*distance*Math.tan(camera.fov*Math.PI/360)/Math.max(240,ballVisualSize.y),phone?.06:.05,phone?.14:.10);
  ballMesh.scale.setScalar(live?radius/.0325:1.5);
  ballGlow.visible=live;ballGlow.position.copy(ballMesh.position);ballGlow.scale.setScalar(radius*3.6);
  trail.material.opacity=phone?.46:.32;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;trail.visible=trail.visible&&!reduced;const moving=!reduced&&live&&game.mode==='rally'&&Math.hypot(game.ball.vx,game.ball.vy,game.ball.vz)>2;
  for(let i=0;i<ballWake.length;i++){const dot=ballWake[i],fade=1-i/ballWake.length,j=(i+1)*3;dot.visible=moving;if(!moving)continue;dot.position.set(trailArray[j],trailArray[j+1],trailArray[j+2]);dot.scale.setScalar(radius*.65*fade);dot.material.opacity=.34*fade;}
}
