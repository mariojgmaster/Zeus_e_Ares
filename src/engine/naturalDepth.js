// Authored native-resolution alpha matte; no thresholding of photo colors.
export function buildLeafDepth(rgba,width,height){
 if(rgba.length!==width*height*4)throw new RangeError('Invalid matte dimensions');
 const coverage=new Uint8Array(width*height);
 for(let i=0;i<coverage.length;i++)coverage[i]=rgba[i*4+3];
 return coverage;
}

export function leafContact(map,width,height,view,proxies){
 if(!view)return false;const [ox,oy,dw,dh]=view;
 for(const q of proxies)for(const [a,b] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]]){
 const u=(q.x+a*q.r-ox)/dw,v=(q.y+b*q.r-oy)/dh;
 if(u>=0&&u<1&&v>=0&&v<1&&map[Math.floor(v*height)*width+Math.floor(u*width)]>=64)return true;
 }return false;
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
