
/*!
 * Nedis - commands - generic
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils');

/**
 * DEL <key>
 */

exports.del = function(client, key){
  // TODO: varg
  key = utils.string(key);
  if (this.data[key]) {
    this.data[key] = null;
    client.int(1);
  } else {
    client.int(0);
  }
};

/**
 * KEYS <pattern>
 */

exports.keys = function(client, pattern){
  var pattern = utils.string(pattern)
    , keys = Object.keys(this.data)
    , matched = [];

  // Optimize for common "*"
  if ('*' == pattern) return client.list(keys);

  // Convert pattern to regexp
  pattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  pattern = new RegExp('^' + pattern + '$');

  // Filter
  for (var i = 0, len = keys.length; i < len; ++i) {
    if (pattern.test(keys[i])) {
      matched.push(keys[i]);
    }
  }
  
  client.list(matched);
};
