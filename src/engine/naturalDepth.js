// Conservative photo-aligned foliage mask; no guessed wood or background cutouts.
export function buildLeafDepth(rgba,width,height){
 const map=new Uint8Array(width*height);
 const regions=[
 [[.005,.09],[.08,.04],[.11,.15],[.20,.18],[.20,.26],[.15,.31],[.20,.39],[.17,.47],[.13,.51],[.03,.49],[0,.40]],
 [[0,.47],[.14,.46],[.17,.56],[.13,.67],[.07,.76],[0,.73]],
 [[.90,.27],[1,.26],[1,.75],[.86,.76],[.84,.66],[.86,.57],[.89,.50]],
 [[.76,.40],[.81,.39],[.87,.43],[.93,.50],[.96,.59],[.91,.60],[.85,.51],[.80,.45],[.76,.43]],
 [[.75,.53],[.80,.52],[.86,.53],[.93,.59],[.95,.65],[.89,.65],[.84,.59],[.79,.57],[.75,.58]],
 [[.76,.62],[.88,.59],[.98,.61],[1,.73],[.94,.79],[.80,.79],[.75,.73]]];
 const inside=(x,y,p)=>{let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const [a,b]=p[i],[c,d]=p[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes;}return yes;};
 const value=Math.round(.98/1.3*255);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const u=(x+.5)/width,v=(y+.5)/height;if(u>.21&&u<.75)continue;
  const i=(y*width+x)*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2];
  if(g<38||g<r*1.10||g<b*1.28||g-b<12)continue;
  if(regions.some(p=>inside(u,v,p)))map[y*width+x]=value;
 }return map;
}

export function leafContact(map,width,height,view,proxies){
 if(!view)return false;const [ox,oy,dw,dh]=view;
 for(const q of proxies)for(const [a,b] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]]){
 const u=(q.x+a*q.r-ox)/dw,v=(q.y+b*q.r-oy)/dh;
 if(u>=0&&u<1&&v>=0&&v<1&&map[Math.floor(v*height)*width+Math.floor(u*width)])return true;
 }return false;
}

export function leafSide(z,previous,contact){return contact?(previous||(z>=.98?1:-1)):0;}

export function leafVisualZ(z,side){return side>0?Math.max(z,1.06):side<0?Math.min(z,.90):z;}
