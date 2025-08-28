// dta-queue.js - Simplified port of DownThemAll! queue for STEPTWO V2
// NOTE: This is an initial version focusing on concurrency, retries, and progress callbacks.

export class DownloadQueue {
  constructor({concurrency = 5, retryLimit = 3} = {}) {
    this.concurrency = concurrency;
    this.retryLimit = retryLimit;
    this.queue = [];
    this.active = new Map(); // downloadId -> job
    this.onProgress = () => {};
    this.paused = false;
  }

  pause(){
    this.paused = true;
    this.onProgress({state:'paused'});
  }

  resume(){
    if(!this.paused) return;
    this.paused = false;
    this.onProgress({state:'resumed'});
    this._next();
  }

  setProgressCallback(cb) {
    this.onProgress = typeof cb === 'function' ? cb : () => {};
  }

  add(job) {
    // job: {url, filename, retries}
    job.retries = 0;
    this.queue.push(job);
    this._next();
  }

  _next() {
    if (this.paused) return;
    if (this.active.size >= this.concurrency) return;
    const job = this.queue.shift();
    if (!job) return;
    const options = {
      url: job.url,
      filename: job.filename,
      conflictAction: 'uniquify',
      saveAs: false
    };
    chrome.downloads.download(options, downloadId => {
      if (downloadId === undefined) {
        this._handleError(job);
        return;
      }
      this.active.set(downloadId, job);
      this.onProgress({state:'started', job, downloadId});
    });
  }

  _handleError(job) {
    if (job.retries < this.retryLimit) {
      job.retries += 1;
      const delay = Math.min(30000, Math.pow(2, job.retries) * 1000); // 1s,2s,4s,... cap 30s
      setTimeout(()=>{ this.queue.unshift(job); this._next(); }, delay);
      this.onProgress({state:'retry', job, delay});
    } else {
      this.onProgress({state:'failed', job});
    }
    // Continue flow
    this._next();
  }

  _handleDownloadChanged(delta) {
    if (!delta.state || !delta.state.current) return;
    const job = this.active.get(delta.id);
    if (!job) return;
    if (delta.state.current === 'complete') {
      this.active.delete(delta.id);
      this.onProgress({state:'completed', job, downloadId: delta.id});
      this._next();
    } else if (delta.state.current === 'interrupted') {
      this.active.delete(delta.id);
      this._handleError(job);
    }
  }

  attachListeners() {
    this._onChanged = this._handleDownloadChanged.bind(this);
    chrome.downloads.onChanged.addListener(this._onChanged);
  }

  detachListeners() {
    if (this._onChanged) chrome.downloads.onChanged.removeListener(this._onChanged);
  }

  setConcurrency(n){
    if(typeof n==='number'&&n>0){
      this.concurrency = n;
      this._next();
    }
  }

  setRetryLimit(n){
    if(typeof n==='number'&&n>=0){
      this.retryLimit = n;
    }
  }
}