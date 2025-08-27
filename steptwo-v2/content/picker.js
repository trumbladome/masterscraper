import {getCssPath} from '../lib/css-path.js';

let overlay;
export function startPicker() {
  if (overlay) return;
  overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.right = '0';
  overlay.style.bottom = '0';
  overlay.style.zIndex = '2147483647';
  overlay.style.pointerEvents = 'none';
  overlay.style.border = '2px solid #2ac3ff';
  document.body.appendChild(overlay);

  function move(e) {
    const el = e.target;
    const rect = el.getBoundingClientRect();
    overlay.style.pointerEvents = 'none';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }

  function click(e) {
    e.preventDefault();
    e.stopPropagation();
    const selector = getCssPath(e.target);
    cleanup();
    chrome.runtime.sendMessage({type:'PICKER_DONE', selector});
  }

  function cleanup() {
    document.removeEventListener('mousemove', move, true);
    document.removeEventListener('click', click, true);
    overlay.remove();
    overlay = null;
  }

  document.addEventListener('mousemove', move, true);
  document.addEventListener('click', click, true);
}