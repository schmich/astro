#!/usr/bin/env node

var parser = require('nomnom');
var astro = require('./common/control');
var spawn = require('child_process').spawn;

parser
  .command('start')
  .callback(function() {
    var control = new astro.AstroControl();
    control.start();
  });

parser
  .command('stop')
  .callback(function() {
    var control = new astro.AstroControl();
    control.stop();
  });

parser
  .command('run')
  .callback(function(opts) {

    // TODO: Check for empty.
    var args = opts._.splice(1);
    var command = args.shift();

    // TODO: Get URL/port from astro settings.
    var env = process.env;
    env.http_proxy = 'http://localhost:8080';

    // TODO: Handle errors (command not found, etc.).
    var child = spawn(command, args, { stdio: 'inherit', env: env });
    child.on('close', function(code) {
      process.exit(code);
    });
  });

parser.parse();
