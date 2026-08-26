/* Portugal 2026 — App V4 (Bilder in Hero/Timeline/Sheets, Karten A/B/C, Karte C entzerrt) */
const DB={meta:null,chapters:[],days:[],locations:[],maps:null,search:[]};
const byId={}; let currentMap='A';
async function loadJSON(p){const r=await fetch(p,{cache:'no-cache'});if(!r.ok)throw new Error(p);return r.json();}

async function boot(){
  try{
    const [meta,chapters,days,locations,maps,search]=await Promise.all([
      loadJSON('data/meta.json'),loadJSON('data/chapters.json'),loadJSON('data/days.json'),
      loadJSON('data/locations.json'),loadJSON('data/maps.json'),loadJSON('data/search-index.json')]);
    Object.assign(DB,{meta,chapters,days,locations,maps,search});
    locations.forEach(l=>byId[l.id]=l);
    render();
  }catch(e){
    document.getElementById('app').innerHTML='<div style="padding:40px;font-family:sans-serif">Daten konnten nicht geladen werden: '+e.message+'<br><br>Bitte über einen Webserver (GitHub Pages) öffnen.</div>';
    console.error(e);
  }
}
function cssVar(n){return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}
function chColor(ck){return cssVar('--'+({lisbon:'lisbon',atlantic:'atl',lagos:'lagos',golf:'golf',resort:'resort'}[ck]||'atl'));}
function fmt(iso){const[y,m,d]=iso.split('-');return `${d}.${m}.`;}

function render(){renderHero();renderKPIs();renderDaybar();renderTimeline();renderMapTabs();renderCurrentMap();buildSearch();}

function renderHero(){
  const imgs=(DB.meta.trip.heroCollage||[]);
  const c=document.getElementById('collage');
  if(imgs.length>=3){
    c.innerHTML=`<figure class="c0" style="background-image:url('${imgs[0]}')"></figure>
      <figure style="background-image:url('${imgs[1]}')"></figure>
      <figure style="background-image:url('${imgs[2]}')"></figure>`;
  }
  document.getElementById('heroSub').textContent=DB.meta.trip.subtitle;
  document.getElementById('heroDates').textContent=fmt(DB.meta.trip.startDate)+'–'+fmt(DB.meta.trip.endDate)+'2026';
}
function renderKPIs(){
  document.getElementById('kpis').innerHTML=DB.meta.trip.kpis.map(k=>`<div class="kpi"><b>${k.value}</b><span>${k.label}</span></div>`).join('');
}
function renderDaybar(){
  const bar=document.getElementById('daybar');
  bar.innerHTML=DB.days.map(d=>{const ck=DB.chapters.find(c=>c.id===d.chapterId)?.colorKey||'atl';
    return `<button class="daychip" data-ck="${ck}" data-day="${d.id}"><span class="d">${d.date.slice(8,10)}</span><span class="c">${d.code}</span></button>`;}).join('');
  bar.querySelectorAll('.daychip').forEach(chip=>chip.addEventListener('click',()=>{
    bar.querySelectorAll('.daychip').forEach(c=>c.classList.remove('active'));chip.classList.add('active');
    const d=DB.days.find(x=>x.id===chip.dataset.day);const ch=DB.chapters.find(c=>c.id===d.chapterId);
    if(ch&&ch.maps&&ch.maps[0]&&['A','B','C'].includes(ch.maps[0]))switchMap(ch.maps[0]);
    openDay(chip.dataset.day);
  }));
}
function renderTimeline(){
  const tl=document.getElementById('timeline');
  tl.innerHTML=DB.chapters.map(c=>{const col=chColor(c.colorKey);
    return `<article class="tl-card" data-chapter="${c.id}">
      ${c.hero?`<div class="bg" style="background-image:url('${c.hero}')"></div>`:''}
      <div class="grad" style="background:linear-gradient(180deg, ${col}22, ${col}e6)"></div>
      <div class="txt"><div class="roman">Kapitel ${c.roman} · ${fmt(c.dateFrom)}–${fmt(c.dateTo)}</div>
      <h3>${c.title}</h3><div class="cs">${c.subtitle}</div></div></article>`;}).join('');
  tl.querySelectorAll('.tl-card').forEach(card=>card.addEventListener('click',()=>openChapter(card.dataset.chapter)));
}

