import {test,expect} from '@playwright/test';
test.use({launchOptions:{args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']}});
test('unified prototype produces frames and can return to reference and observation',async({page})=>{const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?unified=1');await expect(page.locator('.aqua-loading')).toBeHidden({timeout:60000});const b=page.locator('#unifiedRenderer');await expect(b).toHaveAttribute('aria-pressed','true');await expect(b).toHaveAttribute('data-frames',/^[1-9]/,{timeout:30000});await expect(page.locator('#gpuHabitat')).toBeHidden();await b.click();await expect(b).toHaveAttribute('aria-pressed','false');await expect(page.locator('#gpuHabitat')).toBeVisible();await b.click();await expect(b).toHaveAttribute('aria-pressed','true');await page.locator('#inspect').click();await expect(b).toHaveAttribute('aria-pressed','false');await page.locator('#inspect').click();await page.locator('#inspect').click();await expect(b).toHaveAttribute('aria-pressed','true');expect(errors).toEqual([]);});
test('ordered scene blends translucent foreground over rear fish but not front fish',async({page})=>{
 await page.goto('/');
 const {readFile}=await import('node:fs/promises');const read=n=>readFile(new URL('../src/engine/'+n,import.meta.url),'utf8');
 const sources=await Promise.all(['livingVegetation.js','parallaxScene.js','gpuLivingScene.js'].map(read));
 const result=await page.evaluate(async([plant,scene,gpu])=>{
  const urls=[];const blob=s=>{const u=URL.createObjectURL(new Blob([s],{type:'text/javascript'}));urls.push(u);return u;};
  const a=blob(plant),b=blob(scene.replace("'./livingVegetation.js'",JSON.stringify(a))),u=blob(gpu.replace("'./livingVegetation.js'",JSON.stringify(a)).replace("'./parallaxScene.js'",JSON.stringify(b)));
  const {createLivingRenderer}=await import(u),w=64,h=32,make=(width,height)=>Object.assign(document.createElement('canvas'),{width,height});
  const water=make(w,h);water.getContext('2d').fillRect(0,0,w,h);
  const c=make(w+36,h+36),ctx=c.getContext('2d');ctx.fillStyle='rgba(255,0,0,.5)';ctx.fillRect(18,18,w,h);ctx.clearRect(18+22,18,8,h);
  const sprites=[{l:{id:'leaf',asset:'wood',x:0,y:0,w,h,z:.9},c}];
  const out=make(w,h),gl=out.getContext('webgl',{alpha:true,depth:true,antialias:false,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL unavailable');
  const renderer=createLivingRenderer(gl,{w,h,sprites,water,optics:{}});const seen=[];
  const fish=[{id:'rear',z:.85,x:0},{id:'front',z:.95,x:32}];
  renderer.draw({x:0,y:0,dw:w,dh:h},[0,0],w,h,{time:0,flow:0,wakes:[0]},null,{fish,occlusion:true,night:0,drawFish:batch=>{gl.enable(gl.SCISSOR_TEST);for(const f of batch){seen.push(f.id);gl.scissor(f.x,0,32,h);gl.clearColor(0,1,0,1);gl.clear(gl.COLOR_BUFFER_BIT);}gl.disable(gl.SCISSOR_TEST);}});
  const pixel=x=>{const p=new Uint8Array(4);gl.readPixels(x,16,1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);return [...p];};
  const result={rear:pixel(12),gap:pixel(25),front:pixel(48),seen};renderer.dispose();urls.forEach(x=>URL.revokeObjectURL(x));return result;
 },sources);
 expect(result.seen).toEqual(['rear','front']);expect(result.rear[0]).toBeGreaterThanOrEqual(126);expect(result.rear[0]).toBeLessThanOrEqual(129);expect(result.rear[1]).toBeGreaterThanOrEqual(126);expect(result.rear[1]).toBeLessThanOrEqual(129);expect(result.gap).toEqual([0,255,0,255]);expect(result.front).toEqual([0,255,0,255]);
});
