
/*!
 * Nedis
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Server = require('./server');

/**
 * Library version.
 */

exports.version = '0.0.1';

/**
 * Initialize a new `Server`.
 *
 * @return {Server}
 * @api public
 */

exports.createServer = function() {
  return new Server;
};