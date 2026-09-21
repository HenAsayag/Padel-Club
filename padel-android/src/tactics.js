(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const levels=window.PADEL_TUNING.ai;
  const styles=['balanced','aggressive','defensive','creative'];
  class RallyTactics {
    constructor(game){this.game=game;this.reset();}
    reset(){this.brains=Array.from({length:4},(_,id)=>({state:'Recover',style:styles[id],history:[],fatigue:0,next:0,shot:-1,readyAt:0,plan:null}));this.rallyStart=null;this.history=[];this.safeguardCount=0;}
    settings(){return levels[this.game.difficulty]||levels.normal;}
    pressure(){return clamp((this.game.rallyHits-8)/26,0,1.5);}
    transition(brain,state){if(brain.state!==state){brain.state=state;brain.since=this.game.time;}}
    choose(id){
      const g=this.game,b=g.ball,p=g.players[id],brain=this.brains[id],side=g.team(id)===0?-1:1,opponents=g.members(1-g.team(id)).map(i=>g.players[i]);
      const exhausted=brain.fatigue+this.pressure()*.22,displaced=Math.min(1,Math.hypot(p.vx,p.vz)/6),defending=Math.abs(p.z)>7.5||b.y<.65||displaced>.85;
      const netPressure=opponents.every(o=>Math.abs(o.z)<4.4),canAttack=b.y>1.7&&Math.abs(p.z)<5.5&&!defending;
      const candidates=[];
      for(const x of [-3.65,0,3.65])for(const depth of [2.8,5.4,8.3])for(const kind of ['drive','lob',...(canAttack?['smash']:[])]){
        if(kind==='lob'&&depth!==8.3)continue;
        const lane=x<0?'left':x>0?'right':'center',zone=depth<4?'short':depth>7?'deep':'middle',key=lane+':'+zone+':'+kind;
        const space=Math.min(...opponents.map(o=>Math.hypot(x-clamp(o.x+o.vx*.32,-4.5,4.5),side*depth-(o.z+o.vz*.25))));
        const recent=brain.history.slice(-4),repeats=recent.filter(h=>h.key===key).length,teamRepeats=this.history.slice(-4).filter(h=>h.team===g.team(id)&&h.lane===lane).length;
        if(recent.length>=2&&recent.slice(-2).every(h=>h.key===key))continue;
        const wallRisk=zone==='deep'&&Math.abs(x)>3?(.25+exhausted*.4):0;
        let score=space*.65-repeats*3-teamRepeats*.65-wallRisk;
        score+=kind==='lob'?(netPressure?3.5:-1.8)+(defending?1.3:0):0;
        score+=kind==='smash'?2.2:0;score+=defending&&zone==='deep'?1.2:0;
        score+=brain.style==='aggressive'&&zone==='short'?.7:brain.style==='defensive'&&kind==='lob'?.9:0;
        score-=Math.abs(x-b.x)*.08*(defending?2:1);score+=g.gaussian()*(brain.style==='creative'?.38:.16);
        candidates.push({x,z:side*depth,kind,lane,zone,key,score});
      }
      candidates.sort((a,b)=>b.score-a.score);const pick=candidates[0];
      const intent=defending?'Defend':canAttack||pick.zone==='short'?'Attack':'Prepare';
      let power=pick.kind==='lob'?.59:pick.kind==='smash'?.77:intent==='Attack'?.73:g.difficulty==='hard'?.67:g.difficulty==='normal'?.57:.49;
      // Timing error grows with speed, fatigue and rally pressure; never rerolled per frame.
      const error=this.settings().error*(1+displaced*.6)+brain.fatigue*.08+this.pressure()*.15;
      power=clamp(power+clamp(g.gaussian(),-2,2)*error,.04,.99);
      return {...pick,power,intent,error,displaced};
    }
    coordinate(){
      const g=this.game,settings=this.settings();
      for(let team=0;team<2;team++){
        const ids=g.members(team),side=team===0?1:-1,incoming=g.lastHitter!==team;
        const pick=incoming?g.predictTeam(team):null;
        if(pick)g.claims[team]=pick.id;
        for(const id of ids){if(g.isHuman(id))continue;const brain=this.brains[id],p=g.players[id];
          if(incoming&&brain.shot!==g.rallyHits){brain.shot=g.rallyHits;brain.readyAt=g.time+settings.reaction*(1+brain.fatigue*.5);brain.plan=null;brain.offset=g.gaussian()*settings.error;brain.next=0;this.transition(brain,'Track');}
          if(g.time<brain.next)continue;brain.next=g.time+levels.decision+settings.reaction*.3;
          if(incoming&&pick&&pick.id===id){
            g.targets[id]={x:clamp(pick.x+(brain.offset||0),-4.5,4.5),z:side*clamp(Math.abs(pick.z)+Math.abs(brain.offset||0)*.3,.65,9.4)};
            if(g.time>=brain.readyAt&&!brain.plan){brain.plan=this.choose(id);brain.readyAt=g.time+.06+brain.plan.displaced*settings.reaction;this.transition(brain,brain.plan.intent);}
          }else{
            const depth=brain.style==='defensive'?6.3:brain.style==='aggressive'&&Math.abs(g.ball.z)<6?3.0:4.9;
            g.targets[id]={x:clamp(ids.length===2&&pick?(pick.x>=0?-2.4:2.4):g.ball.x*.22+(ids.length===2?(id<2?1.9:-1.9)*side:0),-4.3,4.3),z:side*(incoming?6.2:depth)};
            this.transition(brain,'Recover');brain.plan=null;
          }
        }
        // Preserve optional desktop teammate switching without switching a charged shot.
        if(pick&&team===0&&g.autoSwitch&&!g.coop&&!g.chargeStates?.some(c=>c)&&pick.id!==g.controlled){g.controls[g.controlled].input={x:0,z:0,sprint:false};g.controlled=pick.id;g.emit('switch',pick.id);}
      }
    }
    hit(id){const g=this.game,brain=this.brains[id],team=g.team(id);if(g.claims[team]!==id||!brain.plan||g.time<brain.readyAt||g.time<(brain.cooldown||0)||!g.canHit(id)||g.serveActive&&(g.bounces[team]===0||id!==g.serveReceiver))return;
      const plan=brain.plan,p=g.players[id],distance=Math.hypot(g.ball.x-p.x,g.ball.z-p.z),strain=clamp(distance-.55,0,1)+brain.fatigue*.3+this.pressure()*.12;
      const error=plan.error*(.6+strain);const x=plan.x+g.gaussian()*error,z=plan.z+g.gaussian()*error;
      this.transition(brain,'Perform Action');g.serveActive=false;g.launch(id,x,z,plan.power,plan.kind);brain.cooldown=g.time+levels.cooldown;
      const record={key:plan.key,lane:plan.lane,kind:plan.kind,power:plan.power,team};brain.history.push(record);brain.history=brain.history.slice(-8);this.history.push(record);this.history=this.history.slice(-12);brain.plan=null;
    }
    step(dt){const g=this.game;if(g.mode!=='rally'){this.rallyStart=null;for(const b of this.brains)b.fatigue=Math.max(0,b.fatigue-dt*.12);return;}
      if(this.rallyStart===null)this.rallyStart=g.time;
      for(let id=0;id<4;id++){const b=this.brains[id],p=g.players[id];b.fatigue=clamp(b.fatigue+dt*(Math.hypot(p.vx,p.vz)*.0025+.0015),0,1);}
      // Neutral replay is a final safety net, never an assigned winner.
      if(g.rallyHits>=100||g.time-this.rallyStart>=150){g.cancelAllShots();g.pendingAward=null;g.mode='between';g.countdown=2.5;g.retry=true;this.rallyStart=null;this.safeguardCount++;g.emit('point','Long rally · replay','No point awarded. Serve again.');}
    }
  }
  window.RallyTactics=RallyTactics;
})();



