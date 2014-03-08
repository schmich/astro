var proxy = require('../proxy/server');
var web = require('../web/server');
var settings = require('../proxy/settings');
var log = require('./log').log;
var open = require('open');

function AstroControl() {
}

AstroControl.prototype.start = function() {
  var proxyPort = 8080;
  proxy.server.listen(proxyPort, function() {
    log('Proxy listening on port ' + proxyPort + '.');
  });

  var webPort = 3000;
  web.listen(webPort, function() {
    log('App listening on port ' + webPort + '.');
  });

  settings.enable(function() {
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