/* Karten-Tabs */
function renderMapTabs(){
  const tabs=document.getElementById('mapTabs');const order=['A','B','C','D','E','F'];
  tabs.innerHTML=order.filter(k=>DB.maps[k]).map(k=>{const m=DB.maps[k];const avail=['A','B','C'].includes(k);
    return `<button class="maptab ${k===currentMap?'active':''}" data-map="${k}" ${avail?'':'disabled'}>${k} · ${m.short||m.title}</button>`;}).join('');
  tabs.querySelectorAll('.maptab:not([disabled])').forEach(b=>b.addEventListener('click',()=>switchMap(b.dataset.map)));
}
function switchMap(k){if(!DB.maps[k])return;currentMap=k;
  document.querySelectorAll('.maptab').forEach(b=>b.classList.toggle('active',b.dataset.map===k));renderCurrentMap();}
function renderCurrentMap(){
  const m=DB.maps[currentMap];
  document.getElementById('mapTitle').textContent=m.title;
  window.PortugalMap.renderMap(document.getElementById('map-container'),m,byId,l=>openLocation(l.id));
  const legend=document.getElementById('mapLegend');
  let extra='';
  if(m.note && byId[m.note]) extra=`<span style="opacity:.85">Hinweis: ${byId[m.note].name} liegt weiter südlich (Sunset am 2.9.) und ist in der Suche.</span>`;
  legend.innerHTML=(m.routePath?`<span><i class="dotg"></i> Stationen</span><span>— — Fahrstrecke (stilisiert)</span>`
    :`<span><i class="dotg"></i> Orte in der Umgebung</span>`)+extra;
}

/* Bottom Sheet */
const sheet=()=>document.getElementById('sheet');
const backdrop=()=>document.getElementById('sheet-backdrop');
function showSheet(html){sheet().innerHTML='<div class="grip"></div>'+html;sheet().classList.add('open');backdrop().classList.add('open');sheet().scrollTop=0;}
function closeSheet(){sheet().classList.remove('open');backdrop().classList.remove('open');}

