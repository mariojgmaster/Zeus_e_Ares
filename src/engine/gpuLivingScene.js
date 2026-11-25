import {plantProfile,plantPhase,wakeTarget,advanceWake} from './livingVegetation.js';
import {cameraFactor,PLANES} from './parallaxScene.js';
export function createPoseState(layers){const wakes=new Map();return {update(time,dt,flow,fish,on){return {time,flow:on?flow:0,wakes:layers.map(l=>{if(!on){wakes.delete(l.id);return 0;}const v=advanceWake(wakes.get(l.id)??0,wakeTarget(l,fish),dt);wakes.set(l.id,v);return v;})};}};}
const vs=`attribute vec2 uv;uniform vec4 local,view,motion;uniform vec2 screen,root;uniform float time,flow,maskPass;varying vec2 v,p;void main(){v=uv;p=local.xy+uv*local.zw;float q=clamp((root.x-p.y)/root.y,0.,1.);p.x+=q*q*motion.x*(flow*(.68*sin(time*motion.y+motion.z-q*1.6)+.24*sin(time*.31+motion.z*.73-q*3.2))+.85*motion.w);vec2 s=view.xy+p*view.zw;gl_Position=vec4(s/screen*vec2(2.,maskPass>.5?2.:-2.)+vec2(-1.,maskPass>.5?-1.:1.),0.,1.);}`;
const fs=`precision highp float;varying vec2 v,p;uniform sampler2D image;uniform vec2 nativeSize;uniform vec4 tint;uniform float maskPass;void main(){if(any(lessThan(p,vec2(0.)))||any(greaterThanEqual(p,nativeSize)))discard;vec4 c=texture2D(image,v);gl_FragColor=maskPass>.5?vec4(c.a):vec4(mix(c.rgb,tint.rgb*c.a,tint.a),c.a);}`;
export function createLivingRenderer(gl,source,maskOnly=false){
 const {w,h,sprites,water,optics}=source;if(!gl||gl.isContextLost()||!gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT)?.precision||Math.max(w,h)>gl.getParameter(gl.MAX_TEXTURE_SIZE))throw Error('GPU living unsupported');
 const tex=[],shaders=[];let prog,buf,fbo,mask,loc,U,items,waterTex,disposed=false;const rows=48,vao=gl.getExtension('OES_vertex_array_object'),stats={uploads:0,frames:0};
 function dispose(){if(disposed)return;disposed=true;for(const t of tex)gl.deleteTexture(t);for(const s of shaders)gl.deleteShader(s);if(prog)gl.deleteProgram(prog);if(buf)gl.deleteBuffer(buf);if(fbo)gl.deleteFramebuffer(fbo);if(mask)gl.deleteTexture(mask);}
 function compile(type,src){const s=gl.createShader(type);shaders.push(s);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 function params(){for(const [p,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,p,v);}
 function upload(c){const t=gl.createTexture();tex.push(t);gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);params();stats.uploads++;return t;}
 function restore(){gl.colorMask(true,true,true,true);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.activeTexture(gl.TEXTURE0);gl.enable(gl.DITHER);if(loc>=0)gl.disableVertexAttribArray(loc);}
 try{prog=gl.createProgram();gl.attachShader(prog,compile(gl.VERTEX_SHADER,vs));gl.attachShader(prog,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
 loc=gl.getAttribLocation(prog,'uv');U=Object.fromEntries(['local','view','motion','screen','root','time','flow','maskPass','image','nativeSize','tint'].map(k=>[k,gl.getUniformLocation(prog,k)]));
 const vertices=[];for(let i=0;i<=rows;i++)vertices.push(0,i/rows,1,i/rows);buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
 gl.activeTexture(gl.TEXTURE0);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);if(!maskOnly)waterTex=upload(water);
 items=sprites.map(({l,c},i)=>{if(maskOnly&&l.z===.7)return null;const p=plantProfile(l.asset);return {l,i,t:upload(c),rect:[l.x-18,l.y-18,c.width,c.height],amp:p?p.amplitude*Math.min(1.2,l.h/600+.35):0,freq:p?.frequency??0,phase:plantPhase(l.id)};}).filter(Boolean);
 if(maskOnly){mask=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,mask);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);params();fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,mask,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('mask framebuffer');}
 if(gl.getError()!==gl.NO_ERROR)throw Error('GPU living init');
 }catch(e){dispose();throw e;}finally{restore();}
 const u4=(k,v)=>gl.uniform4fv(U[k],v);
 function quad(t,local,view,motion,root,tint){gl.bindTexture(gl.TEXTURE_2D,t);u4('local',local);u4('view',view);u4('motion',motion);gl.uniform2fv(U.root,root);u4('tint',tint);gl.drawArrays(gl.TRIANGLE_STRIP,0,(rows+1)*2);}
 function draw(rect,shift,W,H,pose){if(disposed||gl.isContextLost())throw Error('GPU unavailable');try{
 if(vao)vao.bindVertexArrayOES(null);gl.bindFramebuffer(gl.FRAMEBUFFER,maskOnly?fbo:null);gl.viewport(0,0,maskOnly?w:gl.drawingBufferWidth,maskOnly?h:gl.drawingBufferHeight);gl.useProgram(prog);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);gl.activeTexture(gl.TEXTURE0);gl.uniform1i(U.image,0);gl.uniform2f(U.nativeSize,w,h);gl.uniform2f(U.screen,maskOnly?w:W,maskOnly?h:H);gl.uniform1f(U.maskPass,+maskOnly);gl.uniform1f(U.time,pose.time);gl.uniform1f(U.flow,pose.flow);
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.DITHER);gl.colorMask(true,true,true,true);gl.disable(gl.BLEND);gl.clearColor(maskOnly?0:9/255,maskOnly?0:40/255,maskOnly?0:46/255,maskOnly?0:1);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
 const view=z=>maskOnly?[0,0,1,1]:[rect.x+shift[0]*rect.dw*cameraFactor(z),rect.y+shift[1]*rect.dh*cameraFactor(z),rect.dw/w,rect.dh/h];
 const tint=z=>!optics.enabled?[0,0,0,0]:z===.7?[34/255,91/255,91/255,.16]:[39/255,101/255,99/255,[.14,.10,.065,.032][PLANES.indexOf(z)]];
 if(!maskOnly)quad(waterTex,[0,0,w,h],view(.7),[0,0,0,0],[h,h],tint(.7));
 let last=-1;for(const {l,i,t,rect,amp,freq,phase} of items){if(maskOnly&&l.z!==last){last=l.z;const j=PLANES.indexOf(l.z);gl.colorMask(j===0,j===1,j===2,j===3);}quad(t,rect,view(l.z),[amp,freq,phase,pose.wakes[i]??0],[l.y+l.h,l.h],tint(l.z));}stats.frames++;
 }finally{restore();}}
 return {mask,stats,draw,dispose};
}
