import {test,expect} from '@playwright/test';
test('integrated parallax loads and switches to both legacy scenes',async({page})=>{
 const errors=[];const missing=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/parallax/')&&!r.ok())missing.push(r.url());});
 await page.goto('/');
 const habitat=page.locator('#habitatMode');
 await expect(habitat).toHaveText('Cenário: Parallax',{timeout:30000});
 await page.waitForFunction(()=>performance.getEntriesByType('resource').filter(e=>/\/parallax\/.*\.webp$/.test(e.name)).length===12);
 await habitat.click();await expect(habitat).toHaveText('Cenário: Natural');
 await habitat.click();await expect(habitat).toHaveText('Cenário: Clássico');
 await habitat.click();await expect(habitat).toHaveText('Cenário: Parallax');
 await page.locator('#optics').click();await page.locator('#night').click();
 expect(missing).toEqual([]);expect(errors).toEqual([]);
});
test('built assets preserve exact four-plane coverage and independent optics',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{const m=await (await fetch('/parallax/scene.json')).json();const ids=[...new Set(m.layers.map(l=>l.asset)),'water','surface'];const loaded=await Promise.all(ids.map(id=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>res([im.naturalWidth,im.naturalHeight]);im.onerror=rej;im.src='/parallax/'+id+'.webp';})));return {instances:m.layers.length,planes:[...new Set(m.layers.map(l=>l.z))].length,loaded:loaded.length,enabled:m.waterOptics.enabled};});
 expect(result).toEqual({instances:24,planes:5,loaded:12,enabled:true});
});

test('vegetation A/B and flow controls are independent and respect reduced motion',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 const v=page.locator('#vegetation'),flow=page.locator('#flow');
 await expect(page.locator('#habitatMode')).toHaveText('Cenário: Parallax',{timeout:30000});
 await expect(v).toHaveAttribute('aria-pressed','false');await v.click();await expect(v).toHaveAttribute('aria-pressed','true');
 await flow.click();await expect(flow).toHaveAttribute('aria-pressed','false');await expect(v).toHaveAttribute('aria-pressed','true');
 await v.click();await expect(v).toHaveAttribute('aria-pressed','false');expect(errors).toEqual([]);
});
