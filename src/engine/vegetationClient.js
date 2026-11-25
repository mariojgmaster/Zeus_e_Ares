import {releaseParallaxFrame} from './parallaxScene.js';
// One request and at most one completed frame in flight. Never queue stale motion.
export function createVegetationWorker(base){
 let worker=null,state='starting',busy=false,readyFrame=null,epoch=0,seq=0,enabled=false,sentAt=performance.now(),lastRequest=-Infinity;
 function clear(){releaseParallaxFrame(readyFrame);readyFrame=null;}
 function fail(){state='fallback';busy=false;clear();worker?.terminate();worker=null;}
 try{
  if(typeof Worker!=='function'||typeof OffscreenCanvas!=='function')throw Error('OffscreenCanvas unavailable');
  worker=new Worker(new URL('./vegetationWorker.js',import.meta.url),{type:'module'});
  worker.onmessage=({data:m})=>{
   if(m.type==='error'){console.warn('Vegetation Worker:',m.message);fail();return;}
   if(m.type==='ready'){state='ready';return;}
   if(m.type==='frame'||m.type==='skip'){
    busy=false;if(m.epoch!==epoch||!enabled){releaseParallaxFrame(m.frame);return;}
    clear();readyFrame=m.frame??null;
   }
  };
  worker.onerror=fail;worker.onmessageerror=fail;
  worker.postMessage({type:'init',base:new URL(base,document.baseURI).href});
 }catch{fail();}
 return {
  get state(){return state;},
  setEnabled(value){if(value===enabled)return;enabled=value;epoch++;clear();lastRequest=-Infinity;if(!value&&worker&&state==='ready')worker.postMessage({type:'reset'});},
  request(time,flow,fish,interval){
   if((state==='starting'||busy)&&performance.now()-sentAt>12000)fail();
   if(state!=='ready'||!enabled||busy||readyFrame||time-lastRequest<interval)return;
   busy=true;sentAt=performance.now();lastRequest=time;
   try{worker.postMessage({type:'frame',id:++seq,epoch,time,flow,fish,interval});}catch{fail();}
  },
  take(){const f=readyFrame;readyFrame=null;return f;},
  dispose(){state='disposed';clear();worker?.terminate();worker=null;}
 };
}