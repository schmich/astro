var Promise = require('bluebird');
var fs = require('fs');
var net = require('net');
var http = require('http');
var https = require('https');
var url = require('url');
var childProcess = require('child_process');
var EventEmitter = require('events').EventEmitter;
var events = new EventEmitter();
Promise.promisifyAll(http.Server.prototype);

var agent = new http.Agent({ maxSockets: Infinity });

var sessions = [];

var proxyServer = http.createServer(function(clientRequest, clientResponse) {
  var options = url.parse(clientRequest.url);
  options.method = clientRequest.method;
  options.headers = clientRequest.headers;
  options.agent = agent;

  // delete clientRequest.headers['if-modified-since'];
  // delete clientRequest.headers['if-none-match'];
  // clientRequest.headers['cache-control'] = 'max-age=0, no-cache';

  var session = {
    id: sessions.length,
    request: {
      timestamp: Date.now(),
      url: clientRequest.url,
      method: clientRequest.method,
      headers: clientRequest.headers
    }
  };

  sessions.push(session);
  events.emit('session:start', session);

  var proxyRequest = http.request(options);

  clientRequest.pipe(proxyRequest);

  proxyRequest.on('response', function(proxyResponse) {
    session.response = {
      status: proxyResponse.statusCode,
      headers: proxyResponse.headers
    }

    clientResponse.writeHead(proxyResponse.statusCode, proxyResponse.headers);
    proxyResponse.pipe(clientResponse);

    var writer = fs.createWriteStream('data/' + session.id);
    proxyResponse.pipe(writer);

    var size = 0;
    proxyResponse.on('data', function(chunk) {
      size += chunk.length;
    });

    proxyResponse.on('end', function() {
      session.response.timestamp = Date.now();
      session.response.size = size;
      events.emit('session:end', session);
    });
  });

  proxyRequest.on('error', function(err) {
    console.log('Error for ' + clientRequest.url + ': ' + err);
    clientResponse.writeHead(502);
    clientResponse.end();
  });
});

proxyServer.on('connect', function(request, socket, head) {
  console.log('Received HTTP CONNECT');
  var server = net.connect(8081, 'localhost', function() {
    socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    server.write(head);
    server.pipe(socket);
    socket.pipe(server);
  });
});

/*var proxyPort = 8080;
proxyServer.listen(proxyPort, function() {
  console.log("Proxy listening on " + proxyPort + "...");
});*/

/*var options = {
  key: fs.readFileSync('astro.key'),
  cert: fs.readFileSync('astro.crt')
};

var httpsProxyServer = https.createServer(options, function(req, res) {
  console.log('HTTPS request inc...');
  res.writeHead(200);
  res.end('HTTPS\n');
});

var httpsProxyPort = 8081;
httpsProxyServer.listen(httpsProxyPort, function() {
  console.log("Secure proxy listening on " + httpsProxyPort + "...");
});*/

module.exports.events = events;
module.exports.server = proxyServer;
module.exports.sessions = sessions;
