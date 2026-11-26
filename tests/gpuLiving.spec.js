import {test,expect} from '@playwright/test';
test.use({launchOptions:{args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']}});
test('GPU living and single habitat',async({page})=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');const live=page.locator('#gpuLiving');await expect(live).toHaveAttribute('data-frames',/^[1-9]/,{timeout:45000});await expect(page.locator('#gpuHabitat')).toBeVisible();await expect(live).toHaveAttribute('aria-pressed','true');await page.locator('#vegetation').click();await expect(page.locator('#gpuHabitat')).toBeVisible();await page.locator('#inspect').click();await expect(page.locator('#gpuHabitat')).toBeHidden();await page.locator('#inspect').click();await page.locator('#inspect').click();await expect(page.locator('#gpuHabitat')).toBeVisible();expect(errors).toEqual([]);});
// Test the actual framebuffer path, not merely the rectangle math.
test('bounded GPU mask equals full mask inside all requested regions',async({page})=>{
 await page.goto('/');
 // Vite dev/preview serve modules differently; use the same original source as a blob module,
 // replacing only its imports with the exact dependency source blobs.
 const {readFile}=await import('node:fs/promises');
 const read=name=>readFile(new URL('../src/engine/'+name,import.meta.url),'utf8');
 const sources=await Promise.all(['livingVegetation.js','parallaxScene.js','gpuLivingScene.js'].map(read));
 const result=await page.evaluate(async([plant,parallax,gpu])=>{
  const urls=[];const blob=s=>{const u=URL.createObjectURL(new Blob([s],{type:'text/javascript'}));urls.push(u);return u;};
  const p=blob(plant),q=blob(parallax.replace("'./livingVegetation.js'",JSON.stringify(p))),u=blob(gpu.replace("'./livingVegetation.js'",JSON.stringify(p)).replace("'./parallaxScene.js'",JSON.stringify(q)));
  const {createLivingRenderer,maskRegions}=await import(u);
  const w=160,h=100,make=(width,height)=>Object.assign(document.createElement('canvas'),{width,height});
  const sprites=[.83,.9,.97,1.065].flatMap((z,j)=>[0,1].map(i=>{const c=make(106,96),g=c.getContext('2d');g.fillStyle=i?'rgba(0,255,0,.65)':'rgba(255,0,0,.45)';g.fillRect(18,18,70,60);g.clearRect(36,30,12,14);return {l:{id:'p'+j+i,asset:'sprouts',x:12+i*60,y:10+j*2,w:70,h:60,z},c};}));
  const canvas=make(w,h),gl=canvas.getContext('webgl',{alpha:true,antialias:false});if(!gl)throw Error('WebGL unavailable');const renderer=createLivingRenderer(gl,{w,h,sprites,water:make(w,h),optics:{}},true);
  const rect={x:0,y:0,dw:w,dh:h},shift=[.005,-.003],pose={time:3,flow:.8,wakes:sprites.map((_,i)=>i%2?.4:-.4)};
  const regions=maskRegions([{x:80,y:48,z:.87,width:12}],rect,shift,w,h);
  renderer.draw(rect,shift,w,h,pose);const full=renderer.diagnosticMask();
  renderer.draw(rect,shift,w,h,pose,regions);const roi=renderer.diagnosticMask();let max=0,n=0;
  regions.forEach((r,i)=>{if(!r)return;for(let y=r[1];y<r[1]+r[3];y++)for(let x=r[0];x<r[0]+r[2];x++){const at=(y*w+x)*4+i;max=Math.max(max,Math.abs(full[at]-roi[at]));n++;}});
  const pixels=renderer.stats.maskPixels;renderer.dispose();urls.forEach(x=>URL.revokeObjectURL(x));return {max,n,pixels,total:w*h*4};
 },sources);
 expect(result.n).toBeGreaterThan(0);expect(result.max).toBe(0);expect(result.pixels).toBeLessThan(result.total);
});

test('split GPU mask matches original inside individual fish bounds',async({page})=>{
 await page.goto('/');
 // Vite dev/preview serve modules differently; use the same original source as a blob module,
 // replacing only its imports with the exact dependency source blobs.
 const {readFile}=await import('node:fs/promises');
 const read=name=>readFile(new URL('../src/engine/'+name,import.meta.url),'utf8');
 const sources=await Promise.all(['livingVegetation.js','parallaxScene.js','gpuLivingScene.js'].map(read));
 const result=await page.evaluate(async([plant,parallax,gpu])=>{
  const urls=[];const blob=s=>{const u=URL.createObjectURL(new Blob([s],{type:'text/javascript'}));urls.push(u);return u;};
  const p=blob(plant),q=blob(parallax.replace("'./livingVegetation.js'",JSON.stringify(p))),u=blob(gpu.replace("'./livingVegetation.js'",JSON.stringify(p)).replace("'./parallaxScene.js'",JSON.stringify(q)));
  const {createLivingRenderer,maskRegions,smartMaskRegions}=await import(u);
  const w=320,h=100,make=(width,height)=>Object.assign(document.createElement('canvas'),{width,height});
  const sprites=[.83,.9,.97,1.065].flatMap((z,j)=>[0,1].map(i=>{const c=make(106,96),g=c.getContext('2d');g.fillStyle=i?'rgba(0,255,0,.65)':'rgba(255,0,0,.45)';g.fillRect(18,18,70,60);g.clearRect(36,30,12,14);return {l:{id:'p'+j+i,asset:'sprouts',x:12+i*60,y:10+j*2,w:70,h:60,z},c};}));
  const canvas=make(w,h),gl=canvas.getContext('webgl',{alpha:true,antialias:false});if(!gl)throw Error('WebGL unavailable');const renderer=createLivingRenderer(gl,{w,h,sprites,water:make(w,h),optics:{}},true);
  const rect={x:0,y:0,dw:w,dh:h},shift=[.005,-.003],pose={time:3,flow:.8,wakes:sprites.map((_,i)=>i%2?.4:-.4)};
  const fish=[{x:45,y:48,z:.87,width:8},{x:265,y:48,z:.87,width:8}];const regions=maskRegions(fish,rect,shift,w,h),split=smartMaskRegions(fish,rect,shift,w,h);
  renderer.draw(rect,shift,w,h,pose,regions);const full=renderer.diagnosticMask();const baselinePixels=renderer.stats.maskPixels;
  renderer.draw(rect,shift,w,h,pose,split);const roi=renderer.diagnosticMask();let max=0,n=0;
  split.forEach((rs,i)=>{if(!rs)return;for(const r of rs){for(let y=r[1];y<r[1]+r[3];y++)for(let x=r[0];x<r[0]+r[2];x++){const at=(y*w+x)*4+i;max=Math.max(max,Math.abs(full[at]-roi[at]));n++;}}});
  const pixels=renderer.stats.maskPixels;renderer.dispose();urls.forEach(x=>URL.revokeObjectURL(x));return {max,n,pixels,total:baselinePixels};
 },sources);
 expect(result.n).toBeGreaterThan(0);expect(result.max).toBe(0);expect(result.pixels).toBeLessThan(result.total);
});
