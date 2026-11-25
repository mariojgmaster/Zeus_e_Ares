import {useEffect,useRef} from 'react';
import {mountAquarium} from './engine/aquarium.js';
import {loadSkins} from './engine/textures.js';
import {AquariumHeader,AquariumControls,ReferencePhoto} from './components/AquariumView.jsx';

export default function App(){
 const ref=useRef(null);
 useEffect(()=>{
  const root=ref.current,controller=new AbortController();
  let stop;
  const status=root.querySelector('#status');
  status.textContent='Preparando texturas dos peixes…';
  loadSkins(controller.signal).then(skins=>{
   if(controller.signal.aborted)return;
   stop=mountAquarium(root,skins);
   status.textContent='Toque no vidro para chamar os peixes.';
  }).catch(error=>{
   if(controller.signal.aborted)return;
   status.textContent='Não foi possível iniciar. Abra em uma versão atual do Chrome, Edge, Firefox ou Safari.';
   console.error(error);
  });
  return ()=>{controller.abort();stop?.();};
 },[]);
 return <div ref={ref} className="aquarium-root">
 <canvas id="tank" aria-label="Aquário virtual interativo de Zeus e Ares"></canvas>
 <AquariumHeader/>
 <AquariumControls/>
 <ReferencePhoto/>
 </div>;
}
