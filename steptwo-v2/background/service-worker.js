// service-worker.js - STEPTWO V2
// Message router and integration with DownThemAll queue (to be implemented)

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;
  switch (msg.type) {
    case 'SCRAPE_DONE': {
      // todo: forward list to DTA queue
      console.log('Received items from content script', msg.items?.length);
      break;
    }
    default:
      console.warn('Unknown message type', msg.type);
  }
});