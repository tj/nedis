
/*!
 * Nedis - Connection
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var net = require('net');

/**
 * Initialize a new `Connection` with the given `server` and `stream`.
 * 
 * @param {Server} server
 * @param {Stream} stream
 * @api private
 */

var Connection = module.exports = function Connection(server, stream) {
  this.server = server;
  this.stream = stream;
};