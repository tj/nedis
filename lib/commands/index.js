
/*!
 * Nedis - commands
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

(function merge(type){
  var cmds = require('./' + type);
  for (var cmd in cmds) {
    exports[cmd] = cmds[cmd];
  }
  return merge;
})('keys')('string')('connection')('server');