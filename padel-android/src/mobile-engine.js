(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  class MobileGame extends window.SimpleGame {
    constructor(event){super(event);this.networkMode='offline';this.networkRole='offline';this.remoteId=1;this.remoteInput={x:0,z:0,drive:false,lob:false};this.remoteInputAt=-100;this.localAction=0;this.localKind='drive';this.deviceInput={x:0,z:0,drive:false,lob:false};}
    isHuman(id){return this.networkMode&&this.networkMode!=='offline'?id===0||id===this.remoteId:super.isHuman(id);}
    button(id,kind,held=false){if(this.networkRole==='guest'){if(this.paused)return;if(!held)this.previewSwing(id,kind);this.localKind=kind;this.localAction++;return;}super.button(id,kind,held);}
    keyboardAim(id=this.controlled){if(this.team(id)===0)return super.keyboardAim(id);const aim=this.controls[id].aim,input=this.controls[id].input;if(this.mode==='ready'||this.mode==='drop'){aim.x=-this.serveX(1);aim.z=4.5;return;}if(Math.abs(input.x)>.25)aim.x=Math.sign(input.x)*3.1;else{let best=-Infinity;for(const x of [-3.1,0,3.1]){const space=Math.min(...this.members(0).map(i=>Math.hypot(x-this.players[i].x,7.5-this.players[i].z)));if(space>best){best=space;aim.x=x;}}}aim.z=input.z>.3?5.6:7.5;}
    tryHit(id){if(this.networkRole==='guest')return false;if(this.team(id)===0)return super.tryHit(id);const c=this.controls[id];if(c.buffer<=0||this.time<c.readyAt||!this.canHit(id))return false;if(this.serveActive&&(this.bounces[1]===0||id!==this.serveReceiver))return false;this.keyboardAim(id);if(c.pendingKind!=='lob')c.pendingKind=this.driveKind(id);const off=this.contactOffset(id),perfect=Math.abs(off)<=.05;this.timing=perfect?'perfect':off>0?'early':'late';this.timingUntil=this.time+1.25;this.lastContactQuality=1;const sigma=(.08+.38*c.power*c.power)*(perfect?.5:1)*this.racketFor(id).control;this.lastAimSigma=sigma;this.serveActive=false;this.launch(id,c.aim.x+this.gaussian()*sigma,clamp(c.aim.z+this.gaussian()*sigma,.35,9.7),c.power,c.pendingKind,perfect?1.15:1);c.buffer=0;this.emit('timing',this.timing,this.lastShotSpeed);return true;}
    moveLocal(id,dt){
      if(this.team(id)===0)return super.moveLocal(id,dt);
      // Mirror the far player into the same movement rules, including stamina,
      // acceleration, side steps and recovery. Restore world coordinates before physics.
      const p=this.players[id],c=this.controls[id],ball=this.ball,target=this.targets[id];
      const mirror=()=>{for(const k of ['x','z','vx','vz','ax','az'])if(Number.isFinite(p[k]))p[k]=-p[k];p.facing+=Math.PI;c.input.x=-c.input.x;c.input.z=-c.input.z;for(const k of ['x','z','vx','vz'])ball[k]=-ball[k];if(target){target.x=-target.x;target.z=-target.z;}};
      // Render effects only after the mirrored coordinates have been restored.
      const facing=p.facing,emit=this.emit,events=[];this.emit=(...args)=>events.push(args);
      mirror();try{super.moveLocal(id,dt);}finally{mirror();this.emit=emit;p.facing-=Math.PI*2;if(!Number.isFinite(p.facing))p.facing=facing;}
      for(const args of events)this.emit(...args);
    }
    step(dt=1/120){if(this.networkRole==='guest')return;if(this.networkRole==='host'){const fresh=this.time-this.remoteInputAt<.6,input=fresh?this.remoteInput:{x:0,z:0,drive:false,lob:false},c=this.controls[this.remoteId];c.input.x=input.x;c.input.z=input.z;c.input.sprint=Math.hypot(this.ball.x-this.players[this.remoteId].x,this.ball.z-this.players[this.remoteId].z)>2.2;if((input.drive||input.lob)&&this.mode==='rally'&&this.lastHitter!==this.team(this.remoteId)&&c.buffer<.15)this.button(this.remoteId,input.lob?'lob':'drive');}super.step(dt);}
  }
  window.MobileGame=MobileGame;
})();
