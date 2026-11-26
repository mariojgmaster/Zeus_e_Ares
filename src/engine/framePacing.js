import {retainedProfiles} from './pixelBudget.js';
const scenario=(id,profiling,maskStrategy)=>Object.freeze({...retainedProfiles['balanced-soft'],id,mode:'living-animated',retained:true,optics:true,opticalMode:'gpu',profiling,maskStrategy});
export const pacingScenarios=Object.freeze([
 scenario('union-full','full','union'),scenario('union-light','light','union'),
 scenario('split-light','light','split'),scenario('split-full','full','split'),
 scenario('split-light-repeat','light','split'),scenario('union-light-repeat','light','union'),
 scenario('union-full-repeat','full','union')
]);
export function pacingCorrelation(samples){
 const summarize=a=>{const mean=k=>{const v=a.map(x=>x[k]).filter(Number.isFinite);return v.length?v.reduce((s,x)=>s+x,0)/v.length:null;};return {n:a.length,meanInterval:mean('interval'),previousMaskPixels:mean('prevMaskPixels'),previousDraws:mean('prevDraws'),previousCpuMs:mean('prevCpu'),previousPollMs:mean('prevPoll'),previousSplitPlanes:mean('prevSplitPlanes')};};
 return {normal:summarize(samples.filter(s=>s.interval<=25)),slow:summarize(samples.filter(s=>s.interval>25)),severe:summarize(samples.filter(s=>s.interval>50)),notes:'Previous RAF callback metrics vs next interval; association, not causal attribution.'};
}
