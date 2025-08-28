import {getCssPath} from '../../lib/css-path.js';

let recording = false;
let steps = [];
let lastTime = Date.now();
let lastTarget = null;
let mutationObserver;
let urlAtClick = location.href;

function startObservers(){
  if(mutationObserver) return;
  mutationObserver = new MutationObserver((muts)=>{ /* noop */ });
  mutationObserver.observe(document.body,{childList:true,subtree:true});
}
function stopObservers(){
  if(mutationObserver){mutationObserver.disconnect();mutationObserver=null;}
}

function inferWaitUntil(){
  // if URL changed
  if(location.href!==urlAtClick){
    steps.push({type:'waitUntil',condition:'urlChange'});
    urlAtClick=location.href;
    return;
  }
  // if new element matching lastTarget appears
  if(lastTarget){
    const sel=getCssPath(lastTarget);
    if(document.querySelector(sel)){
      steps.push({type:'waitUntil',selector:[sel]});
    }else{steps.push({type:'waitUntil',condition:'domStable',timeout:3000});}
  }
}

function onClick(e){
  if(!recording) return;
  const now=Date.now();
  const gap=now-lastTime; lastTime=now;
  if(gap>600) steps.push({type:'delay',ms:gap});
  const sel=getCssPath(e.target);
  steps.push({type:'click',selector:[sel],button:e.button});
}

let lastScrollY=window.scrollY;
function onScroll(){
  if(!recording) return;
  const delta=window.scrollY-lastScrollY;
  if(Math.abs(delta)<50) return; // ignore small moves
  const now=Date.now();
  const gap=now-lastTime; lastTime=now;
  if(gap>600) steps.push({type:'delay',ms:gap});
  steps.push({type:'scroll',deltaY:delta});
  lastScrollY=window.scrollY;
  lastTarget=null; inferWaitUntil();
}

function onInput(e){
  if(!recording) return;
  const now=Date.now();
  const gap=now-lastTime; lastTime=now;
  if(gap>600) steps.push({type:'delay',ms:gap});
  const sel=getCssPath(e.target);
  steps.push({type:'input',selector:[sel],value:e.target.value});
  lastTarget=e.target;
  inferWaitUntil();
}

export function startRec(){
  if(recording) return;
  recording=true; steps=[]; lastTime=Date.now();
  document.addEventListener('click',onClick,true);
  document.addEventListener('input',onInput,true);
  window.addEventListener('scroll',onScroll,true);
  startObservers();
  console.log('Macro recording started');
}

export function stopRec(){
  if(!recording) return;
  recording=false;
  document.removeEventListener('click',onClick,true);
  document.removeEventListener('input',onInput,true);
  window.removeEventListener('scroll',onScroll,true);
  stopObservers();
  chrome.runtime.sendMessage({type:'REC_COMPLETE',steps});
  console.log('Macro recording stopped',steps);
}