import zeusSkin from '../assets/zeus-skin.deflate?url';
import aresSkin from '../assets/ares-skin.deflate?url';
export async function loadSkins(signal){
 if(typeof DecompressionStream!=='function')throw Error('Navegador sem suporte a descompressão nativa.');
 return Promise.all([zeusSkin,aresSkin].map(async url=>{
  const response=await fetch(url,{signal});
  if(!response.ok)throw Error('Textura indisponível: '+response.status);
  const compressed=await response.arrayBuffer();
  const rgb=new Uint8Array(await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  if(rgb.length!==768*768*3)throw Error('Textura inválida');
  const rgba=new Uint8Array(768*768*4);
  for(let i=0,j=0;i<rgb.length;i+=3,j+=4){rgba[j]=rgb[i];rgba[j+1]=rgb[i+1];rgba[j+2]=rgb[i+2];rgba[j+3]=255;}
  return rgba;
 }));
}
