
/*!
 * Nedis - Database
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var commands = require('./commands');

/**
 * Initialize a new `Database`.
 *
 * @api private
 */

var Database = module.exports = function Database() {
  this.data = {};
};

/**
 * Expose commands to store.
 */

Database.prototype = commands;
