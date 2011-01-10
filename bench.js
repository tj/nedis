
/**
 * Module dependencies.
 */

var nedis = require('./')
  , Connection = require('./lib/connection');

/**
 * Server to run against.
 */

var server = nedis.createServer();
server.aof = false;

/**
 * Times to run each benchmark.
 */

var times = 100000;

server.on('listening', function(){
  var client = new Connection(server)
    , n = times
    , start = new Date
    , buf = new Buffer('*2\r\n$3\r\nGET\r\n$3\r\nfoo\r\n');

  client.parse('*3\r\n$3\r\nSET\r\n$3\r\nfoo\r\n$3\r\nbar\r\n');
  while (n--) {
    client.parse(buf);
  }
  console.log('GET: %dms', new Date - start);


  var n = times
    , start = new Date
    , buf = new Buffer('*3\r\n$3\r\nSET\r\n$3\r\nfoo\r\n$3\r\nbar\r\n');

  while (n--) {
    client.parse(buf);
  }
  console.log('SET: %dms', new Date - start);

  server.close();
});

server.listen();