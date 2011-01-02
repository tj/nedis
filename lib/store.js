
/*!
 * Nedis - Store
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var commands = require('./commands');

/**
 * Initialize a new `Store`.
 *
 * @api private
 */

var Store = module.exports = function Store() {
  this.data = {};
};

/**
 * Expose commands to store.
 */

Store.prototype = commands;
