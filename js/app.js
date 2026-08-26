/* Portugal 2026 — App Shell V2  (Datenmodell-Anbindung, Karte A, Suche) */
const DB = { meta:null, chapters:[], days:[], locations:[], maps:null, search:[] };
const byId = {};

async function loadJSON(p){ const r = await fetch(p, {cache:'no-cache'}); if(!r.ok) throw new Error(p); return r.json(); }

async function boot(){
  try{
    const [meta,chapters,days,locations,maps,search] = await Promise.all([
      loadJSON('data/meta.json'), loadJSON('data/chapters.json'),
      loadJSON('data/days.json'), loadJSON('data/locations.json'),
      loadJSON('data/maps.json'), loadJSON('data/search-index.json')
    ]);
    Object.assign(DB,{meta,chapters,days,locations,maps,search});
    locations.forEach(l=>byId[l.id]=l);
    render();
  }catch(e){
    document.getElementById('app').innerHTML =
      '<div style="padding:40px;font-family:sans-serif">Daten konnten nicht geladen werden: '+e.message+
      '<br><br>Bitte über einen Webserver (z. B. GitHub Pages) öffnen, nicht per Doppelklick.</div>';
    console.error(e);
  }
}

function chapterColor(ck){return getComputedStyle(document.documentElement).getPropertyValue('--'+
  ({lisbon:'lisbon',atlantic:'atl',lagos:'lagos',golf:'golf',resort:'resort'}[ck]||'atl')).trim();}

function fmtDate(iso){const[y,m,d]=iso.split('-');return `${d}.${m}.`;}

function render(){
  renderKPIs();
  renderDaybar();
  renderTimeline();
  renderMap();
  buildSearch();
}

/* ---- KPIs ---- */
function renderKPIs(){
  const el=document.getElementById('kpis');
  el.innerHTML = DB.meta.trip.kpis.map(k=>`<div class="kpi"><b>${k.value}</b><span>${k.label}</span></div>`).join('');
  document.getElementById('heroSub').textContent = DB.meta.trip.subtitle;
  document.getElementById('heroDates').textContent =
    fmtDate(DB.meta.trip.startDate)+'–'+fmtDate(DB.meta.trip.endDate)+'2026';
}

/* ---- Day-by-day Leiste ---- */
function renderDaybar(){
  const bar=document.getElementById('daybar');
  bar.innerHTML = DB.days.map(d=>{
    const ck = DB.chapters.find(c=>c.id===d.chapterId)?.colorKey||'atl';
    const dd = d.date.slice(8,10);
    return `<button class="daychip" data-ck="${ck}" data-day="${d.id}">
      <span class="d">${dd}</span><span class="c">${d.code}</span></button>`;
  }).join('');
  bar.querySelectorAll('.daychip').forEach(chip=>{
    chip.addEventListener('click',()=>{
      bar.querySelectorAll('.daychip').forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');
      openDay(chip.dataset.day);
    });
  });
}

/* ---- Timeline (Kapitel) ---- */
function renderTimeline(){
  const tl=document.getElementById('timeline');
  tl.innerHTML = DB.chapters.map(c=>{
    const col = chapterColor(c.colorKey);
    return `<article class="tl-card" data-chapter="${c.id}">
      <div class="grad" style="background:linear-gradient(180deg, ${col}22, ${col}dd)"></div>
      <div class="txt">
        <div class="roman">Kapitel ${c.roman} · ${fmtDate(c.dateFrom)}–${fmtDate(c.dateTo)}</div>
        <h3>${c.title}</h3>
        <div class="cs">${c.subtitle}</div>
      </div>
    </article>`;
  }).join('');
  tl.querySelectorAll('.tl-card').forEach(card=>{
    card.addEventListener('click',()=>openChapter(card.dataset.chapter));
  });
}

/* ---- Karte A ---- */
function renderMap(){
  const wrap=document.getElementById('mapA-container');
  window.PortugalMap.renderMapA(wrap, DB.maps.A, byId, (loc)=>openLocation(loc.id));
  document.getElementById('mapTitle').textContent = DB.maps.A.title;
}

/* ---- Bottom Sheet ---- */
const sheet=()=>document.getElementById('sheet');
const backdrop=()=>document.getElementById('sheet-backdrop');
function showSheet(html){
  sheet().innerHTML='<div class="grip"></div>'+html;
  sheet().classList.add('open'); backdrop().classList.add('open');
}
function closeSheet(){ sheet().classList.remove('open'); backdrop().classList.remove('open'); }

