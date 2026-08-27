const DEFAULT_BOUNDS={minLat:36.90,maxLat:38.85,minLon:-9.55,maxLon:-7.80};
const MAP_W=800,MAP_H=900,PAD=70;
const COAST=[[-9.30,38.78],[-9.48,38.68],[-9.32,38.50],[-9.20,38.42],[-8.98,38.48],[-8.90,38.40],[-8.79,38.30],[-8.80,38.05],[-8.87,37.95],[-8.80,37.70],[-8.86,37.44],[-8.90,37.25],[-8.99,37.02],[-8.80,36.99],[-8.60,37.09],[-8.40,37.08],[-8.20,37.07],[-8.05,37.05],[-7.92,37.01]];
function makeProjector(b){return(lat,lon)=>[PAD+(lon-b.minLon)/(b.maxLon-b.minLon)*(MAP_W-2*PAD),PAD+(b.maxLat-lat)/(b.maxLat-b.minLat)*(MAP_H-2*PAD)];}
function svgEl(n,a){const e=document.createElementNS('http://www.w3.org/2000/svg',n);Object.entries(a||{}).forEach(([k,v])=>e.setAttribute(k,v));return e;}
function coastPath(P){const p=COAST.map(([lo,la])=>P(la,lo));let d=`M ${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;for(let i=1;i<p.length;i++){const[x,y]=p[i],[px,py]=p[i-1];d+=` Q ${px.toFixed(1)} ${py.toFixed(1)} ${((x+px)/2).toFixed(1)} ${((y+py)/2).toFixed(1)}`;}return d;}
function smoothPath(pts){if(!pts||pts.length<2)return'';let d=`M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;for(let i=1;i<pts.length;i++){const[x,y]=pts[i],[px,py]=pts[i-1];d+=` Q ${px.toFixed(1)} ${py.toFixed(1)} ${((x+px)/2).toFixed(1)} ${((y+py)/2).toFixed(1)}`;}const l=pts[pts.length-1];return `${d} L ${l[0].toFixed(1)} ${l[1].toFixed(1)}`;}
function renderMap(container,mapDef,locById,onPinClick){
 const bounds=mapDef.view||DEFAULT_BOUNDS,P=makeProjector(bounds);container.innerHTML='';
 const svg=svgEl('svg',{viewBox:`0 0 ${MAP_W} ${MAP_H}`,id:'mapSVG',role:'img','aria-label':`Karte ${mapDef.title||''}`});
 const defs=svgEl('defs');defs.innerHTML='<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#123849"/><stop offset="1" stop-color="#0C2028"/></linearGradient>';svg.appendChild(defs);
 svg.appendChild(svgEl('rect',{x:0,y:0,width:MAP_W,height:MAP_H,fill:'url(#sea)'}));
 const coast=coastPath(P);
 svg.appendChild(svgEl('path',{d:`${coast} L ${MAP_W} ${MAP_H} L ${MAP_W} 0 Z`,fill:'#EAE0CB',opacity:'0.96'}));
 svg.appendChild(svgEl('path',{d:coast,fill:'none',stroke:'#5A6E62','stroke-width':'2.4','stroke-linecap':'round'}));
 if(Array.isArray(mapDef.routePath)&&mapDef.routePath.length>1){const rp=mapDef.routePath.map(([la,lo])=>P(la,lo));svg.appendChild(svgEl('path',{d:smoothPath(rp),fill:'none',stroke:'#C99A52','stroke-width':'4','stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':'2 12',opacity:'0.95'}));}
 const points=(mapDef.pins||[]).map((id,index)=>{const location=locById[id];if(!location)return null;const[x,y]=P(location.lat,location.lon);return{location,index,x,y,labelY:y};}).filter(Boolean);
 const sorted=[...points].sort((a,b)=>a.y-b.y);for(let i=1;i<sorted.length;i++){if(sorted[i].labelY-sorted[i-1].labelY<30)sorted[i].labelY=sorted[i-1].labelY+30;}
 points.forEach(({location,index,x,y,labelY})=>{const g=svgEl('g',{class:'pin',style:'cursor:pointer',tabindex:'0',role:'button','aria-label':location.name});
  g.appendChild(svgEl('circle',{cx:x,cy:y,r:23,fill:'#C99A52','fill-opacity':'0.16'}));
  g.appendChild(svgEl('circle',{cx:x,cy:y,r:12,fill:'#C99A52',stroke:'#0E2A33','stroke-width':'3'}));
  const num=svgEl('text',{x,y:y+4,'text-anchor':'middle','font-size':'13','font-weight':'800',fill:'#0E2A33','font-family':'-apple-system,Arial'});num.textContent=String(index+1);g.appendChild(num);
  const right=x<MAP_W-240,lx=x+(right?21:-21);
  if(Math.abs(labelY-y)>2)g.appendChild(svgEl('line',{x1:x+(right?13:-13),y1:y,x2:lx,y2:labelY-6,stroke:'#8A6F3A','stroke-width':'1.4','stroke-dasharray':'2 3'}));
  const lbl=svgEl('text',{x:lx,y:labelY,'font-size':'19','font-weight':'700',fill:'#12333C','font-family':'Georgia, serif','text-anchor':right?'start':'end','paint-order':'stroke',stroke:'#EAE0CB','stroke-width':'4'});lbl.textContent=location.name;g.appendChild(lbl);
  const open=()=>onPinClick(location);g.addEventListener('click',open);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')open();});svg.appendChild(g);});
 container.appendChild(svg);return svg;}
window.PortugalMap={renderMap};
