/* Portugal 2026 — interaktive Magazin-Karte (SVG, offline)
   Karten A–F mit eigenem Ausschnitt (view) und an Land geführter Route (routePath).
   Label-Antikollision: verteilt eng liegende Beschriftungen automatisch. */

const DEFAULT_BOUNDS = { minLat:36.90, maxLat:38.85, minLon:-9.55, maxLon:-7.80 };
const MAP_W = 800, MAP_H = 900, PAD = 70;

const COAST = [
  [-9.30,38.78],[-9.48,38.68],[-9.32,38.50],[-9.20,38.42],[-8.98,38.48],
  [-8.90,38.40],[-8.79,38.30],[-8.80,38.05],[-8.87,37.95],[-8.80,37.70],
  [-8.86,37.44],[-8.90,37.25],[-8.99,37.02],[-8.80,36.99],[-8.60,37.09],
  [-8.40,37.08],[-8.20,37.07],[-8.05,37.05],[-7.92,37.01]
];

function makeProjector(b){
  return (lat,lon)=>[
    PAD + (lon-b.minLon)/(b.maxLon-b.minLon)*(MAP_W-2*PAD),
    PAD + (b.maxLat-lat)/(b.maxLat-b.minLat)*(MAP_H-2*PAD)
  ];
}
function svgEl(n,a){const e=document.createElementNS('http://www.w3.org/2000/svg',n);for(const k in a)e.setAttribute(k,a[k]);return e;}
function coastD(P){const p=COAST.map(([lo,la])=>P(la,lo));let d=`M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
  for(let i=1;i<p.length;i++){const[x,y]=p[i],[px,py]=p[i-1];d+=` Q ${px.toFixed(1)} ${py.toFixed(1)} ${((x+px)/2).toFixed(1)} ${((y+py)/2).toFixed(1)}`;}return d;}
function smooth(pts){if(!pts||pts.length<2)return'';let d=`M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for(let i=1;i<pts.length;i++){const[x,y]=pts[i],[px,py]=pts[i-1];d+=` Q ${px.toFixed(1)} ${py.toFixed(1)} ${((x+px)/2).toFixed(1)} ${((y+py)/2).toFixed(1)}`;}
  const l=pts[pts.length-1];return d+` L ${l[0].toFixed(1)} ${l[1].toFixed(1)}`;}

function renderMap(container, mapDef, locById, onPinClick){
  const bounds = mapDef.view || DEFAULT_BOUNDS;
  const P = makeProjector(bounds);
  container.innerHTML='';
  const svg = svgEl('svg',{viewBox:`0 0 ${MAP_W} ${MAP_H}`,id:'mapSVG',role:'img','aria-label':'Karte '+(mapDef.title||'')});
  const defs=svgEl('defs',{});
  defs.innerHTML='<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#123849"/><stop offset="1" stop-color="#0C2028"/></linearGradient>';
  svg.appendChild(defs);
  svg.appendChild(svgEl('rect',{x:0,y:0,width:MAP_W,height:MAP_H,fill:'url(#sea)'}));
  const cd=coastD(P);
  svg.appendChild(svgEl('path',{d:cd+` L ${MAP_W} ${MAP_H} L ${MAP_W} 0 Z`,fill:'#EAE0CB',opacity:'0.96'}));
  svg.appendChild(svgEl('path',{d:cd,fill:'none',stroke:'#5A6E62','stroke-width':'2.4','stroke-linecap':'round'}));

  // Route
  let rp=null;
  if(Array.isArray(mapDef.routePath)&&mapDef.routePath.length>1) rp=mapDef.routePath.map(([la,lo])=>P(la,lo));
  if(rp) svg.appendChild(svgEl('path',{d:smooth(rp),fill:'none',stroke:'#C99A52','stroke-width':'4','stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':'2 12',opacity:'0.95'}));

  // Pins berechnen
  const pts = mapDef.pins.map((id,i)=>{const l=locById[id];const[x,y]=P(l.lat,l.lon);return{l,i,x,y};}).filter(p=>p.l);

  // Label-Antikollision: y-Positionen entzerren, wenn Labels sich überlappen
  const LBLH=26;
  const sorted=[...pts].sort((a,b)=>a.y-b.y);
  for(let i=1;i<sorted.length;i++){
    if(sorted[i].ly===undefined) sorted[i].ly=sorted[i].y;
    if(sorted[i-1].ly===undefined) sorted[i-1].ly=sorted[i-1].y;
    if(sorted[i].ly - sorted[i-1].ly < LBLH) sorted[i].ly = sorted[i-1].ly + LBLH;
  }

  pts.forEach(pt=>{
    const {l,i,x,y}=pt; const ly = pt.ly!==undefined?pt.ly:y;
    const g=svgEl('g',{class:'pin',style:'cursor:pointer',tabindex:'0',role:'button','aria-label':l.name});
    g.appendChild(svgEl('circle',{cx:x,cy:y,r:22,fill:'#C99A52','fill-opacity':'0.15'}));
    g.appendChild(svgEl('circle',{cx:x,cy:y,r:12,fill:'#C99A52',stroke:'#0E2A33','stroke-width':'3'}));
    const num=svgEl('text',{x:x,y:y+4,'text-anchor':'middle','font-size':'13','font-weight':'800',fill:'#0E2A33','font-family':'-apple-system,Arial'});
    num.textContent=(i+1); g.appendChild(num);
    const toRight = x < MAP_W-230;
    const lx = x + (toRight?20:-20);
    // Leader-Linie, falls Label vertikal versetzt wurde
    if(Math.abs(ly-y)>2){
      g.appendChild(svgEl('line',{x1:x+(toRight?12:-12),y1:y,x2:lx,y2:ly-5,stroke:'#8a6f3a','stroke-width':'1.4','stroke-dasharray':'2 3'}));
    }
    const lbl=svgEl('text',{x:lx,y:ly,'font-size':'19','font-weight':'700',fill:'#12333c',
      'font-family':'Georgia, serif','text-anchor':toRight?'start':'end','paint-order':'stroke',stroke:'#EAE0CB','stroke-width':'4'});
    lbl.textContent=l.name; g.appendChild(lbl);
    const fire=()=>onPinClick(l);
    g.addEventListener('click',fire);
    g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')fire();});
    svg.appendChild(g);
  });

  container.appendChild(svg);
  return svg;
}
window.PortugalMap = { renderMap };
