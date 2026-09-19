(() => {
  const abilities=['control','accuracy','timing','consistency','placement','defense','net','stamina','sweet','technique'];
  const keys=['rio','alex','classic'];
  class PlayerProgress {
    constructor(storage){this.storage=storage;this.data={};this.gains={};try{const saved=JSON.parse(storage?.getItem('padel-progress-v1')||'{}');for(const key of keys){this.data[key]={};for(const a of abilities)this.data[key][a]=Math.max(0,Math.min(100,Number(saved[key]?.[a])||0));}}catch{} }
    value(key,ability){return this.data[key]?.[ability]||0;}
    begin(){this.gains={};}
    award(key,weights){if(!keys.includes(key))return;this.data[key]??={};this.gains[key]??={};for(const a of abilities){const amount=Math.max(0,Math.min(2,Number(weights[a])||0));if(!amount)continue;const old=this.value(key,a),gain=Math.min(100-old,.16*amount/(1+old/12));this.data[key][a]=old+gain;this.gains[key][a]=(this.gains[key][a]||0)+gain;}try{this.storage?.setItem('padel-progress-v1',JSON.stringify(this.data));}catch{} }
  }
  window.PlayerProgress=PlayerProgress;window.PADEL_ABILITIES=abilities;
})();
