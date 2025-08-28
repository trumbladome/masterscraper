// smartGuess.js – Advanced heuristic inspired by Instant Data Scraper
import {getCssPath} from '../lib/css-path.js';

// Utility: check visible
function isVisible(el){
  const rect = el.getBoundingClientRect();
  return rect.width>0 && rect.height>0 && rect.bottom>0 && rect.right>0 && getComputedStyle(el).display!=='none' && getComputedStyle(el).visibility!=='hidden';
}

export async function guessSelector(){
  const map = new Map(); // hash -> nodes array
  const all = Array.from(document.querySelectorAll('body *'));
  for(const el of all){
    if(!isVisible(el)) continue;
    const hash = el.tagName.toLowerCase()+'|'+Array.from(el.classList).sort().join('.');
    const arr = map.get(hash)||[];
    arr.push(el);
    map.set(hash,arr);
  }

  let best=null;
  for(const [hash,nodes] of map){
    if(nodes.length<5) continue; // need repetition
    // compute average height and gap
    let totalH=0, totalGap=0;
    for(let i=0;i<nodes.length;i++){
      const r=nodes[i].getBoundingClientRect();
      totalH+=r.height;
      if(i>0){ totalGap+=r.top - nodes[i-1].getBoundingClientRect().bottom; }
    }
    const avgH = totalH/nodes.length;
    const avgGap = totalGap/Math.max(1,nodes.length-1);
    if(avgGap/avgH>0.6) continue; // rows too far apart
    // ensure it contains img or link
    const first = nodes[0];
    if(!first.querySelector('img, a')) continue;

    const areaScore = nodes.length * avgH;
    if(!best || areaScore>best.areaScore){
      best={nodes, areaScore};
    }
  }

  if(!best) return '';
  const selector = getCssPath(best.nodes[0]);
  // highlight first 3 rows briefly
  highlight(best.nodes.slice(0,3));
  return selector+' img, '+selector+' a';
}

function highlight(nodes){
  const boxes=[];
  nodes.forEach(n=>{
    const rect=n.getBoundingClientRect();
    const div=document.createElement('div');
    div.style.position='fixed';
    div.style.left=rect.left+'px';
    div.style.top=rect.top+'px';
    div.style.width=rect.width+'px';
    div.style.height=rect.height+'px';
    div.style.border='2px solid #2ac3ff';
    div.style.zIndex='2147483647';
    div.style.pointerEvents='none';
    document.body.appendChild(div);
    boxes.push(div);
  });
  setTimeout(()=>boxes.forEach(b=>b.remove()),2000);
}