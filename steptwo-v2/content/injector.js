// injector.js - injects picker and scraper when activated via extension action

(async () => {
  let profiles = {};
  let autoDetect = true;
  chrome.runtime.sendMessage({type:'GET_PROFILES'}, resp => {
    if(resp){profiles = resp.profiles||{}; autoDetect = resp.autoDetect; maybeAuto();}
  });

  function maybeAuto(){
    if(!autoDetect) return;
    const host = location.hostname.replace(/^www\./,'');
    const profile = profiles[host];
    if(profile){
      import(chrome.runtime.getURL('content/scraper.js')).then(mod=>{
        mod.runScrape(profile.selector);
      });
    }
  }

  // Wait for command from popup to start picker
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === 'START_PICKER') {
      import(chrome.runtime.getURL('content/picker.js')).then(module => {
        module.startPicker();
      });
    } else if (msg?.type === 'PICKER_DONE') {
      import(chrome.runtime.getURL('content/scraper.js')).then(mod => {
        mod.runScrape(msg.selector);
      });
    } else if(msg?.type==='SMART_GUESS'){
      import(chrome.runtime.getURL('content/smartGuess.js')).then(m=>m.guessSelector()).then(sel=>{
        if(sel){
          import(chrome.runtime.getURL('content/scraper.js')).then(scr=>scr.runScrape(sel));
        } else {
          alert('Smart guess could not detect a gallery. Use manual picker.');
        }
      });
    } else if(msg?.type==='START_REC'){
      import(chrome.runtime.getURL('content/macro/recorder.js')).then(m=>m.startRec());
    } else if(msg?.type==='STOP_REC'){
      import(chrome.runtime.getURL('content/macro/recorder.js')).then(m=>m.stopRec());
    }
  });

  async function smartGuess(){
    const candidates = new Map();
    const all = Array.from(document.querySelectorAll('img,a,div'));
    for(const el of all){
      if(!el.offsetParent) continue; // not visible
      const parent = el.parentElement;
      if(!parent) continue;
      const sel = parent.tagName.toLowerCase();
      const count = candidates.get(sel)||0;
      candidates.set(sel,count+1);
    }
    let bestSel='',bestCount=0;
    for(const [sel,count] of candidates){
      if(count>bestCount){bestCount=count;bestSel=sel;}
    }
    if(bestCount<10) return '';
    return bestSel+' img';
  }
})();