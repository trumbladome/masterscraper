import {getCssPath} from '../lib/css-path.js';

let overlay;
let tooltip;
export function startPicker() {
  if (overlay) return;
  
  // Create main overlay
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

  // Create tooltip
  tooltip = document.createElement('div');
  tooltip.style.position = 'fixed';
  tooltip.style.zIndex = '2147483647';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  tooltip.style.color = 'white';
  tooltip.style.padding = '8px 12px';
  tooltip.style.borderRadius = '6px';
  tooltip.style.fontSize = '14px';
  tooltip.style.fontFamily = 'Arial, sans-serif';
  tooltip.style.whiteSpace = 'nowrap';
  tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
  tooltip.style.transform = 'translate(-50%, -100%)';
  tooltip.style.marginTop = '-10px';
  tooltip.textContent = 'Click an image to select';
  document.body.appendChild(tooltip);

  function move(e) {
    const el = e.target;
    const rect = el.getBoundingClientRect();
    overlay.style.pointerEvents = 'none';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    
    // Update tooltip position
    tooltip.style.left = e.clientX + 'px';
    tooltip.style.top = e.clientY + 'px';
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
    if (overlay) {
      overlay.remove();
      overlay = null;
    }
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
  }

  document.addEventListener('mousemove', move, true);
  document.addEventListener('click', click, true);
}