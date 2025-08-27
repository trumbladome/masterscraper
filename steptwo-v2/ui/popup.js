document.getElementById('start').addEventListener('click', () => {
  chrome.tabs.query({active:true,currentWindow:true}, tabs => {
    if (!tabs.length) return;
    chrome.tabs.sendMessage(tabs[0].id, {type:'START_PICKER'});
  });
});