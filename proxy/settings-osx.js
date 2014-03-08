var Promise = require('bluebird');
var sudo = require('sudo');
var colors = require('colors');
var message = require('../common/log').message;

function run(cmd) {
  return new Promise(function(resolve, reject) {
    var child = sudo(cmd, { prompt: message('Password (sudo): ') });
    child.on('exit', resolve);
  });
}

module.exports.enable = function() {
  // networksetup -getproxybypassdomains "Wi-Fi"

  return run(['networksetup', '-setproxybypassdomains', 'Wi-Fi', 'astro'])
    .then(function() {
      return run(['networksetup', '-setwebproxy', 'Wi-Fi', 'localhost', '8080', 'off']);
    }).then(function() {
      return run(['networksetup', '-setwebproxystate', 'Wi-Fi', 'on']);
    });

  //networksetup -setsecurewebproxy "Wi-Fi" localhost 8080 off
  //networksetup -setsecurewebproxystate "Wi-Fi" on

  //if ! grep -F "astro" /etc/hosts ; then 
    //echo "127.0.0.1\tastro\n" | sudo tee -a /etc/hosts
  //fi
};

module.exports.disable = function() {
  return run(['networksetup', '-setwebproxystate', 'Wi-Fi', 'off']);
  // networksetup -setsecurewebproxystate "Wi-Fi" off
};
