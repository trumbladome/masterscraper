// filename-mask.js - Very small subset of DownThemAll! mask parser

export function applyMask(mask, {name='', num=1, ext=''}) {
  let out = mask;
  out = out.replace(/\*name\*/gi, name);
  out = out.replace(/\*num\*/gi, String(num).padStart(3,'0'));
  out = out.replace(/\*ext\*/gi, ext.replace(/^\./,''));
  return out;
}