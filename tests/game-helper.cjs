const fs=require('fs'),vm=require('vm');
function load(){const ctx={window:{},Math:Object.create(Math)};let seed=1234;ctx.Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};vm.createContext(ctx);for(const m of fs.readFileSync('public/index.html','utf8').matchAll(/<script>([\s\S]*?)<\/script>/g))if(/class (PadelGame|ClubGame|MotionGame|SimpleGame|SkillGame|MobileGame)/.test(m[1]))vm.runInContext(m[1],ctx);return ctx.window;}
module.exports=load;
