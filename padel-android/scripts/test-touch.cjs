
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
// Exercise a second touch on the actual swipe listeners while the stick stays held.
{
const source=fs.readFileSync(path.resolve(__dirname,'../src/gesture-ui.js'),'utf8'),snippet=source.slice(source.indexOf('renderer.domElement.style.touchAction'),source.indexOf('function estimateGesture')),events={},renderer={domElement:{style:{},addEventListener:(key,fn)=>events[key]=fn,setPointerCapture(){}}};let shots=0;
Object.assign(game,{mode:'rally',ball:{x:0},players:[{x:0,z:6}],commitGesture(){shots++;return true;},setMoveTarget(){}});
new Function('renderer','game','window','document','performance','let swipe=null,swipeFeedback=null;const landingArea={visible:false},audioStart=()=>{},liveGesture=()=>true,gestureView=()=>({id:0}),gesturePoint=()=>null,swipeSample=e=>e.result,cancelSwipe=()=>{swipe=null;},estimateGesture=()=>({x:0,z:-6}),selectGestureShot=()=>{};'+snippet)(renderer,game,{addEventListener(){}},{addEventListener(){}},{now:()=>0});
fire('joystick','pointerdown',10,120,64);const gesture={pointerId:11,button:0,clientX:400,clientY:200,timeStamp:10,preventDefault(){},result:{valid:true,forward:1,power:.58,kind:'drive',aim:{x:1,z:-6}}};events.pointerdown(gesture);events.pointerup(gesture);assert.equal(shots,1);assert.ok(api.touch.x>.9);fire('joystick','pointercancel',10);assert.equal(api.touch.x,0);events.pointerup(gesture);assert.equal(shots,1);console.log('PASS simultaneous joystick and swipe use independent pointer captures');
}
