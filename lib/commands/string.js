
/*!
 * Nedis - commands - string
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils');

/**
 * GET <key>
 */

exports.get = function(client, key){
  var key = utils.string(key)
    , val = this.data[key];
  if (null == val) {
    client.nil();
  } else {
    client.send(val);
  }
};

/**
 * GETSET <key> <val>
 */

exports.getset = function(client, key, val){
  var key = utils.string(key)
    , prev = this.data[key];
  this.data[key] = val;
  if (null == prev) {
    client.nil();
  } else {
    client.send(prev);
  }
};

/**
 * SET <key> <str>
 */

exports.set = function(client, key, str){
  key = utils.string(key);
  this.data[key] = str;
  client.ok();
};

/**
 * INCR <key>
 */

exports.incr = function(client, key){
  var key = utils.string(key)
    , val = this.data[key] || '0'
    , n = +val.toString();

  // TODO: typecheck
  client.int(this.data[key] = ++n);
};

/**
 * INCRBY <key> <num>
 */

exports.incrby = function(client, key, num){
  var key = utils.string(key)
    , val = this.data[key] || '0'
    , n = +val.toString()
    , num = +num.toString();

  if (isNaN(num)) return client.rangeError();

  // TODO: typecheck
  client.int(this.data[key] = n + num);
};

/**
 * DECRBY <key> <num>
 */

exports.decrby = function(client, key, num){
  var key = utils.string(key)
    , val = this.data[key] || '0'
    , n = +val.toString()
    , num = +num.toString();

  if (isNaN(num)) return client.rangeError();

  // TODO: typecheck
  client.int(this.data[key] = n - num);
};

/**
 * DECR <key>
 */

exports.decr = function(client, key){
  var key = utils.string(key)
    , val = this.data[key] || '0'
    , n = +val.toString();

  // TODO: typecheck
  client.int(this.data[key] = --n);
};

/**
 * STRLEN <key>
 */

exports.strlen = function(client, key){
  var key = utils.string(key)
    , val = this.data[key];

  // TODO: typecheck
  if (val) {
    client.int(val.length);
  } else {
    client.int(0);
  }
};

/**
 * APPEND <key> <str>
 */

exports.append = function(client, key, str){
  var key = utils.string(key)
    , val = null != this.data[key]
      ? this.data[key]
      : new Buffer(0);

  // TODO: typecheck
  if (Buffer.isBuffer(val)) {
    var offset = val.length
      , len = offset + str.length
      , buf = new Buffer(len);
    val.copy(buf);
    str.copy(buf, offset);
    this.data[key] = buf;
    client.int(len);
  } else {
    client.typeError();
  }
};

/**
 * SETRANGE <key> <offset> <str>
 */

exports.setrange = function(client, key, offset, str){
  var key = utils.string(key)
    , val = this.data[key]
    , offset = +utils.string(offset);
  
  if (null == val) {
    // TODO: finish
  } else {
    str.copy(val, offset);
    client.int(val.length);
  }
};

/**
 * GETRANGE <key> <from> <to>
 */

exports.getrange = function(client, key, from, to){
  var key = utils.string(key)
    , val = this.data[key]
    , len = val.length
    , from = +utils.string(from)
    , to = +utils.string(to);

  if (isNaN(from)) return client.typeError();
  if (isNaN(to)) return client.typeError();

  // Clamp positive
  if (from > len) from = len;
  if (to > len) to = len;

  // Negative
  if (from < 0) from = len + from;
  if (to < 0) to = len + to;

  // Clamp negative
  if (to < 0) to = 0;
  if (from < 0) from = 0;

  if (null == val) {
    client.nil();
  } else {
     client.send(val.slice(from, to + 1));
  }
};

/**
 * Alias as SUBSTR
 */

exports.substr = exports.getrange;

/**
 * MGET <key>+
 */

(exports.mget = function(client, keys){
  var len = keys.length;
  client.stream.write('*' + len + '\r\n');
  for (var i = 0; i < len; ++i) {
    this.get(client, keys[i]);
  }
}).multiple = 1;

/**
 * MSET (<key> <val>)+
 */

(exports.mset = function(client, strs){
  var key
    , val
    , len = strs.length;
  for (var i = 0; i < len; ++i) {
    key = utils.string(strs[i++]);
    val = strs[i];
    this.data[key] = val;
  }
  client.ok();
}).multiple = 2;
