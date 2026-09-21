(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  class SkillGame extends window.SimpleGame {
    constructor(event){super(event);this.tactics=new window.RallyTactics(this);this.chargeStates=Array(4).fill(null);this.characterKeys=['rio','alex','rio','alex'];this.rewardEvents=[];this.rewardSequence=0;this.pendingAward=null;this.pointCredits=[0,0,0,0];this.lastRelease=[];}
    start(level){super.start(level);this.tactics?.reset();this.cancelAllShots();this.pendingAward=null;this.pointCredits=[0,0,0,0];this.rewardEvents=[];this.rewardSequence=0;this.progress?.begin();}
    prepare(){super.prepare();this.cancelAllShots();for(const c of this.controls){c.contactWindow=null;c.moveTarget=null;}this.pendingAward=null;this.pointCredits=[0,0,0,0];}
    stat(){return 0;} // Player skill is learned; saved attributes no longer affect play.
    powerSpec(id,kind){return {cycle:kind==='lob'?1.2:1.02,low:kind==='lob'?.53:.62,high:(kind==='lob'?.65:.74)+this.stat(id,'control')*.025};}
    powerZone(id,kind,power){const s=this.powerSpec(id,kind);return power<window.PADEL_TUNING.power.weak?'weak':power>window.PADEL_TUNING.power.over?'strong':power>=s.low&&power<=s.high?'sweet':'controlled';}
    beginShot(id,kind='drive'){
      if(this.paused||!this.isHuman(id)||!['ready','rally'].includes(this.mode)||this.mode==='ready'&&id!==this.serverPlayer||this.chargeStates?.[id])return false;
      this.chargeStates??=Array(4).fill(null);this.chargeStates[id]={kind,elapsed:0,power:0};this.controls[id].buffer=0;this.controls[id].charging=true;if(id===this.controlled)this.charging=true;this.reserveContact(id);return true;
    }
    reserveContact(){} // Kept for old button callers; never slow or rewind live flight.
    tapMove(){return false;} // Inputs use acceleration rather than velocity impulses.
    setMoveTarget(id,point){
      if(this.paused||!this.isHuman(id)||!['ready','rally'].includes(this.mode)||!point||!Number.isFinite(point.x)||!Number.isFinite(point.z))return false;
      const side=this.team(id)===0?1:-1;if(Math.abs(point.x)>4.55||point.z*side<.6||point.z*side>9.55)return false;
      this.controls[id].moveTarget={x:point.x,z:point.z};this.controls[id].autoPosition=false;
      if(this.networkRole==='guest'){this.localMoveAction=(this.localMoveAction||0)+1;this.localMoveTarget={...point};}return true;
    }
    movementCommand(id){
      const c=this.controls[id],p=this.players[id],target=c.moveTarget;delete c.input.moveDistance;
      if(Math.hypot(c.input.x,c.input.z)>.08){c.moveTarget=null;return false;}if(!target)return false;
      const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz),t=window.PADEL_TUNING.movement;
      if(d<t.arrival){c.moveTarget=null;return false;}const amount=Math.min(1,d*t.gain);c.input.x=dx/d*amount;c.input.z=dz/d*amount;c.input.sprint=false;c.input.moveDistance=d;return true;
    }
    commitGesture(id,kind,power,aim){
      if(this.paused||!this.isHuman(id)||!['ready','rally'].includes(this.mode))return false;
      this.cancelShot(id);this.previewSwing(id,kind);this.lastRelease[id]={kind,power,zone:this.powerZone(id,kind,power),at:this.time};
      if(this.networkRole==='guest'){this.localAction++;this.localKind=kind;this.localPower=power;this.localAim=aim;return true;}
      return this.queueReleasedShot(id,kind,power,aim);
    }
    shotDifficulty(id,kind,power){
      const p=this.players[id],b=this.ball,c=this.controls[id],speed=Math.hypot(p.vx,p.vz),reach=Math.hypot(b.x-p.x,b.z-p.z),incoming=Math.hypot(b.vx,b.vy,b.vz);
      const stretch=clamp((reach-.55)/1,0,1),balance=clamp(speed/6+Math.abs(p.turnRate||0)*.025+(this.time<(p.recoverUntil||0)?.25:0),0,1);
      const strain=clamp(stretch*.38+balance*.32+clamp((incoming-12)/20,0,1)*.18+(1-c.stamina)*.12,0,1);
      const spread=Math.min(window.PADEL_TUNING.power.maxSpread,.07+strain*.5+(power>.86?(power-.86)*1.6:0)+(kind==='lob'?.03:0));
      return {strain,spread,dx:clamp(p.vx/6+(b.x-p.x)*.35,-1,1)*spread,dz:clamp(p.vz/6+(b.z-p.z)*.35,-1,1)*spread,powerScale:1-strain*.10};
    }
    physics(dt){
      const speed=Math.hypot(this.ball.vx,this.ball.vy,this.ball.vz),count=Math.max(1,Math.ceil(speed*dt/window.PADEL_TUNING.contact.stepDistance));
      for(let n=0;n<count;n++){
        if(this.mode==='rally')for(const id of this.activePlayers){if(this.isHuman(id))this.tryHit(id);else this.aiHit(id);}
        super.physics(dt/count);
      }
    }
    button(id,kind,held=false){if(!held)return this.beginShot(id,kind);}
    advanceCharge(dt){if(this.paused)return;for(let id=0;id<4;id++){const state=this.chargeStates?.[id];if(!state)continue;state.elapsed+=dt;state.power=Math.min(1,state.elapsed/this.powerSpec(id,state.kind).cycle);this.controls[id].charge=state.power;if(id===this.controlled)this.charge=state.power;}}
    cancelShot(id,keepContact=false){if(this.chargeStates)this.chargeStates[id]=null;const c=this.controls?.[id];if(c){if(!keepContact&&c.contactWindow)c.contactWindow.until=-1;c.charging=false;c.charge=0;c.buffer=0;}if(id===this.controlled){this.charging=false;this.charge=0;}}
    cancelAllShots(){for(let id=0;id<4;id++)this.cancelShot(id);}
    releaseShot(id,kind){const c=this.chargeStates?.[id];if(!c||kind&&c.kind!==kind)return false;const power=c.power;kind=c.kind;this.cancelShot(id,true);if(this.paused||!['ready','rally'].includes(this.mode))return false;
      this.previewSwing(id,kind);this.lastRelease[id]={power,kind,zone:this.powerZone(id,kind,power),at:this.time};this.keyboardAim(id);
      const aim={...(id===this.controlled?this.aim:this.controls[id].aim)};
      if(this.networkRole==='guest'){this.localAction++;this.localKind=kind;this.localPower=power;this.localAim=aim;return true;}
      return this.queueReleasedShot(id,kind,power,aim);
    }
    queueReleasedShot(id,kind,power,aim){
      if(!aim||!Number.isFinite(aim.x)||!Number.isFinite(aim.z)||this.paused||!this.isHuman(id)||!Number.isFinite(power)||power<0||power>1||!['drive','lob'].includes(kind))return false;
      if(this.mode==='ready'){if(id!==this.serverPlayer)return false;this.controls[id].servePower=power;const side=this.team(id)===0?-1:1;this.controls[id].serveAim={x:clamp(aim.x,-4.4,4.4),z:side*clamp(Math.abs(aim.z),2.2,9.2)};return this.requestServe();}
      if(this.mode!=='rally')return false;const c=this.controls[id],side=this.team(id)===0?-1:1;
      c.power=power;c.pendingKind=kind;c.buffer=window.PADEL_TUNING.gesture.inputBuffer;c.readyAt=this.time;c.releasedAim={x:clamp(aim.x,-4.4,4.4),z:side*clamp(Math.abs(aim.z),2.2,9.2)};
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
      this.serveActive=false;this.launch(id,aim.x,aim.z,c.power,kind);c.buffer=0;return true;
    }

    serveHit(){const id=this.serverPlayer,b=this.ball;if(!this.dropBounced||b.y>1||Math.abs(b.z)<6.95){this.fault('Illegal serve');return;}
      this.keyboardAim(id);const side=this.team(id)===0?-1:1,aim=this.isHuman(id)?(this.controls[id].serveAim||(id===this.controlled?this.aim:this.controls[id].aim)):{x:-this.serveX(),z:side*4.5};
      const power=this.isHuman(id)?(this.controls[id].servePower??.5):clamp(.53+this.gaussian()*this.tactics.settings().error*.5,.1,.95);
      this.launch(id,aim.x,aim.z,power,'serve');this.serveActive=true;this.serveNet=false;this.mode='rally';
    }
    shotVelocity(id,tx,tz,unusedPower,kind){
      const b=this.ball,power=this.shotContext?.power??unusedPower,dx=tx-b.x,dz=tz-b.z,d=Math.hypot(dx,dz),lob=kind==='lob',serve=kind==='serve';
      const feel=window.PADEL_TUNING.power;let flight=lob?feel.lobBase+d*.025:serve?feel.serveFlight:Math.max(feel.driveMinimum,feel.driveBase+d*feel.driveDistance-power*feel.drivePower),solution;
      // Solve a nominal controlled trajectory using the actual gravity, drag and spin.
      // Underpowered shots can fall short; overpowered shots can reach glass first.
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
      const limits=window.PADEL_TUNING.power,over=clamp((power-limits.over)/(1-limits.over),0,1),weak=clamp(power/limits.weak,0,1);
      solution.vx*=(.45+.55*weak)*(1+over*limits.overSpeed);solution.vz*=(.45+.55*weak)*(1+over*limits.overSpeed);
      solution.vy*=(.20+.80*weak)*(1+over*limits.overLift);
      Object.assign(b,solution);this.solvedKind=kind;
    }
    launch(id,tx,tz,power,kind,bonus=1){
      if(this.pendingAward&&this.team(this.pendingAward.id)!==this.team(id)&&this.crossed&&!this.hitNet)this.creditShot();
      if(kind==='flat'||kind==='slice'||kind==='topspin')kind='drive';if(kind!=='serve'){const q=this.shotDifficulty(id,kind,power);tx+=q.dx;tz+=q.dz;power*=q.powerScale;}this.shotContext={id,power};
      const p=this.players[id],zone=this.powerZone(id,kind,power),speed=Math.hypot(p.vx,p.vz),off=Math.abs(this.contactOffset(id));
      super.launch(id,tx,tz,power,kind,1);this.shotContext=null;
      this.lastContact.power=power;this.lastContact.zone=zone;
      this.pendingAward={id,zone,power,kind,x:p.x,z:p.z,speed,wall:this.time-p.lastWall<1.5,off,character:this.characterKeys[id]};
      if(zone==='sweet')this.emit('sweet',id);if(this.tactics)this.aiEligible=this.time+this.tactics.settings().reaction;
    }
    creditShot(){this.pendingAward=null;} // No automatic progression or stat awards.
    floorContact(){const legal=this.mode==='rally'&&(this.ball.z>=0?0:1)!==this.lastHitter&&!this.hitNet&&this.bounces[1-this.lastHitter]===0;super.floorContact();if(legal&&this.mode==='rally')this.creditShot();}
    endPoint(winner,reason,detail){super.endPoint(winner,reason,detail);this.cancelAllShots();this.pendingAward=null;}
    fault(reason){super.fault(reason);this.cancelAllShots();this.pendingAward=null;}
    predictTeam(team){
      const q={...this.ball},side=team===0?1:-1,bounces=[...this.bounces],ids=this.members(team);let best=null,crossed=this.crossed;
      const speed=this.tactics?.settings().speed||5.2,reaction=Math.max(0,this.aiEligible-this.time);
      for(let n=1;n<=300;n++){
        const oldZ=q.z;this.integrate(q,1/120);const half=q.z>=0?0:1;
        if(oldZ*q.z<=0){if(q.y<.96)break;crossed=true;}
        if(q.y<.0325&&q.vy<0){if(half===this.lastHitter||++bounces[half]>=2)break;q.y=.0325;q.vy=Math.abs(q.vy)*.72;q.vx*=.92;q.vz*=.92;q.vx+=q.sz*.001;q.vz-=q.sx*.001;q.sx*=.78;q.sz*=.78;}
        for(const axis of ['x','z']){const limit=axis==='x'?4.9675:9.9675;if(Math.abs(q[axis])<=limit)continue;
          if(half!==this.lastHitter&&bounces[half]===0||half===this.lastHitter&&!crossed)return best||{id:ids[0],x:this.players[ids[0]].x,z:this.players[ids[0]].z};
          const glass=axis==='z'||Math.abs(q.z)>=8?3:2;if(q.y>glass+1)return best||{id:ids[0],x:0,z:side*7};const bounce=q.y>glass?.35:.85;q[axis]=Math.sign(q[axis])*limit;q['v'+axis]*=-bounce;
        }
        if(q.z*side<.6||q.y<.15||q.y>2.45||this.serveActive&&bounces[team]===0)continue;
        const time=n/120,x=clamp(q.x-.35*side,-4.5,4.5),z=side*clamp(Math.abs(q.z)+.22,.65,9.4);
        for(const id of ids){if(this.serveActive&&id!==this.serveReceiver)continue;const p=this.players[id],distance=Math.hypot(x-p.x,z-p.z),late=Math.max(0,(distance-.65)/speed+reaction-time),score=late*8+time*.13+distance*.025+(id===this.claims[team]?-.08:0);if(!best||score<best.score)best={id,x,z,score,time,wall:bounces[team]>0};}
        if(best&&best.score<.12&&time>.22)break;
      }
      return best||{id:ids[0],x:clamp(this.ball.x,-4.4,4.4),z:side*7.8};
    }
    coordinate(){this.tactics.coordinate();}
    aiHit(id){this.tactics.hit(id);}
    moveToward(p,x,z,dt,speed=window.PADEL_TUNING.movement.run){const id=this.players.indexOf(p);if(this.mode==='rally'&&id>=0&&!this.isHuman(id)&&this.tactics)speed=this.tactics.settings().speed*(1-this.tactics.brains[id].fatigue*.15);const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz),targetSpeed=Math.min(speed,d*window.PADEL_TUNING.movement.gain),vx=d>.001?dx/d*targetSpeed:0,vz=d>.001?dz/d*targetSpeed:0,ax=vx-p.vx,az=vz-p.vz,a=Math.hypot(ax,az),limit=window.PADEL_TUNING.movement.acceleration*dt,f=a>limit?limit/a:1;p.vx+=ax*f;p.vz+=az*f;p.x=clamp(p.x+p.vx*dt,-4.55,4.55);const side=z<0?-1:1;p.z=side*clamp((p.z+p.vz*dt)*side,.6,9.55);}
    moveLocal(id,dt){const c=this.controls[id],before=c.stamina;super.moveLocal(id,dt);if(c.stamina<before)c.stamina+=((before-c.stamina)*this.stat(id,'stamina')*.12);}
    step(dt=1/120){if(this.paused||this.networkRole==='guest')return;super.step(dt);if(this.mode!=='menu'&&this.mode!=='match'){this.advanceCharge(dt);this.tactics.step(dt);}}
  }
  window.SkillGame=SkillGame;window.SimpleGame=SkillGame;
})();

