
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
 * HSET <key> <field> <val>
 */

exports.hset = function(client, key, field, val){
  var key = utils.string(key)
    , field = utils.string(field)
    , hash = this.data[key];

  // New hash
  if (null == hash) {
    hash = {};
    hash.type = 'hash';
  }

  if ('hash' != hash.type) return client.typeError();

  hash[field] = val;
  this.data[key] = hash;
  client.bool(true);
};

/**
 * HGET <key> <field>
 */

exports.hget = function(client, key, field){
  var key = utils.string(key)
    , field = utils.string(field)
    , hash = this.data[key]
    , val;

  if (null == hash) return client.nil();
  if ('hash' != hash.type) return client.typeError();
  if (val = hash[field]) return client.send(val);

  client.nil();
};

/**
 * HGETALL <key>
 */

exports.hgetall = function(client, key){
  var key = utils.string(key)
    , hash = this.data[key]
    , list = [];

  if (null == hash) return client.emptyList();
  if ('hash' != hash.type) return client.typeError();

  for (var field in hash) {
    if ('type' == field) continue;
    list.push(field, hash[field]);
  }

  client.list(list);
};