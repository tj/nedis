
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

  // Typecheck
  if ('hash' == hash.type) {
    hash[field] = val;
    this.data[key] = hash;
    client.bool(true);
  } else {
    client.typeError();
  }
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
}