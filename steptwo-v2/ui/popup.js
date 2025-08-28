document.getElementById('start').addEventListener('click', () => {
  chrome.tabs.query({active:true,currentWindow:true}, tabs => {
    if (!tabs.length) return;
    chrome.tabs.sendMessage(tabs[0].id, {type:'START_PICKER'});
  });
});

document.getElementById('export').addEventListener('click',()=>{
  chrome.runtime.sendMessage({type:'EXPORT_CSV'});
});

document.getElementById('export-xlsx').addEventListener('click',()=>{
  chrome.runtime.sendMessage({type:'EXPORT_XLSX'});
});

document.getElementById('pause').addEventListener('click',()=>{
  chrome.runtime.sendMessage({type:'QUEUE_PAUSE'});
  document.getElementById('pause').disabled=true;
  document.getElementById('resume').disabled=false;
});

document.getElementById('resume').addEventListener('click',()=>{
  chrome.runtime.sendMessage({type:'QUEUE_RESUME'});
  document.getElementById('pause').disabled=false;
  document.getElementById('resume').disabled=true;
});

document.getElementById('smart').addEventListener('click',()=>{
  chrome.tabs.query({active:true,currentWindow:true}, tabs => {
    if(!tabs.length) return;
    chrome.tabs.sendMessage(tabs[0].id,{type:'SMART_GUESS'});
  });
});

const progressDiv = document.getElementById('progress');
chrome.runtime.onMessage.addListener((msg, sender) => {
  if(msg?.type==='QUEUE_PROGRESS'){
    const {progress} = msg;
    const line = document.createElement('div');
    line.textContent = `${progress.state}: ${progress.job?.filename || ''}`;
    progressDiv.appendChild(line);
    progressDiv.scrollTop = progressDiv.scrollHeight;
  }
});