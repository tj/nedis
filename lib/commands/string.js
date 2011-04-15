
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
  var obj = this.lookup(string(key));

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
    , obj = this.lookup(key);

  this.db.data[key] = { type: 'string', val: val };

  if (!obj) {
    client.nil();
  } else if ('string' == obj.type) {
    client.send(obj.val);
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
  if (this.lookup(key)) return client.bool(false);
  this.db.data[key] = { type: 'string', val: val };
  client.bool(true);
}).mutates = true;

/**
 * INCR <key>
 */

(exports.incr = function(client, key){
  var key = string(key)
    , obj = this.lookup(key);

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
    , obj = this.lookup(key)
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
    , obj = this.lookup(key)
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
    , obj = this.lookup(key);

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
    , val = this.lookup(key);

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
    , obj = this.lookup(key);

  if (obj && 'string' != obj.type) return client.typeError();

  if (obj) {
    if (!Buffer.isBuffer(obj.val)) obj.val = new Buffer(obj.val.toString());
    var offset = obj.val.length
      , len = offset + str.length
      , buf = new Buffer(len);
    obj.val.copy(buf);
    str.copy(buf, offset);
    obj.val = buf;
    this.db.data[key] = obj;
    client.int(len);
  } else {
    this.db.data[key] = { type: 'string', val: str };
    client.int(str.length);
  }
}).mutates = true;

/**
 * SETRANGE <key> <offset> <str>
 */

(exports.setrange = function(client, key, offset, str){
  var obj = this.lookup(string(key))
    , offset = +string(offset);


  if (!obj) {
    // TODO: finish
  } else if ('string' == obj.type) {
    str.copy(obj.val, offset);
    client.int(obj.val.length);
  } else {
    client.typeError();
  }
}).mutates;

/**
 * GETRANGE <key> <from> <to>
 */

exports.getrange = function(client, key, from, to){
  var obj = this.lookup(string(key))
    , from = +string(from)
    , to = +string(to);

  if (!obj) return client.nil();
  if ('string' != obj.type) return client.typeError();

  var len = obj.val.length;

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

  client.send(obj.val.slice(from, to + 1));
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
  var len = strs.length
    , key
    , val;

  for (var i = 0; i < len; ++i) {
    key = string(strs[i++]);
    this.db.data[key] = { type: 'string', val: strs[i] };
  }

  client.ok();
};

exports.mset.multiple = 2;
exports.mset.mutates = true;

/**
 * MSETNX (<key> <val>)+
 */

exports.msetnx = function(client, strs){
  var len = strs.length
    , keys = []
    , key
    , val;

  // Ensure none exist
  for (var i = 0; i < len; ++i) {
    keys[i] = key = string(strs[i++]);
    if (this.lookup(key)) return client.bool(false);
  }

  // Perform sets
  for (var i = 0; i < len; i += 2) {
    key = keys[i];
    this.db.data[key] = { type: 'string', val: strs[i] }
  }

  client.bool(true);
};

exports.msetnx.multiple = 2;
exports.msetnx.mutates = true;
