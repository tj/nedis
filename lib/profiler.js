
/*!
 * Nedis - profiler
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

require.registerExtension('.js', function(js){
  return js
    .replace(/^ *\/\/start: *(\w+)/gm, 'console.time("$1")')
    .replace(/^ *\/\/end: *(\w+)/gm, 'console.timeEnd("$1")');
});