
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
 */

var Server = module.exports = function Server(options) {
  var self = this
    , options = options || {};

  // Lazy-require to allow instrumentation
  if (options.debug) require('./debugger');
  if (options.profile) require('./profiler');
  var Connection = require('./connection');

  // Startup time
  this.start = new Date;

  // Initialize data-store
  this.db = new Database(this, options);

  // Force AOF support for now
  this.aof = true;

  // Connected clients
  this.clients = [];

  // Add / remove clients
  net.Server.call(self, function(stream){
    var client = new Connection(self, stream);
    stream.on('connect', function(){
      self.addClient(client);
    }).on('end', function(){
      self.removeClient(client);
    });
  });
};

/**
 * Inherit from `Server.prototype`.
 */

Server.prototype.__proto__ = net.Server.prototype;

/**
 * Add `client` and return its index.
 *
 * @param {Connection} client
 * @return {Number} 
 */

Server.prototype.addClient = function(client){
  var len = this.clients.push(client);
  return client.index = len - 1;
};

/**
 * Remove `client`.
 *
 * @param {Connection} client
 */

Server.prototype.removeClient = function(client){
  this.clients.splice(client.index, 1);
};

/**
 * Listen on `port` and `host`, defaulting to 6379 and '127.0.0.1'
 *
 * @param {Number} port
 * @param {String} host
 */

Server.prototype.listen = function(port, host){
  net.Server.prototype.listen.call(
      this
    , port || defaultPort
    , host || defaultHost);
  return this;
};
