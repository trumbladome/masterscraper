import {applyMask} from '../background/filename-mask.js';

const {createApp} = Vue;
createApp({
  data(){return{ name:'', selector:'', description:'', concurrency:5, retryLimit:3, hostLimit:3, downloadFolder:'', minWidth:0,minHeight:0, formats:{jpeg:true,png:true,webp:true,gif:false}, mask:'*name* -*num*.*ext*', maskPreview:'', autoDetect:true, profiles:{}, recipes:[] }},
  async created(){
    const data = await chrome.storage.sync.get(['recipes','concurrency','mask','autoDetectProfiles','retryLimit','hostLimit','downloadFolder','minWidth','minHeight','formats']);
    this.recipes = data.recipes || [];
    this.concurrency = data.concurrency || 5;
    this.retryLimit = data.retryLimit ?? 3;
    this.hostLimit = data.hostLimit ?? 3;
    this.downloadFolder = data.downloadFolder || '';
    this.mask = data.mask || this.mask;
    this.autoDetect = data.autoDetectProfiles !== false;
    this.minWidth = data.minWidth ?? 0;
    this.minHeight = data.minHeight ?? 0;
    this.formats = data.formats || this.formats;
    this.updatePreview();
    chrome.runtime.sendMessage({type:'GET_PROFILES'}, resp=>{ if(resp){ this.profiles = resp.profiles; }});
  },
  watch:{
    mask(){this.updatePreview();},
    autoDetect(val){ chrome.storage.sync.set({autoDetectProfiles:val}); },
    concurrency(val){ chrome.storage.sync.set({concurrency:val}); },
    retryLimit(val){ chrome.storage.sync.set({retryLimit:val}); },
    hostLimit(val){ chrome.storage.sync.set({hostLimit:val}); },
    downloadFolder(val){ chrome.storage.sync.set({downloadFolder:val}); },
    minWidth(val){ chrome.storage.sync.set({minWidth:val}); },
    minHeight(val){ chrome.storage.sync.set({minHeight:val}); },
    formats:{
      handler(val){ chrome.storage.sync.set({formats:val}); },
      deep:true
    }
  },
  methods:{
    updatePreview(){
      this.maskPreview = applyMask(this.mask,{name:'image',num:1,ext:'jpg',host:'example.com',subdirs:'gallery'});
    },
    async save(){
      if(!this.name||!this.selector) return;
      this.recipes.push({name:this.name, selector:this.selector, description:this.description});
      await chrome.storage.sync.set({recipes:this.recipes, concurrency:this.concurrency, mask:this.mask});
      this.name=this.selector=this.description='';
    },
    async remove(r){
      this.recipes = this.recipes.filter(x=>x!==r);
      await chrome.storage.sync.set({recipes:this.recipes});
    },
    setupRecorderButton(){
      const btn=document.getElementById('recordBtn');
      const statusDiv=document.getElementById('macroStatus');
      let recording=false;
      btn.addEventListener('click',()=>{
        chrome.tabs.query({active:true,currentWindow:true}, tabs=>{
          if(!tabs.length) return;
          const tabId=tabs[0].id;
          chrome.tabs.sendMessage(tabId,{type: recording?'STOP_REC':'START_REC'});
          recording=!recording;
          btn.textContent=recording?'Stop Recording':'Start Recording';
          statusDiv.textContent=recording?'Recording…':'Idle';
        });
      });
      chrome.runtime.onMessage.addListener((msg)=>{
        if(msg?.type==='REC_COMPLETE'){
          recording=false;
          btn.textContent='Start Recording';
          statusDiv.textContent=`Recorded ${msg.steps.length} steps`;
          // store globally (simple demo)
          chrome.storage.sync.set({macroSteps:msg.steps});
        }
      });
    }
  }
}).mount('#app');