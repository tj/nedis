
/**
 * Module dependencies.
 */

var nedis = require('nedis')
  , should = require('should')
  , net = require('net');

var server = nedis.createServer().listen('/tmp/nedis')
  , client;

module.exports = {
  setup: function(done){
    server.on('listening', function(){
      client = net.createConnection('/tmp/nedis');
      client.on('connect', done);
    });
  },
  
  'test .version': function(assert){
    nedis.version.should.match(/^\d+\.\d+\.\d+$/);
  },
  
  'test Server inheritance': function(){
    var server = nedis.createServer();
    server.should.be.an.instanceof(net.Server);
  },
  
  'test GET <key>': function(done){
    client.write('*3\r\nGET\r\n$3\r\nfoo\r\n');
    client.on('data', function(chunk){
      console.log(chunk.toString());
    });
  }
};