
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),source=fs.readFileSync(path.resolve(__dirname,'../src/mobile-ui.js'),'utf8').split("window.addEventListener('blur',resetTouch);")[0];
const nodes={};function $(id){return nodes[id]||=( {dataset:{},style:{},classList:{add(){},remove(){}},handlers:{},getBoundingClientRect:()=>({left:0,top:0,width:128,height:128}),addEventListener(type,fn){this.handlers[type]=fn;},setPointerCapture(){}});}
let hits=[],releases=0,cancels=0;const game={controlled:0,beginShot:(id,kind)=>hits.push(kind),releaseShot:()=>releases++,cancelShot:()=>cancels++},document={body:{classList:{toggle(){}}}},navigator={userAgent:'Android'},location={search:'?touch=1'};
const api=new Function('$','game','document','navigator','location','URLSearchParams','let keys={};const clearLocalInputs=()=>{},audioStart=()=>{};'+source+';return {touch,resetTouch};')($,game,document,navigator,location,URLSearchParams);
const fire=(id,type,pointerId,x=64,y=64)=>$(id).handlers[type]({pointerId,clientX:x,clientY:y,currentTarget:$(id),preventDefault(){}});
fire('joystick','pointerdown',1,120,64);assert.ok(api.touch.x>.9);
fire('touch-hit','pointerdown',2);assert.ok(api.touch.drive&&api.touch.x>.9);assert.deepEqual(hits,['drive']);
fire('touch-hit','pointerup',2);assert.equal(api.touch.drive,false);assert.ok(api.touch.x>.9);
fire('joystick','pointercancel',1);assert.equal(api.touch.x,0);
fire('touch-lob','pointerdown',3);assert.ok(api.touch.lob);api.resetTouch();assert.equal(api.touch.lob,false);
fire('touch-lob','pointerdown',4);assert.ok(api.touch.lob);assert.equal(hits.length,3);
console.log('PASS simultaneous joystick + shot, independent release, pointer cancellation and pause recovery');

fire('touch-lob','pointercancel',4);assert.equal(releases,1);assert.equal(cancels,1);