function openDay(dayId){
  const d=DB.days.find(x=>x.id===dayId); if(!d) return;
  const ch=DB.chapters.find(c=>c.id===d.chapterId);
  const stops=(d.locationIds||[]).map(id=>byId[id]?.name).filter(Boolean);
  showSheet(`
    <h3>${d.title}</h3>
    <div class="meta">${d.weekday}, ${fmtDate(d.date)}2026 · ${ch?ch.title:''}</div>
    <ul class="agenda">${d.agenda.map(a=>`<li>${a}</li>`).join('')}</ul>
    <div style="margin-top:12px">${stops.map(s=>`<span class="tag">📍 ${s}</span>`).join('')}</div>
  `);
}
function openChapter(chId){
  const c=DB.chapters.find(x=>x.id===chId); if(!c) return;
  const days=DB.days.filter(d=>d.chapterId===chId);
  showSheet(`
    <h3>Kapitel ${c.roman} · ${c.title}</h3>
    <div class="meta">${c.subtitle} · ${fmtDate(c.dateFrom)}–${fmtDate(c.dateTo)}2026</div>
    <ul class="agenda">${days.map(d=>`<li><b>${fmtDate(d.date)}</b> &nbsp; ${d.title}</li>`).join('')}</ul>
    <div class="meta" style="margin-top:12px">Karten: ${c.maps.join(', ')}</div>
  `);
}
function openLocation(locId){
  const l=byId[locId]; if(!l) return;
  const ch=DB.chapters.find(c=>c.id===l.chapterId);
  const days=DB.days.filter(d=>(d.locationIds||[]).includes(locId));
  const prec = ({verified:'Koordinate verifiziert',approx:'Kartenpunkt näherungsweise',property:'Anlage regional verortet'})[l.precision]||'';
  showSheet(`
    <h3>${l.name}</h3>
    <div class="meta">${l.type} · ${ch?ch.title:''}</div>
    <div>${(l.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
    ${days.length?`<ul class="agenda" style="margin-top:12px">
      ${days.map(d=>`<li><b>${fmtDate(d.date)}</b> &nbsp; ${d.title}</li>`).join('')}</ul>`:''}
    <a class="cta" target="_blank" rel="noopener"
       href="https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lon}">In Karten öffnen ↗</a>
    <div class="meta" style="margin-top:10px">${prec}</div>
  `);
}

/* ---- Suche ---- */
function buildSearch(){
  const ov=document.getElementById('search-overlay');
  const inp=document.getElementById('search-input');
  const res=document.getElementById('search-results');
  const emoji={location:'📍',day:'📅'};
  const badgeType={city:'🏛️',beach:'🏖️',golf:'⛳',stay:'🏨',nature:'🪨',viewpoint:'🌅',
    airport:'✈️',village:'🏘️',region:'🗺️',marina:'⛵',district:'🏙️',trail:'🥾',activity:'🎾'};

  function run(q){
    q=(q||'').trim().toLowerCase();
    if(!q){ res.innerHTML='<div class="sr-empty">Suche nach Orten, Tagen, Golf, Fado, Strand …</div>'; return; }
    const hits=DB.search.filter(it=>
      it.title.toLowerCase().includes(q) || it.terms.some(t=>t.includes(q))
    ).slice(0,40);
    if(!hits.length){ res.innerHTML='<div class="sr-empty">Keine Treffer für „'+q+'“</div>'; return; }
    res.innerHTML=hits.map(h=>{
      const loc = h.type==='location'?byId[h.id]:null;
      const bicon = loc?(badgeType[loc.type]||emoji.location):emoji.day;
      return `<div class="sr-item" data-kind="${h.target.kind}" data-id="${h.target.id}">
        <div class="badge">${bicon}</div>
        <div><div class="tt">${h.title}</div><div class="ss">${h.sub||''}</div></div>
      </div>`;
    }).join('');
    res.querySelectorAll('.sr-item').forEach(item=>{
      item.addEventListener('click',()=>{
        closeSearch();
        if(item.dataset.kind==='location') openLocation(item.dataset.id);
        else openDay(item.dataset.id);
      });
    });
  }
  inp.addEventListener('input',()=>run(inp.value));
  document.getElementById('btn-search').addEventListener('click',()=>{
    ov.classList.add('open'); setTimeout(()=>inp.focus(),150); run('');
  });
  document.getElementById('search-close').addEventListener('click',closeSearch);
  function closeSearch(){ ov.classList.remove('open'); inp.value=''; }
  window.__closeSearch=closeSearch;
}

/* Wiring */
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('sheet-backdrop').addEventListener('click',closeSheet);
  boot();
});
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
}
