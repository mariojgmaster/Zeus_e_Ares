import {expectedMode} from './pixelBudget.js';
// Optional, local-only performance lab. No profiling in the ordinary app.
export function summarize(values){if(!values.length)return null;const a=[...values].sort((x,y)=>x-y),p=q=>a[Math.max(0,Math.ceil(q*a.length)-1)];return {n:a.length,mean:a.reduce((x,y)=>x+y,0)/a.length,p50:p(.5),p95:p(.95),p99:p(.99),max:a.at(-1)};}
export const modes=['original-static','gpu-static','living-static','living-animated','unified-static','unified-animated'];
const WARM=4000,SAMPLE=12000;
export function createPerformanceLab(root,control,options={}){
 const scenarios=options.scenarios??modes.map(mode=>({id:mode,mode})),pixel=!!options.scenarios;let warm=WARM,sample=SAMPLE;
 const panel=document.createElement('section');panel.style.cssText='position:fixed;top:75px;right:12px;z-index:20;background:#09282ef2;border:1px solid #739b9299;border-radius:12px;padding:12px;max-width:300px;font:12px system-ui;color:#e0f3ec;pointer-events:auto';panel.setAttribute('aria-label','Diagnóstico local de performance');
 const label=document.createElement('p'),button=document.createElement('button'),download=document.createElement('button'),cancel=document.createElement('button'),profile=document.createElement('select');profile.setAttribute('aria-label','Duração do benchmark');for(const [value,title] of [['quick','Rápido · 4s + 12s'],['full','Estendido · 10s + 30s']]){const opt=document.createElement('option');opt.value=value;opt.textContent=title;profile.append(opt);}profile.style.cssText='width:100%;margin:0 0 8px;background:#12363a;color:#e0f3ec;padding:8px;border-radius:6px';label.setAttribute('role','status');label.textContent=pixel?(options.label??'Pixel Budget')+' · '+scenarios.length+' configurações':'Diagnóstico A/B · 6 modos';button.textContent='Executar diagnóstico';cancel.textContent='Cancelar diagnóstico';cancel.hidden=true;download.textContent='Exportar JSON';download.disabled=true;panel.append(label);if(pixel)panel.append(profile);panel.append(button,cancel,download);root.append(panel);
 let active=false,original=null,phase=0,phaseAt=0,last=0,samples=[],results=[],report=null,lastUi=0,phaseMeta=null;
 const timers=new Map();let phaseEpoch=0;
 function timer(gl){if(!gl)return null;if(timers.has(gl))return timers.get(gl);const ext=gl.getExtension('EXT_disjoint_timer_query'),t={gl,ext,pending:[],values:{},disjoint:0};timers.set(gl,t);return t;}
 function poll(){for(const t of timers.values()){const {gl,ext}=t;if(!ext||gl.isContextLost())continue;if(gl.getParameter(ext.GPU_DISJOINT_EXT)){t.disjoint++;t.values={};for(const q of t.pending)ext.deleteQueryEXT(q.query);t.pending=[];continue;}while(t.pending.length&&ext.getQueryObjectEXT(t.pending[0].query,ext.QUERY_RESULT_AVAILABLE_EXT)){const {query,name,epoch}=t.pending.shift(),ms=ext.getQueryObjectEXT(query,ext.QUERY_RESULT_EXT)/1e6;ext.deleteQueryEXT(query);if(epoch===phaseEpoch&&Number.isFinite(ms))(t.values[name]??=[]).push(ms);}}}
 function gpu(gl,name,fn){if(!active||!gl||!phaseAt||performance.now()-phaseAt<warm)return fn();const t=timer(gl);if(!t.ext||t.pending.length>=8||gl.isContextLost())return fn();const q=t.ext.createQueryEXT();if(!q)return fn();t.ext.beginQueryEXT(t.ext.TIME_ELAPSED_EXT,q);try{return fn();}finally{t.ext.endQueryEXT(t.ext.TIME_ELAPSED_EXT);t.pending.push({query:q,name,epoch:phaseEpoch});}}
 function restore(){if(original)control.restore(original);original=null;active=false;button.disabled=false;profile.disabled=false;cancel.hidden=true;button.textContent='Executar diagnóstico';}
 function abort(reason){if(!active)return;restore();label.textContent='Diagnóstico interrompido: '+reason;}
 function beginMode(ts){phaseEpoch++;phaseAt=ts;last=0;samples=[];phaseMeta=null;for(const t of timers.values()){t.values={};t.disjoint=0;}const sc=scenarios[phase];control.setMode(sc.mode,pixel?sc:null);label.textContent='Aquecendo: '+sc.id;}
 function finishMode(){poll();const gpuMs={};for(const t of timers.values())for(const [name,v] of Object.entries(t.values))gpuMs[name]=summarize(v);const intervals=samples.map(s=>s.interval);const cpu={};for(const name of ['simulation','environment','fish','color','mask','opticalBackground','opticalForeground','total']){const values=samples.map(s=>s[name]).filter(Number.isFinite);if(values.length)cpu[name]=summarize(values);}const frame=summarize(intervals);results.push({mode:scenarios[phase].mode,id:scenarios[phase].id,scenario:pixel?scenarios[phase]:undefined,measuredSettings:phaseMeta,actualModes:[...new Set(samples.map(s=>s.actual))],fps:frame?1000/frame.mean:null,frameMs:frame,longFrames:intervals.filter(x=>x>50).length,cpuMs:cpu,gpuMs,gpuTimerSupported:[...timers.values()].some(t=>!!t.ext),disjointEvents:[...timers.values()].reduce((n,t)=>n+t.disjoint,0),maskPixels:summarize(samples.map(s=>s.maskPixels)),draws:summarize(samples.map(s=>s.draws))});}
 function frame(ts,metrics){
 if(!active)return;const meta=control.info(),initial=original.info,sc=scenarios[phase];
 if(document.hidden||!meta.valid||meta.width!==initial.width||meta.height!==initial.height||meta.dpr!==initial.dpr||meta.deviceDpr!==initial.deviceDpr||meta.night!==initial.night||meta.depthEnabled!==initial.depthEnabled||meta.flowOn!==initial.flowOn||(!pixel&&meta.opticsOn!==initial.opticsOn)){abort('janela alterada, aba oculta ou modo incompatível');return;}
 if(!phaseAt){beginMode(ts);return;}
 if(ts-lastUi>250){lastUi=ts;poll();label.textContent=(phase+1)+'/'+scenarios.length+' · '+sc.id+' · '+(ts-phaseAt<warm?'aquecendo':'medindo')+' · '+Math.min((warm+sample)/1000,Math.floor((ts-phaseAt)/1000))+'/'+(warm+sample)/1000+' s';}
 if(ts-phaseAt>=warm&&last&&last-phaseAt>=warm){
  if(metrics.actual!==expectedMode(sc.mode)||!control.validate?.(pixel?sc:null,meta)){abort('modo ou dimensões reais não correspondem à configuração');return;}
  if(!phaseMeta)phaseMeta=meta;
  samples.push({...metrics,interval:ts-last});
 }
 last=ts;
 if(ts-phaseAt>=warm+sample){
  if(!samples.length){abort('sem amostras válidas');return;}finishMode();phase++;if(phase<scenarios.length){beginMode(ts);return;}
  report={schema:pixel?2:1,version:options.version??'P1-unified',settings:initial,warmupMs:warm,sampleMs:sample,results,notes:'Live unseeded fish; sequential phases. GPU timers async; CPU submission and RAF cadence are not GPU/compositor wall time. Pixel tests change backing stores, not textures or geometry. Optical OFF uses existing control, not complete removal of all effects.'};restore();download.disabled=false;label.textContent='Concluído · exporte o JSON para comparação.';
 }
 }

 button.onclick=()=>{if(active)return;original=control.snapshot();if(!original.info.valid){label.textContent='Abra o aquário em WebGL, fora da observação, com a aba visível.';original=null;return;}results=[];report=null;download.disabled=true;warm=pixel&&profile.value==='full'?10000:WARM;sample=pixel&&profile.value==='full'?30000:SAMPLE;active=true;phase=0;phaseAt=0;button.disabled=true;profile.disabled=true;cancel.hidden=false;control.lock?.();button.textContent='Medindo…';};
 cancel.onclick=()=>abort('cancelado pelo usuário');
 download.onclick=()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=options.filename??(pixel?'aqua-pixel-budget-lab.json':'aqua-performance-lab.json');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 const hidden=()=>{if(document.hidden)abort('aba oculta');};document.addEventListener('visibilitychange',hidden);
 return {get active(){return active;},frame,gpu,abort,dispose(){restore();document.removeEventListener('visibilitychange',hidden);for(const t of timers.values())for(const q of t.pending)t.ext?.deleteQueryEXT(q.query);timers.clear();panel.remove();}};
}
