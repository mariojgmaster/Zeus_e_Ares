import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const assets=["classic-tank.jpg","natural-tank.jpg","leaf-1.png","leaf-2.png","leaf-3.png","zeus-reference.jpg","ares-reference.jpg","zeus-skin.deflate","ares-skin.deflate"];
const expected = {
  "classic-tank.jpg": "09d5a1e37e7bd5d9f03eacb5f8e95135353f7f6e",
  "natural-tank.jpg": "c668a63971296f4faed61a5fd674008309b325fb",
  "leaf-1.png": "7752fcd1dd5c94f871b1061f1bc2aff20ed770a0",
  "leaf-2.png": "4a4ed0127b8d34efc806f967b7a9d939ef8204ca",
  "leaf-3.png": "c23253f8eedb167cc042cb7c89a6f86756bf7796",
  "zeus-reference.jpg": "251183e40b87063167c8d470439f19f5678f8efe",
  "ares-reference.jpg": "3ee47a4df9c2ed021c24084b21856b3367d04fc4",
  "zeus-skin.deflate": "1a7de49f640db7fd61d719e762c47fd6c3c839fb",
  "ares-skin.deflate": "f2132582c2874a1d54de589e8da5006697b02787"
};
for(const name of assets)test('asset '+name,async()=>{
 const bytes=await readFile(new URL('../src/assets/'+name,import.meta.url));
 assert.ok(bytes.length>0);
 if(name.endsWith('.deflate'))assert.equal(inflateSync(bytes).length,768*768*3);
 else if(name.endsWith('.jpg'))assert.equal(bytes.subarray(0,3).toString('hex'),'ffd8ff');
 else assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 if(expected[name]){const gitHash=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');assert.equal(gitHash,expected[name]);}
});
