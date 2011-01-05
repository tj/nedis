
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
 * TYPE <key>
 */

exports.type = function(client, key){
  var key = utils.string(key)
    , val = this.data[key];
  
  if (val) {
    // TODO: others when supported
    client.write('string');
  } else {
    client.write('none');
  }
};

/**
 * EXISTS <key>
 */

exports.exists = function(client, key){
  key = utils.string(key);
  client.bool(null != this.data[key]);
};

/**
 * RANDOMKEY
 */

exports.randomkey = function(client){
  var keys = Object.keys(this.data)
    , len = keys.length;

  if (len) {
    var key = keys[Math.random() * len | 0];
    client.send(key);
  } else {
    client.nil();
  }
};

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
 * RENAME from to
 */

exports.rename = function(client, from, to){
  from = utils.string(from);
  if (null == this.data[from]) return client.error('no such key');
  to = utils.string(to);
  if (from == to) return client.error('source and destination objects are the same');
  this.data[to] = this.data[from];
  this.data[from] = null; 
  client.ok();
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
  pattern = utils.parsePattern(pattern);

  // Filter
  for (var i = 0, len = keys.length; i < len; ++i) {
    if (pattern.test(keys[i])) {
      matched.push(keys[i]);
    }
  }
  
  client.list(matched);
};
