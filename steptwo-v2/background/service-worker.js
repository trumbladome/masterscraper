// service-worker.js - STEPTWO V2
// Message router and integration with DownThemAll queue (to be implemented)
import {DownloadQueue} from './dta-queue.js';
import {applyMask} from './filename-mask.js';

const queue = new DownloadQueue({concurrency:5,retryLimit:3});
queue.attachListeners();
queue.setProgressCallback(progress => {
  chrome.runtime.sendMessage({type:'QUEUE_PROGRESS', progress});
});

let lastItems = [];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.type) return;
  switch (msg.type) {
    case 'SCRAPE_DONE': {
      const items = msg.items || [];
      lastItems = items;
      let counter = 1;
      for (const it of items) {
        // Determine filename using mask
        const url = it.url;
        const urlObj = new URL(url);
        const namePart = urlObj.pathname.split('/').pop() || 'file';
        const ext = namePart.includes('.') ? namePart.split('.').pop() : '';
        const filename = applyMask('*name* -*num*.*ext*', {
          name: namePart.replace(/\.[^/.]+$/, ''),
          num: counter++,
          ext
        });
        queue.add({url, filename});
      }
      break;
    }
    case 'EXPORT_CSV': {
      if (!lastItems.length) return;
      const headers = 'url,filename\n';
      const rows = lastItems.map(it => `${it.url},${it.filename || ''}`).join('\n');
      const csv = headers + rows;
      const blob = new Blob([csv], {type:'text/csv'});
      const url = URL.createObjectURL(blob);
      chrome.downloads.download({url, filename:'scrape.csv', saveAs:true});
      break;
    }
    default:
      console.warn('Unknown message type', msg.type);
  }
});