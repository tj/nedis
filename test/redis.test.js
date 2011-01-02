
/**
 * Module dependencies.
 */

var nedis = require('nedis')
  , should = require('should');

module.exports = {
  'test .version': function(assert){
    nedis.version.should.match(/^\d+\.\d+\.\d+$/);
  },
  
  'test createServer()': function(){
    var server = nedis.createServer();
    server.should.have.property('port', 6379);
    server.should.have.property('host', '127.0.0.1');
  },
  
  'test createServer(port, host)': function(){
    var server = nedis.createServer(3000, '1.1.1.1');
    server.should.have.property('port', 3000);
    server.should.have.property('host', '1.1.1.1');
  }
};