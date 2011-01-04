
/*!
 * Nedis - Server
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Database = require('./database');

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
 * Initialize a new `Server` with the given `options`.
 * 
 * @param {Object} options
 * @api private
 */

var Server = module.exports = function Server(options) {
  var self = this
    , options = options || {};

  // Lazy-require to allow instrumentation
  if (options.debug) require('./debugger');
  if (options.profile) require('./profiler');
  var Connection = require('./connection');

  // Initialize data-store
  this.db = new Database;

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
  net.Server.prototype.listen.call(
      this
    , port || defaultPort
    , host || defaultHost);
  return this;
};
