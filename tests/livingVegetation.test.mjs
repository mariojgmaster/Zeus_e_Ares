import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plantProfile,plantOffset,wakeTarget,advanceWake} from '../src/engine/livingVegetation.js';
const plant={id:'fern-left',asset:'fern-left',x:100,y:100,w:300,h:600,z:.9};
test('roots remain fixed and solid assets never move',()=>{for(let t=0;t<20;t+=.25){assert.equal(plantOffset(plant,1,t,1,1),0);assert.equal(plantOffset({...plant,asset:'wood'},0,t,1,1),0);}});
test('vegetation has distinct phases, bounded displacement and calm water',()=>{assert.notEqual(plantOffset(plant,0,1,1),plantOffset({...plant,id:'fern-right'},0,1,1));assert.equal(plantOffset(plant,0,1,0),0);for(let t=0;t<20;t+=.1)assert.ok(Math.abs(plantOffset(plant,0,t,1,1))<24);assert.equal(plantProfile('gravel'),null);});
test('wake is local in XY and Z, speed dependent, signed and damped',()=>{const f={x:200,y:300,z:.91,vx:120};assert.ok(wakeTarget(plant,[f])>0);assert.ok(wakeTarget(plant,[{...f,vx:-120}])<0);assert.equal(wakeTarget(plant,[{...f,z:1.1}]),0);assert.equal(wakeTarget(plant,[{...f,x:700}]),0);assert.equal(wakeTarget(plant,[{...f,vx:0}]),0);const w=advanceWake(0,1,.1);assert.ok(w>0&&w<1);assert.ok(advanceWake(w,0,.1)<w);assert.ok(advanceWake(w,0,.1)>0);});
