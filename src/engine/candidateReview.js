import {auxiliaryScenarios,matchesBuffers,retainedProfiles} from './pixelBudget.js';
// Review a complete local diagnostic, never auto-promote a renderer.
export const reviewPolicy=Object.freeze({maxReferenceDriftPct:5,minGainPct:3,tailToleranceMs:1});
const keys=['scale','habitat','fish','foreground','retained','optics','opticalMode','mode'];
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const pct=(a,b)=>100*(a/b-1);
const profileFor=sc=>Object.keys(retainedProfiles).find(k=>['scale','habitat','fish','foreground'].every(x=>retainedProfiles[k][x]===sc[x]));
export function reviewAuxiliaryReport(report){
 const invalid=reason=>({status:'invalid',reason,recommendation:null,releaseApproved:false});
 if(report?.schema!==2||report.version!=='P2.1-auxiliary'||!Array.isArray(report.results)||report.results.length!==auxiliaryScenarios.length)return invalid('Relatório P2.1 incompleto ou incompatível.');
 if(![12000,30000].includes(report.sampleMs)||report.warmupMs!==(report.sampleMs===30000?10000:4000))return invalid('Duração de amostra incompatível.');
 const initial=report.settings;
 if(!initial||![initial.width,initial.height,initial.dpr].every(x=>finite(x)&&x>0)||initial.dpr>1.5||initial.renderMode!=='WebGL'||typeof initial.night!=='boolean'||initial.depthEnabled!==true||initial.flowOn!==true)return invalid('Ambiente ou recursos obrigatórios incompatíveis.');
 const rows=[];
 for(let i=0;i<auxiliaryScenarios.length;i++){
  const s=auxiliaryScenarios[i],x=report.results[i],m=x?.measuredSettings,t=x?.frameMs;
  if(x?.id!==s.id||!keys.every(k=>x.scenario?.[k]===s[k])||x.actualModes?.length!==1||x.actualModes[0]!=='living'||!m||!t)return invalid('Cenário inesperado: '+s.id);
  if(m.width!==initial.width||m.height!==initial.height||m.dpr!==initial.dpr||m.deviceDpr!==initial.deviceDpr||m.night!==initial.night||m.renderMode!=='WebGL'||m.quality!==1||m.adaptiveQuality!==false||m.depthEnabled!==true||m.flowOn!==true||m.opticsOn!==true||m.vegetationOn!==true||m.retained!==true||m.opticalActual!==s.opticalMode||!matchesBuffers(m.surfaces??{},s,m.width,m.height,m.dpr))return invalid('Configuração real diferente da esperada: '+s.id);
  if(![x.fps,t.mean,t.p50,t.p95,t.p99,t.max].every(n=>finite(n)&&n>0)||!Number.isInteger(t.n)||t.n<=0||!Number.isInteger(x.longFrames)||x.longFrames<0||x.longFrames>t.n||t.n*t.mean<report.sampleMs-1000||t.n*t.mean>report.sampleMs+1000||Math.abs(x.fps-1000/t.mean)>.05||t.p50>t.p95||t.p95>t.p99||t.p99>t.max)return invalid('Amostra inválida: '+s.id);
  rows.push({id:s.id,profile:profileFor(s),opticalMode:s.opticalMode,fps:x.fps,p95:t.p95,p99:t.p99,max:t.max,longFrames:x.longFrames,n:t.n,longRate:x.longFrames/t.n,disjoint:x.disjointEvents??null});
 }
 const first=rows[0],last=rows.at(-1),reference={fps:(first.fps+last.fps)/2,p95:Math.max(first.p95,last.p95),p99:Math.max(first.p99,last.p99),longRate:(first.longFrames+last.longFrames)/(first.n+last.n)};
 const driftPct=Math.abs(pct(last.fps,first.fps)),repeatRequired=report.sampleMs<30000||driftPct>reviewPolicy.maxReferenceDriftPct;
 const pairs=[0,2,4,6].map(i=>({reference:rows[i].id,candidate:rows[i+1].id,gainPct:pct(rows[i+1].fps,rows[i].fps),p95DeltaMs:rows[i+1].p95-rows[i].p95,p99DeltaMs:rows[i+1].p99-rows[i].p99,longRateDelta:rows[i+1].longRate-rows[i].longRate}));
 const comparable=rows.slice(1,6).map(x=>({...x,gainPct:pct(x.fps,reference.fps),stable:x.p95<=reference.p95+reviewPolicy.tailToleranceMs&&x.p99<=reference.p99+reviewPolicy.tailToleranceMs&&x.longRate<=reference.longRate}));
 const eligible=comparable.filter(x=>x.stable&&x.gainPct>=reviewPolicy.minGainPct).sort((a,b)=>b.fps-a.fps||a.p99-b.p99);
 const best=rows.slice().sort((a,b)=>b.fps-a.fps||a.p99-b.p99)[0];
 // Keep the proven balanced profile if gains are below the policy threshold or uncertain.
 const selected=repeatRequired?null:eligible[0]??first;
 const recommendation=selected?{profile:selected.profile,opticalMode:selected.opticalMode,id:selected.id,fps:selected.fps,gainPct:pct(selected.fps,reference.fps),candidateUrl:'/?candidate=1&profile='+selected.profile+'&opticalMode='+selected.opticalMode,releaseUrl:'/?releaseLab=1&profile='+selected.profile+'&opticalMode='+selected.opticalMode}:null;
 return {status:repeatRequired?'repeat-required':eligible.length?'candidate-for-review':'keep-reference',reason:report.sampleMs<30000?'Execute o perfil estendido antes de selecionar uma candidata.':driftPct>reviewPolicy.maxReferenceDriftPct?'A referência variou mais de 5%; repita em condições estáveis.':eligible.length?'Ganho acima da margem proposta sem piora relevante das caudas ou frequência de quadros longos.':'Nenhuma alternativa Equilibrada atingiu a margem proposta com estabilidade; mantenha a referência.',reference,driftPct,pairs,rows,best, recommendation,releaseApproved:false,policy:reviewPolicy,night:initial.night,notes:['Seleção provisória, não certificação estatística.','Detalhe é relatado à parte, não compete com Equilibrado.','Homologação visual, P3, dia/noite e soak permanecem obrigatórios.']};
}
