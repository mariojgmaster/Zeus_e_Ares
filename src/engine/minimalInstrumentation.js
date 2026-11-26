import {retainedProfiles} from './pixelBudget.js';
// Bounded, allocation-free per recorded interval; abort rather than silently drop samples.
export function createIntervalBuffer(sampleMs){
 if(!Number.isFinite(sampleMs)||sampleMs<=0||sampleMs>900000)throw Error('invalid sample duration');
 const values=new Float64Array(Math.ceil((sampleMs+2000)*480/1000));let count=0;
 return {get count(){return count;},get capacity(){return values.length;},push(ms){if(!Number.isFinite(ms)||ms<=0||count===values.length)return false;values[count++]=ms;return true;},view(){return values.subarray(0,count);}};
}
const sc=(id,profiling)=>Object.freeze({...retainedProfiles['balanced-soft'],id,mode:'living-animated',retained:true,optics:true,opticalMode:'gpu',maskStrategy:'union',profiling});
// Mirrored order; two observations per mode and reference at both ends.
export const minimalScenarios=Object.freeze([sc('full-1','full'),sc('light-1','light'),sc('minimal-1','minimal'),sc('minimal-2','minimal'),sc('light-2','light'),sc('full-2','full')]);
export function compareInstrumentation(results){
 const modes=['full','light','minimal'],groups=Object.fromEntries(modes.map(m=>{const rows=results.filter(r=>r.profiling===m);const fps=rows.map(r=>r.fps);return [m,{runs:rows.length,fps,meanFps:fps.length?fps.reduce((a,b)=>a+b,0)/fps.length:null,driftPct:fps.length===2?100*Math.abs(fps[1]/fps[0]-1):null,p95:rows.map(r=>r.frameMs.p95),p99:rows.map(r=>r.frameMs.p99),longFrames:rows.reduce((a,r)=>a+r.longFrames,0)}];}));
 const valid=modes.every(m=>groups[m].runs===2&&groups[m].fps.every(v=>Number.isFinite(v)&&v>0));
 const stable=valid&&modes.every(m=>groups[m].driftPct<=5);
 const delta=(a,b)=>valid?100*(groups[a].meanFps/groups[b].meanFps-1):null;
 return {status:stable?'comparable':'repeat-required',groups,minimalVsFullPct:delta('minimal','full'),minimalVsLightPct:delta('minimal','light'),maxDriftPct:5,notes:'Mirrored sequential runs, live unseeded fish; drift <=5% is a heuristic, not proof of causality. RAF callback cadence is not monitor presentation. No release approval.'};
}
