
/*!
 * Nedis - debugger
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

require.extensions['.js'] = function(module, filename){
  var js = require('fs').readFileSync(filename, 'utf8');
  module._compile(js.replace(/^ *\/\/debug: */gm, ''), filename);
};
