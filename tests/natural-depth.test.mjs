import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildLeafDepth,leafContact,leafSide,leafVisualZ} from '../src/engine/naturalDepth.js';
const W=100,H=100,frame=new Uint8Array(W*H*4);
function paint(x,y,r,g,b){frame.set([r,g,b,255],(y*W+x)*4);}
paint(80,42,40,100,25);paint(81,42,9,37,40);paint(50,42,40,100,25);
const map=buildLeafDepth(frame,W,H);
test('only foreground green pixels in calibrated regions can occlude',()=>{assert.ok(map[4280]);assert.equal(map[4281],0);assert.equal(map[4250],0);});
test('contact uses responsive photo rect and fin radius',()=>{assert.equal(leafContact(map,W,H,[-100,0,200,100],[{x:61,y:42.5,r:1}]),true);assert.equal(leafContact(map,W,H,[0,0,100,100],[{x:50,y:42,r:2}]),false);});
test('whole fish stays on same side until it clears foliage',()=>{assert.equal(leafSide(.87,0,true),-1);assert.equal(leafSide(1.07,-1,true),-1);assert.equal(leafVisualZ(1.07,-1),.90);assert.equal(leafSide(1.07,-1,false),0);assert.equal(leafSide(1.07,0,true),1);assert.equal(leafVisualZ(.91,1),1.06);});
