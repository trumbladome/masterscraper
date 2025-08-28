import {getCssPath} from '../../lib/css-path.js';

let recording = false;
let steps = [];
let lastTime = Date.now();

function onClick(e){
  if(!recording) return;
  const now=Date.now();
  const gap=now-lastTime; lastTime=now;
  if(gap>600) steps.push({type:'delay',ms:gap});
  const sel=getCssPath(e.target);
  steps.push({type:'click',selector:[sel],button:e.button});
}

export function startRec(){
  if(recording) return;
  recording=true; steps=[]; lastTime=Date.now();
  document.addEventListener('click',onClick,true);
  console.log('Macro recording started');
}

export function stopRec(){
  if(!recording) return;
  recording=false;
  document.removeEventListener('click',onClick,true);
  chrome.runtime.sendMessage({type:'REC_COMPLETE',steps});
  console.log('Macro recording stopped',steps);
}