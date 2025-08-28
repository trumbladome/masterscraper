import {applyMask} from '../background/filename-mask.js';

const {createApp} = Vue;
createApp({
  data(){return{ name:'', selector:'', description:'', concurrency:5, mask:'*name* -*num*.*ext*', maskPreview:'', autoDetect:true, profiles:{}, recipes:[] }},
  async created(){
    const data = await chrome.storage.sync.get(['recipes','concurrency','mask','autoDetectProfiles']);
    this.recipes = data.recipes || [];
    this.concurrency = data.concurrency || 5;
    this.mask = data.mask || this.mask;
    this.autoDetect = data.autoDetectProfiles !== false; // default true
    this.updatePreview();
    // fetch profiles
    chrome.runtime.sendMessage({type:'GET_PROFILES'}, resp=>{ if(resp){ this.profiles = resp.profiles; }});
  },
  watch:{
    mask(){this.updatePreview();},
    autoDetect(val){ chrome.storage.sync.set({autoDetectProfiles:val}); }
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
    }
  }
}).mount('#app');