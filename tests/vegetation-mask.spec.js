import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('authored matte aligns with native photograph and keeps water gaps open',async({page})=>{
 const photo=await readFile(new URL('../src/assets/natural-tank.jpg',import.meta.url));
 await page.goto('/');
 const result=await page.evaluate(async(photoData)=>{
  const load=async src=>{const im=new Image();im.src=src;await im.decode();return im;};
  const [mask,photo]=await Promise.all([load('/natural-leaf-mask.svg'),load(photoData)]);
  const c=document.createElement('canvas');c.width=photo.naturalWidth;c.height=photo.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(mask,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
  const alpha=(x,y)=>data[(y*c.width+x)*4+3];
  let partial=0;for(let i=3;i<data.length;i+=4)if(data[i]>0&&data[i]<255)partial++;
  return {mask:[mask.naturalWidth,mask.naturalHeight],photo:[photo.naturalWidth,photo.naturalHeight],solid:[[290,194],[270,202],[275,365],[305,355],[1386,580],[1340,518],[1550,300]].map(p=>alpha(...p)),water:[[375,360],[1000,450],[600,300],[400,280],[1260,300]].map(p=>alpha(...p)),partial};
 },'data:image/jpeg;base64,'+photo.toString('base64'));
 expect(result.mask).toEqual([1672,941]);expect(result.photo).toEqual(result.mask);
 expect(result.solid).toEqual(Array(7).fill(255));expect(result.water).toEqual(Array(5).fill(0));expect(result.partial).toBeGreaterThan(1000);
});
