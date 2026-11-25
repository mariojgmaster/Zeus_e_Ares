import {useEffect,useRef,useState} from 'react';
import {mountAquarium} from './engine/aquarium.js';
import {loadSkins} from './engine/textures.js';
import {loadParallaxScene} from './engine/parallaxScene.js';
import {AquariumHeader,AquariumControls,ReferencePhoto} from './components/AquariumView.jsx';
function LoadingScreen({state,stage,onRetry}){return <div className={'aqua-loading '+(state==='ready'?'aqua-loading--ready':'')} role={state==='error'?'alert':'status'} aria-live="polite" aria-hidden={state==='ready'}><div className="aqua-loading-inner"><svg className="aqua-loading-mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="1" opacity=".24"/><path d="M10 31c8-11 16-11 23 0s16 11 21 0M10 38c8-8 16-8 23 0s16 8 21 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle className="aqua-loading-orbit" cx="32" cy="6" r="2.4" fill="#b4ded3"/></svg><p className="aqua-loading-kicker">AQUA ETERNA</p><h2>Zeus &amp; Ares</h2><p className="aqua-loading-stage">{state==='error'?'Não foi possível preparar o aquário.':state==='ready'?'Pronto':stage+'…'}</p>{state==='error'?<button onClick={onRetry}>Tentar novamente</button>:<div className="aqua-loading-track" aria-hidden="true"><span/></div>}</div></div>;}
export default function App(){
 const ref=useRef(null);const [state,setState]=useState('loading'),[stage,setStage]=useState('Carregando recursos');
 useEffect(()=>{
  const root=ref.current,controller=new AbortController();let stop,timer;let ended=false;
  const fail=error=>{if(controller.signal.aborted||ended)return;ended=true;clearTimeout(timer);setState('error');console.error(error);stop?.();};
  const ready=()=>{if(controller.signal.aborted||ended)return;ended=true;clearTimeout(timer);setState('ready');};
  const progress=s=>{if(!controller.signal.aborted&&!ended)setStage(s);};
  // Let the initial overlay paint, then fetch both groups concurrently.
  const raf=requestAnimationFrame(()=>{const scenePromise=loadParallaxScene(import.meta.env.BASE_URL+'parallax/');scenePromise.catch(fail);
   loadSkins(controller.signal).then(skins=>{if(controller.signal.aborted||ended)return;progress('Preparando Zeus e Ares');stop=mountAquarium(root,skins,{scenePromise,onProgress:progress,onReady:ready,onError:fail});}).catch(fail);
  });
  timer=setTimeout(()=>fail(Error('Tempo limite de inicialização')),60000);
  return ()=>{controller.abort();cancelAnimationFrame(raf);clearTimeout(timer);stop?.();};
 },[]);
 return <><div ref={ref} className="aquarium-root" inert={state!=='ready'} aria-busy={state==='loading'}><canvas id="tank" aria-label="Aquário virtual interativo de Zeus e Ares"/><AquariumHeader/><AquariumControls/><ReferencePhoto/></div><LoadingScreen state={state} stage={stage} onRetry={()=>location.reload()}/></>;
}
