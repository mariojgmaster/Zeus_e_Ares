// Backing-store sizes only. All world, hit-test and CSS coordinates remain logical.
export const NATIVE_PIXELS=1672*941;
export function pixelBudget(width,height,deviceDpr,scale=1){
 if(![width,height,deviceDpr].every(v=>Number.isFinite(v)&&v>0))throw Error('Invalid viewport');
 const baseDpr=Math.min(deviceDpr,1.5);
 const factor=scale==='native'?Math.min(1,Math.sqrt(NATIVE_PIXELS/(width*height*baseDpr*baseDpr))):scale;
 if(![1,.75,.5].includes(scale)&&scale!=='native')throw Error('Unsupported scale');
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
export function expectedMode(mode){return mode.startsWith('unified')?'unified':mode.startsWith('living')?'living':mode==='gpu-static'?'gpu-static':'original';}
export function matchesBuffers(surfaces,scenario,width,height,baseDpr){
 const full=pixelBudget(width,height,baseDpr,scenario.scale),front=pixelBudget(width,height,baseDpr,scenario.foreground);
 const same=(s,b)=>s&&s.width===b.width&&s.height===b.height&&s.visible&&(s.drawingBufferWidth===undefined||s.drawingBufferWidth===b.width)&&(s.drawingBufferHeight===undefined||s.drawingBufferHeight===b.height);
 return same(surfaces.tank,full)&&same(surfaces.fish,full)&&same(surfaces.foreground,front)&&(scenario.mode.startsWith('living')?same(surfaces.habitat,full):!surfaces.habitat.visible);
}
