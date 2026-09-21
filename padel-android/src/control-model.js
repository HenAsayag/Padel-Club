// Shared, dimensionless control and gameplay tuning. CSS pixels are normalized by
// the shorter gameplay viewport edge; devicePixelRatio never enters the gesture.
window.PADEL_TUNING={
  gesture:{tapDistance:.025,tapDuration:280,minSwipe:.035,maxDuration:1400,depthLength:.48,minDepth:2.5,maxDepth:8.8,minSpeed:.18,maxSpeed:2.0,inputBuffer:.30},
  movement:{arrival:.16,gain:2.4,acceleration:26,braking:32,run:5.2,max:6.1},
  contact:{reachRadius:1.55,grace:.12,lateRadius:1.95,stepDistance:.10,assistDistance:.45,assistDuration:.16,assistSpeed:3.4},
  power:{weak:.24,over:.86,maxSpread:.8},
  ai:{easy:{reaction:.27,speed:3.9,error:.27},normal:{reaction:.16,speed:4.9,error:.15},hard:{reaction:.085,speed:5.65,error:.075},decision:.20,cooldown:.26}
};
window.PadelGesture={
  sample(start,end,viewport){
    const t=window.PADEL_TUNING.gesture,unit=Math.max(1,Math.min(viewport.width,viewport.height)),dx=(end.x-start.x)/unit,dy=(end.y-start.y)/unit;
    const length=Math.hypot(dx,dy),duration=Math.max(16,end.time-start.time),speed=length/(duration/1000),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    return {tap:length<=t.tapDistance&&duration<=t.tapDuration,valid:length>=t.minSwipe&&duration<=t.maxDuration,direction:length?dx/length:0,forward:-dy,length,duration,
      depth:t.minDepth+(t.maxDepth-t.minDepth)*clamp(length/t.depthLength,0,1),power:clamp((speed-t.minSpeed)/(t.maxSpeed-t.minSpeed),0,1)};
  }
};
