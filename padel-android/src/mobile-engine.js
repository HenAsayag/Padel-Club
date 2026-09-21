(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  class MobileGame extends window.SimpleGame {
    constructor(event){super(event);this.networkMode='offline';this.networkRole='offline';this.remoteId=1;this.remoteInput={x:0,z:0,drive:false,lob:false};this.remoteInputAt=-100;this.localAction=0;this.localKind='drive';this.deviceInput={x:0,z:0,drive:false,lob:false};}
    isHuman(id){return this.networkMode&&this.networkMode!=='offline'?id===0||id===this.remoteId:super.isHuman(id);}
    button(id,kind,held=false){return super.button(id,kind,held);}
    keyboardAim(id=this.controlled){return super.keyboardAim(id);}
    tryHit(id){return super.tryHit(id);}
    moveLocal(id,dt){
      const command=this.movementCommand(id);
      if(this.team(id)===0){try{return super.moveLocal(id,dt);}finally{if(command){this.controls[id].input.x=0;this.controls[id].input.z=0;}}}
      // Mirror the far player into the same movement rules, including stamina,
      // acceleration, side steps and recovery. Restore world coordinates before physics.
      const p=this.players[id],c=this.controls[id],ball=this.ball,target=this.targets[id];
      const mirror=()=>{for(const k of ['x','z','vx','vz','ax','az'])if(Number.isFinite(p[k]))p[k]=-p[k];p.facing+=Math.PI;c.input.x=-c.input.x;c.input.z=-c.input.z;for(const k of ['x','z','vx','vz'])ball[k]=-ball[k];if(target){target.x=-target.x;target.z=-target.z;}};
      // Render effects only after the mirrored coordinates have been restored.
      const facing=p.facing,emit=this.emit,events=[];this.emit=(...args)=>events.push(args);
      mirror();try{super.moveLocal(id,dt);}finally{mirror();this.emit=emit;p.facing-=Math.PI*2;if(!Number.isFinite(p.facing))p.facing=facing;}
      if(command){c.input.x=0;c.input.z=0;}for(const args of events)this.emit(...args);
    }
    step(dt=1/120){if(this.networkRole==='guest')return;if(this.networkRole==='host'){const fresh=this.time-this.remoteInputAt<.6,input=fresh?this.remoteInput:{x:0,z:0},c=this.controls[this.remoteId];c.input.x=input.x;c.input.z=input.z;c.input.sprint=Math.hypot(this.ball.x-this.players[this.remoteId].x,this.ball.z-this.players[this.remoteId].z)>2.2;}super.step(dt);}
  }
  window.MobileGame=MobileGame;
})();
