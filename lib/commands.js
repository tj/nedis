
/*!
 * Nedis - commands
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * GET key.
 */

exports.get = function(client, key){
  console.log('GET %s', key);
  var val = this.data[key];
  if (val) {
    
  } else {
    client.nil();
  }
};

/**
 * SET key val
 */

exports.set = function(client, key, val){
  console.log('SET %s %s', key, val);
};