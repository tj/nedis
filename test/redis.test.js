
/**
 * Module dependencies.
 */

var nedis = require('nedis')
  , should = require('should')
  , net = require('net');

module.exports = {
  'test .version': function(assert){
    nedis.version.should.match(/^\d+\.\d+\.\d+$/);
  },
  
  'test Server inheritance': function(){
    var server = nedis.createServer();
    server.should.be.an.instanceof(net.Server);
  }
};