import {getCssPath} from '../../lib/css-path.js';

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function queryVisible(selectors,timeout=3000){
  const end=Date.now()+timeout;
  while(Date.now()<end){
    for(const sel of selectors){
      const el=document.querySelector(sel);
      if(el && el.offsetParent) return el;
    }
    await sleep(100);
  }
  throw new Error('Element not found');
}

export async function runMacro(steps){
  for(const step of steps){
    switch(step.type){
      case 'delay':
        await sleep(step.ms);
        break;
      case 'click':{
        const el=await queryVisible(step.selector);
        el.dispatchEvent(new MouseEvent('click',{bubbles:true,button:step.button||0}));
        break;}
      case 'scroll':{
        window.scrollBy({top:step.deltaY||step.y||0,behavior:'smooth'});
        await sleep(500);
        break;}
      default:
        console.warn('Unsupported step',step);
    }
  }
}