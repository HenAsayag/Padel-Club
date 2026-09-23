// Shared, dimensionless control and gameplay tuning. CSS pixels are normalized by
// the shorter gameplay viewport edge; devicePixelRatio never enters the gesture.
window.PADEL_TUNING={
  gesture:{tapDistance:.025,tapDuration:280,minSwipe:.035,maxDuration:1400,depthLength:.64,minDepth:2.8,maxDepth:8.2,minSpeed:.12,powerFloor:.32,powerCeiling:.96,speedResponse:2.8,lateralReach:4.2,inputBuffer:.65},
  movement:{arrival:.16,gain:2.4,acceleration:38,braking:44,run:7.2,max:8.2,shuffle:.88,backpedal:.8},
  autoRun:{decision:.08,manualPause:.65,recoveryDepth:5.3},
  contact:{reachRadius:1.55,grace:.12,lateRadius:1.95,stepDistance:.10,assistDistance:.45,assistDuration:.16,assistSpeed:3.4},
  power:{weak:.24,over:.90,maxSpread:.8,overSpeed:.28,overLift:.07,driveBase:.74,driveDistance:.050,drivePower:.40,driveMinimum:.62,serveFlight:1.32,lobBase:2.0},
  ai:{easy:{reaction:.27,speed:4.15,error:.27},normal:{reaction:.16,speed:5.15,error:.15},hard:{reaction:.085,speed:5.9,error:.075},decision:.20,cooldown:.26}
};
window.PadelGesture={
  sample(start,end,viewport){
    const t=window.PADEL_TUNING.gesture,unit=Math.max(1,Math.min(viewport.width,viewport.height)),dx=(end.x-start.x)/unit,dy=(end.y-start.y)/unit;
    const length=Math.hypot(dx,dy),duration=Math.max(16,end.time-start.time),speed=length/(duration/1000),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    return {tap:length<=t.tapDistance&&duration<=t.tapDuration,valid:length>=t.minSwipe&&duration<=t.maxDuration,direction:length?dx/length:0,forward:-dy,length,duration,
      depth:t.minDepth+(t.maxDepth-t.minDepth)*clamp(length/t.depthLength,0,1),power:t.powerFloor+(t.powerCeiling-t.powerFloor)*(1-Math.exp(-Math.max(0,speed-t.minSpeed)/t.speedResponse))};
  }
};
