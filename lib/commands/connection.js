
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
 * PING
 */

exports.ping = function(client){
  client.write('PONG');
};

/**
 * ECHO <val>
 */

exports.echo = function(client, val){
  client.write(val);
};

/**
 * QUIT
 */

exports.quit = function(client){
  client.stream.end();
};

/**
 * SELECT <index>
 */

(exports.select = function(client, index){
  index = +string(index);
  if (isNaN(index) || index < 0) return client.error('invalid DB index');
  this.selectDB(index);
  client.ok();
}).mutates = true;
