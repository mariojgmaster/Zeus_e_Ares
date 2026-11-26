// Backing-store sizes only. All world, hit-test and CSS coordinates remain logical.
export const NATIVE_PIXELS=1672*941;
export function pixelBudget(width,height,deviceDpr,scale=1){
 if(![width,height,deviceDpr].every(v=>Number.isFinite(v)&&v>0))throw Error('Invalid viewport');
 const baseDpr=Math.min(deviceDpr,1.5);
 const native=Math.min(1,Math.sqrt(NATIVE_PIXELS/(width*height*baseDpr*baseDpr)));const factor=scale==='native'?native:scale==='native-half'?native*.5:scale;
 if(![1,.75,.5].includes(scale)&&scale!=='native'&&scale!=='native-half')throw Error('Unsupported scale');
 const dpr=baseDpr*factor;
 return {width:Math.max(1,Math.round(width*dpr)),height:Math.max(1,Math.round(height*dpr)),dpr,baseDpr,factor};
}
export const pixelScenarios=Object.freeze([
 {id:'living-100',mode:'living-animated',scale:1,foreground:1,optics:true},
 {id:'living-75',mode:'living-animated',scale:.75,foreground:.75,optics:true},
 {id:'living-50',mode:'living-animated',scale:.5,foreground:.5,optics:true},
 {id:'living-native',mode:'living-animated',scale:'native',foreground:'native',optics:true},
 {id:'unified-100',mode:'unified-animated',scale:1,foreground:1,optics:true},
 {id:'unified-75',mode:'unified-animated',scale:.75,foreground:.75,optics:true},
 {id:'unified-50',mode:'unified-animated',scale:.5,foreground:.5,optics:true},
 {id:'gpu-static-100',mode:'gpu-static',scale:1,foreground:1,optics:true},
 {id:'living-100-optics-off',mode:'living-animated',scale:1,foreground:1,optics:false},
 {id:'living-100-foreground-50',mode:'living-animated',scale:1,foreground:.5,optics:true}
].map(Object.freeze));
// Presets are explicitly selected, never applied silently to Max.
export const retainedProfiles=Object.freeze({
 native:Object.freeze({scale:'native',habitat:'native',fish:'native',foreground:'native'}),
 balanced:Object.freeze({scale:'native',habitat:'native',fish:.5,foreground:'native-half'}),
 detail:Object.freeze({scale:'native',habitat:'native',fish:.75,foreground:'native-half'}),
 'balanced-soft':Object.freeze({scale:'native-half',habitat:'native',fish:.5,foreground:'native-half'}),
 'detail-soft':Object.freeze({scale:'native-half',habitat:'native',fish:.75,foreground:'native-half'}),
 max:Object.freeze({scale:1,habitat:1,fish:1,foreground:1})
});
const scenario=(id,p,retained)=>Object.freeze({id,mode:'living-animated',...p,retained,optics:true});
export const retainedScenarios=Object.freeze([
 scenario('reference-native',retainedProfiles.native,false),
 scenario('retained-native',retainedProfiles.native,true),
 scenario('reference-balanced',retainedProfiles.balanced,false),
 scenario('retained-balanced',retainedProfiles.balanced,true),
 scenario('retained-detail',retainedProfiles.detail,true),
 scenario('retained-native-soft',{...retainedProfiles.native,foreground:'native-half'},true),
 scenario('reference-max',retainedProfiles.max,false),
 scenario('retained-max',retainedProfiles.max,true)
]);
const opticalScenario=(id,p,opticalMode)=>Object.freeze({...p,id,mode:'living-animated',retained:true,optics:true,opticalMode});
export const opticalScenarios=Object.freeze([
 opticalScenario('balanced-reference',retainedProfiles.balanced,'reference'),
 opticalScenario('balanced-cached',retainedProfiles.balanced,'cached'),
 opticalScenario('balanced-gpu',retainedProfiles.balanced,'gpu'),
 opticalScenario('native-soft-reference',{...retainedProfiles.native,foreground:'native-half'},'reference'),
 opticalScenario('native-soft-gpu',{...retainedProfiles.native,foreground:'native-half'},'gpu'),
 opticalScenario('detail-reference',retainedProfiles.detail,'reference'),
 opticalScenario('detail-gpu',retainedProfiles.detail,'gpu'),
 opticalScenario('balanced-reference-repeat',retainedProfiles.balanced,'reference')
]);
// Same fish, habitat and foreground buffers in each pair; only tank effects backing varies.
export const auxiliaryScenarios=Object.freeze([
 opticalScenario('balanced-reference',retainedProfiles.balanced,'reference'),
 opticalScenario('balanced-aux-reference',retainedProfiles['balanced-soft'],'reference'),
 opticalScenario('balanced-cached',retainedProfiles.balanced,'cached'),
 opticalScenario('balanced-aux-cached',retainedProfiles['balanced-soft'],'cached'),
 opticalScenario('balanced-gpu',retainedProfiles.balanced,'gpu'),
 opticalScenario('balanced-aux-gpu',retainedProfiles['balanced-soft'],'gpu'),
 opticalScenario('detail-gpu',retainedProfiles.detail,'gpu'),
 opticalScenario('detail-aux-gpu',retainedProfiles['detail-soft'],'gpu'),
 opticalScenario('balanced-reference-repeat',retainedProfiles.balanced,'reference')
]);
export function tankScaleForMode(scale,living){return scale==='native-half'&&!living?'native':scale;}
export function expectedMode(mode){return mode.startsWith('unified')?'unified':mode.startsWith('living')?'living':mode==='gpu-static'?'gpu-static':'original';}
export function matchesBuffers(surfaces,scenario,width,height,baseDpr){
 const full=pixelBudget(width,height,baseDpr,scenario.scale),front=pixelBudget(width,height,baseDpr,scenario.foreground),fish=pixelBudget(width,height,baseDpr,scenario.fish??scenario.scale),habitat=pixelBudget(width,height,baseDpr,scenario.habitat??scenario.scale);
 const same=(s,b)=>s&&s.width===b.width&&s.height===b.height&&s.visible&&(s.drawingBufferWidth===undefined||s.drawingBufferWidth===b.width)&&(s.drawingBufferHeight===undefined||s.drawingBufferHeight===b.height);
 return same(surfaces.tank,full)&&same(surfaces.fish,fish)&&same(surfaces.foreground,front)&&(scenario.mode.startsWith('living')?same(surfaces.habitat,habitat):!surfaces.habitat.visible);
}
