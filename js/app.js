/* Portugal 2026 — App V4.2
   Hero-Collage, Kapitelbilder, Ortsbilder, Suchbilder,
   Karten A/B/C und Karte-C-Entzerrung via maps.json view. */

const DB = { meta: null, chapters: [], days: [], locations: [], maps: null, search: [] };
const byId = {};
let currentMap = 'A';

async function loadJSON(path) {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(path);
  return response.json();
}
async function boot() {
  try {
    const [meta, chapters, days, locations, maps, search] = await Promise.all([
      loadJSON('data/meta.json'), loadJSON('data/chapters.json'), loadJSON('data/days.json'),
      loadJSON('data/locations.json'), loadJSON('data/maps.json'), loadJSON('data/search-index.json')
    ]);
    Object.assign(DB, { meta, chapters, days, locations, maps, search });
    locations.forEach(location => { byId[location.id] = location; });
    render();
  } catch (error) {
    document.getElementById('app').innerHTML = `<div style="padding:40px;font-family:sans-serif">Daten konnten nicht geladen werden: ${error.message}<br><br>Bitte über GitHub Pages öffnen.</div>`;
    console.error(error);
  }
}
function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function chapterColor(key) {
  return cssVar(`--${({ lisbon: 'lisbon', atlantic: 'atl', lagos: 'lagos', golf: 'golf', resort: 'resort' }[key] || 'atl')}`);
}
function fmtDate(iso) { const [year, month, day] = iso.split('-'); return `${day}.${month}.`; }
function render() {
  renderHero(); renderKPIs(); renderDaybar(); renderTimeline(); renderMapTabs(); renderCurrentMap(); buildSearch();
}

function renderHero() {
  const images = DB.meta.trip.heroCollage || [];
  const collage = document.getElementById('collage');
  if (collage && images.length >= 3) {
    collage.innerHTML = `<figure class="c0" style="background-image:url('${images[0]}')"></figure>
      <figure style="background-image:url('${images[1]}')"></figure>
      <figure style="background-image:url('${images[2]}')"></figure>`;
  }
  document.getElementById('heroSub').textContent = DB.meta.trip.subtitle;
  document.getElementById('heroDates').textContent = `${fmtDate(DB.meta.trip.startDate)}–${fmtDate(DB.meta.trip.endDate)}2026`;
}
function renderKPIs() {
  document.getElementById('kpis').innerHTML = DB.meta.trip.kpis
    .map(item => `<div class="kpi"><b>${item.value}</b><span>${item.label}</span></div>`).join('');
}
function renderDaybar() {
  const bar = document.getElementById('daybar');
  bar.innerHTML = DB.days.map(day => {
    const colorKey = DB.chapters.find(chapter => chapter.id === day.chapterId)?.colorKey || 'atl';
    return `<button class="daychip" data-ck="${colorKey}" data-day="${day.id}"><span class="d">${day.date.slice(8, 10)}</span><span class="c">${day.code}</span></button>`;
  }).join('');
  bar.querySelectorAll('.daychip').forEach(chip => chip.addEventListener('click', () => {
    bar.querySelectorAll('.daychip').forEach(item => item.classList.remove('active'));
    chip.classList.add('active');
    const day = DB.days.find(item => item.id === chip.dataset.day);
    const chapter = DB.chapters.find(item => item.id === day.chapterId);
    if (chapter?.maps?.[0] && ['A', 'B', 'C'].includes(chapter.maps[0])) switchMap(chapter.maps[0]);
    openDay(chip.dataset.day);
  }));
}
function renderTimeline() {
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = DB.chapters.map(chapter => {
    const color = chapterColor(chapter.colorKey);
    return `<article class="tl-card" data-chapter="${chapter.id}">
      ${chapter.hero ? `<div class="bg" style="background-image:url('${chapter.hero}')"></div>` : ''}
      <div class="grad" style="background:linear-gradient(180deg, ${color}22, ${color}e6)"></div>
      <div class="txt"><div class="roman">Kapitel ${chapter.roman} · ${fmtDate(chapter.dateFrom)}–${fmtDate(chapter.dateTo)}</div>
      <h3>${chapter.title}</h3><div class="cs">${chapter.subtitle}</div></div></article>`;
  }).join('');
  timeline.querySelectorAll('.tl-card').forEach(card => card.addEventListener('click', () => openChapter(card.dataset.chapter)));
}

