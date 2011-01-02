
/*!
 * Nedis - commands
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * GET key.
 */

exports.get = function(store, key, fn){
  console.log('GET %s', key);
};

/**
 * SET key val
 */

exports.set = function(store, key, val, fn){
  console.log('SET %s %s', key, val);
};