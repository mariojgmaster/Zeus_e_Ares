import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plantProfile,plantOffset,wakeTarget,advanceWake} from '../src/engine/livingVegetation.js';
const plant={id:'fern-left',asset:'fern-left',x:100,y:100,w:300,h:600,z:.9};
test('roots remain fixed and solid assets never move',()=>{for(let t=0;t<20;t+=.25){assert.equal(plantOffset(plant,1,t,1,1),0);assert.equal(plantOffset({...plant,asset:'wood'},0,t,1,1),0);}});
test('vegetation has distinct phases, bounded displacement and calm water',()=>{assert.notEqual(plantOffset(plant,0,1,1),plantOffset({...plant,id:'fern-right'},0,1,1));assert.equal(plantOffset(plant,0,1,0),0);for(let t=0;t<20;t+=.1)assert.ok(Math.abs(plantOffset(plant,0,t,1,1))<24);assert.equal(plantProfile('gravel'),null);});
test('wake is local in XY and Z, speed dependent, signed and damped',()=>{const f={x:200,y:300,z:.91,vx:120};assert.ok(wakeTarget(plant,[f])>0);assert.ok(wakeTarget(plant,[{...f,vx:-120}])<0);assert.equal(wakeTarget(plant,[{...f,z:1.1}]),0);assert.equal(wakeTarget(plant,[{...f,x:700}]),0);assert.equal(wakeTarget(plant,[{...f,vx:0}]),0);const w=advanceWake(0,1,.1);assert.ok(w>0&&w<1);assert.ok(advanceWake(w,0,.1)<w);assert.ok(advanceWake(w,0,.1)>0);});

import {dynamicMaskSize,packAlpha,vegetationInterval} from '../src/engine/parallaxScene.js';
test('dynamic mask reduces bytes by approximately 75 percent',()=>{const {maskW,maskH}=dynamicMaskSize(1672,941);assert.deepEqual([maskW,maskH],[836,471]);assert.ok(maskW*maskH/(1672*941)<.251);});
test('packed alpha preserves channels and transparency',()=>{const p=new Uint8Array([1,2,3,4,5,6,7,8]);packAlpha(p,new Uint8Array([9,9,9,120,9,9,9,0]),2);assert.deepEqual([...p],[1,2,120,4,5,6,0,8]);});
test('adaptive update interval has a bounded cost response',()=>{assert.equal(vegetationInterval(.075,1),.075);assert.equal(vegetationInterval(.12,10),.12);assert.equal(vegetationInterval(.075,40),.16);assert.equal(vegetationInterval(.075,100),.16);});
test('24px strip interpolation preserves the 8px motion curve to subpixel error',()=>{for(const asset of ['stems-green','stems-red','fern-left','fern-right','anubias','sprouts'])for(const h of [134,455,850]){const l={...plant,asset,h};for(let t=0;t<10;t+=.5)for(let y=0;y<h;y+=8){const a=Math.floor(y/24)*24,b=Math.min(h,a+24);const approx=plantOffset(l,a/h,t,1,.5)+(plantOffset(l,b/h,t,1,.5)-plantOffset(l,a/h,t,1,.5))*(y-a)/(b-a);assert.ok(Math.abs(approx-plantOffset(l,y/h,t,1,.5))<.6);}}});
