
/*!
 * Nedis - profiler
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

require.extensions['.js'] = function(module, filename){
  var js = require('fs').readFileSync(filename, 'utf8')
    .replace(/^ *\/\/start: *([^\n]+)/gm, 'console.time($1)')
    .replace(/^ *\/\/end: *([^\n]+)/gm, 'console.timeEnd($1)');
  module._compile(js, filename);
};