function renderMapTabs() {
  const tabs = document.getElementById('mapTabs');
  const order = ['A', 'B', 'C', 'D', 'E', 'F'];
  tabs.innerHTML = order.filter(key => DB.maps[key]).map(key => {
    const map = DB.maps[key];
    const available = ['A', 'B', 'C'].includes(key);
    return `<button class="maptab ${key === currentMap ? 'active' : ''}" data-map="${key}" ${available ? '' : 'disabled'}>${key} · ${map.short || map.title}</button>`;
  }).join('');
  tabs.querySelectorAll('.maptab:not([disabled])').forEach(button => button.addEventListener('click', () => switchMap(button.dataset.map)));
}
function switchMap(key) {
  if (!DB.maps[key]) return;
  currentMap = key;
  document.querySelectorAll('.maptab').forEach(button => button.classList.toggle('active', button.dataset.map === key));
  renderCurrentMap();
}
function renderCurrentMap() {
  const map = DB.maps[currentMap];
  document.getElementById('mapTitle').textContent = map.title;
  window.PortugalMap.renderMap(document.getElementById('map-container'), map, byId, location => openLocation(location.id));
  let note = '';
  if (map.note && byId[map.note]) {
    note = `<span style="opacity:.85">Hinweis: ${byId[map.note].name} liegt weiter südlich und bleibt über die Suche erreichbar.</span>`;
  }
  document.getElementById('mapLegend').innerHTML = (map.routePath
    ? '<span><i class="dotg"></i> Stationen</span><span>— — Fahrstrecke (stilisiert)</span>'
    : '<span><i class="dotg"></i> Orte in der Umgebung</span>') + note;
}

const sheet = () => document.getElementById('sheet');
const backdrop = () => document.getElementById('sheet-backdrop');
function showSheet(html) {
  sheet().innerHTML = `<div class="grip"></div>${html}`;
  sheet().classList.add('open'); backdrop().classList.add('open'); sheet().scrollTop = 0;
}
function closeSheet() { sheet().classList.remove('open'); backdrop().classList.remove('open'); }

