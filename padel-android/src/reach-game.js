// Arcade reach is independent of the early-input buffer. A recent legal
// Short, bounded footwork assistance; contact always requires physical reach.
const REACH_RADIUS=1.55,REACH_GRACE=.12,REACH_LATE_LIMIT=1.95;
class ReachGame extends window.SimpleGame {
  start(level){this.reachWindows=[];this.lunges=[];this.reachAttempted=[];super.start(level);}
  prepare(){this.reachWindows=[];this.lunges=[];this.reachAttempted=[];super.prepare();}
  assistReturn(id){
    if(this.reachAttempted?.[id]||this.controls[id].buffer<=0||!this.reachOpportunity(id)||super.canHit(id))return;
    this.reachAttempted[id]=true;
    this.lunges[id]={start:this.time,travel:0,hit:this.lastHitTime,point:this.pointNumber,bounces:this.bounces[this.team(id)]};
  }
  button(id,kind='drive',held=false){
    if(!held&&!this.paused&&!this.lunges?.[id]){this.reachAttempted??=[];this.reachAttempted[id]=false;}
    super.button(id,kind,held);
    if(this.networkRole!=='guest')this.assistReturn(id);
  }
  legalReach(id){const b=this.ball,team=this.team(id);return !this.paused&&this.mode==='rally'&&this.isHuman(id)&&team!==this.lastHitter&&(team===0?b.z>0.05:b.z<-.05)&&b.y>.09&&b.y<=2.68&&this.time-this.lastHitTime>.13&&(!this.serveActive||(this.bounces[team]>0&&id===this.serveReceiver));}
  rememberReach(id){
    if(!this.legalReach(id))return;
    const p=this.players[id],b=this.ball;if(Math.hypot(b.x-p.x,b.z-p.z)>REACH_RADIUS)return;
    this.reachWindows??=[];this.reachWindows[id]={time:this.time,hit:this.lastHitTime,rally:this.rallyHits,point:this.pointNumber,bounces:this.bounces[this.team(id)]};
  }
  reachOpportunity(id){
    if(!this.legalReach(id))return false;
    const p=this.players[id],b=this.ball,d=Math.hypot(b.x-p.x,b.z-p.z);
    if(d<=REACH_RADIUS)return true;
    const w=this.reachWindows?.[id];return d<=REACH_LATE_LIMIT&&!!w&&this.time-w.time<=REACH_GRACE+1e-8&&this.time>=w.time&&w.hit===this.lastHitTime&&w.rally===this.rallyHits&&w.point===this.pointNumber&&w.bounces===this.bounces[this.team(id)];
  }
  reachPose(id){
    const p=this.players[id],b=this.ball,side=this.team(id)===0?1:-1;
    if(this.contactValidator?.(id,b))return {x:p.x,z:p.z};
    const original={x:p.x,z:p.z},angle=Math.atan2(p.z-b.z,p.x-b.x);let best=null;
    // Find the nearest legal lunge that still puts the real racket on the ball.
    try{for(const radius of [.65,.45,.85])for(let i=0;i<16;i++){
      const a=angle+i*Math.PI/8,x=b.x+Math.cos(a)*radius,z=b.z+Math.sin(a)*radius;
      if(Math.abs(x)>4.65||z*side<.35||z*side>9.65)continue;
      const cost=Math.hypot(x-original.x,z-original.z);if(best&&cost>=best.cost)continue;
      p.x=x;p.z=z;if(!this.contactValidator||this.contactValidator(id,b))best={x,z,cost};
    }}finally{p.x=original.x;p.z=original.z;}
    return best;
  }
  canHit(id){return super.canHit(id);}
  launch(id,tx,tz,power,kind,bonus=1){
    super.launch(id,tx,tz,power,kind,bonus);this.reachWindows=[];this.lunges=[];
  }
  advanceLunge(id,dt){
    const l=this.lunges?.[id];if(!l)return;
    if(!this.legalReach(id)||this.time-l.start>.18||l.travel>=.65||l.hit!==this.lastHitTime||l.point!==this.pointNumber||l.bounces!==this.bounces[this.team(id)]||super.canHit(id)){this.lunges[id]=null;return;}
    const pose=this.reachPose(id);if(!pose){this.lunges[id]=null;return;}
    const p=this.players[id],dx=pose.x-p.x,dz=pose.z-p.z,d=Math.hypot(dx,dz);
    const c=this.controls[id];if(c.input.x*dx+c.input.z*dz<-.1){this.lunges[id]=null;return;}
    const age=Math.max(0,this.time-l.start),speed=4.5*Math.min(1,(age+dt)/.05),step=Math.min(d,.65-l.travel,speed*dt);
    if(step<=0||d<.001)return;
    p.x+=dx/d*step;p.z+=dz/d*step;p.vx=dx/d*speed;p.vz=dz/d*speed;l.travel+=step;
  }
  step(dt=1/120){
    if(!this.paused&&this.mode==='rally'&&this.networkRole!=='guest'&&this.hitStop<=0)for(const id of this.activePlayers){this.rememberReach(id);this.assistReturn(id);this.advanceLunge(id,dt);}
    super.step(dt);
    if(!this.paused&&this.mode==='rally')for(const id of this.activePlayers)this.rememberReach(id);
    else if(this.mode!=='rally')this.reachWindows=[];
  }
}
window.SimpleGame=ReachGame;
