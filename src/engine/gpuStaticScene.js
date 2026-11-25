// Stage A: retained native-resolution, pregraded static planes, shared fish GL context.
// Color is premultiplied for correct transparent edges; alpha channels are independent.
export const DEPTH_PLANES=[.83,.90,.97,1.065];
export function planeRect(rect,z,shift=[0,0]){
 const k=(z-.70)/.365;return [rect.x+shift[0]*rect.dw*k,rect.y+shift[1]*rect.dh*k,rect.dw,rect.dh];
}
const vertex=`attribute vec2 uv;uniform vec4 rect;uniform vec2 screen;uniform float maskPass;varying vec2 v;void main(){v=uv;vec2 p=rect.xy+uv*rect.zw;gl_Position=maskPass>.5?vec4(uv*2.-1.,0.,1.):vec4(p/screen*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);}`;
const fragment=`precision mediump float;varying vec2 v;uniform sampler2D image;uniform float maskPass;void main(){vec4 c=texture2D(image,v);gl_FragColor=maskPass>.5?vec4(c.a):c;}`;
export function createGpuStaticScene(gl,source){
 const {far,planes}=source,w=far.width,h=far.height;
 if(gl.isContextLost()||planes.length!==4||planes.some((p,i)=>p.z!==DEPTH_PLANES[i]||p.canvas.width!==w||p.canvas.height!==h)||w>gl.getParameter(gl.MAX_TEXTURE_SIZE)||h>gl.getParameter(gl.MAX_TEXTURE_SIZE))throw Error('GPU static capability/dimensions');
 const shaders=[],textures=[];let program=null,buffer=null,fbo=null,mask=null,disposed=false;
 const stats={uploads:0,maskBuilds:0,compositions:0};
 function dispose(){if(disposed)return;disposed=true;for(const t of textures)gl.deleteTexture(t);if(mask)gl.deleteTexture(mask);if(fbo)gl.deleteFramebuffer(fbo);if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);for(const s of shaders)gl.deleteShader(s);}
 function compile(type,code){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 function params(){gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}
 function upload(canvas){const t=gl.createTexture();textures.push(t);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);params();stats.uploads++;return t;}
 const vao=gl.getExtension('OES_vertex_array_object');
 let loc,rectLoc,screenLoc,passLoc;
 function bind(pass,W,H){if(vao)vao.bindVertexArrayOES(null);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);gl.activeTexture(gl.TEXTURE0);gl.uniform1i(gl.getUniformLocation(program,'image'),0);gl.uniform2f(screenLoc,W,H);gl.uniform1f(passLoc,pass);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.DITHER);}
 function quad(t,rect){gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform4fv(rectLoc,rect);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}
 function reset(){gl.colorMask(true,true,true,true);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.enable(gl.DITHER);if(loc>=0)gl.disableVertexAttribArray(loc);gl.activeTexture(gl.TEXTURE0);}
 try{
  program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  loc=gl.getAttribLocation(program,'uv');rectLoc=gl.getUniformLocation(program,'rect');screenLoc=gl.getUniformLocation(program,'screen');passLoc=gl.getUniformLocation(program,'maskPass');
  buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,1,1]),gl.STATIC_DRAW);
  gl.activeTexture(gl.TEXTURE0);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);upload(far);for(const p of planes)upload(p.canvas);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
  mask=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,mask);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);params();
  fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,mask,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('GPU alpha target incomplete');
  gl.viewport(0,0,w,h);bind(1,w,h);gl.disable(gl.BLEND);gl.colorMask(true,true,true,true);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  // FBO row zero is the authored top row, matching the existing packed CPU sampler.
  for(let i=0;i<4;i++){gl.colorMask(i===0,i===1,i===2,i===3);quad(textures[i+1],[0,0,w,h]);}
  stats.maskBuilds++;if(gl.getError()!==gl.NO_ERROR)throw Error('GPU static initialization failed');
 }catch(error){dispose();throw error;}finally{reset();}
 return {mask,w,h,stats,draw(rect,shift,logicalW,logicalH){
  if(disposed||gl.isContextLost())throw Error('GPU static context unavailable');
  try{gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight);bind(0,logicalW,logicalH);gl.colorMask(true,true,true,true);gl.disable(gl.BLEND);gl.clearColor(9/255,40/255,46/255,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  quad(textures[0],planeRect(rect,.70));for(let i=0;i<4;i++)quad(textures[i+1],planeRect(rect,DEPTH_PLANES[i],shift));stats.compositions++;
  }finally{reset();}
 },diagnosticMask(){const pixels=new Uint8Array(w*h*4);gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);try{gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;}finally{gl.bindFramebuffer(gl.FRAMEBUFFER,null);}},dispose};
}
export function comparePixels(a,b,threshold=12){
 if(a.length!==b.length||!a.length)throw Error('pixel size mismatch');
 let sum=0,max=0,bad=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);sum+=d;max=Math.max(max,d);if(d>threshold)bad++;}return {mean:sum/a.length,max,fraction:bad/a.length};
}
