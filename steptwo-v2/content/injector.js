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
    }
  });
})();