import {applyMask} from '../background/filename-mask.js';

const {createApp} = Vue;
createApp({
  data(){return{ name:'', selector:'', description:'', concurrency:5, mask:'*name* -*num*.*ext*', maskPreview:'', recipes:[] }},
  async created(){
    const data = await chrome.storage.sync.get(['recipes','concurrency','mask']);
    this.recipes = data.recipes || [];
    this.concurrency = data.concurrency || 5;
    this.mask = data.mask || this.mask;
    this.updatePreview();
  },
  watch:{
    mask(){this.updatePreview();}
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