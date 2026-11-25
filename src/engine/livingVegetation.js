// Root-anchored, depth-local photographic vegetation. No changes to fish dynamics.
const profiles={
 'stems-green':{amplitude:13,frequency:.60},
 'stems-red':{amplitude:12,frequency:.53},
 'fern-left':{amplitude:9,frequency:.43},
 'fern-right':{amplitude:9,frequency:.47},
 'anubias':{amplitude:5,frequency:.38},
 'sprouts':{amplitude:3.5,frequency:.63}
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function plantProfile(asset){return profiles[asset]??null;}
export function plantPhase(id){let h=0;for(const c of id)h=(Math.imul(h,31)+c.charCodeAt(0))|0;return (h>>>0)%6283/1000;}
export function plantOffset(layer,heightFraction,time,flow,wake=0){
 const p=plantProfile(layer.asset);if(!p)return 0;
 const q=clamp(1-heightFraction,0,1),phase=plantPhase(layer.id),f=clamp(flow,0,1);
 const a=p.amplitude*Math.min(1.2,layer.h/600+.35);
 return q*q*(a*f*(.68*Math.sin(time*p.frequency+phase-q*1.6)+.24*Math.sin(time*.31+phase*.73-q*3.2)) + clamp(wake,-1,1)*a*.85);
}
// Fish coordinates are in the native scene, with velocity in native pixels per second.
export function wakeTarget(layer,fish){
 if(!plantProfile(layer.asset))return 0;
 let result=0;for(const f of fish){
  const dz=Math.abs(f.z-layer.z);if(dz>=.09)continue;
  const dx=f.x-clamp(f.x,layer.x,layer.x+layer.w),dy=f.y-clamp(f.y,layer.y,layer.y+layer.h);
  const distance=Math.hypot(dx,dy),range=95;if(distance>=range)continue;
  const speed=clamp(Math.abs(f.vx)/150,0,1);if(!speed)continue;
  const local=(1-distance/range)*(1-dz/.09);
  result+=Math.sign(f.vx)*speed*local;
 }return clamp(result,-1,1);
}
export function advanceWake(previous,target,dt){
 return previous+(target-previous)*(1-Math.exp(-Math.max(0,dt)*(Math.abs(target)>Math.abs(previous)?3.2:1.35)));
}
export function drawBentPlant(ctx,sprite,layer,time,flow,wake,pad=18){
 const h=sprite.height,w=sprite.width,step=8;
 // A continuous piecewise affine horizontal warp: adjacent rows share the same edge,
 // and the base stays fixed. The exact same raster is used for the occlusion mask.
 for(let y=0;y<h;y+=step){
  const n=Math.min(step,h-y),a=plantOffset(layer,(y-pad)/layer.h,time,flow,wake),b=plantOffset(layer,(y+n-pad)/layer.h,time,flow,wake);
  ctx.save();ctx.translate(layer.x-pad+a,layer.y-pad+y);ctx.transform(1,0,(b-a)/n,1,0,0);ctx.drawImage(sprite,0,y,w,n,0,0,w,n);ctx.restore();
 }
}
