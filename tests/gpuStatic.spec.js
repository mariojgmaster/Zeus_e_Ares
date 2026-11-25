import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test.use({launchOptions:{args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']}});
test('GPU static synthetic color, alpha and orientation parity',async({page})=>{
 await page.goto('/');const source=await readFile(new URL('../src/engine/gpuStaticScene.js',import.meta.url),'utf8');
 const result=await page.evaluate(async source=>{const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));const {createGpuStaticScene,comparePixels}=await import(url);URL.revokeObjectURL(url);
 const canvas=()=>Object.assign(document.createElement('canvas'),{width:8,height:8});const far=canvas(),f=far.getContext('2d');f.fillStyle='#122f38';f.fillRect(0,0,8,8);
 const planes=[.83,.90,.97,1.065].map((z,i)=>{const c=canvas(),g=c.getContext('2d');g.fillStyle=['rgba(255,0,0,.5)','rgba(0,255,0,.25)','rgba(0,0,255,.75)','rgba(255,255,0,.5)'][i];g.fillRect(i,0,4,3+i);return {z,canvas:c};});
 const out=canvas(),gl=out.getContext('webgl',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true});if(!gl)throw Error('WebGL required in GPU test');
 const gpu=createGpuStaticScene(gl,{far,planes}),ref=canvas(),g=ref.getContext('2d');g.drawImage(far,0,0);const expected=new Uint8Array(256);for(let i=0;i<4;i++){g.drawImage(planes[i].canvas,0,0);const a=planes[i].canvas.getContext('2d').getImageData(0,0,8,8).data;for(let j=0;j<64;j++)expected[j*4+i]=a[j*4+3];}gpu.draw({x:0,y:0,dw:8,dh:8},[0,0],8,8);
 const copy=canvas(),ctx=copy.getContext('2d');ctx.drawImage(out,0,0);const color=comparePixels(g.getImageData(0,0,8,8).data,ctx.getImageData(0,0,8,8).data),mask=comparePixels(expected,gpu.diagnosticMask(),1);const stats={...gpu.stats};gpu.dispose();return {color,mask,stats};},source);
 expect(result.mask.max).toBeLessThanOrEqual(1);expect(result.color.max).toBeLessThanOrEqual(3);expect(result.stats).toEqual({uploads:5,maskBuilds:1,compositions:1});
});
for(const viewport of [{width:1280,height:720},{width:390,height:844}]){
 test('real static scene parity and A/B '+viewport.width,async({page})=>{
  await page.setViewportSize(viewport);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?gpuParity=1');const b=page.locator('#gpuStatic'),v=page.locator('#vegetation');
  await expect(b).toBeEnabled({timeout:30000});const live=page.locator('#gpuLiving');if(await live.getAttribute('aria-pressed')==='true')await live.click();await expect(b).toHaveAttribute('aria-pressed','false');await b.click();await expect(b).toHaveAttribute('data-parity',/color/,{timeout:30000});const p=JSON.parse(await b.getAttribute('data-parity'));expect(p.mask.max).toBeLessThanOrEqual(1);expect(p.color.mean).toBeLessThan(2.5);expect(p.color.fraction).toBeLessThan(.035);
  await expect(v).toBeDisabled();await expect(v).toHaveAttribute('aria-pressed','false');await page.mouse.move(20,30);await page.locator('#night').click();await page.locator('#inspect').click();await expect(page.locator('#rotate')).toBeVisible();await page.locator('#inspect').click();await page.locator('#inspect').click();await b.click();await expect(v).toBeEnabled();await expect(b).toHaveAttribute('aria-pressed','false');expect(errors).toEqual([]);
 });
}
