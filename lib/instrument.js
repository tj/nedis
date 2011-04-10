
/*!
 * Nedis - instrumentation
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

const fs = require('fs');

module.exports = function (options) {
  require.extensions['.js'] = function(module, filename){
    var js = fs.readFileSync(filename, 'utf8');

    if (options.profile) {
      js = js.replace(/^ *\/\/start: *([^\n]+)/gm, 'console.time($1)')
             .replace(/^ *\/\/end: *([^\n]+)/gm, 'console.timeEnd($1)');
    }

    if (options.debug) {
      js = js.replace(/^ *\/\/debug: */gm, '');
    }

    module._compile(js, filename);
  }
};
