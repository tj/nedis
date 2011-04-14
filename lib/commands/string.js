
/*!
 * Nedis - commands - string
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils')
  , string = utils.string;

/**
 * GET <key>
 */

exports.get = function(client, key){
  var key = string(key)
    , obj = this.db.data[key];

  if (!obj) {
    client.nil();
  } else if ('string' == obj.type) {
    client.send(obj.val);
  } else {
    client.typeError();
  }
};

/**
 * GETSET <key> <val>
 */

exports.getset = function(client, key, val){
  var key = string(key)
    , prev = this.data[key]
    , prevType = this.keyType(key);

  this.data[key] = val;
  this.keyType(key, 'string');

  if (null == prev) {
    client.nil();
  } else if ('string' == prevType) {
    client.send(prev);
  } else {
    client.typeError();
  }
};

/**
 * SET <key> <str>
 */

(exports.set = function(client, key, str){
  key = string(key);
  this.db.data[key] = { val: str, type: 'string' };
  client.ok();
}).mutates = true;

/**
 * SETNX <key> <val>
 */

(exports.setnx = function(client, key, val){
  key = string(key);
  if (null != this.data[key]) return client.bool(false);
  this.data[key] = val;
  this.keyType(key, 'string');
  client.bool(true);
}).mutates = true;

/**
 * INCR <key>
 */

(exports.incr = function(client, key){
  var key = string(key)
    , obj = this.db.data[key];

  if (!obj) {
    this.db.data[key] = { type: 'string', val: 1 };
    client.int(1);
  } else if ('string' == obj.type) {
    if (Buffer.isBuffer(obj.val)) obj.val = +string(obj.val);
    if (isNaN(obj.val)) return client.rangeError();
    client.int(++obj.val);
  } else {
    client.typeError();
  }
}).mutates = true;

/**
 * INCRBY <key> <num>
 */

(exports.incrby = function(client, key, num){
  var key = string(key)
    , obj = this.db.data[key]
    , num = +string(num);

  if (isNaN(num)) return client.rangeError();

  if (!obj) {
    obj = this.db.data[key] = { type: 'string', val: num };
    client.int(obj.val);
  } else if ('string' == obj.type) {
    if (Buffer.isBuffer(obj.val)) obj.val = +string(obj.val);
    if (isNaN(obj.val)) return client.rangeError();
    client.int(obj.val += num);
  } else {
    client.typeError();
  }
}).mutates = true;

/**
 * DECRBY <key> <num>
 */

(exports.decrby = function(client, key, num){
  var key = string(key)
    , obj = this.db.data[key]
    , num = +string(num);

  if (isNaN(num)) return client.rangeError();

  if (!obj) {
    obj = this.db.data[key] = { type: 'string', val: -num };
    client.int(obj.val);
  } else if ('string' == obj.type) {
    if (Buffer.isBuffer(obj.val)) obj.val = +string(obj.val);
    if (isNaN(obj.val)) return client.rangeError();
    client.int(obj.val -= num);
  } else {
    client.typeError();
  }
}).mutates = true;

/**
 * DECR <key>
 */

(exports.decr = function(client, key){
  var key = string(key)
    , obj = this.db.data[key];

  if (!obj) {
    this.db.data[key] = { type: 'string', val: -1 };
    client.int(-1);
  } else if ('string' == obj.type) {
    if (Buffer.isBuffer(obj.val)) obj.val = +string(obj.val);
    if (isNaN(obj.val)) return client.rangeError();
    client.int(--obj.val);
  } else {
    client.typeError();
  }
}).mutates = true;

/**
 * STRLEN <key>
 */

exports.strlen = function(client, key){
  var key = string(key)
    , val = this.data[key];

  if (val) {
    client.int(val.length);
  } else if ('string' == this.keyType(key)) {
    client.int(0);
  } else {
    client.typeError();
  }
};

/**
 * APPEND <key> <str>
 */

(exports.append = function(client, key, str){
  var key = string(key)
    , val = null != this.data[key]
      ? this.data[key]
      : new Buffer(0);

  if ('string' != this.keyType(key)) return client.typeError();

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
}).mutates = true;

/**
 * SETRANGE <key> <offset> <str>
 */

(exports.setrange = function(client, key, offset, str){
  var key = string(key)
    , val = this.data[key]
    , offset = +string(offset);


  if (null == val) {
    // TODO: finish
  } else if ('string' == this.keyType(key)) {
    str.copy(val, offset);
    client.int(val.length);
  } else {
    client.typeError();
  }
}).mutates;

/**
 * GETRANGE <key> <from> <to>
 */

exports.getrange = function(client, key, from, to){
  var key = string(key)
    , val = this.data[key]
    , len = val.length
    , from = +string(from)
    , to = +string(to);

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
  } else if ('string' == this.keyType(key)) {
    client.send(val.slice(from, to + 1));
  } else {
    client.typeError();
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

exports.mset = function(client, strs){
  var key
    , val
    , len = strs.length;
  for (var i = 0; i < len; ++i) {
    key = string(strs[i++]);
    val = strs[i];
    this.data[key] = val;
    this.keyType(key, 'string');
  }
  client.ok();
};

exports.mset.multiple = 2;
exports.mset.mutates = true;

/**
 * MSETNX (<key> <val>)+
 */

exports.msetnx = function(client, strs){
  var key
    , val
    , len = strs.length
    , keys = [];

  // Ensure none exist
  for (var i = 0; i < len; ++i) {
    keys[i] = key = string(strs[i++]);
    if (null != this.data[key]) {
      return client.bool(false);
    }
  }

  // Perform sets
  for (var i = 0; i < len; i += 2) {
    key = keys[i];
    val = strs[i];
    this.data[key] = val;
    this.keyType(key, 'string');
  }

  client.bool(true);
};

exports.msetnx.multiple = 2;
exports.msetnx.mutates = true;