function openDay(dayId) {
  const day = DB.days.find(item => item.id === dayId); if (!day) return;
  const chapter = DB.chapters.find(item => item.id === day.chapterId);
  const stops = (day.locationIds || []).map(id => byId[id]).filter(Boolean);
  const heroLocation = stops.find(stop => stop.image);
  showSheet(`${heroLocation ? `<div class="sheet-hero" style="background-image:url('${heroLocation.image}')"></div>` : ''}
    <h3>${day.title}</h3><div class="meta">${day.weekday}, ${fmtDate(day.date)}2026 · ${chapter ? chapter.title : ''}</div>
    <ul class="agenda">${day.agenda.map(item => `<li>${item}</li>`).join('')}</ul>
    <div style="margin-top:12px">${stops.map(stop => `<span class="tag" data-loc="${stop.id}">📍 ${stop.name}</span>`).join('')}</div>`);
  sheet().querySelectorAll('.tag[data-loc]').forEach(tag => tag.addEventListener('click', () => openLocation(tag.dataset.loc)));
}
function openChapter(chapterId) {
  const chapter = DB.chapters.find(item => item.id === chapterId); if (!chapter) return;
  const days = DB.days.filter(day => day.chapterId === chapterId);
  if (chapter.maps?.[0] && ['A', 'B', 'C'].includes(chapter.maps[0])) switchMap(chapter.maps[0]);
  showSheet(`${chapter.hero ? `<div class="sheet-hero" style="background-image:url('${chapter.hero}')"></div>` : ''}
    <h3>Kapitel ${chapter.roman} · ${chapter.title}</h3>
    <div class="meta">${chapter.subtitle} · ${fmtDate(chapter.dateFrom)}–${fmtDate(chapter.dateTo)}2026</div>
    <ul class="agenda">${days.map(day => `<li data-day="${day.id}"><b>${fmtDate(day.date)}</b> &nbsp; ${day.title}</li>`).join('')}</ul>
    <div class="meta" style="margin-top:12px">Karten: ${chapter.maps.join(', ')}</div>`);
  sheet().querySelectorAll('.agenda li[data-day]').forEach(item => item.addEventListener('click', () => openDay(item.dataset.day)));
}
function openLocation(locationId) {
  const location = byId[locationId]; if (!location) return;
  const chapter = DB.chapters.find(item => item.id === location.chapterId);
  const days = DB.days.filter(day => (day.locationIds || []).includes(locationId));
  const precision = ({ verified: 'Koordinate verifiziert', approx: 'Kartenpunkt näherungsweise', property: 'Anlage regional verortet' })[location.precision] || '';
  showSheet(`${location.image ? `<div class="sheet-hero" style="background-image:url('${location.image}')"></div>` : ''}
    <h3>${location.name}</h3><div class="meta">${location.type} · ${chapter ? chapter.title : ''}</div>
    <div>${(location.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
    ${days.length ? `<ul class="agenda" style="margin-top:12px">${days.map(day => `<li data-day="${day.id}"><b>${fmtDate(day.date)}</b> &nbsp; ${day.title}</li>`).join('')}</ul>` : ''}
    <a class="cta" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lon}">In Karten öffnen ↗</a>
    <div class="meta" style="margin-top:10px">${precision}</div>`);
  sheet().querySelectorAll('.agenda li[data-day]').forEach(item => item.addEventListener('click', () => openDay(item.dataset.day)));
}

function buildSearch() {
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const icons = { city:'🏛️', beach:'🏖️', golf:'⛳', stay:'🏨', nature:'🪨', viewpoint:'🌅', airport:'✈️', village:'🏘️', region:'🗺️', marina:'⛵', district:'🏙️', trail:'🥾', activity:'🎾' };
  function run(query) {
    query = (query || '').trim().toLowerCase();
    if (!query) { results.innerHTML = '<div class="sr-empty">Suche nach Orten, Tagen, Golf, Fado, Strand …</div>'; return; }
    const hits = DB.search.filter(item => item.title.toLowerCase().includes(query) || item.terms.some(term => term.includes(query))).slice(0, 40);
    if (!hits.length) { results.innerHTML = `<div class="sr-empty">Keine Treffer für „${query}“</div>`; return; }
    results.innerHTML = hits.map(hit => {
      const location = hit.type === 'location' ? byId[hit.id] : null;
      const icon = location ? (icons[location.type] || '📍') : '📅';
      const badge = location?.image ? `class="badge img" style="background-image:url('${location.image}')"` : 'class="badge"';
      return `<div class="sr-item" data-kind="${hit.target.kind}" data-id="${hit.target.id}"><div ${badge}>${location?.image ? '' : icon}</div><div><div class="tt">${hit.title}</div><div class="ss">${hit.sub || ''}</div></div></div>`;
    }).join('');
    results.querySelectorAll('.sr-item').forEach(item => item.addEventListener('click', () => {
      overlay.classList.remove('open'); input.value = '';
      item.dataset.kind === 'location' ? openLocation(item.dataset.id) : openDay(item.dataset.id);
    }));
  }
  input.addEventListener('input', () => run(input.value));
  document.getElementById('btn-search').addEventListener('click', () => { overlay.classList.add('open'); setTimeout(() => input.focus(), 150); run(''); });
  document.getElementById('search-close').addEventListener('click', () => { overlay.classList.remove('open'); input.value = ''; });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sheet-backdrop').addEventListener('click', closeSheet);
  boot();
});
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js').catch(() => {}));
}
