import {buildParallaxScene} from './parallaxScene.js';
let scene=null;
self.onmessage=async({data:m})=>{
 try{
  if(m.type==='init'){
   const res=await fetch(m.base+'scene.json');if(!res.ok)throw Error('manifest '+res.status);
   const manifest=await res.json();
   scene=await buildParallaxScene(manifest,async id=>{const res=await fetch(m.base+id+'.webp');if(!res.ok)throw Error('asset '+id);return createImageBitmap(await res.blob());},()=>new OffscreenCanvas(1,1));
   postMessage({type:'ready'});return;
  }
  if(m.type==='reset'){if(scene)scene.commit(scene.stage(0,0,[],false));return;}
  if(m.type!=='frame'||!scene)return;
  const next=scene.stage(m.time,m.flow,m.fish,true,m.interval);
  if(!next){postMessage({type:'skip',id:m.id,epoch:m.epoch});return;}
  // Ownership moves to UI; canvases themselves remain reusable on worker.
  const far=next.far.transferToImageBitmap(),planes=next.planes.map(p=>({z:p.z,canvas:p.canvas.transferToImageBitmap()})),packed=next.packed.slice();
  scene.commit(next);
  postMessage({type:'frame',id:m.id,epoch:m.epoch,frame:{external:true,far,planes,packed,maskW:next.maskW,maskH:next.maskH,stats:{...scene.stats}}},[far,...planes.map(p=>p.canvas),packed.buffer]);
 }catch(error){postMessage({type:'error',message:String(error)});}
};