function openDay(dayId){
  const d=DB.days.find(x=>x.id===dayId);if(!d)return;const ch=DB.chapters.find(c=>c.id===d.chapterId);
  const stops=(d.locationIds||[]).map(id=>byId[id]).filter(Boolean);
  const heroLoc=stops.find(s=>s.image);
  showSheet(`${heroLoc?`<div class="sheet-hero" style="background-image:url('${heroLoc.image}')"></div>`:''}
    <h3>${d.title}</h3>
    <div class="meta">${d.weekday}, ${fmt(d.date)}2026 · ${ch?ch.title:''}</div>
    <ul class="agenda">${d.agenda.map(a=>`<li>${a}</li>`).join('')}</ul>
    <div style="margin-top:12px">${stops.map(s=>`<span class="tag" data-loc="${s.id}">📍 ${s.name}</span>`).join('')}</div>`);
  sheet().querySelectorAll('.tag[data-loc]').forEach(t=>t.addEventListener('click',()=>openLocation(t.dataset.loc)));
}
function openChapter(chId){
  const c=DB.chapters.find(x=>x.id===chId);if(!c)return;const days=DB.days.filter(d=>d.chapterId===chId);
  if(c.maps&&c.maps[0]&&['A','B','C'].includes(c.maps[0]))switchMap(c.maps[0]);
  showSheet(`${c.hero?`<div class="sheet-hero" style="background-image:url('${c.hero}')"></div>`:''}
    <h3>Kapitel ${c.roman} · ${c.title}</h3>
    <div class="meta">${c.subtitle} · ${fmt(c.dateFrom)}–${fmt(c.dateTo)}2026</div>
    <ul class="agenda">${days.map(d=>`<li data-day="${d.id}"><b>${fmt(d.date)}</b> &nbsp; ${d.title}</li>`).join('')}</ul>
    <div class="meta" style="margin-top:12px">Karten: ${c.maps.join(', ')}</div>`);
  sheet().querySelectorAll('.agenda li[data-day]').forEach(li=>li.addEventListener('click',()=>openDay(li.dataset.day)));
}
function openLocation(locId){
  const l=byId[locId];if(!l)return;const ch=DB.chapters.find(c=>c.id===l.chapterId);
  const days=DB.days.filter(d=>(d.locationIds||[]).includes(locId));
  const prec=({verified:'Koordinate verifiziert',approx:'Kartenpunkt näherungsweise',property:'Anlage regional verortet'})[l.precision]||'';
  showSheet(`${l.image?`<div class="sheet-hero" style="background-image:url('${l.image}')"></div>`:''}
    <h3>${l.name}</h3>
    <div class="meta">${l.type} · ${ch?ch.title:''}</div>
    <div>${(l.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
    ${days.length?`<ul class="agenda" style="margin-top:12px">${days.map(d=>`<li data-day="${d.id}"><b>${fmt(d.date)}</b> &nbsp; ${d.title}</li>`).join('')}</ul>`:''}
    <a class="cta" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lon}">In Karten öffnen ↗</a>
    <div class="meta" style="margin-top:10px">${prec}</div>`);
  sheet().querySelectorAll('.agenda li[data-day]').forEach(li=>li.addEventListener('click',()=>openDay(li.dataset.day)));
}

/* Suche */
function buildSearch(){
  const ov=document.getElementById('search-overlay');const inp=document.getElementById('search-input');const res=document.getElementById('search-results');
  const bt={city:'🏛️',beach:'🏖️',golf:'⛳',stay:'🏨',nature:'🪨',viewpoint:'🌅',airport:'✈️',village:'🏘️',region:'🗺️',marina:'⛵',district:'🏙️',trail:'🥾',activity:'🎾'};
  function run(q){q=(q||'').trim().toLowerCase();
    if(!q){res.innerHTML='<div class="sr-empty">Suche nach Orten, Tagen, Golf, Fado, Strand …</div>';return;}
    const hits=DB.search.filter(it=>it.title.toLowerCase().includes(q)||it.terms.some(t=>t.includes(q))).slice(0,40);
    if(!hits.length){res.innerHTML='<div class="sr-empty">Keine Treffer für „'+q+'“</div>';return;}
    res.innerHTML=hits.map(h=>{const loc=h.type==='location'?byId[h.id]:null;const b=loc?(bt[loc.type]||'📍'):'📅';
      const thumb=loc&&loc.image?`style="background-image:url('${loc.image}')" class="badge img"`:`class="badge"`;
      return `<div class="sr-item" data-kind="${h.target.kind}" data-id="${h.target.id}"><div ${thumb}>${loc&&loc.image?'':b}</div><div><div class="tt">${h.title}</div><div class="ss">${h.sub||''}</div></div></div>`;}).join('');
    res.querySelectorAll('.sr-item').forEach(it=>it.addEventListener('click',()=>{ov.classList.remove('open');inp.value='';
      it.dataset.kind==='location'?openLocation(it.dataset.id):openDay(it.dataset.id);}));
  }
  inp.addEventListener('input',()=>run(inp.value));
  document.getElementById('btn-search').addEventListener('click',()=>{ov.classList.add('open');setTimeout(()=>inp.focus(),150);run('');});
  document.getElementById('search-close').addEventListener('click',()=>{ov.classList.remove('open');inp.value='';});
}

document.addEventListener('DOMContentLoaded',()=>{document.getElementById('sheet-backdrop').addEventListener('click',closeSheet);boot();});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));}
