var colors = require('colors');

function message(msg) {
  return '[' + 'astro'.cyan + '] ' + msg;
}

function log(msg) {
  console.log(message(msg));
}

module.exports = {
  log: log,
  message: message
};
