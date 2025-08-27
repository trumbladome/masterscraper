// scraper.js - very basic extractor that collects href/src values

export async function runScrape(selector) {
  const nodes = Array.from(document.querySelectorAll(selector));
  const items = [];
  for (const el of nodes) {
    let url = '';
    if (el.tagName === 'IMG') {
      url = el.src;
    } else if (el.tagName === 'A') {
      url = el.href;
    } else {
      // attempt background-image
      const bg = getComputedStyle(el).backgroundImage;
      const m = bg && bg.match(/url\(["']?(.*?)["']?\)/);
      if (m) url = m[1];
    }
    if (url) items.push({url});
  }
  // Send to service worker
  chrome.runtime.sendMessage({type:'SCRAPE_DONE', items});
}