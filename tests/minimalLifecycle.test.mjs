import {test} from 'node:test';import assert from 'node:assert/strict';
import {createPerformanceLab} from '../src/engine/performanceLab.js';import {minimalScenarios} from '../src/engine/minimalInstrumentation.js';
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.style={};this.dataset={};this.attributes={};this.hidden=false;this.disabled=false;}
 append(...els){this.children.push(...els);}setAttribute(k,v){this.attributes[k]=v;}replaceChildren(){this.children=[];}remove(){}click(){this.onclick?.();}
}
function harness(){
 const root=new Element('root'),oldDoc=globalThis.document,oldUrl=URL.createObjectURL,oldRevoke=URL.revokeObjectURL,oldTimeout=globalThis.setTimeout;let blob,restored=0,infoCalls=0,validates=0;
 globalThis.document={hidden:false,createElement:t=>new Element(t),addEventListener(){},removeEventListener(){}};
 URL.createObjectURL=b=>{blob=b;return 'blob:mock';};URL.revokeObjectURL=()=>{};globalThis.setTimeout=()=>0;
 const meta={valid:true,width:960,height:540,dpr:1,deviceDpr:1,night:false,depthEnabled:true,flowOn:true,opticsOn:true};
 const lab=createPerformanceLab(root,{info(){infoCalls++;return {...meta};},snapshot(){return {info:{...meta}};},setMode(){},lock(){},validate(){validates++;return true;},restore(){restored++;}}, {scenarios:[minimalScenarios[2]],fixedTiming:{warm:10000,sample:30000},version:'test-minimal'});
 const panel=root.children[0],button=panel.children.find(e=>e.textContent==='Executar diagnóstico'),download=panel.children.find(e=>e.textContent==='Exportar JSON');
 return {lab,panel,button,download,meta,get restored(){return restored;},get infoCalls(){return infoCalls;},get validates(){return validates;},async report(){download.click();return JSON.parse(await blob.text());},cleanup(){lab.dispose();globalThis.document=oldDoc;URL.createObjectURL=oldUrl;URL.revokeObjectURL=oldRevoke;globalThis.setTimeout=oldTimeout;}};
}
test('minimal lab completes real collection/export path with periodic validation and no GPU queries',async()=>{const h=harness();try{h.button.click();assert.equal(h.lab.minimal,true);let draws=0;const gl={getExtension(){throw Error('GPU query attempted in minimal');}};for(let i=0;i<=2401&&h.lab.active;i++){h.lab.gpu(gl,'fish',()=>draws++);h.lab.frame(100+i*1000/60,'living');}assert.equal(h.lab.active,false);assert.equal(h.restored,1);assert.equal(h.download.disabled,false);assert.ok(draws>2300);assert.ok(h.infoCalls<200);assert.ok(h.validates<150);const r=await h.report(),x=r.results[0];assert.equal(x.profiling,'minimal');assert.equal(x.cpuMs,null);assert.equal(x.gpuMs,null);assert.equal(x.gpuTimerSupported,null);assert.ok(Math.abs(x.fps-60)<.01);assert.equal(x.longFrames,0);assert.ok(x.frameMs.n>=1798);assert.deepEqual(x.actualModes,['living']);assert.equal(x.frameWindows.length,3);}finally{h.cleanup();}});
test('minimal lab aborts on unexpected actual mode during sample',()=>{const h=harness();try{h.button.click();for(let i=0;i<650&&h.lab.active;i++)h.lab.frame(100+i*1000/60,i===620?'original':'living');assert.equal(h.lab.active,false);assert.equal(h.restored,1);assert.equal(h.download.disabled,true);}finally{h.cleanup();}});
