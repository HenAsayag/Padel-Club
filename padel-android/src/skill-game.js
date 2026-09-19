(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  class SkillGame extends window.SimpleGame {
    constructor(event){super(event);this.tactics=new window.RallyTactics(this);this.chargeStates=Array(4).fill(null);this.characterKeys=['rio','alex','rio','alex'];this.rewardEvents=[];this.rewardSequence=0;this.pendingAward=null;this.pointCredits=[0,0,0,0];this.lastRelease=[];}
    start(level){super.start(level);this.tactics?.reset();this.cancelAllShots();this.pendingAward=null;this.pointCredits=[0,0,0,0];this.rewardEvents=[];this.rewardSequence=0;this.progress?.begin();}
    prepare(){super.prepare();this.cancelAllShots();this.pendingAward=null;this.pointCredits=[0,0,0,0];}
    stat(id,key){return this.networkMode&&this.networkMode!=='offline'?0:(this.progress?.value(this.characterKeys[id],key)||0)/100;}
    powerSpec(id,kind){return {cycle:kind==='lob'?1.2:1.02,low:kind==='lob'?.53:.62,high:(kind==='lob'?.65:.74)+this.stat(id,'control')*.025};}
    powerZone(id,kind,power){const s=this.powerSpec(id,kind);return power<.24?'weak':power>.86?'strong':power>=s.low&&power<=s.high?'sweet':'controlled';}
    beginShot(id,kind='drive'){
      if(this.paused||!this.isHuman(id)||!['ready','rally'].includes(this.mode)||this.mode==='ready'&&id!==this.serverPlayer||this.chargeStates?.[id])return false;
      this.chargeStates??=Array(4).fill(null);this.chargeStates[id]={kind,elapsed:0,power:0};this.controls[id].buffer=0;this.controls[id].charging=true;if(id===this.controlled)this.charging=true;return true;
    }
    button(id,kind,held=false){if(!held)return this.beginShot(id,kind);}
    advanceCharge(dt){if(this.paused)return;for(let id=0;id<4;id++){const state=this.chargeStates?.[id];if(!state)continue;state.elapsed+=dt;state.power=Math.min(1,state.elapsed/this.powerSpec(id,state.kind).cycle);this.controls[id].charge=state.power;if(id===this.controlled)this.charge=state.power;}}
    cancelShot(id){if(this.chargeStates)this.chargeStates[id]=null;const c=this.controls?.[id];if(c){c.charging=false;c.charge=0;c.buffer=0;}if(id===this.controlled){this.charging=false;this.charge=0;}}
    cancelAllShots(){for(let id=0;id<4;id++)this.cancelShot(id);}
    releaseShot(id,kind){const c=this.chargeStates?.[id];if(!c||kind&&c.kind!==kind)return false;const power=c.power;kind=c.kind;this.cancelShot(id);if(this.paused||!['ready','rally'].includes(this.mode))return false;
      this.previewSwing(id,kind);this.lastRelease[id]={power,kind,zone:this.powerZone(id,kind,power),at:this.time};this.keyboardAim(id);
      const aim={...(id===this.controlled?this.aim:this.controls[id].aim)};
      if(this.networkRole==='guest'){this.localAction++;this.localKind=kind;this.localPower=power;this.localAim=aim;return true;}
      return this.queueReleasedShot(id,kind,power,aim);
    }
    queueReleasedShot(id,kind,power,aim){
      if(this.paused||!this.isHuman(id)||!Number.isFinite(power)||power<0||power>1||!['drive','lob'].includes(kind))return false;
      if(this.mode==='ready'){if(id!==this.serverPlayer)return false;this.controls[id].servePower=power;this.keyboardAim(id);return this.requestServe();}
      if(this.mode!=='rally')return false;const c=this.controls[id],side=this.team(id)===0?-1:1;
      c.power=power;c.pendingKind=kind;c.buffer=.22+this.stat(id,'timing')*.025;c.readyAt=this.time;c.releasedAim={x:clamp(Number(aim?.x)||0,-4.4,4.4),z:side*clamp(Math.abs(Number(aim?.z)||6.5),2.2,9.2)};
      this.reachAttempted[id]=false;this.assistReturn(id);return true;
    }
    keyboardAim(id=this.controlled){const c=this.controls[id],aim=id===this.controlled?this.aim:c.aim,side=this.team(id)===0?-1:1,input=id===this.controlled?this.input:c.input;
      if(this.mode==='ready'||this.mode==='drop'){aim.x=-this.serveX(this.team(id));aim.z=side*4.5;return;}
      // Movement selects the lane and depth. Neutral input keeps the last aim.
      if(Math.abs(input.x)>.18)aim.x=clamp(input.x*3.7,-3.7,3.7);if(Math.abs(input.z)>.18)aim.z=side*(input.z*side>0?4.1:8.2);
      if(!Number.isFinite(aim.z)||aim.z*side<=0)aim.z=side*6.5;if(!Number.isFinite(aim.x))aim.x=0;
    }
    tryHit(id){const c=this.controls[id],team=this.team(id);if(this.networkRole==='guest'||c.buffer<=0||this.time<c.readyAt||!this.canHit(id)||this.serveActive&&(this.bounces[team]===0||id!==this.serveReceiver))return false;
      const aim=c.releasedAim;if(!aim)return false;const kind=c.pendingKind==='lob'?'lob':this.driveKind(id),zone=this.powerZone(id,c.pendingKind,c.power);
      const off=Math.abs(this.contactOffset(id)),fatigue=1-c.stamina,sigma=(zone==='sweet'?.045:zone==='strong'?.7:.16)*(1+fatigue*.5+off*.3)*(1-this.stat(id,'accuracy')*.15);
      this.serveActive=false;this.launch(id,aim.x+this.gaussian()*sigma,aim.z+this.gaussian()*sigma,c.power,kind);c.buffer=0;return true;
    }
    serveHit(){const id=this.serverPlayer,b=this.ball;if(!this.dropBounced||b.y>1||Math.abs(b.z)<6.95){this.fault('Illegal serve');return;}
      this.keyboardAim(id);const side=this.team(id)===0?-1:1,aim=this.isHuman(id)?(id===this.controlled?this.aim:this.controls[id].aim):{x:-this.serveX(),z:side*4.5};
      const power=this.isHuman(id)?(this.controls[id].servePower??.5):clamp(.53+this.gaussian()*this.tactics.settings().error*.5,.1,.95);
      this.launch(id,aim.x,aim.z,power,'serve');this.serveActive=true;this.serveNet=false;this.mode='rally';
    }
    shotVelocity(id,tx,tz,unusedPower,kind){
      const b=this.ball,power=this.shotContext?.power??unusedPower,dx=tx-b.x,dz=tz-b.z,d=Math.hypot(dx,dz),lob=kind==='lob',serve=kind==='serve';
      let flight=lob?1.9+d*.025:serve?1.15:Math.max(.50,.58+d*.047-power*.28),solution;
      // Solve a nominal controlled trajectory using the actual gravity, drag and spin.
      // A tap uses the slower nominal arc too: beginners can return without charging.
      // Overcharging still adds speed after solving and can hit glass before the floor.
      for(let attempt=0;attempt<8;attempt++){
        let vx=dx/flight,vy=(.0325-b.y+4.905*flight*flight)/flight,vz=dz/flight;const spin=lob?24:kind==='smash'?75:35;
        let net=Infinity;
        for(let iteration=0;iteration<5;iteration++){
          const q={...b,vx,vy,vz,sx:dz/Math.max(d,.01)*spin,sy:0,sz:-dx/Math.max(d,.01)*spin};net=Infinity;
          const steps=Math.ceil(flight*120),dt=flight/steps;
          for(let i=0;i<steps;i++){const z=q.z,y=q.y;this.integrate(q,dt);if(z*q.z<=0)net=Math.min(net,y+(q.y-y)*Math.abs(z)/Math.max(.0001,Math.abs(q.z-z)));}
          if(iteration<4){vx+=(tx-q.x)/flight;vy+=(.0325-q.y)/flight;vz+=(tz-q.z)/flight;}
          solution={vx,vy,vz,sx:dz/Math.max(d,.01)*spin,sy:0,sz:-dx/Math.max(d,.01)*spin};
        }
        if(net>1.03||lob)break;flight+=.10;
      }
      const over=clamp((power-.86)/.14,0,1);
      solution.vx*=1+over*.82;solution.vz*=1+over*.82;
      solution.vy*=1+over*.14;
      Object.assign(b,solution);this.solvedKind=kind;
    }
    launch(id,tx,tz,power,kind,bonus=1){
      if(this.pendingAward&&this.team(this.pendingAward.id)!==this.team(id)&&this.crossed&&!this.hitNet)this.creditShot();
      if(kind==='flat'||kind==='slice'||kind==='topspin')kind='drive';this.shotContext={id,power};
      const p=this.players[id],zone=this.powerZone(id,kind,power),speed=Math.hypot(p.vx,p.vz),off=Math.abs(this.contactOffset(id));
      super.launch(id,tx,tz,power,kind,1);this.shotContext=null;
      this.lastContact.power=power;this.lastContact.zone=zone;
      this.pendingAward={id,zone,power,kind,x:p.x,z:p.z,speed,wall:this.time-p.lastWall<1.5,off,character:this.characterKeys[id]};
      if(zone==='sweet')this.emit('sweet',id);if(this.tactics)this.aiEligible=this.time+this.tactics.settings().reaction;
    }
    creditShot(){const shot=this.pendingAward;if(!shot)return;this.pendingAward=null;if(!this.isHuman(shot.id)||!['sweet','controlled'].includes(shot.zone)||this.pointCredits[shot.id]>=4)return;
      this.pointCredits[shot.id]++;const placement=Math.min(...this.members(1-this.team(shot.id)).map(i=>Math.hypot(this.ball.x-this.players[i].x,this.ball.z-this.players[i].z)));
      const weights={control:1,accuracy:1,consistency:1,placement:placement>2?1:0,timing:shot.off<.09?1:0,defense:shot.wall||Math.abs(shot.z)>7?1.3:0,net:Math.abs(shot.z)<3.5?1:0,stamina:this.rallyHits>10?1:0,sweet:shot.zone==='sweet'?1.3:0,technique:shot.kind==='smash'||shot.kind==='lob'?1:0};
      const event={seq:++this.rewardSequence,id:shot.id,character:shot.character,weights};this.rewardEvents.push(event);this.rewardEvents=this.rewardEvents.slice(-32);
      if(this.networkRole!=='host'||shot.id===this.controlled)this.progress?.award(shot.character,weights);
    }
    floorContact(){const legal=this.mode==='rally'&&(this.ball.z>=0?0:1)!==this.lastHitter&&!this.hitNet&&this.bounces[1-this.lastHitter]===0;super.floorContact();if(legal&&this.mode==='rally')this.creditShot();}
    endPoint(winner,reason,detail){super.endPoint(winner,reason,detail);this.cancelAllShots();this.pendingAward=null;}
    fault(reason){super.fault(reason);this.cancelAllShots();this.pendingAward=null;}
    coordinate(){this.tactics.coordinate();}
    aiHit(id){this.tactics.hit(id);}
    moveToward(p,x,z,dt,speed){const id=this.players.indexOf(p);if(this.mode==='rally'&&id>=0&&!this.isHuman(id)&&this.tactics)speed=this.tactics.settings().speed*(1-this.tactics.brains[id].fatigue*.15);super.moveToward(p,x,z,dt,speed);}
    moveLocal(id,dt){const c=this.controls[id],before=c.stamina;super.moveLocal(id,dt);if(c.stamina<before)c.stamina+=((before-c.stamina)*this.stat(id,'stamina')*.12);}
    step(dt=1/120){if(this.paused||this.networkRole==='guest')return;super.step(dt);if(this.mode!=='menu'&&this.mode!=='match'){this.advanceCharge(dt);this.tactics.step(dt);}}
  }
  window.SkillGame=SkillGame;window.SimpleGame=SkillGame;
})();

