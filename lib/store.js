
/*!
 * Nedis - Store
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Initialize a new `Store`.
 *
 * @api private
 */

var Store = module.exports = function Store() {
  this.data = {};
};