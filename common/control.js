var Promise = require('bluebird');
var proxy = require('../proxy/server');
var web = require('../web/server');
var settings = require('../proxy/settings');
var log = require('./log').log;
var open = require('open');

function AstroControl() {
}

AstroControl.prototype.start = function() {
  var proxyPort = 8080;
  var webPort = 3000;

  Promise.join(proxy.server.listenAsync(proxyPort), web.listenAsync(webPort)).then(function() {
    log('Proxy listening on port ' + proxyPort + '.');
    log('App listening on port ' + webPort + '.');
    log('Enabling system proxy.');
  }).then(function() {
    return settings.enable();
  }).then(function() {
    log('System proxy enabled.');

    process.on('exit', function() {
      log('Exiting.');
      log('Disabling system proxy.');
      settings.disable();
    });

    process.on('SIGTERM', function() {
      process.exit();
    });

    process.on('SIGINT', function() {
      process.exit();
    });

    open('http://astro:' + webPort);
  });
};

AstroControl.prototype.stop = function() {
};

module.exports.AstroControl = AstroControl;
