/* Portugal 2026 — Map Engine (V4.2, unverändert)
   Interaktive SVG-Magazinkarten, offline, mit map.view-Zoom,
   routePath-Fahrstrecken und Label-Entzerrung. */
const DEFAULT_BOUNDS = { minLat: 36.90, maxLat: 38.85, minLon: -9.55, maxLon: -7.80 };
const MAP_W = 800, MAP_H = 900, PAD = 70;
const COAST = [
  [-9.30,38.78],[-9.48,38.68],[-9.32,38.50],[-9.20,38.42],[-8.98,38.48],
  [-8.90,38.40],[-8.79,38.30],[-8.80,38.05],[-8.87,37.95],[-8.80,37.70],
  [-8.86,37.44],[-8.90,37.25],[-8.99,37.02],[-8.80,36.99],[-8.60,37.09],
  [-8.40,37.08],[-8.20,37.07],[-8.05,37.05],[-7.92,37.01]
];
function makeProjector(bounds) {
  return (lat, lon) => [
    PAD + (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon) * (MAP_W - 2 * PAD),
    PAD + (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat) * (MAP_H - 2 * PAD)
  ];
}
function svgEl(name, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attrs || {}).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}
function coastPath(project) {
  const pts = COAST.map(([lon, lat]) => project(lat, lon));
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x, y] = pts[i];
    const [px, py] = pts[i - 1];
    d += ` Q ${px.toFixed(1)} ${py.toFixed(1)} ${((x + px) / 2).toFixed(1)} ${((y + py) / 2).toFixed(1)}`;
  }
  return d;
}
function smoothPath(points) {
  if (!points || points.length < 2) return '';
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i += 1) {
    const [x, y] = points[i];
    const [px, py] = points[i - 1];
    d += ` Q ${px.toFixed(1)} ${py.toFixed(1)} ${((x + px) / 2).toFixed(1)} ${((y + py) / 2).toFixed(1)}`;
  }
  const last = points[points.length - 1];
  return `${d} L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
}
function renderMap(container, mapDef, locById, onPinClick) {
  const bounds = mapDef.view || DEFAULT_BOUNDS;
  const project = makeProjector(bounds);
  container.innerHTML = '';
  const svg = svgEl('svg', { viewBox: `0 0 ${MAP_W} ${MAP_H}`, id: 'mapSVG', role: 'img', 'aria-label': `Karte ${mapDef.title || ''}` });
  const defs = svgEl('defs');
  defs.innerHTML = '<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#123849"/><stop offset="1" stop-color="#0C2028"/></linearGradient>';
  svg.appendChild(defs);
  svg.appendChild(svgEl('rect', { x: 0, y: 0, width: MAP_W, height: MAP_H, fill: 'url(#sea)' }));
  const coast = coastPath(project);
  svg.appendChild(svgEl('path', { d: `${coast} L ${MAP_W} ${MAP_H} L ${MAP_W} 0 Z`, fill: '#EAE0CB', opacity: '0.96' }));
  svg.appendChild(svgEl('path', { d: coast, fill: 'none', stroke: '#5A6E62', 'stroke-width': '2.4', 'stroke-linecap': 'round' }));
  if (Array.isArray(mapDef.routePath) && mapDef.routePath.length > 1) {
    const routePoints = mapDef.routePath.map(([lat, lon]) => project(lat, lon));
    svg.appendChild(svgEl('path', {
      d: smoothPath(routePoints), fill: 'none', stroke: '#C99A52', 'stroke-width': '4',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '2 12', opacity: '0.95'
    }));
  }
  const points = (mapDef.pins || []).map((id, index) => {
    const location = locById[id];
    if (!location) return null;
    const [x, y] = project(location.lat, location.lon);
    return { location, index, x, y, labelY: y };
  }).filter(Boolean);
  const sorted = [...points].sort((a, b) => a.y - b.y);
  const minLabelGap = 30;
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].labelY - sorted[i - 1].labelY < minLabelGap) {
      sorted[i].labelY = sorted[i - 1].labelY + minLabelGap;
    }
  }
  points.forEach(({ location, index, x, y, labelY }) => {
    const group = svgEl('g', { class: 'pin', style: 'cursor:pointer', tabindex: '0', role: 'button', 'aria-label': location.name });
    group.appendChild(svgEl('circle', { cx: x, cy: y, r: 23, fill: '#C99A52', 'fill-opacity': '0.16' }));
    group.appendChild(svgEl('circle', { cx: x, cy: y, r: 12, fill: '#C99A52', stroke: '#0E2A33', 'stroke-width': '3' }));
    const number = svgEl('text', { x, y: y + 4, 'text-anchor': 'middle', 'font-size': '13', 'font-weight': '800', fill: '#0E2A33', 'font-family': '-apple-system,Arial' });
    number.textContent = String(index + 1);
    group.appendChild(number);
    const right = x < MAP_W - 240;
    const labelX = x + (right ? 21 : -21);
    if (Math.abs(labelY - y) > 2) {
      group.appendChild(svgEl('line', {
        x1: x + (right ? 13 : -13), y1: y, x2: labelX, y2: labelY - 6,
        stroke: '#8A6F3A', 'stroke-width': '1.4', 'stroke-dasharray': '2 3'
      }));
    }
    const label = svgEl('text', {
      x: labelX, y: labelY, 'font-size': '19', 'font-weight': '700', fill: '#12333C',
      'font-family': 'Georgia, serif', 'text-anchor': right ? 'start' : 'end',
      'paint-order': 'stroke', stroke: '#EAE0CB', 'stroke-width': '4'
    });
    label.textContent = location.name;
    group.appendChild(label);
    const open = () => onPinClick(location);
    group.addEventListener('click', open);
    group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') open(); });
    svg.appendChild(group);
  });
  container.appendChild(svg);
  return svg;
}
window.PortugalMap = { renderMap };
