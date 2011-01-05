
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
  if (val) {
    client.send(val);
  } else {
    client.nil();
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