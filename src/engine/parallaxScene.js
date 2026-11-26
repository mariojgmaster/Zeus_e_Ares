import {plantProfile,wakeTarget,advanceWake,drawBentPlant} from './livingVegetation.js';
// Aqua Eterna — independent photographic planes. Greater z is nearer the glass.
export const PLANES=[.83,.90,.97,1.065];
export const CAMERA_FACTORS=PLANES.map(z=>(z-.70)/.365);
export function cameraFactor(z){return (z-.70)/.365;}
export function samplePacked(map,w,h,u,v,channel){
 if(!map||u<0||v<0||u>=1||v>=1)return 0;
 const x=Math.max(0,Math.min(w-1,u*w-.5)),y=Math.max(0,Math.min(h-1,v*h-.5)),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,nx=Math.min(w-1,ix+1),ny=Math.min(h-1,iy+1);
 const a=map[(iy*w+ix)*4+channel],b=map[(iy*w+nx)*4+channel],c=map[(ny*w+ix)*4+channel],d=map[(ny*w+nx)*4+channel];return ((a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy)/255;
}
export function planeVisibility(map,w,h,u,v,z,shift=[0,0]){
 let vis=1;const planes=[.83,.90,.97,1.065];for(let i=0;i<4;i++){if(z<planes[i]){const k=(planes[i]-.70)/.365;vis*=1-samplePacked(map,w,h,u-shift[0]*k,v-shift[1]*k,i);}}return vis;
}
export function contactPlane(map,w,h,rect,proxies,i,padding=0){
 const {x,y,dw,dh}=rect;for(const q of proxies){const r=q.r+padding;for(const [a,b] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]])if(samplePacked(map,w,h,(q.x+a*r-x)/dw,(q.y+b*r-y)/dh,i)>.45)return true;}return false;
}
// No positional snap: only disallow the part of a proposed depth step that would cross a solid plane.
export function guardDepthStep(z,next,blocked){for(let i=0;i<PLANES.length;i++){const p=PLANES[i];if(!((z<p&&next>=p)||(z>=p&&next<p)))continue;if(!blocked(i))continue;if(z<p&&next>=p)return Math.min(next,Math.max(z,p-.006));if(z>=p&&next<p)return Math.max(next,Math.min(z,p+.006));}return next;}
export function drawLayer(ctx,im,l){ctx.save();ctx.globalAlpha=l.opacity??1;ctx.filter=`saturate(${l.saturation??1}) contrast(${l.contrast??1}) brightness(${l.shade??1}) blur(${l.blur??0}px)`;if(l.flip){ctx.translate(l.x+l.w,l.y);ctx.scale(-1,1);ctx.drawImage(im,0,0,l.w,l.h);}else ctx.drawImage(im,l.x,l.y,l.w,l.h);ctx.restore();}
// Dynamic alpha is sampled at half resolution; the photographic planes stay native.
export function dynamicMaskSize(w,h){return {maskW:Math.ceil(w/2),maskH:Math.ceil(h/2)};}
export function packAlpha(target,rgba,channel){for(let i=channel,j=3;j<rgba.length;i+=4,j+=4)target[i]=rgba[j];}
export function vegetationInterval(base,cost){return Math.min(.16,Math.max(base,Math.max(0,cost)/1000*4));}
export async function buildParallaxScene(manifest,load){
 const {width:w,height:h,layers}=manifest;const ids=[...new Set(layers.map(l=>l.asset))];const assets=Object.fromEntries(await Promise.all(ids.map(async id=>[id,await load(id)])));const water=await load('water');const optics=manifest.waterOptics??{};const surface=optics.enabled?await load('surface'):null;
 const make=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};const far=make(),farCtx=far.getContext('2d');const grade=manifest.waterGrade??{};farCtx.filter=`saturate(${grade.saturation??1}) contrast(${grade.contrast??1}) brightness(${grade.brightness??1})`;farCtx.drawImage(water,0,0,w,h);farCtx.filter='none';
 const planes=PLANES.map(z=>({z,canvas:make()}));for(const l of [...layers].sort((a,b)=>a.z-b.z)){const c=planes.find(p=>p.z===l.z)?.canvas??far;drawLayer(c.getContext('2d'),assets[l.asset],l);}
 const packed=new Uint8Array(w*h*4);for(let i=0;i<planes.length;i++){const rgba=planes[i].canvas.getContext('2d').getImageData(0,0,w,h).data;for(let p=0;p<w*h;p++)packed[p*4+i]=rgba[p*4+3];}
 // Apply color scattering only after the alpha maps are captured. Source-atop preserves alpha.
 if(optics.enabled){for(const [i,p] of planes.entries()){const g=p.canvas.getContext('2d');g.save();g.globalCompositeOperation='source-atop';g.fillStyle=`rgba(39,101,99,${[.14,.10,.065,.032][i]})`;g.fillRect(0,0,w,h);g.restore();}farCtx.fillStyle='rgba(34,91,91,.16)';farCtx.fillRect(0,0,w,h);}
 // Keep the homologated static scene as an exact A/B reference.
 const baseline={far,planes,packed,maskW:w,maskH:h};let active=baseline,spare=null,updatedAt=-Infinity;
 const {maskW,maskH}=dynamicMaskSize(w,h),maskCanvas=document.createElement('canvas');maskCanvas.width=maskW;maskCanvas.height=maskH;const maskCtx=maskCanvas.getContext('2d',{willReadFrequently:true});
 const stats={stageMs:0,maskMs:0,updates:0,bytes:packed.byteLength,interval:0};
 const sorted=[...layers].sort((a,b)=>a.z-b.z),pad=18,wakes=new Map();
 const sprites=sorted.map(l=>{const c=document.createElement('canvas');c.width=Math.ceil(l.w)+2*pad;c.height=Math.ceil(l.h)+2*pad;drawLayer(c.getContext('2d'),assets[l.asset],{...l,x:pad,y:pad});return {l,c};});
 // Consecutive static objects at each depth are rasterized once, preserving layer order.
 let batches=null;
 function prepareFallback(){if(batches)return;batches=[];
 for(const item of sprites){const {l,c}=item;if(plantProfile(l.asset)){batches.push(item);continue;}
  const last=batches[batches.length-1];if(last?.static&&last.z===l.z){last.ctx.drawImage(c,l.x-pad,l.y-pad);continue;}
  const canvas=make(),ctx=canvas.getContext('2d');ctx.drawImage(c,l.x-pad,l.y-pad);batches.push({static:true,z:l.z,canvas,ctx});
 }}
 const makeFrame=()=>({far:make(),planes:PLANES.map(z=>({z,canvas:make()})),maskW,maskH,packed:new Uint8Array(maskW*maskH*4)});
 const waterBase=make(),wb=waterBase.getContext('2d');wb.filter=`saturate(${grade.saturation??1}) contrast(${grade.contrast??1}) brightness(${grade.brightness??1})`;wb.drawImage(water,0,0,w,h);
 function stage(time,flow,fish,enabled=true,interval=.075){
  if(!enabled){wakes.clear();updatedAt=-Infinity;return active===baseline?null:baseline;}
  interval=vegetationInterval(interval,stats.stageMs);stats.interval=interval;if(time-updatedAt<interval)return null;
  const start=performance.now();prepareFallback();
  const dt=Number.isFinite(updatedAt)?Math.min(.35,time-updatedAt):.075;updatedAt=time;
  const next=spare??makeFrame();spare=null;
  const fc=next.far.getContext('2d');fc.clearRect(0,0,w,h);fc.drawImage(waterBase,0,0);
  for(const p of next.planes)p.canvas.getContext('2d').clearRect(0,0,w,h);
  for(const item of batches){
   if(item.static){const g=(next.planes.find(p=>p.z===item.z)?.canvas??next.far).getContext('2d');g.drawImage(item.canvas,0,0);continue;}
   const {l,c}=item,g=(next.planes.find(p=>p.z===l.z)?.canvas??next.far).getContext('2d');
   const wake=advanceWake(wakes.get(l.id)??0,wakeTarget(l,fish),dt);wakes.set(l.id,wake);drawBentPlant(g,c,l,time,flow,wake,pad);
  }
  const maskStart=performance.now();
  for(const [i,p] of next.planes.entries()){
   const g=p.canvas.getContext('2d');maskCtx.clearRect(0,0,maskW,maskH);maskCtx.drawImage(p.canvas,0,0,maskW,maskH);packAlpha(next.packed,maskCtx.getImageData(0,0,maskW,maskH).data,i);
   if(optics.enabled){g.save();g.globalCompositeOperation='source-atop';g.fillStyle=`rgba(39,101,99,${[.14,.10,.065,.032][i]})`;g.fillRect(0,0,w,h);g.restore();}
  }
  if(optics.enabled){fc.fillStyle='rgba(34,91,91,.16)';fc.fillRect(0,0,w,h);}
  stats.maskMs=performance.now()-maskStart;const elapsed=performance.now()-start;stats.stageMs=stats.updates?stats.stageMs*.8+elapsed*.2:elapsed;stats.updates++;return next;
 }
 const scene={w,h,far,planes,packed,staticSource:baseline,livingSource:{w,h,sprites,water:waterBase,optics},maskW:w,maskH:h,stats,layers,assets,surface,optics,stage,commit(next){if(!next||next===active)return false;if(active!==baseline)spare=active;active=next;scene.far=next.far;scene.planes=next.planes;scene.packed=next.packed;scene.maskW=next.maskW;scene.maskH=next.maskH;stats.bytes=next.packed.byteLength;return true;},drawOptics(ctx,rect,time=0,strength=1,night=0,cache=null){if(optics.enabled)drawWaterOptics(ctx,rect,surface,time,strength,night,optics,cache);},draw(ctx,rect,shift=[0,0]){const {x,y,dw,dh}=rect;ctx.drawImage(active.far,x,y,dw,dh);for(const p of active.planes){const k=cameraFactor(p.z);ctx.drawImage(p.canvas,x+shift[0]*dw*k,y+shift[1]*dh*k,dw,dh);}}};return scene;
}
export async function loadParallaxScene(base){const url=base.replace(/\/?$/,'/');const res=await fetch(url+'scene.json');if(!res.ok)throw Error('Parallax manifest unavailable');const manifest=await res.json();return buildParallaxScene(manifest,id=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Missing parallax asset '+id));im.src=url+id+'.webp';}));}

// Separate optical pass: never used for collision, depth, or fish scale.
export function opticalStrength(strength=1,night=0){return Math.max(0,Math.min(1,strength))*(1-.89*Math.max(0,Math.min(1,night)));}
export function drawWaterOptics(ctx,rect,surface,time=0,strength=1,night=0,config={},cache=null){
 const a=opticalStrength(strength,night);if(a<.002)return;
 const {x,y,dw,dh}=rect;ctx.save();ctx.translate(x,y);ctx.scale(dw,dh);ctx.beginPath();ctx.rect(0,0,1,1);ctx.clip();
 // Clear water scattering, not a uniform fog blanket.
 if(cache)cache.drawSoft(ctx,a,config);else{const veil=ctx.createLinearGradient(0,0,0,1);veil.addColorStop(0,`rgba(86,151,144,${a*(config.veil??.09)})`);veil.addColorStop(.46,`rgba(49,107,110,${a*.072})`);veil.addColorStop(1,`rgba(18,62,68,${a*.025})`);ctx.fillStyle=veil;ctx.fillRect(0,0,1,1);
 // Broad soft light from the tank lamp; rays drift without moving the scene silhouettes.
 const glow=ctx.createRadialGradient(.51,.015,0,.51,.015,.61);glow.addColorStop(0,`rgba(192,231,208,${a*.19})`);glow.addColorStop(.28,`rgba(144,202,188,${a*.085})`);glow.addColorStop(1,'rgba(93,157,156,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,1,1);}
 const rays=[[.39,.072,.57,-.25],[.48,.057,.76,-.14],[.54,.045,.63,.13],[.60,.069,.73,.21],[.72,.053,.48,.32],[.31,.044,.43,-.32]];
 for(let i=0;i<rays.length;i++){const [cx,width,length,angle]=rays[i],sway=Math.sin(time*.26+i*1.71)*.011;ctx.save();ctx.translate(cx+sway,.02);ctx.transform(1,0,angle+Math.sin(time*.19+i)*.035,1,0,0);ctx.scale(width,length);if(cache)cache.drawRay(ctx,a,config,.21+.036*Math.sin(time*.7+i));else{const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(177,219,198,${a*(config.rays??.68)*(.21+.036*Math.sin(time*.7+i))})`);g.addColorStop(.38,`rgba(140,202,188,${a*(config.rays??.68)*.12})`);g.addColorStop(1,'rgba(108,175,169,0)');ctx.fillStyle=g;ctx.fillRect(-1,0,2,1);}ctx.restore();}
 // Real surface detail, softly faded and slowly shifted. The texture is mirrored at its edges.
 if(surface){ctx.globalAlpha=a*(config.surface??.86);const off=Math.sin(time*.24)*.009;for(let i=-1;i<=1;i++)ctx.drawImage(surface,off+i,0,1,.087);ctx.globalAlpha=1;}
 // Sparse fine motes caught by light; deterministic trajectories and no abrupt resets in view.
 for(let i=0;i<42;i++){const px=((i*.61803398875+.003*Math.sin(time*.23+i))%1+1)%1,py=((i*.38196601125-time*(.0015+(i%4)*.0005))%1+1)%1;const focus=Math.exp(-Math.pow((px-.52)*2.2,2))*(1-py*.73);const fade=Math.min(1,py*18,(1-py)*18);ctx.fillStyle=`rgba(190,222,208,${a*(config.particles??.45)*focus*fade*(.12+(i%3)*.075)})`;ctx.beginPath();ctx.ellipse(px,py,.00042+(i%3)*.00013,.00070+(i%3)*.00020,0,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
