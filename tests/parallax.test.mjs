import {test} from 'node:test';import assert from 'node:assert/strict';
import {samplePacked,planeVisibility,guardDepthStep,contactPlane,PLANES,opticalStrength} from '../src/engine/parallaxScene.js';
const solid=new Uint8Array([255,0,255,0]);
test('planes independently hide fish only behind them',()=>{assert.equal(planeVisibility(solid,1,1,.5,.5,.80),0);assert.equal(planeVisibility(solid,1,1,.5,.5,.91),0);assert.equal(planeVisibility(solid,1,1,.5,.5,1.01),1);});
test('transparent gaps and fractional edges',()=>{assert.equal(planeVisibility(new Uint8Array(4),1,1,.5,.5,.8),1);assert.ok(Math.abs(planeVisibility(new Uint8Array([0,0,0,128]),1,1,.5,.5,1)-127/255)<1e-9);});
test('camera shifts the same mask with its plane',()=>{const m=new Uint8Array([0,0,0,255,0,0,0,0]);assert.ok(Math.abs(planeVisibility(m,2,1,.7,.5,1)-.9)<1e-9);assert.ok(Math.abs(planeVisibility(m,2,1,.7,.5,1,[.2,0])-.5)<1e-9);});
test('depth guard does not teleport and allows free water crossings',()=>{assert.equal(guardDepthStep(.829,.832,()=>true),.829);assert.equal(guardDepthStep(.829,.832,()=>false),.832);assert.equal(guardDepthStep(.831,.828,()=>true),.831);assert.equal(guardDepthStep(.80,.81,()=>true),.81);});
test('collision uses exact same plane alpha and responsive crop',()=>{assert.equal(contactPlane(solid,1,1,{x:0,y:0,dw:100,dh:100},[{x:50,y:50,r:4}],0),true);assert.equal(contactPlane(solid,1,1,{x:0,y:0,dw:100,dh:100},[{x:50,y:50,r:4}],1),false);});

test('optics respect night and zero strength without modifying the geometry',()=>{assert.equal(opticalStrength(0,0),0);assert.equal(opticalStrength(1,0),1);assert.ok(Math.abs(opticalStrength(1,1)-.11)<1e-9);assert.equal(opticalStrength(-2,0),0);});

test('depth guard skips mask sampling unless crossing a plane',()=>{let calls=0;assert.equal(guardDepthStep(.84,.85,()=>{calls++;return true;}),.85);assert.equal(calls,0);guardDepthStep(.829,.832,()=>{calls++;return true;});assert.equal(calls,1);});
