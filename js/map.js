/* Portugal 2026 — interaktive Magazin-Karte (SVG, offline, keine Fremdbibliothek)
   Projektion: einfache equirectangular-Projektion des Ausschnitts Südwest-Portugal.
   Renders Map A: Route + klickbare Pins. */

const MAP_BOUNDS = {
  // Ausschnitt Südwesten Portugals (grosszügig, damit Lissabon–Faro passt)
  minLat: 36.90, maxLat: 38.85,
  minLon: -9.55, maxLon: -7.80
};
const MAP_W = 800, MAP_H = 900, PAD = 60;

function project(lat, lon){
  const x = PAD + (lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon) * (MAP_W - 2*PAD);
  const y = PAD + (MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat) * (MAP_H - 2*PAD);
  return [x, y];
}

/* Sehr grob stilisierte Küstenlinie SW-Portugals (dekorativ, kein Vermessungsanspruch). */
function coastlinePath(){
  // von Nord (Lissabon-Küste) nach Süd (Sagres) und Ostalgarve
  const pts = [
    [-9.30,38.78],[-9.48,38.68],[-9.32,38.50],[-9.20,38.42],[-8.98,38.48],
    [-8.90,38.40],[-8.79,38.30],[-8.80,38.05],[-8.87,37.95],[-8.80,37.70],
    [-8.86,37.44],[-8.90,37.25],[-8.99,37.02],[-8.80,36.99],[-8.60,37.09],
    [-8.40,37.08],[-8.20,37.07],[-8.05,37.05],[-7.92,37.01]
  ].map(([lo,la])=>project(la,lo));
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for(let i=1;i<pts.length;i++){
    const [x,y]=pts[i], [px,py]=pts[i-1];
    const cx=(x+px)/2, cy=(y+py)/2;
    d += ` Q ${px.toFixed(1)} ${py.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}`;
  }
  return d;
}

function svgEl(name, attrs){
  const e = document.createElementNS('http://www.w3.org/2000/svg', name);
  for(const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

function renderMapA(container, mapDef, locById, onPinClick){
  container.innerHTML='';
  const svg = svgEl('svg', {viewBox:`0 0 ${MAP_W} ${MAP_H}`, id:'mapA', role:'img',
    'aria-label':'Karte Portugal 2026 mit Reiseroute'});

  // Meer-Hintergrund
  const defs = svgEl('defs',{});
  defs.innerHTML =
    `<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#123849"/><stop offset="1" stop-color="#0C2028"/>
     </linearGradient>`;
  svg.appendChild(defs);
  svg.appendChild(svgEl('rect',{x:0,y:0,width:MAP_W,height:MAP_H,fill:'url(#sea)'}));

  // Land (Fläche rechts der Küstenlinie) – dezent warm
  const land = svgEl('path',{
    d: coastlinePath() + ` L ${MAP_W} ${MAP_H} L ${MAP_W} 0 Z`,
    fill:'#EAE0CB', opacity:'0.96'
  });
  svg.appendChild(land);
  // Küstenlinie
  svg.appendChild(svgEl('path',{d:coastlinePath(),fill:'none',
    stroke:'#5A6E62','stroke-width':'2.4','stroke-linecap':'round'}));

  // dezente Gradnetz-Linien
  for(let la=37; la<=38.5; la+=0.5){
    const [ , y] = project(la, MAP_BOUNDS.minLon);
    svg.appendChild(svgEl('line',{x1:0,y1:y,x2:MAP_W,y2:y,stroke:'#ffffff',
      'stroke-opacity':'0.06','stroke-width':'1'}));
  }

  // "SPANIEN" / "ATLANTIK" Labels
  const atl = svgEl('text',{x:70,y:MAP_H*0.42,fill:'#5f7f86','font-size':'26',
    'font-family':'Georgia, serif','letter-spacing':'6',transform:`rotate(-90 70 ${MAP_H*0.42})`});
  atl.textContent='ATLANTIK'; svg.appendChild(atl);

  // Route (Gold, gestrichelt) über die route-locations
  if(mapDef.route && mapDef.route.length>1){
    const rp = mapDef.route.map(id=>{const l=locById[id];return project(l.lat,l.lon);});
    let d = `M ${rp[0][0].toFixed(1)} ${rp[0][1].toFixed(1)}`;
    for(let i=1;i<rp.length;i++) d += ` L ${rp[i][0].toFixed(1)} ${rp[i][1].toFixed(1)}`;
    svg.appendChild(svgEl('path',{d, fill:'none', stroke:'#C99A52','stroke-width':'4',
      'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':'2 12',opacity:'0.95'}));
  }

  // Pins
  mapDef.pins.forEach((id, i)=>{
    const l = locById[id]; if(!l) return;
    const [x,y] = project(l.lat, l.lon);
    const g = svgEl('g',{class:'pin', style:'cursor:pointer', tabindex:'0',
      role:'button', 'aria-label':l.name});
    // Halo
    g.appendChild(svgEl('circle',{cx:x,cy:y,r:20,fill:'#C99A52','fill-opacity':'0.16'}));
    // Punkt
    g.appendChild(svgEl('circle',{cx:x,cy:y,r:11,fill:'#C99A52',stroke:'#0E2A33','stroke-width':'3'}));
    // Nummer
    const num = svgEl('text',{x:x,y:y+4,'text-anchor':'middle','font-size':'12',
      'font-weight':'800',fill:'#0E2A33','font-family':'-apple-system,Arial'});
    num.textContent = (i+1); g.appendChild(num);
    // Label
    const lbl = svgEl('text',{x:x+18,y:y+5,'font-size':'20','font-weight':'700',
      fill:'#12333c','font-family':'Georgia, serif','paint-order':'stroke',
      stroke:'#EAE0CB','stroke-width':'4'});
    lbl.textContent = l.name; g.appendChild(lbl);
    const fire = ()=>onPinClick(l);
    g.addEventListener('click', fire);
    g.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' ') fire(); });
    svg.appendChild(g);
  });

  container.appendChild(svg);
  return svg;
}

window.PortugalMap = { renderMapA, project };
