// Downloaded meshes are fitted to the existing articulated contact rig.
// Limb triangles are clipped at elbows/knees, preserving UVs and skin contact.
const characterAssets=__CHARACTER_ASSETS__;
const characterGeometries=new Map();
function characterPart(asset,name,size,center,range=[0,1]){
 const cacheKey=[asset.name,name,...size,...center,...range].join(':');if(characterGeometries.has(cacheKey))return characterGeometries.get(cacheKey);
 const data=asset.meshes[name],min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<data.positions.length;i++) {const k=i%3;min[k]=Math.min(min[k],data.positions[i]);max[k]=Math.max(max[k],data.positions[i]);}
 const low=min[1]+(max[1]-min[1])*range[0],high=min[1]+(max[1]-min[1])*range[1];
 function cut(poly,plane,above){const result=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],insideA=above?a[1]>=plane:a[1]<=plane,insideB=above?b[1]>=plane:b[1]<=plane;if(insideA)result.push(a);if(insideA!==insideB){const t=(plane-a[1])/(b[1]-a[1]);result.push(a.map((v,k)=>v+(b[k]-v)*t));}}return result;}
 const positions=[],uv=[];for(let i=0;i<data.indices.length;i+=3){let poly=data.indices.slice(i,i+3).map(n=>[...data.positions.slice(n*3,n*3+3),...data.uv.slice(n*2,n*2+2)]);poly=cut(cut(poly,low,true),high,false);for(let j=1;j+1<poly.length;j++)for(const v of [poly[0],poly[j],poly[j+1]]){positions.push((v[0]-(min[0]+max[0])/2)/(max[0]-min[0])*size[0]+center[0],(v[1]-(low+high)/2)/(high-low)*size[1]+center[1],-(v[2]-(min[2]+max[2])/2)/(max[2]-min[2])*size[2]+center[2]);uv.push(v[3],v[4]);}}
 // Z reflection reverses winding.
 for(let i=0;i<positions.length;i+=9){for(let k=0;k<3;k++){const a=positions[i+3+k];positions[i+3+k]=positions[i+6+k];positions[i+6+k]=a;}for(let k=0;k<2;k++){const a=uv[i/3*2+2+k];uv[i/3*2+2+k]=uv[i/3*2+4+k];uv[i/3*2+4+k]=a;}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();characterGeometries.set(cacheKey,g);return g;
}
const characterTextures=characterAssets.map(a=>{const t=new THREE.TextureLoader().load(a.texture);t.colorSpace=THREE.SRGBColorSpace;t.flipY=false;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.NearestFilter;return t;});
function installCharacter(model,assetIndex){
 model.arcadeMeshes?.forEach(m=>m.parent.remove(m));model.arcadeMeshes=[];
 if(!model.originalMeshes){model.originalMeshes=[];model.root.traverse(o=>{let p=o;while(p&&p!==model.racket)p=p.parent;if(o.isMesh&&!p)model.originalMeshes.push(o);});}
 model.originalMeshes.forEach(m=>m.visible=assetIndex<0);model.assetIndex=assetIndex;if(assetIndex<0)return;
 const asset=characterAssets[assetIndex];model.arcadeMaterial?.dispose();const material=new THREE.MeshStandardMaterial({map:characterTextures[assetIndex],roughness:.88});model.arcadeMaterial=material;
 function add(name,parent,size,center,range){const mesh=new THREE.Mesh(characterPart(asset,name,size,center,range),material);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);model.arcadeMeshes.push(mesh);}
 add('head',model.head,[.25,.27,.23],[0,0,0]);add('torso',model.torso,[.37,.44,.20],[0,.21,0]);add('torso',model.hips,[.30,.16,.19],[0,.02,0],[0,.2]);model.neck.children.filter(m=>m.isMesh).forEach(m=>m.visible=true);
 for(const side of ['left','right']){const l=model.limbs[side],arm='arm-'+side,leg='leg-'+side;add(arm,l.arm,[.115,.295,.12],[0,-.1475,0],[.5,1]);add(arm,l.forearm,[.095,.27,.105],[0,-.135,0],[0,.5]);add(arm,l.hand,[.075,.085,.085],[0,-.032,0],[0,.12]);add(leg,l.thigh,[.145,.405,.16],[0,-.2025,0],[.5,1]);add(leg,l.shin,[.12,.395,.13],[0,-.1975,0],[.12,.5]);add(leg,l.foot,[.135,.09,.25],[0,-.035,-.05],[0,.12]);}
}
let clubhouse={style:0,tab:'club',demo:'idle'};try{const saved=JSON.parse(localStorage.getItem('padel-clubhouse')||'{}');if([-1,0,1].includes(saved.style))clubhouse.style=saved.style;}catch{}
function chooseCharacter(style){clubhouse.style=style;models.forEach((m,i)=>installCharacter(m,style<0?-1:(style+i%2)%characterAssets.length));document.querySelectorAll('[data-character]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.character)===style)));try{localStorage.setItem('padel-clubhouse',JSON.stringify({style}));}catch{}renderRosterPortraits();}
function clubTab(tab){clubhouse.tab=tab;document.querySelector('.rally-challenge').hidden=tab!=='club';document.querySelectorAll('[data-club-panel]').forEach(p=>p.hidden=p.dataset.clubPanel!==tab);document.querySelectorAll('[data-club-tab]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.clubTab===tab));b.classList.toggle('active',b.dataset.clubTab===tab);});document.querySelector('.experience-panel').scrollTop=0;}
for(const b of document.querySelectorAll('[data-club-tab]'))b.onclick=()=>clubTab(b.dataset.clubTab);
for(const b of document.querySelectorAll('[data-character]'))b.onclick=()=>chooseCharacter(Number(b.dataset.character));
for(const b of document.querySelectorAll('[data-demo]'))b.onclick=()=>{clubhouse.demo=b.dataset.demo;document.querySelectorAll('[data-demo]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
characterAssets.forEach((a,i)=>{document.querySelector('[data-character="'+i+'"] img').src=a.preview;});
chooseCharacter(clubhouse.style);clubTab('club');$('cycle-looks').textContent='Switch player style ↻';$('cycle-looks').onclick=()=>chooseCharacter(clubhouse.style===1?-1:clubhouse.style+1);
// Source emotes are sampled only outside rallies, so padel IK remains authoritative.
function sampleCharacterRotation(asset,clip,node,time){const track=asset.clips[clip]?.find(t=>t.node===node);if(!track)return null;const duration=track.times.at(-1);time=duration?time%duration:0;let i=0;while(i<track.times.length-2&&track.times[i+1]<time)i++;const t=(time-track.times[i])/Math.max(.0001,track.times[i+1]-track.times[i]);return new THREE.Quaternion().fromArray(track.values,i*4).slerp(new THREE.Quaternion().fromArray(track.values,(i+1)*4),Math.max(0,Math.min(1,t)));}
function animateClubCharacter(model,p,id,dt){
 if(dt<=0)return;const menu=game.mode==='menu',between=game.mode==='between'||game.mode==='match';if(!menu&&!between){const charge=game.chargeStates?.[id];if(charge&&model.clock-model.contactAt>.3){const amount=Math.min(1,charge.power*2);model.torso.rotation.y-=amount*.18;model.hips.position.y-=amount*.025;model.limbs.right.arm.rotation.x+=amount*.25;model.limbs.right.forearm.rotation.x+=amount*.18;}return;}
 if(model.assetIndex>=0){const asset=characterAssets[model.assetIndex],clip=between?(model.emotion==='win'?'emote-yes':'emote-no'):'idle',q=sampleCharacterRotation(asset,clip,'head',model.clock);if(q)model.head.quaternion.slerp(q,.65);}
 if(between){const win=model.emotion==='win',wave=Math.sin(model.clock*8);if(win){model.limbs.left.arm.rotation.x=2.3+wave*.18;model.limbs.left.forearm.rotation.x=1.4;model.torso.rotation.y+=Math.sin(model.clock*4)*.10;}else{model.neck.rotation.x=-.22;model.limbs.left.hand.rotation.z=Math.sin(model.clock*5)*.15;}return;}
 const demo=clubhouse.tab==='locker'?clubhouse.demo:'idle',t=model.clock;
 if(demo==='run'){for(const [k,l] of Object.entries(model.limbs)){const sign=k==='left'?1:-1;l.thigh.rotation.x=.25+Math.sin(t*11)*.65*sign;l.shin.rotation.x=-.5-Math.max(0,-Math.sin(t*11)*sign)*.6;l.foot.rotation.x=-l.thigh.rotation.x-l.shin.rotation.x;l.arm.rotation.x=.7-Math.sin(t*11)*.45*sign;}model.hips.position.y=.78+Math.abs(Math.sin(t*11))*.035;}
 else if(demo==='swing'){const swing=(Math.sin(t*3)+1)/2;model.torso.rotation.y=-.4+swing*.9;model.limbs.right.arm.rotation.set(.7+swing*.5,0,.5-swing*1.2);model.limbs.right.forearm.rotation.x=.55;}
 else if(demo==='celebrate'){model.limbs.left.arm.rotation.x=2.7;model.limbs.left.forearm.rotation.x=.7+Math.sin(t*7)*.4;model.hips.position.y=.79+Math.abs(Math.sin(t*5))*.055;}
 else{const warm=(Math.sin(t*.7+id)+1)/2;model.torso.rotation.y+=Math.sin(t*.7+id)*.12;model.limbs.left.arm.rotation.x+=warm*.2;model.hips.position.y-=warm*.025;}
 model.root.updateMatrixWorld(true);
}
// A dedicated render target avoids resizing or interrupting the main court canvas.
const lockerScene=new THREE.Scene();lockerScene.background=new THREE.Color('#172d39');lockerScene.add(new THREE.HemisphereLight(0xf3f9ff,0x647a68,2.8));const lockerLight=new THREE.DirectionalLight(0xffe4c5,2.5);lockerLight.position.set(-2,4,-3);lockerScene.add(lockerLight);
const lockerCamera=new THREE.PerspectiveCamera(33,1,.1,20);lockerCamera.position.set(2.2,1.55,-3.4);lockerCamera.lookAt(0,.93,0);const lockerTarget=new THREE.WebGLRenderTarget(256,256),lockerPixels=new Uint8Array(256*256*4),lockerContext=$('locker-canvas').getContext('2d'),lockerImage=lockerContext.createImageData(256,256);lockerTarget.texture.colorSpace=THREE.SRGBColorSpace;let lockerTimer=0;
function updateLocker(dt){if(game.mode!=='menu'||clubhouse.tab!=='locker')return;lockerTimer+=dt;if(lockerTimer<1/24)return;lockerTimer=0;const model=models[0],root=model.root,oldPosition=root.position.clone(),oldRotation=root.rotation.clone(),parent=root.parent,visible=root.visible,previous=renderer.getRenderTarget();lockerScene.add(root);root.position.set(0,model.groundOffset,0);root.rotation.y=0;root.visible=true;renderer.setRenderTarget(lockerTarget);renderer.render(lockerScene,lockerCamera);renderer.readRenderTargetPixels(lockerTarget,0,0,256,256,lockerPixels);renderer.setRenderTarget(previous);parent.add(root);root.position.copy(oldPosition);root.rotation.copy(oldRotation);root.visible=visible;for(let row=0;row<256;row++)lockerImage.data.set(lockerPixels.subarray((255-row)*1024,(256-row)*1024),row*1024);lockerContext.putImageData(lockerImage,0,0);}
