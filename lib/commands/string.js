
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
 * GET key.
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
 * SET key val
 */

exports.set = function(client, key, val){
  key = utils.string(key);
  this.data[key] = val;
  client.ok();
};