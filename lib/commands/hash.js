
/*!
 * Nedis - commands - hash
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var utils = require('../utils');

/**
 * HLEN <key>
 */

exports.hlen = function(client, key){
  var key = utils.string(key)
    , obj = this.db.data[key];

  if (!obj) {
    client.int(0);
  } else if ('hash' == obj.type) {
    client.int(Object.keys(obj.val).length);
  } else {
    client.typeError();
  }
};

/**
 * HVALS <key>
 */

exports.hvals = function(client, key){
  var key = utils.string(key)
    , obj = this.db.data[key];

  if (!obj) {
    client.emptyList();
  } else if ('hash' == obj.type) {
    client.list(Object.keys(obj.val).map(function(key){
      return obj.val[key];
    }));
  } else {
    client.typeError();
  }
};

/**
 * HKEYS <key>
 */

exports.hkeys = function(client, key){
  var key = utils.string(key)
    , obj = this.db.data[key];

  if (!obj) {
    client.emptyList();
  } else if ('hash' == obj.type) {
    client.list(Object.keys(obj.val));
  } else {
    client.typeError();
  }
};

/**
 * HSET <key> <field> <val>
 */

(exports.hset = function(client, key, field, val){
  var key = utils.string(key)
    , field = utils.string(field)
    , obj = this.db.data[key];

  if (obj && 'hash' != obj.type) return client.typeError();
  obj = obj || (this.db.data[key] = { type: 'hash', val: {} });

  obj.val[field] = val;
  client.bool(true);
}).mutates = true;

/**
 * HMSET <key> (<field> <val>)+
 */

(exports.hmset = function(client, data){
  var len = data.length
    , key = utils.string(data[0])
    , obj = this.db.data[key]
    , field
    , val;

  if (obj && 'hash' != obj.type) return client.typeError();
  obj = obj || (this.db.data[key] = { type: 'hash', val: {} });

  for (var i = 1; i < len; ++i) {
    field = utils.string(data[i++]);
    val = data[i];
    obj.val[field] = val;
  }

  client.ok();
}).mutates = true;

exports.hmset.multiple = 2;
exports.hmset.skip = 1;

/**
 * HGET <key> <field>
 */

exports.hget = function(client, key, field){
  var key = utils.string(key)
    , field = utils.string(field)
    , obj = this.db.data[key]
    , val;

  if (!obj) {
    client.nil();
  } else if ('hash' == obj.type) {
    if (val = obj.val[field]) {
      client.send(val);
    } else {
      client.nil();
    }
  } else {
    client.typeError();
  }
};

/**
 * HGETALL <key>
 */

exports.hgetall = function(client, key){
  var key = utils.string(key)
    , obj = this.db.data[key]
    , list = [];

  if (!obj) {
    client.emptyList();
  } else if ('hash' == obj.type) {
    for (var field in obj.val) {
      list.push(field, obj.val[field]);
    }
    client.list(list);
  } else {
    client.typeError();
  }
};

/**
 * HEXISTS <key> <field>
 */

exports.hexists = function(client, key, field){
  var key = utils.string(key)
    , field = utils.string(field)
    , obj = this.db.data[key]

  if (obj) {
    if ('hash' == obj.type) {
      client.bool(field in obj.val);
    } else {
      client.typeError();
    }
  } else {
    client.bool(false);
  }
};
