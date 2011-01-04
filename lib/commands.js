
/*!
 * Nedis - commands
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('./utils')
  , toString = utils.toString;

/**
 * KEYS <pattern>
 */

exports.keys = function(client, pattern){
  var pattern = toString(pattern)
    , keys = Object.keys(this.data)
    , matched = [];

  // Optimize for "*"
  if ('*' == pattern) return client.send(keys);

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
  
  client.send(matched);
};

/**
 * GET key.
 */

exports.get = function(client, key){
  var key = toString(key)
    , val = this.data[key];
  if (val) {
    client.send(val);
  } else {
    client.nil();
  }
};

/**
 * SET key val
 */

exports.set = function(client, key, val){
  key = toString(key);
  this.data[key] = val;
  client.ok();
};