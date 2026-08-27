/* Portugal 2026 — App V5 RC4.1
   RC4 + kopiersichere Copilot-Prompts: Prompt sichtbar + "Kopieren"-Button
   (bei "🎧 Hier & Jetzt" und "🤖 Frag Copilot"), da Copilot ?q= nicht immer übernimmt. */
const DB = { meta:null, home:null, chapters:[], days:[], locations:[], maps:null, search:[], accommodations:[], restaurants:null };
const byId = {};
let currentMap = 'A';

async function loadJSON(path){ const r = await fetch(path,{cache:'no-cache'}); if(!r.ok) throw new Error(path); return r.json(); }
async function boot(){
  try{
    const [meta,home,chapters,days,locations,maps,search,accommodations,restaurants] = await Promise.all([
      loadJSON('data/meta.json'), loadJSON('data/home.json'), loadJSON('data/chapters.json'),
      loadJSON('data/days.json'), loadJSON('data/locations.json'), loadJSON('data/maps.json'),
      loadJSON('data/search-index.json'), loadJSON('data/accommodations.json'), loadJSON('data/restaurants.json')
    ]);
    Object.assign(DB,{meta,home,chapters,days,locations,maps,search,accommodations,restaurants});
    locations.forEach(l => { byId[l.id] = l; });
    render();
  }catch(e){
    document.getElementById('app').innerHTML =
      '<div style="padding:40px;font-family:sans-serif"><h2>App konnte nicht starten</h2><p>'+e.message+
      '</p><p>Bitte die GitHub-Pages-URL online öffnen und neu laden.</p></div>';
    console.error(e);
  }
}
function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function chapterColor(k){ return cssVar('--'+({lisbon:'lisbon',atlantic:'atl',lagos:'lagos',golf:'golf',resort:'resort'}[k]||'atl')); }
function fmtDate(iso){ const [,m,d] = iso.split('-'); return `${d}.${m}.`; }
function noon(iso){ return new Date(`${iso}T12:00:00`); }
function today12(){ const n = new Date(); return new Date(n.getFullYear(),n.getMonth(),n.getDate(),12); }
function diffDays(a,b){ return Math.round((a-b)/86400000); }
function mapsHref(query){ return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`; }
function esc(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function tripState(){
  const start=noon(DB.meta.trip.startDate), end=noon(DB.meta.trip.endDate), t=today12();
  if(t<start){ const d=diffDays(start,t); return {phase:'before', value:'0 / 14', label:d===1?'Start morgen':`Start in ${d} Tagen`, day:DB.days[0]}; }
  if(t>end)   return {phase:'after', value:'14 / 14', label:'Reise beendet', day:DB.days[DB.days.length-1]};
  const idx=diffDays(t,start)+1; return {phase:'during', value:`${idx} / 14`, label:'Reisetag', day:DB.days[idx-1]};
}
function render(){ renderHero(); renderActionCards(); renderDaybar(); renderMapTabs(); renderCurrentMap(); renderTimeline(); buildSearch(); markCurrentDay(); }

function renderHero(){
  const imgs = DB.meta.trip.heroCollage || [], c = document.getElementById('collage');
  if(c && imgs.length>=3){
    c.innerHTML = `<figure class="c0" style="background-image:url('${imgs[0]}')"></figure>`+
                  `<figure style="background-image:url('${imgs[1]}')"></figure>`+
                  `<figure style="background-image:url('${imgs[2]}')"></figure>`;
  }
  document.getElementById('heroSub').textContent = DB.meta.trip.subtitle;
  document.getElementById('heroDates').textContent = fmtDate(DB.meta.trip.startDate)+'–'+fmtDate(DB.meta.trip.endDate)+'2026';
}
function renderActionCards(){
  const s = tripState();
  document.getElementById('kpis').innerHTML =
    `<button class="kpi action-card" data-action="tripday"><b>${s.value}</b><span>${s.label}</span></button>`+
    `<button class="kpi action-card" data-action="accommodations"><b>4</b><span>Unterkünfte</span></button>`+
    `<button class="kpi action-card" data-action="weather"><b>☀</b><span>Wetter</span></button>`+
    `<button class="kpi action-card" data-action="hereandnow"><b>🎧</b><span>Hier &amp; Jetzt</span></button>`;
  document.querySelectorAll('.action-card').forEach(card => card.addEventListener('click',()=>{
    const a = card.dataset.action;
    if(a==='tripday') openToday();
    else if(a==='accommodations') openAccommodations();
    else if(a==='weather') openWeather();
    else if(a==='hereandnow') openHereAndNow();
  }));
}
function renderDaybar(){
  const bar = document.getElementById('daybar');
  bar.innerHTML = DB.days.map(d=>{
    const ck = DB.chapters.find(c=>c.id===d.chapterId)?.colorKey || 'atl';
    const hasFixed = d.agenda.some(x=>/^\d{2}:\d{2}/.test(x));
    const mark = d.date==='2026-09-02' ? '★' : (hasFixed ? '•' : '');
    return `<button class="daychip" data-ck="${ck}" data-day="${d.id}"><span class="d">${d.date.slice(8,10)}${mark?`<small>${mark}</small>`:''}</span><span class="c">${d.code}</span></button>`;
  }).join('');
  bar.querySelectorAll('.daychip').forEach(chip => chip.addEventListener('click',()=>{
    bar.querySelectorAll('.daychip').forEach(c=>c.classList.remove('active'));
    chip.classList.add('active'); openDay(chip.dataset.day);
  }));
}
function markCurrentDay(){
  const s = tripState();
  if(s.phase==='during'){
    const c = document.querySelector(`.daychip[data-day="${s.day.id}"]`);
    if(c){ c.classList.add('active'); c.scrollIntoView({inline:'center',block:'nearest'}); }
  }
}
function renderTimeline(){
  const tl = document.getElementById('timeline');
  tl.innerHTML = DB.chapters.map(c=>{
    const col = chapterColor(c.colorKey);
    return `<article class="tl-card" data-chapter="${c.id}">`+
      (c.hero?`<div class="bg" style="background-image:url('${c.hero}')"></div>`:'')+
      `<div class="grad" style="background:linear-gradient(180deg, ${col}22, ${col}e6)"></div>`+
      `<div class="txt"><div class="roman">Kapitel ${c.roman} · ${fmtDate(c.dateFrom)}–${fmtDate(c.dateTo)}</div>`+
      `<h3>${c.title}</h3><div class="cs">${c.subtitle}</div></div></article>`;
  }).join('');
  tl.querySelectorAll('.tl-card').forEach(x=>x.addEventListener('click',()=>openChapter(x.dataset.chapter)));
}
function renderMapTabs(){
  const tabs = document.getElementById('mapTabs');
  tabs.innerHTML = ['A','B','C'].map(k=>`<button class="maptab ${k===currentMap?'active':''}" data-map="${k}">${k} · ${DB.maps[k].short||DB.maps[k].title}</button>`).join('');
  tabs.querySelectorAll('.maptab').forEach(b=>b.addEventListener('click',()=>switchMap(b.dataset.map)));
}
function switchMap(k){ if(!DB.maps[k])return; currentMap=k; document.querySelectorAll('.maptab').forEach(b=>b.classList.toggle('active',b.dataset.map===k)); renderCurrentMap(); }
function renderCurrentMap(){
  const m = DB.maps[currentMap];
  document.getElementById('mapTitle').textContent = m.title;
  window.PortugalMap.renderMap(document.getElementById('map-container'), m, byId, l=> l.isHub ? openChapter('chapter_golf') : openLocation(l.id));
  document.getElementById('mapLegend').innerHTML = '<span><i class="dotg"></i> Stationen</span><span>— — Fahrstrecke (stilisiert)</span>';
}

const sheet = ()=>document.getElementById('sheet');
const backdrop = ()=>document.getElementById('sheet-backdrop');
function showSheet(html){ sheet().innerHTML = '<div class="grip"></div>'+html; sheet().classList.add('open'); backdrop().classList.add('open'); sheet().scrollTop=0; wireCopilotBlocks(); }
function closeSheet(){ sheet().classList.remove('open'); backdrop().classList.remove('open'); }

/* ---------- Kopiersicherer Copilot-Block ----------
   Zeigt den Prompt sichtbar an + Buttons "Copilot öffnen" und "Prompt kopieren".
   Wird über data-Attribute verdrahtet, nachdem das Sheet gerendert wurde. */
function copilotBlock(prompt, openLabel){
  const href = `https://copilot.microsoft.com/?q=${encodeURIComponent(prompt)}`;
  return `<div class="copilot-block">`+
    `<div class="cp-prompt" data-prompt="${esc(prompt)}">${esc(prompt)}</div>`+
    `<div class="button-row">`+
      `<a class="cta copilot" target="_blank" rel="noopener" href="${href}">${openLabel} ↗</a>`+
      `<button class="cta secondary cp-copy" type="button">📋 Prompt kopieren</button>`+
    `</div>`+
    `<div class="cp-hint">Falls das Textfeld in Copilot leer ist: „Prompt kopieren“ tippen, in Copilot einfügen und senden. Danach dort auf 🔊 Vorlesen.</div>`+
  `</div>`;
}
function wireCopilotBlocks(){
  sheet().querySelectorAll('.copilot-block').forEach(block=>{
    const btn = block.querySelector('.cp-copy');
    const text = block.querySelector('.cp-prompt')?.dataset.prompt || '';
    if(!btn) return;
    btn.addEventListener('click', async ()=>{
      let ok=false;
      try{ await navigator.clipboard.writeText(text); ok=true; }
      catch(_){
        try{ // Fallback für ältere/strikte Browser
          const ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
          document.body.appendChild(ta); ta.focus(); ta.select();
          ok=document.execCommand('copy'); document.body.removeChild(ta);
        }catch(__){ ok=false; }
      }
      btn.textContent = ok ? '✓ Kopiert' : '📋 Markieren & kopieren';
      if(!ok){ // Text markierbar machen
        const range=document.createRange(); range.selectNodeContents(block.querySelector('.cp-prompt'));
        const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      }
      setTimeout(()=>{ btn.textContent='📋 Prompt kopieren'; }, 2200);
    });
  });
}

