import {DIRECTIONS} from './directions.js';

const $ = id => document.getElementById(id);
let active;
let sculpture;
let toastTimer;
const initialId = location.hash.slice(1);
const grid = $('comparison-grid');
for(const direction of DIRECTIONS){
  const link = document.createElement('a');
  link.className='comparison-card';
  link.href='#'+direction.id;
  const img=document.createElement('img');
  img.src=`assets/${direction.id}.jpg`;img.alt=direction.alt;img.width=1536;img.height=1024;img.loading='lazy';
  const title=document.createElement('h3');title.textContent=direction.name+' ↗';
  const p=document.createElement('p');p.textContent=direction.caption;
  link.append(img,title,p);grid.append(link);
  link.addEventListener('click',()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
}

function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2800);}
async function copy(value){try{await navigator.clipboard.writeText(value);toast('Copied: '+value);}catch{toast(value);}}
function setDirection(id){
  const d=DIRECTIONS.find(x=>x.id===id);
  if(!d || d===active)return;
  active=d;
  const root=document.documentElement;
  root.dataset.direction=d.id;
  for(const [key,value] of Object.entries(d.tokens))root.style.setProperty('--'+key,value);
  root.style.setProperty('--display',`'${d.display}'`);root.style.setProperty('--body',`'${d.body}'`);
  document.querySelector('meta[name="theme-color"]').content=d.tokens.bg;
  document.title=d.name+' | Avantix Labs website themes';
  $('headline').innerHTML=d.title;
  $('hero-description').textContent=d.description;
  $('service-heading').textContent=d.serviceHeading;
  $('direction-title').textContent=d.name;
  $('direction-summary').textContent=d.summary;
  $('font-pair').textContent=d.display+' + '+d.body;
  $('type-note').textContent=d.typeNote;
  $('motion-note').textContent=d.motion;
  $('fallback').src=`assets/${d.id}.jpg`;$('fallback').alt=d.alt;
  $('canvas').setAttribute('aria-label',d.name+' interactive 3D sculpture');
  for(const b of document.querySelectorAll('[data-pick]'))b.setAttribute('aria-pressed',String(b.dataset.pick===d.id));
  $('palette').replaceChildren();
  for(const [role,hex] of d.palette){
    const b=document.createElement('button');b.className='swatch';b.setAttribute('aria-label',`Copy ${role} color ${hex}`);
    const chip=document.createElement('span');chip.className='chip';chip.style.background=hex;
    const code=document.createElement('span');code.className='swatch-code';code.textContent=hex;
    const label=document.createElement('span');label.className='swatch-role';label.textContent=role;
    b.append(chip,code,label);b.addEventListener('click',()=>copy(hex));$('palette').append(b);
  }
  sculpture?.setDirection(d);
}

document.querySelectorAll('[data-pick]').forEach(button=>{
  button.addEventListener('click',()=>{history.replaceState(null,'','#'+button.dataset.pick);setDirection(button.dataset.pick);});
  button.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();let i=DIRECTIONS.findIndex(d=>d.id===button.dataset.pick);
    if(e.key==='Home')i=0;else if(e.key==='End')i=DIRECTIONS.length-1;else i=(i+(e.key==='ArrowRight'?1:-1)+DIRECTIONS.length)%DIRECTIONS.length;
    const next=document.querySelector(`[data-pick="${DIRECTIONS[i].id}"]`);next.focus();next.click();
  });
});
addEventListener('hashchange',()=>setDirection(location.hash.slice(1)));
$('share').addEventListener('click',()=>copy(location.href.split('#')[0]+'#'+active.id));
setDirection(DIRECTIONS.some(d=>d.id===initialId)?initialId:'signal');

// The theme controls and image fallback work even when WebGL is unavailable.
try{
  const {createSculpture}=await import('./sculpture.js');
  sculpture=createSculpture({canvas:$('canvas'),stage:$('stage'),status:$('render-status'),button:$('motion')});
  sculpture.setDirection(active);
}catch(error){
  $('stage').classList.remove('live');$('render-status').textContent='Still image preview';$('motion').textContent='3D unavailable';$('motion').disabled=true;
  console.warn('Using website theme image fallback.',error);
}
