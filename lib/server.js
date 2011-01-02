
/*!
 * Nedis - Server
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Connection = require('./connection')
  , Store = require('./store');

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
 * Initialize a new `Server`.
 * 
 * @api private
 */

var Server = module.exports = function Server(port, host) {
  var self = this;
  this.store = new Store;
  net.Server.call(self, function(stream){
    new Connection(self, stream);
  });
};

/**
 * Inherit from `Server.prototype`.
 */

Server.prototype.__proto__ = net.Server.prototype;

/**
 * Listen on `port` and `host`, defaulting to 6379 and '127.0.0.1'
 *
 * @param {Number} port
 * @param {String} host
 * @api private
 */

Server.prototype.listen = function(port, host){
  return net.Server.prototype.listen.call(
      this
    , port || defaultPort
    , host || defaultHost);
};
