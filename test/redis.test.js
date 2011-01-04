
/**
 * Module dependencies.
 */

var nedis = require('nedis')
  , should = require('should')
  , net = require('net');

var server = nedis.createServer().listen('/tmp/nedis')
  , client;

module.exports = {
  before: function(done){
    server.on('listening', function(){
      client = net.createConnection('/tmp/nedis');
      client.on('connect', done);
      client.once = function(event, fn){
        client.on(event, function callback(){
          client.removeListener(event, callback);
          fn.apply(this, arguments);
        });
      };
    });
  },
  
  'test .version': function(){
    nedis.version.should.match(/^\d+\.\d+\.\d+$/);
  },
  
  'test Server inheritance': function(){
    var server = nedis.createServer();
    server.should.be.an.instanceof(net.Server);
  },
  
  'test lowercase command': function(done){
    client.write('*2\r\n$3\r\nget\r\n$3\r\nfoo\r\n');
    client.once('data', function(chunk){
      chunk.toString().should.equal('$-1\r\n');
      done();
    });
  },
  
  'test missing bulk length LF': function(done){
    client.write('*3\r\n$3\rGET\r\n$3\r\nfoo\r\n$3\r\nbar\r\n');
    client.once('data', function(chunk){
      chunk.toString().should.equal("-ERR missing line feed for bulk length\r\n");
      done();
    });
  },

  'test invalid multi-bulk number': function(done){
    client.write('*asdf\r\n$3\rGET\r\n$3\r\nfoo\r\n$3\r\nbar\r\n');
    client.once('data', function(chunk){
      chunk.toString().should.equal("-ERR Protocol error: number expected after *\r\n");
      done();
    });
  },
  
  'test invalid bulk number': function(done){
    client.write('*2\r\n$ohnoes\r\nGET\r\n$3\r\nfoo\r\n');
    client.once('data', function(chunk){
      chunk.toString().should.equal("-ERR Protocol error: number expected after $\r\n");
      done();
    });
  },
  
  'test invalid command': function(done){
    client.write('*2\r\n$7\r\nINVALID\r\n$3\r\nfoo\r\n');
    client.once('data', function(chunk){
      chunk.toString().should.equal("-ERR unknown command 'invalid'\r\n");
      done();
    });
  },
  
  'test GET <key>': function(done){
    client.write('*2\r\n$3\r\nGET\r\n$3\r\nfoo\r\n');
    client.once('data', function(chunk){
      chunk.toString().should.equal('$-1\r\n');
      done();
    });
  },

  'test SET <key> <val>': function(done){
    client.write('*3\r\n$3\r\nSET\r\n$3\r\nfoo\r\n$3\r\nbar\r\n');
    client.once('data', function(chunk){
      chunk.toString().should.equal('+OK\r\n');
      done();
    });
  },
  
  'test GET invalid args': function(done){
    client.write('*3\r\n$3\r\nGET\r\n$3\r\nfoo\r\n$3\r\nbar\r\n');
    client.once('data', function(chunk){
      chunk.toString().should.equal("-ERR wrong number of arguments for 'get' command\r\n");
      done();
    });
  },
  
  after: function(){
    client.destroy();
    server.close();
  }
};