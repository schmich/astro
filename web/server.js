var Promise = require('bluebird');
var fs = require('fs');
var http = require('http');
var url = require('url');
var express = require('express');
var stream = require('stream');
var zlib = require('zlib');
var path = require('path');
var ect = require('ect');
var faye = require('faye');
var childProcess = require('child_process');
var streaming = new faye.NodeAdapter({ mount: '/stream', timeout: 45 });
var proxy = require('../proxy/server');
var sessions = proxy.sessions;
var events = proxy.events;
var store = proxy.store;
Promise.promisifyAll(http.Server.prototype);

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ect');
//app.use(express.favicon(__dirname + '/public/images/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use('/assets', express.static(path.join(__dirname, 'public')));
app.engine('.ect', ect({ watch: app.get('env') == 'development', root: app.get('views') }).render);

app.get('/', function(req, res) {
  res.render('index');
});

events.on('session:start', function(session) {
  streaming.getClient().publish('/sessions', session);
});

events.on('session:end', function(session) {
  streaming.getClient().publish('/sessions', session);
});

app.get('/content/:id', function(req, res) {
  // TODO: Headers might be null.
  var session = sessions[req.params.id];
  var type = session.response.headers['content-type'];

  store.createReadStream(session.id.toString()).then(function(read) {
    if (session.response.headers['content-encoding'] == 'gzip') {
      var gunzip = new zlib.createGunzip();
      read = read.pipe(gunzip);
    }

    if (/image\//i.test(type)) {
      res.set('content-type', type);
    } else {
      res.set('content-type', 'text/plain');
    }

    read.pipe(res);
  });
});

app.get('/sessions', function(req, res) {
  res.send(sessions);
});

app.delete('/sessions', function(req, res) {
  sessions.length = 0;
  res.send({});
});

app.get('/sessions/:id', function(req, res) {
  res.send(sessions[req.params.id]);
});

app.get('/requests/:id', function(req, res) {
  res.render('request', { id: req.params.id });
});

function guessExtension(session) {
  // TODO: Headers might be null.
  var contentType = session.response.headers['content-type'];
  if (/javascript|json/i.test(contentType)) {
    return ".js";
  } else if (/css/i.test(contentType)) {
    return ".css";
  } else if (/html/i.test(contentType)) {
    return ".html";
  } else if (/xml/i.test(contentType)) {
    return ".xml";
  } else if (/text\/plain/i.test(contentType)) {
    return ".txt";
  }
  
  var parts = url.parse(session.request.url);
  var extension = path.extname(parts.pathname);

  if (extension) {
    return extension;
  }

  return "";
}

app.post('/edit/:id', function(req, res) {
  // TODO: Better error handling.
  var session = sessions[req.params.id];
  var editor = process.env.EDITOR;

  // TODO: Use original request URL for filename (but ensure uniqueness with ID, too).

  var makeRead = store.createReadStream(session.id.toString());
  var makeWrite = store.createWriteStream(session.id.toString() + guessExtension(session));

  Promise.join(makeRead, makeWrite).spread(function(read, write) {
    if (session.response.headers['content-encoding'] == 'gzip') {
      var gunzip = new zlib.createGunzip();
      read = read.pipe(gunzip)
    }

    read.pipe(write);
    read.on('end', function() {
      childProcess.spawn(editor, [fileName]);
    });

    res.send({});
  });
});

var appServer = http.createServer(app);
streaming.attach(appServer);

module.exports = appServer;
