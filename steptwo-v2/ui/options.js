const {createApp} = Vue;
createApp({
  data(){return{ name:'', selector:'', description:'', concurrency:5, recipes:[] }},
  async created(){
    const data = await chrome.storage.sync.get(['recipes','concurrency']);
    this.recipes = data.recipes || [];
    this.concurrency = data.concurrency || 5;
  },
  methods:{
    async save(){
      if(!this.name||!this.selector) return;
      this.recipes.push({name:this.name, selector:this.selector, description:this.description});
      await chrome.storage.sync.set({recipes:this.recipes, concurrency:this.concurrency});
      this.name=this.selector=this.description='';
    },
    async remove(r){
      this.recipes = this.recipes.filter(x=>x!==r);
      await chrome.storage.sync.set({recipes:this.recipes});
    }
  }
}).mount('#app');