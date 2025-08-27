// injector.js - injects picker and scraper when activated via extension action

(async () => {
  // Wait for command from background/popup to start picker
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