#!/usr/bin/env node

var parser = require('nomnom');
var astro = require('./common/control');

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

parser.parse();
