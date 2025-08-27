// scraper.js - very basic extractor that collects href/src values

export async function runScrape(selector) {
  const collected = new Set();
  const items = [];
  function collect() {
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
      if(url) items.push({url});
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