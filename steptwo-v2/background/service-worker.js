// service-worker.js - STEPTWO V2
// Message router and integration with DownThemAll queue (to be implemented)
import {DownloadQueue} from './dta-queue.js';
import {applyMask} from './filename-mask.js';
import * as XLSX from 'xlsx';
import profilesData from '../profiles.json' assert { type: 'json' };

let profiles = profilesData;
let autoDetect = true;

const queue = new DownloadQueue({concurrency:5,retryLimit:3});
queue.attachListeners();
queue.setProgressCallback(progress => {
  chrome.runtime.sendMessage({type:'QUEUE_PROGRESS', progress});
});

let lastItems = [];

let savedConcurrency = 5;
let maskPattern='*name* -*num*.*ext*';
let retryLimit = 3;
let hostLimit = 3;
let downloadFolder='';
chrome.storage.sync.get(['concurrency','mask','retryLimit','hostLimit','downloadFolder']).then(d=>{
  if(d.concurrency) savedConcurrency = d.concurrency;
  if(d.mask) maskPattern=d.mask;
  if(d.retryLimit!==undefined){ retryLimit = d.retryLimit; queue.setRetryLimit(retryLimit);} 
  if(d.hostLimit!==undefined){ hostLimit = d.hostLimit; queue.setHostLimit(hostLimit);} 
  if(d.downloadFolder) downloadFolder=d.downloadFolder;
  queue.setConcurrency(savedConcurrency);
});

chrome.storage.onChanged.addListener(changes=>{
  if(changes.concurrency){
    const newVal = changes.concurrency.newValue;
    queue.setConcurrency(newVal);
  }
  if(changes.mask) maskPattern=changes.mask.newValue;
  if(changes.retryLimit){
    retryLimit = changes.retryLimit.newValue;
    queue.setRetryLimit(retryLimit);
  }
  if(changes.hostLimit){ hostLimit = changes.hostLimit.newValue; queue.setHostLimit(hostLimit);} 
  if(changes.downloadFolder) downloadFolder=changes.downloadFolder.newValue||'';
});

chrome.storage.sync.get('autoDetectProfiles').then(d=>{if(typeof d.autoDetectProfiles==='boolean') autoDetect=d.autoDetectProfiles;});

const REMOTE_PROFILE_URL = 'https://raw.githubusercontent.com/steptwo-profiles/main/profiles.json';
let remoteProfiles = null;
let profilesLastUpdate = 0;

async function fetchRemoteProfiles(force=false){
  if(!autoDetect) return;
  if(!force && Date.now()-profilesLastUpdate < 1000*60*60*24*7){ // 7 days
    return;
  }
  try{
    const res = await fetch(REMOTE_PROFILE_URL,{cache:'no-cache'});
    if(res.ok){
      const json = await res.json();
      remoteProfiles = json;
      profilesLastUpdate = Date.now();
      await chrome.storage.local.set({remoteProfiles, profilesLastUpdate});
      console.log('Remote profiles updated');
    }
  }catch(e){console.warn('Remote profile fetch failed',e);}
}

// load cache
chrome.storage.local.get(['remoteProfiles','profilesLastUpdate']).then(d=>{
  if(d.remoteProfiles) remoteProfiles = d.remoteProfiles;
  profilesLastUpdate = d.profilesLastUpdate||0;
  fetchRemoteProfiles();
});

chrome.alarms.onAlarm.addListener(a=>{if(a.name==='updateProfiles') fetchRemoteProfiles();});
chrome.alarms.create('updateProfiles',{periodInMinutes:60*24}); // daily

chrome.runtime.onMessage.addListener((msg,sender,sendResponse)=>{
  if(msg?.type==='UPDATE_PROFILES'){
    fetchRemoteProfiles(true).then(()=>sendResponse({ok:true,updated:remoteProfiles!=null}));
    return true; // async
  }
});

function getProfiles(){
  return remoteProfiles || profiles;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if(msg?.type==='GET_PROFILES'){
    sendResponse({profiles: getProfiles(), autoDetect});
    return; // sync response
  }
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
        const filename = applyMask(maskPattern,{name: namePart.replace(/\.[^/.]+$/, ''), num: counter++, ext, host:urlObj.host, subdirs:urlObj.pathname.split('/').slice(0,-1).join('/')});
        const finalName = downloadFolder ? `${downloadFolder.replace(/\/+/g,'/')}/${filename}` : filename;
        queue.add({url, filename: finalName});
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
    case 'EXPORT_XLSX': {
      if(!lastItems.length) return;
      const ws = XLSX.utils.json_to_sheet(lastItems);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Scrape');
      const wbout = XLSX.write(wb,{type:'array',bookType:'xlsx'});
      const blob = new Blob([wbout],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url = URL.createObjectURL(blob);
      chrome.downloads.download({url, filename:'scrape.xlsx', saveAs:true});
      break;
    }
    case 'QUEUE_PAUSE':{
      queue.pause();
      break;
    }
    case 'QUEUE_RESUME':{
      queue.resume();
      break;
    }
    default:
      console.warn('Unknown message type', msg.type);
  }
});