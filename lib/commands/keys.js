
/*!
 * Nedis - commands - generic
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils')
  , string = utils.string;

/**
 * EXPIRE <key> <seconds>
 */

exports.expire = function(client, key, seconds){
  var obj = this.lookup(string(key));

  if (obj) {
    obj.expires = Date.now() + Number(string(seconds));
    client.bool(true);
  } else {
    client.bool(false);
  }
};

/**
 * EXPIREAT <key> <seconds>
 */

exports.expireat = function(client, key, seconds){
  var obj = this.lookup(string(key));

  if (obj) {
    obj.expires = +string(seconds);
    client.bool(true);
  } else {
    client.bool(false);
  }
};

/**
 * PERSIST <key>
 */

exports.persist = function(client, key){
  var obj = this.lookup(string(key));

  if (obj && 'number' == typeof obj.expires) {
    delete obj.expires;
    client.bool(true);
  } else {
    client.bool(false);
  }
};

/**
 * TTL <key>
 */

exports.ttl = function(client, key){
  var obj = this.lookup(string(key));

  if (obj && 'number' == typeof obj.expires) {
    client.int(obj.expires - Date.now());
  } else {
    client.nil();
  }
};

/**
 * TYPE <key>
 */

exports.type = function(client, key){
  var obj = this.lookup(string(key));
  
  if (obj) {
    client.write(obj.type);
  } else {
    client.write('none');
  }
};

/**
 * EXISTS <key>
 */

exports.exists = function(client, key){
  client.bool(this.lookup(string(key)));
};

/**
 * RANDOMKEY
 */

exports.randomkey = function(client){
  var keys = Object.keys(this.db.data)
    , len = keys.length;

  if (len) {
    var key = keys[Math.random() * len | 0];
    client.send(key);
  } else {
    client.nil();
  }
};

/**
 * DEL <key>+
 */

(exports.del = function(client, key){
  // TODO: varg
  // TODO: del count ?
  key = string(key);
  if (this.lookup(key)) {
    delete this.db.data[key];
    client.bool(true);
  } else {
    client.bool(false);
  }
}).mutates = true;

/**
 * RENAME <from> <to>
 */

(exports.rename = function(client, from, to){
  var data = this.db.data;

  // Fail if attempting to rename a non-existant key
  from = string(from);
  if (!this.lookup(from)) return client.error('no such key');

  // Fail on same keys
  to = string(to);
  if (from == to) return client.error('source and destination objects are the same');

  // Map key val / key type
  var type = data[from].type
    , obj = data[to] = data[from];
  obj.type = type;
  delete data[from];

  client.ok();
}).mutates = true;

/**
 * KEYS <pattern>
 */

exports.keys = function(client, pattern){
  var pattern = string(pattern)
    , keys = Object.keys(this.db.data)
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
