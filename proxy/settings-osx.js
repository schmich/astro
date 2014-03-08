var shell = require('shelljs');
var sudo = require('sudo');
var colors = require('colors');
var message = require('../common/log').message;

function run(cmd, callback) {
  //var result = shell.exec(cmd, { silent: true });
  // if (result.code != 0)
  // result.output

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
  //run('networksetup -setsecurewebproxy "Wi-Fi" localhost 8080 off');
  //run('networksetup -setsecurewebproxystate "Wi-Fi" on');

  //if ! grep -F "astro" /etc/hosts ; then 
    //echo "127.0.0.1\tastro\n" | sudo tee -a /etc/hosts
  //fi
};

module.exports.disable = function(callback) {
  run(['networksetup', '-setwebproxystate', 'Wi-Fi', 'off'], callback);
  //run('networksetup -setsecurewebproxystate "Wi-Fi" off');
};

/*
function enableProxy {
  networksetup -setproxybypassdomains 'Wi-Fi' 'proxy-mirror'
  networksetup -setwebproxy 'Wi-Fi' localhost 8888 off
  networksetup -setwebproxystate 'Wi-Fi' on
  networksetup -setsecurewebproxy 'Wi-Fi' localhost 8888 off
  networksetup -setsecurewebproxystate 'Wi-Fi' on
  echo "Enabled proxy"
}

function disableProxy {
  networksetup -setwebproxystate 'Wi-Fi' off
  networksetup -setsecurewebproxystate 'Wi-Fi' off
  echo "Disabled proxy"
}

if ! grep -F "proxy-mirror" /etc/hosts ; then 
  echo "127.0.0.1\tproxy-mirror\n" | sudo tee -a /etc/hosts
fi


case "$1" in
"-enable")
    enableProxy
    ;;
"-disable")
    disableProxy
    ;;
*)
    echo "Usage: ./setup-proxy -enable or -disable"
    exit 1
    ;;
esac
*/
