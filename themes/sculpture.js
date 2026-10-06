import * as THREE from 'three';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';

function rounded(w,h,r){
  const s=new THREE.Shape(),x=-w/2,y=-h/2;
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;
}
function linkGeometry(w,h,band,depth){
  const s=rounded(w,h,.35);s.holes.push(rounded(w-band*2,h-band*2,.18));
  const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:4,bevelSize:.06,bevelThickness:.06,steps:1,curveSegments:20});g.center();return g;
}
function material(color,metalness=.8,roughness=.3){return new THREE.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.25});}
function signal(){
  const group=new THREE.Group(),rails=[],graphite=material('#3B4039',.85,.3),citron=material('#D1DE59',.2,.34),g=linkGeometry(2.45,1.7,.24,.18);
  for(let i=0;i<3;i++){const m=new THREE.Mesh(g,graphite);m.position.z=(i-1)*.5;m.rotation.z=(i-1)*.18;group.add(m);rails.push(m);}
  const carrier=new THREE.Mesh(new THREE.BoxGeometry(.35,.4,.3),citron);group.add(carrier);
  group.rotation.set(.24,-.5,-.12);
  return {group,update(t){rails.forEach((m,i)=>{m.position.z=(i-1)*(.5+Math.sin(t*.35)*.13);});carrier.position.set(Math.sin(t*.7)*.95,.66,Math.cos(t*.7)*.5);}};
}
function nocturne(){
  const group=new THREE.Group(),fins=[];
  const glass=new THREE.MeshPhysicalMaterial({color:'#91DDD2',metalness:.05,roughness:.11,transmission:.72,thickness:.4,ior:1.45,clearcoat:1,attenuationColor:'#297C79',attenuationDistance:2.5});
  const s=rounded(.5,2.65,.22),g=new THREE.ExtrudeGeometry(s,{depth:.14,bevelEnabled:true,bevelSegments:4,bevelSize:.05,bevelThickness:.05,curveSegments:20});g.center();
  for(let i=0;i<7;i++){const pivot=new THREE.Group(),m=new THREE.Mesh(g,glass);m.position.y=.9;pivot.add(m);group.add(pivot);fins.push(pivot);}
  const spine=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,2.2,32),material('#52646B',.95,.24));spine.rotation.z=Math.PI/2;spine.position.y=-.5;group.add(spine);
  group.rotation.set(.06,-.3,-.12);
  return {group,update(t){fins.forEach((m,i)=>{m.rotation.z=(i-3)*(.17+Math.sin(t*.4)*.035);m.position.x=(i-3)*.13;m.position.z=(i-3)*.22;m.position.y=-.4;});}};
}
function garnet(){
  const group=new THREE.Group(),segments=200,across=12,positions=[],uvs=[],indices=[];
  // A broad ribbon with a changing cross-section, rather than a spherical blob.
  for(let i=0;i<=segments;i++){
    const t=i/segments*Math.PI*2;
    const center=new THREE.Vector3(1.25*Math.cos(t),.8*Math.sin(t),.7*Math.sin(t*2));
    const radial=new THREE.Vector3(Math.cos(t),Math.sin(t),0),normal=new THREE.Vector3(0,0,1);
    const twist=t*.5+.4*Math.sin(t*2);
    const cross=radial.multiplyScalar(Math.cos(twist)).add(normal.multiplyScalar(Math.sin(twist)));
    for(let j=0;j<=across;j++){const v=center.clone().addScaledVector(cross,(j/across-.5)*.72);positions.push(v.x,v.y,v.z);uvs.push(i/segments,j/across);}
  }
  for(let i=0;i<segments;i++)for(let j=0;j<across;j++){const a=i*(across+1)+j,b=a+across+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
  const satin=new THREE.MeshPhysicalMaterial({color:'#D5A6B4',metalness:.5,roughness:.33,side:THREE.DoubleSide,anisotropy:.8,sheen:.5,sheenColor:'#F0CBDA',clearcoat:.2});
  const m=new THREE.Mesh(g,satin);group.add(m);group.rotation.set(.48,-.2,.2);
  return {group,update(t){group.rotation.y=-.2+Math.sin(t*.22)*.45;group.rotation.z=.2+Math.sin(t*.3)*.06;}};
}
function ember(){
  const group=new THREE.Group(),copper=material('#E9AF88',1,.28),smoke=material('#6C6258',1,.32),g=linkGeometry(2.3,1.4,.27,.24);
  const a=new THREE.Mesh(g,copper),b=new THREE.Mesh(g,smoke);a.position.x=-.72;b.position.x=.72;b.rotation.x=Math.PI/2;group.add(a,b);group.rotation.set(.25,.12,-.15);
  return {group,update(t){group.rotation.y=.12+Math.sin(t*.28)*.22;group.rotation.x=.25+Math.sin(t*.2)*.08;}};
}
const builds={signal,nocturne,garnet,ember};

export function createSculpture({canvas,stage,status,button}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'default'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.1,40);camera.position.set(0,.1,7.5);
  const environment=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(environment,.04);
  scene.environment=env.texture;environment.dispose();pmrem.dispose();
  const key=new THREE.DirectionalLight('#F8F5EF',3);key.position.set(3,4,5);scene.add(key);
  const fill=new THREE.DirectionalLight('#BDDCDF',1.8);fill.position.set(-4,1,2);scene.add(fill);
  scene.add(new THREE.HemisphereLight('#F3EFE7','#313633',1.3));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let current,currentId,t=0,frameId=0,last=0,visible=true,userPaused=false,contextLost=false;
  let pointer={x:0,y:0},smooth={x:0,y:0};
  function paused(){return userPaused||reduced.matches;}
  function sync(){button.disabled=reduced.matches;button.textContent=reduced.matches?'Reduced motion':paused()?'Resume motion':'Pause motion';button.setAttribute('aria-pressed',String(paused()));status.textContent=reduced.matches?'3D preview / reduced motion':paused()?'3D preview / paused':'Live 3D / move your pointer';}
  function draw(now=performance.now()){
    frameId=0;
    if(!current||contextLost||!visible||document.hidden)return;
    const delta=last?Math.min((now-last)/1000,.05):0;last=now;
    if(!paused()){t+=delta;smooth.x+=(pointer.x-smooth.x)*.055;smooth.y+=(pointer.y-smooth.y)*.055;}else{smooth.x=0;smooth.y=0;}
    current.update(t);current.group.position.y=Math.sin(t*.45)*.035;
    camera.position.set(smooth.x*.3,.1-smooth.y*.25,7.5);camera.lookAt(0,.15,0);
    renderer.render(scene,camera);stage.classList.add('live');
    if(!paused())frameId=requestAnimationFrame(draw);
  }
  function wake(){if(!frameId){last=0;frameId=requestAnimationFrame(draw);}}
  function dispose(group){const geometries=new Set(),materials=new Set();group.traverse(n=>{if(n.geometry)geometries.add(n.geometry);if(n.material)for(const m of [].concat(n.material))materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
  function resize(){const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();if(current)current.group.scale.setScalar(currentId==='ember'?THREE.MathUtils.clamp(camera.aspect*.75,1,1.7):1.25);wake();}
  const observer=new ResizeObserver(resize);observer.observe(stage);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else if(frameId){cancelAnimationFrame(frameId);frameId=0;}},{threshold:0}).observe(stage);
  stage.addEventListener('pointermove',e=>{if(paused())return;const r=stage.getBoundingClientRect();pointer={x:(e.clientX-r.left)/r.width*2-1,y:(e.clientY-r.top)/r.height*2-1};});
  stage.addEventListener('pointerleave',()=>{pointer={x:0,y:0};});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake();});
  reduced.addEventListener('change',()=>{sync();wake();});
  button.disabled=false;button.addEventListener('click',()=>{if(reduced.matches){status.textContent='Motion disabled by your device preference';return;}userPaused=!userPaused;sync();wake();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;stage.classList.remove('live');status.textContent='Still image preview / graphics unavailable';button.disabled=true;if(frameId)cancelAnimationFrame(frameId);frameId=0;});
  canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;button.disabled=false;sync();resize();});
  return {setDirection(d){
    stage.classList.remove('live');if(current){scene.remove(current.group);dispose(current.group);}
    currentId=d.id;current=builds[d.id]();scene.add(current.group);scene.background=new THREE.Color(d.tokens.bg);renderer.toneMappingExposure=d.exposure;t=0;pointer={x:0,y:0};smooth={x:0,y:0};sync();resize();
  }};
}