/* ---------- 🎧 Hier & Jetzt (GPS → nächster Ort → Copilot, Variante B) ---------- */
function haversineKm(aLat,aLon,bLat,bLon){
  const R=6371, toR=x=>x*Math.PI/180;
  const dLat=toR(bLat-aLat), dLon=toR(bLon-aLon);
  const s=Math.sin(dLat/2)**2 + Math.cos(toR(aLat))*Math.cos(toR(bLat))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
function nearestLocation(lat,lon){
  let best=null, bestKm=Infinity;
  DB.locations.forEach(l=>{
    if(l.isHub || typeof l.lat!=='number') return;
    const km=haversineKm(lat,lon,l.lat,l.lon);
    if(km<bestKm){ bestKm=km; best=l; }
  });
  return { loc:best, km:bestKm };
}
function guidePrompt({name, lat, lon, km}){
  if(name && km<=50){
    const dist = km<0.8 ? 'direkt hier' : `etwa ${km.toFixed(1)} km entfernt`;
    return `Sei mein charmanter Reiseführer. Ich stehe gerade an der Algarve/Costa Vicentina, ${dist} bei „${name}“. `+
           `Erzähl mir in rund 30 Sekunden lebendig und wertig das Spannendste über diesen Ort – Geschichte, Atmosphäre, `+
           `ein besonderer Blickwinkel – und schließe mit einem echten Geheimtipp. Locker, aber niveauvoll, auf Deutsch.`;
  }
  return `Sei mein charmanter Reiseführer. Ich stehe gerade an diesen Koordinaten in Portugal: ${lat.toFixed(4)}, ${lon.toFixed(4)}. `+
         `Erzähl mir in rund 30 Sekunden lebendig, was hier oder in unmittelbarer Nähe interessant ist, und gib mir einen Geheimtipp. Auf Deutsch.`;
}
function hereAndNowSheet(inner){
  showSheet(`<div class="sheet-kicker">Audioguide · online</div><h3>🎧 Hier &amp; Jetzt</h3>${inner}`);
}
function openHereAndNow(){
  hereAndNowSheet(`<p class="sheet-intro">Ich hole kurz Deinen Standort …</p><div class="han-status">📍 Standort wird ermittelt</div>`);

  const finishWithCoords=(lat,lon)=>{
    const {loc,km}=nearestLocation(lat,lon);
    const prompt=guidePrompt({name:loc?loc.name:null, lat, lon, km});
    const near = loc && km<=50
      ? `<div class="han-place">In Deiner Nähe: <b>${loc.name}</b>${km<0.8?' (direkt hier)':` · ${km.toFixed(1)} km`}</div>${loc.image?`<div class="sheet-hero" style="background-image:url('${loc.image}')"></div>`:''}${loc.summary?`<p class="loc-summary">${loc.summary}</p>`:''}`
      : `<div class="han-place">Kein bekannter Ort in der Nähe – Copilot erzählt Dir trotzdem, was hier interessant ist.</div>`;
    hereAndNowSheet(
      near+
      `<p class="sheet-intro">Copilot schreibt Dir einen ~30-Sekunden-Reiseführer-Text und liest ihn auf Wunsch vor.</p>`+
      copilotBlock(prompt, '🎧 Reiseführer öffnen')+
      (loc?`<div class="button-row"><a class="cta secondary" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}">📍 Auf Karte ↗</a></div>`:'')
    );
  };
  const fallbackToday=(reason)=>{
    const s=tripState();
    const loc=(s.day.locationIds||[]).map(id=>byId[id]).find(Boolean);
    if(loc){
      const prompt=guidePrompt({name:loc.name, lat:loc.lat, lon:loc.lon, km:0});
      hereAndNowSheet(
        `<div class="han-place">${reason} Ich nehme den heutigen Ort: <b>${loc.name}</b></div>`+
        (loc.image?`<div class="sheet-hero" style="background-image:url('${loc.image}')"></div>`:'')+
        (loc.summary?`<p class="loc-summary">${loc.summary}</p>`:'')+
        copilotBlock(prompt, '🎧 Reiseführer öffnen')
      );
    } else {
      hereAndNowSheet(`<p class="sheet-intro">${reason} Und ich konnte auch keinen Tagesort finden. Versuch es später noch einmal.</p>`);
    }
  };

  if(!('geolocation' in navigator)){ fallbackToday('Standort ist auf diesem Gerät nicht verfügbar.'); return; }
  navigator.geolocation.getCurrentPosition(
    pos => finishWithCoords(pos.coords.latitude, pos.coords.longitude),
    err => fallbackToday(err.code===1 ? 'Standortfreigabe wurde abgelehnt.' : 'Standort konnte nicht ermittelt werden.'),
    { enableHighAccuracy:true, timeout:8000, maximumAge:60000 }
  );
}

function diningBlockForDay(d){
  const R = DB.restaurants; if(!R) return '';
  let html = '';
  const res = (R.reserved||[]).find(r=>r.date===d.date);
  if(res){
    html += `<div class="dining-box reserved"><div class="dining-h">🍽️ Reserviert · ${res.time}</div>`+
            `<div class="dining-name">${res.name}</div><div class="dining-note">${res.note}</div>`+
            `<a class="cta small" target="_blank" rel="noopener" href="${mapsHref(res.mapsQuery)}">Navigation ↗</a></div>`;
  }
  if(R.specialEvening && R.specialEvening.date===d.date){
    const se=R.specialEvening;
    html += `<div class="dining-box special"><div class="dining-h">★ ${se.title}</div>`+
      `<div class="dining-note">${se.intro}</div>`+
      se.options.map(o=>`<div class="dining-option"><div class="dining-name">${o.name} <small>· ${o.area}</small></div>`+
        `<div class="dining-hl">${o.highlight}</div>`+
        `<a class="cta small" target="_blank" rel="noopener" href="${mapsHref(o.mapsQuery)}">Navigation ↗</a></div>`).join('')+
      `</div>`;
  }
  if(!res && !(R.specialEvening && R.specialEvening.date===d.date)){
    const region = d.diningRegion;
    if(region==='none') return html;
    let recs = [];
    if(region==='atlantic') recs = (R.recommendations||[]).filter(x=>x.region==='atlantic');
    else if(region==='lagos') recs = (R.recommendations||[]).filter(x=>x.region==='lagos');
    if(recs.length){
      html += `<div class="dining-box"><div class="dining-h">Restaurant-Empfehlungen</div>`+
        recs.slice(0,4).map(x=>`<div class="dining-option"><div class="dining-name">${x.name} <small>· ${x.cuisine}</small></div>`+
          `<div class="dining-hl">${x.note}</div>`+
          `<a class="cta small" target="_blank" rel="noopener" href="${mapsHref(x.mapsQuery)}">Navigation ↗</a></div>`).join('')+
        `</div>`;
    }
  }
  return html;
}

function openToday(){ const s = tripState(); openDay(s.day.id, s.phase==='before'?`Vorschau · ${s.label}`:s.label); }
function openDay(id, kicker='Tagesprogramm'){
  const d = DB.days.find(x=>x.id===id); if(!d) return;
  const ch = DB.chapters.find(c=>c.id===d.chapterId);
  const stops = (d.locationIds||[]).map(x=>byId[x]).filter(Boolean);
  const heroImg = d.heroImage || (stops.find(x=>x.image)||{}).image;
  const fixed = d.agenda.filter(x=>/^\d{2}:\d{2}/.test(x));
  const flex  = d.agenda.filter(x=>!/^\d{2}:\d{2}/.test(x));
  showSheet(
    (heroImg?`<div class="sheet-hero" style="background-image:url('${heroImg}')"></div>`:'')+
    `<div class="sheet-kicker">${kicker}</div><h3>${d.title}</h3>`+
    `<div class="meta">${d.weekday}, ${fmtDate(d.date)}2026 · ${ch?ch.title:''}</div>`+
    (fixed.length?`<h4>Fixe Zeiten</h4><ul class="agenda fixed">${fixed.map(x=>`<li>${x}</li>`).join('')}</ul>`:'')+
    `<h4>Programm</h4><ul class="agenda">${flex.map(x=>`<li>${x}</li>`).join('')}</ul>`+
    diningBlockForDay(d)+
    `<div class="tagrow">${stops.map(x=>`<button class="tag" data-loc="${x.id}">📍 ${x.name}</button>`).join('')}</div>`
  );
  sheet().querySelectorAll('.tag[data-loc]').forEach(x=>x.addEventListener('click',()=>openLocation(x.dataset.loc)));
}
function openAccommodations(){
  showSheet(
    `<div class="sheet-kicker">Vier Stationen</div><h3>Unterkünfte</h3><div class="stay-list">`+
    DB.accommodations.map(a=>
      `<article class="stay-card"><div class="stay-img" style="background-image:url('${a.image}')"></div>`+
      `<div class="stay-body"><div class="stay-city">${a.city} · ${a.dates}</div><h4>${a.name}</h4>`+
      `<p>${a.description}</p><div class="stay-address">📍 ${a.address}</div>`+
      `<div class="feature-row">${a.features.map(f=>`<span>${f}</span>`).join('')}</div>`+
      `<div class="stay-info"><b>Check-in:</b> ${a.checkin}<br><b>Check-out:</b> ${a.checkout}</div>`+
      `<div class="button-row"><a class="cta" href="${a.mapsUrl}" target="_blank" rel="noopener">Navigation ↗</a>`+
      (a.website?`<a class="cta secondary" href="${a.website}" target="_blank" rel="noopener">Website ↗</a>`:'')+
      `</div></div></article>`
    ).join('')+`</div>`
  );
}
function openWeather(){
  const places = [['Lissabon','Lisbon'],['Aljezur','Aljezur'],['Lagos','Lagos Portugal'],['Albufeira','Albufeira']];
  showSheet(
    `<div class="sheet-kicker">Online & aktuell</div><h3>Wetter</h3>`+
    `<p class="sheet-intro">Reiseinhalte bleiben offline. Für aktuelle Prognosen öffnet sich die Wetter-Suche online.</p>`+
    `<div class="weather-list">`+
    places.map(([n,q])=>`<a href="https://www.google.com/search?q=${encodeURIComponent('Wetter '+q)}" target="_blank" rel="noopener"><b>☀ ${n}</b><span>Aktuelle Prognose öffnen ↗</span></a>`).join('')+
    `</div>`
  );
}
function openChapter(id){
  const c = DB.chapters.find(x=>x.id===id); if(!c) return;
  const days = DB.days.filter(d=>d.chapterId===id);
  if(c.maps && c.maps[0] && ['A','B','C'].includes(c.maps[0])) switchMap(c.maps[0]);
  showSheet(
    (c.hero?`<div class="sheet-hero" style="background-image:url('${c.hero}')"></div>`:'')+
    `<div class="sheet-kicker">Kapitel ${c.roman}</div><h3>${c.title}</h3>`+
    `<div class="meta">${c.subtitle} · ${fmtDate(c.dateFrom)}–${fmtDate(c.dateTo)}2026</div>`+
    `<ul class="agenda chapter-days">${days.map(d=>`<li data-day="${d.id}"><b>${fmtDate(d.date)}</b> ${d.title}</li>`).join('')}</ul>`
  );
  sheet().querySelectorAll('.agenda li[data-day]').forEach(x=>x.addEventListener('click',()=>openDay(x.dataset.day)));
}
function openLocation(id){
  const l = byId[id]; if(!l) return;
  const ch = DB.chapters.find(c=>c.id===l.chapterId);
  const days = DB.days.filter(d=>(d.locationIds||[]).includes(id));
  const prompt = `Wir sind mit unserer Familie (zwei Teenager) in Portugal bei ${l.name}. Was können wir heute hier oder in der Nähe unternehmen? Gib 5 konkrete Tipps inkl. Essen und Schlechtwetter-Alternative.`;
  showSheet(
    (l.image?`<div class="sheet-hero" style="background-image:url('${l.image}')"></div>`:'')+
    `<div class="sheet-kicker">${l.type}</div><h3>${l.name}</h3>`+
    `<div class="meta">${ch?ch.title:''}</div>`+
    (l.summary?`<p class="loc-summary">${l.summary}</p>`:'')+
    (l.bestTime||l.tip?`<div class="loc-facts">`+
      (l.bestTime?`<div><b>Beste Zeit</b><span>${l.bestTime}</span></div>`:'')+
      (l.tip?`<div><b>Tipp</b><span>${l.tip}</span></div>`:'')+`</div>`:'')+
    `<div class="feature-row">${(l.tags||[]).map(t=>`<span>${t}</span>`).join('')}</div>`+
    (days.length?`<ul class="agenda">${days.map(d=>`<li data-day="${d.id}"><b>${fmtDate(d.date)}</b> ${d.title}</li>`).join('')}</ul>`:'')+
    `<div class="button-row"><a class="cta" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lon}">📍 Navigation ↗</a>`+
    (l.website?`<a class="cta secondary" target="_blank" rel="noopener" href="${l.website}">🌐 Weitere Infos ↗</a>`:'')+
    `<a class="cta secondary" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent('Aktivitäten in der Nähe '+l.name)}">✨ Ideen in der Nähe ↗</a></div>`+
    copilotBlock(prompt, '🤖 Frag Copilot')
  );
  sheet().querySelectorAll('.agenda li[data-day]').forEach(x=>x.addEventListener('click',()=>openDay(x.dataset.day)));
}

function buildSearch(){
  const ov = document.getElementById('search-overlay');
  const inp = document.getElementById('search-input');
  const res = document.getElementById('search-results');
  const bt = {city:'🏛️',beach:'🏖️',golf:'⛳',stay:'🏨',nature:'🪨',viewpoint:'🌅',airport:'✈️',village:'🏘️',region:'🗺️',marina:'⛵',district:'🏙️',trail:'🥾',activity:'🎾'};
  function run(q){
    q = (q||'').trim().toLowerCase();
    if(!q){ res.innerHTML = '<div class="sr-empty">Suche nach Orten, Tagen, Golf, Fado, Strand …</div>'; return; }
    const hits = DB.search.filter(it=>it.title.toLowerCase().includes(q)||it.terms.some(t=>t.includes(q))).slice(0,40);
    if(!hits.length){ res.innerHTML = `<div class="sr-empty">Keine Treffer für „${q}“</div>`; return; }
    res.innerHTML = hits.map(h=>{
      const l = h.type==='location'?byId[h.id]:null;
      const badge = l&&l.image?`class="badge img" style="background-image:url('${l.image}')"`:'class="badge"';
      const icon = l?(bt[l.type]||'📍'):'📅';
      return `<div class="sr-item" data-kind="${h.target.kind}" data-id="${h.target.id}"><div ${badge}>${l&&l.image?'':icon}</div><div><div class="tt">${h.title}</div><div class="ss">${h.sub||''}</div></div></div>`;
    }).join('');
    res.querySelectorAll('.sr-item').forEach(x=>x.addEventListener('click',()=>{
      ov.classList.remove('open'); inp.value='';
      if(x.dataset.kind==='location') openLocation(x.dataset.id); else openDay(x.dataset.id);
    }));
  }
  inp.addEventListener('input',()=>run(inp.value));
  document.getElementById('btn-search').addEventListener('click',()=>{ ov.classList.add('open'); setTimeout(()=>inp.focus(),100); run(''); });
  document.getElementById('search-close').addEventListener('click',()=>{ ov.classList.remove('open'); inp.value=''; });
}

document.addEventListener('DOMContentLoaded',()=>{ document.getElementById('sheet-backdrop').addEventListener('click',closeSheet); boot(); });
if('serviceWorker' in navigator){ window.addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{})); }
