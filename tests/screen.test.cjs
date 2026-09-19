const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
function fixture({portrait=false,reject=false}={}){
 const calls=[],elements={},events={};const $=id=>elements[id]??={hidden:false,addEventListener(){}};
 const document={fullscreenElement:null,hidden:false,documentElement:{async requestFullscreen(){calls.push('fullscreen');if(reject)throw Error('unsupported');document.fullscreenElement={};}},addEventListener:(type,fn)=>events[type]=fn};
 const game={mode:'rally',paused:false};const ctx={isPhone:true,document,screen:{orientation:{async lock(value){calls.push(value);}}},matchMedia:q=>({matches:q==='(orientation:portrait)'&&portrait}),$,game,resetTouch:()=>calls.push('reset'),pause:()=>{game.paused=true;calls.push('pause');},navigator:{},window:{addEventListener(){},padelSuspend:()=>calls.push('suspend')},location:{protocol:'http:'}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('padel-android/src/mobile-screen.js','utf8'),ctx);return {ctx,calls,elements,events,document};
}
test('Fullscreen gesture precedes landscape lock',async()=>{const f=fixture();await f.ctx.enterGameScreen();assert.deepEqual(f.calls,['fullscreen','landscape']);assert.equal(f.elements['fullscreen-play'].hidden,true);});
test('Unsupported fullscreen preserves a usable retry control',async()=>{const f=fixture({reject:true});await f.ctx.enterGameScreen();assert.equal(f.elements['fullscreen-play'].hidden,false);});
test('Portrait pauses play and clears held controls',()=>{const f=fixture({portrait:true});assert.deepEqual(f.calls,['reset','pause']);f.ctx.refreshGameScreen();assert.equal(f.calls.filter(c=>c==='pause').length,1);});
test('Backgrounding suspends the match',()=>{const f=fixture();f.document.hidden=true;f.events.visibilitychange();assert.deepEqual(f.calls,['suspend']);});
