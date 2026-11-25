// Conservative photo-aligned foliage mask; no guessed wood or background cutouts.
export function buildLeafDepth(rgba,width,height){
 const map=new Uint8Array(width*height);
 const regions=[
 [[.005,.09],[.08,.04],[.11,.15],[.20,.18],[.20,.26],[.15,.31],[.20,.39],[.17,.47],[.13,.51],[.03,.49],[0,.40]],
 [[0,.47],[.14,.46],[.17,.56],[.13,.67],[.07,.76],[0,.73]],
 [[.90,.27],[1,.26],[1,.75],[.86,.76],[.84,.66],[.86,.57],[.89,.50]],
 [[.75,.39],[.80,.39],[.87,.42],[.94,.49],[.97,.59],[.91,.61],[.84,.52],[.79,.46],[.75,.44]],
 [[.75,.52],[.80,.52],[.86,.53],[.93,.58],[.96,.65],[.89,.66],[.83,.60],[.79,.58],[.75,.59]],
 [[.76,.62],[.88,.59],[.98,.61],[1,.73],[.94,.79],[.80,.79],[.75,.73]]];
 const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const [a,b]=p[i],[c,d]=p[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes;}return yes;};
 const value=255;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=(x+.5)/width,v=(y+.5)/height;if(u>.21&&u<.75)continue;
  const i=(y*width+x)*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2];
  if(g<38||g<r*1.10||g<b*1.28||g-b<12)continue;
  if(regions.some(p=>inside(u,v,p)))map[y*width+x]=value;
 }return refineCoverage(map,width,height);
}

export function leafContact(map,width,height,view,proxies){
 if(!view)return false;const [ox,oy,dw,dh]=view;
 for(const q of proxies)for(const [a,b] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]]){
 const u=(q.x+a*q.r-ox)/dw,v=(q.y+b*q.r-oy)/dh;
 if(u>=0&&u<1&&v>=0&&v<1&&map[Math.floor(v*height)*width+Math.floor(u*width)]>=64)return true;
 }return false;
}


export function refineCoverage(seed,w,h){
 // Closing fills leaf veins and small gaps; opening removes isolated color speckles.
 function pass(src,r,max,vertical){const dst=new Uint8Array(src.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let v=max?0:255;for(let d=-r;d<=r;d++){const xx=vertical?x:Math.max(0,Math.min(w-1,x+d)),yy=vertical?Math.max(0,Math.min(h-1,y+d)):y;v=max?Math.max(v,src[yy*w+xx]):Math.min(v,src[yy*w+xx]);}dst[y*w+x]=v;}return dst;}
 const morph=(src,r,max)=>pass(pass(src,r,max,false),r,max,true);
 const r=Math.max(1,Math.round(w/340));
 let solid=morph(morph(seed,r,true),r,false);
 solid=morph(morph(solid,1,false),1,true);
 // Fill small fully enclosed dark patches, but retain genuine water gaps.
 const seen=new Uint8Array(solid.length),queue=new Int32Array(solid.length),limit=Math.max(9,Math.round(w*h*.00065));
 for(let start=0;start<solid.length;start++){if(solid[start]||seen[start])continue;let head=0,tail=1,edge=false;queue[0]=start;seen[start]=1;while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);if(x===0||y===0||x===w-1||y===h-1)edge=true;for(const j of [x>0?i-1:-1,x<w-1?i+1:-1,y>0?i-w:-1,y<h-1?i+w:-1])if(j>=0&&!solid[j]&&!seen[j]){seen[j]=1;queue[tail++]=j;}}if(!edge&&tail<=limit)for(let k=0;k<tail;k++)solid[queue[k]]=255;}
 // A one-pixel Gaussian-like edge, not a blurred interior.
 const out=new Uint8Array(solid.length);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let sum=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const xx=Math.max(0,Math.min(w-1,x+i)),yy=Math.max(0,Math.min(h-1,y+j));sum+=solid[yy*w+xx]*(i===0?2:1)*(j===0?2:1);}out[y*w+x]=Math.round(sum/16);}
 return out;
}

export function sampleCoverage(map,w,h,u,v){
 if(u<0||v<0||u>=1||v>=1)return 0;
 const x=Math.max(0,Math.min(w-1,u*w-.5)),y=Math.max(0,Math.min(h-1,v*h-.5)),ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,j=iy*w+ix,nx=Math.min(w-1,ix+1),ny=Math.min(h-1,iy+1);
 return (map[j]*(1-fx)*(1-fy)+map[iy*w+nx]*fx*(1-fy)+map[ny*w+ix]*(1-fx)*fy+map[ny*w+nx]*fx*fy)/255;
}

export function approachDepth(z,velocity,dt){return Math.max(.76,Math.min(1.13,z+Math.max(-.13,Math.min(.13,velocity))*Math.max(0,dt)));}

export function steerDepth(z,side,dz,unit,strength){if(!side||strength<=0)return dz;const clearance=side*(z-.98),near=Math.max(0,Math.min(1,(.09-clearance)/.09)),toward=side*dz<0?dz*near:0;return dz-strength*toward+side*unit*.035*near*strength;}

export function nextLeafSide(z,side,near,clearFor,dt){const clear=near?0:clearFor+dt;return {side:near?(side||(z>=.98?1:-1)):(clear>=.35?0:side),clear};}

export function leafOcclusion(z,side){return side?Number(side<0):Number(z<.98);}
