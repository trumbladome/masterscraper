// scraper.js - very basic extractor that collects href/src values

// fetch filter settings
const settings = await chrome.storage.sync.get(['minWidth','minHeight','formats','skipDup']);
const minW = settings.minWidth||0;
const minH = settings.minHeight||0;
const formats = settings.formats||{jpeg:true,png:true,webp:true,gif:false};
const skipDup = settings.skipDup || false;
let seenHashes = new Set();
let hashWorker = null;
function getWorker(){
  if(hashWorker) return hashWorker;
  hashWorker = new Worker(chrome.runtime.getURL('content/hashWorker.js'));
  return hashWorker;
}
function hashImage(url){
  return new Promise(res=>{
    const id=Math.random().toString(36).slice(2);
    const wk=getWorker();
    const listener = e=>{ if(e.data.id===id){ wk.removeEventListener('message',listener); res(e.data.hash||null);} };
    wk.addEventListener('message',listener);
    wk.postMessage({id,url});
  });
}

function validFormat(url){
  const ext = (url.split('.').pop()||'').toLowerCase().split(/[#?]/)[0];
  if(['jpg','jpeg'].includes(ext)) return formats.jpeg;
  if(ext==='png') return formats.png;
  if(ext==='webp') return formats.webp;
  if(ext==='gif') return formats.gif;
  return false;
}

async function passesSize(url){
  if(minW===0&&minH===0) return true;
  return new Promise(res=>{
    const img = new Image();
    img.onload = ()=>{res(img.naturalWidth>=minW && img.naturalHeight>=minH);};
    img.onerror = ()=>res(false);
    img.src = url;
  });
}

export async function runScrape(selector) {
  const collected = new Set();
  const items = [];
  async function collect() {
    const nodes = Array.from(document.querySelectorAll(selector));
    for (const el of nodes) {
      if (collected.has(el)) continue;
      collected.add(el);
      let url='';
      if(el.tagName==='IMG') url=el.src;
      else if(el.tagName==='A') url=el.href;
      else{
        const bg=getComputedStyle(el).backgroundImage;
        const m=bg&&bg.match(/url\(["']?(.*?)["']?\)/);
        if(m) url=m[1];
      }
      if(!url) continue;
      if(!validFormat(url)) continue;
      if(!(await passesSize(url))) continue;
      if(skipDup){
        const hash = await hashImage(url);
        if(!hash || seenHashes.has(hash)){
          chrome.runtime.sendMessage({type:'DUP_SKIPPED',url});
          continue; // duplicate
        }
        seenHashes.add(hash);
      }
      items.push({url});
    }
  }
  collect();
  // Auto-scroll pagination using IntersectionObserver
  let done=false;
  const sentinel=document.createElement('div');
  sentinel.style.height='1px';
  document.body.appendChild(sentinel);
  const io=new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting){
      window.scrollBy(0, window.innerHeight);
      setTimeout(()=>{
        const prevCount=items.length;
        collect();
        if(items.length===prevCount){
          // no new items; assume end
          done=true;
          finalize();
          io.disconnect();
          sentinel.remove();
        }
      },500);
    }
  });
  io.observe(sentinel);

  function finalize(){
    chrome.runtime.sendMessage({type:'SCRAPE_DONE',items});
  }

  // Fallback timeout finalization after 30s
  setTimeout(()=>{if(!done){done=true;io.disconnect();sentinel.remove();finalize();}},30000);
}