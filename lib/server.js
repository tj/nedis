
/*!
 * Nedis - Server
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var net = require('net');

/**
 * Default portno.
 */

var defaultPort = 6379;

/**
 * Default hostname.
 */

var defaultHost = '127.0.0.1';

/**
 * Initialize a new `Server` with the given `port` and `host`
 * defaulting to 6379 and 127.0.0.1
 *
 * @param {Number} port
 * @param {String} host
 * @api public
 */

var Server = module.exports = function Server(port, host) {
  this.port = port || defaultPort;
  this.host = host || defaultHost;
};

/**
 * Inherit from `Server.prototype`.
 */

Server.prototype.__proto__ = net.Server.prototype;