
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
 * Initialize a new `Server` with the given `options`.
 *
 * @param {Object} options
 * @return {Server}
 */

exports.createServer = function(options) {
  return new Server(options);
};