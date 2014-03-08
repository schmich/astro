var sudo = require('sudo');
var colors = require('colors');
var message = require('../common/log').message;

function run(cmd, callback) {
  // TODO: Check result code.
  var child = sudo(cmd, { prompt: message('Password (sudo): ') } );
  child.on('exit', callback || (function() { }));
}

module.exports.enable = function(callback) {
  // networksetup -getproxybypassdomains "Wi-Fi"

  run(['networksetup', '-setproxybypassdomains', 'Wi-Fi', 'astro'], function() {
    run(['networksetup', '-setwebproxy', 'Wi-Fi', 'localhost', '8080', 'off'], function() {
      run(['networksetup', '-setwebproxystate', 'Wi-Fi', 'on'], callback);
    });
  });
  //networksetup -setsecurewebproxy "Wi-Fi" localhost 8080 off
  //networksetup -setsecurewebproxystate "Wi-Fi" on

  //if ! grep -F "astro" /etc/hosts ; then 
    //echo "127.0.0.1\tastro\n" | sudo tee -a /etc/hosts
  //fi
};

module.exports.disable = function(callback) {
  run(['networksetup', '-setwebproxystate', 'Wi-Fi', 'off'], callback);
  // networksetup -setsecurewebproxystate "Wi-Fi" off
};
