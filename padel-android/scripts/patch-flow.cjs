// Shared keyboard/touch shot feedback and bounded, physical reach assistance.
module.exports=function(s){
 const replace=(a,b)=>{if(!s.includes(a))throw Error('Missing flow anchor: '+a.slice(0,70));s=s.replace(a,b);};
 replace('    button(id,kind){\n      if(this.paused||!this.isHuman(id))return;',`    previewSwing(id,kind){if(this.paused||!this.isHuman(id)||!['ready','drop','rally','between'].includes(this.mode))return;this.emit('swing',id,kind);}
    assistReturn(id){
      const c=this.controls[id],p=this.players[id],b=this.ball,team=this.team(id);
      const elapsed=Math.max(0,Math.min(.025,this.time-(c.assistAt??this.time)));c.assistAt=this.time;
      if(this.paused||this.mode!=='rally'||!this.isHuman(id)||c.buffer<=0||!(c.assistLeft>0)||team===this.lastHitter||b.y<.3||b.y>2.6)return;
      if(this.serveActive&&(this.bounces[team]===0||id!==this.serveReceiver))return;
      if((team===0?b.z:-b.z)<.35||Math.hypot(b.x-p.x,b.z-p.z)>1.6||this.canHit(id))return;
      const f=p.facing,dx=b.x-(.45*Math.cos(f)-.35*Math.sin(f))-p.x,dz=b.z-(-.45*Math.sin(f)-.35*Math.cos(f))-p.z,d=Math.hypot(dx,dz);
      if(d<.01||c.input.x*dx+c.input.z*dz<-.15)return;
      const step=Math.min(d,elapsed*4,c.assistLeft),oldX=p.x,oldZ=p.z,side=team===0?1:-1;
      p.x=Math.max(-4.55,Math.min(4.55,p.x+dx/d*step));p.z=side*Math.max(.65,Math.min(9.4,side*(p.z+dz/d*step)));c.assistLeft-=Math.hypot(p.x-oldX,p.z-oldZ);
    }
    button(id,kind,held=false){
      if(this.paused||!this.isHuman(id))return;
      if(!held)this.previewSwing(id,kind);`);
 // Swing input does not pull the player toward a distant ball.
 replace('      const p=this.players[id],dx=this.ball.x-p.x,dz=this.ball.z-p.z;this.tapMove(id,dx,dz);\n','');
 replace("      this.keyboardAim(id);this.queueHitFor(id,kind,kind==='lob'?.5:.64);", "      const previousReady=this.controls[id].buffer>0?this.controls[id].readyAt:Infinity;this.keyboardAim(id);this.queueHitFor(id,kind,kind==='lob'?.5:.64);this.controls[id].readyAt=Math.min(previousReady,this.time+.04);");
 replace('this.controls[id].buffer=1.15;','this.controls[id].buffer=1.55;this.controls[id].assistAt=this.time;this.controls[id].assistLeft=.5;');
 replace('      this.keyboardAim(id);if(c.pendingKind!==\'lob\')c.pendingKind=this.driveKind(id);\n      return super.tryHit(id);',"      this.assistReturn(id);this.keyboardAim(id);if(c.pendingKind!=='lob')c.pendingKind=this.driveKind(id);\n      return super.tryHit(id);");
 replace("game.button(id,lob?'lob':'drive');","game.button(id,lob?'lob':'drive',true);");
 replace("  if(type==='sound'){sound(a,b);return;}","  if(type==='swing'){const m=models[a];if(m){m.airSwingAt=m.clock;m.airSwingKind=b;m.airSwingSide=game.strokeFor(a,b).side;}return;}if(type==='sound'){sound(a,b);return;}");
 replace("  if(model.emotion!=='neutral'){",`  const airAge=model.clock-(model.airSwingAt??-100);
  if(!contact&&airAge>=0&&airAge<.46){
    const t=airAge/.46,sweep=Math.sin(t*Math.PI),side=model.airSwingSide||1,lob=model.airSwingKind==='lob';
    target[3]=side*(-.30+.75*sweep);target[2]-=.06*sweep;target[0]-=.025*sweep;
    target[15]=lob?.45+1.55*sweep:.5+.65*sweep;target[16]=side*(.55-1.15*sweep);target[17]=.35+.35*sweep;target[18]=lob?.2+.35*sweep:.1+.3*sweep;
    target[11]=.7;target[12]=-.25;target[13]=.85;
  }
  if(model.emotion!=='neutral'){`);
 replace('m.contactAt=-100;m.preHop=0;','m.contactAt=-100;m.airSwingAt=-100;m.preHop=0;');
 return s;
};
