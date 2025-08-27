// filename-mask.js - Enhanced mask parser supporting tokens
// Tokens: *name*, *num*, *ext*, *date*, *host*, *subdirs*

export function applyMask(mask, ctx) {
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,''); // YYYYMMDD
  let out = mask;
  const replace = (token, value) => { out = out.replace(new RegExp(`\\*${token}\\*`,'gi'), value); };
  replace('name', ctx.name||'');
  replace('num', String(ctx.num||1).padStart(3,'0'));
  replace('ext', ctx.ext||'');
  replace('date', dateStr);
  replace('host', ctx.host||'');
  replace('subdirs', ctx.subdirs||'');
  return out;
}