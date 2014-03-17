var Promise = require('bluebird');
var os = require('os');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var async = require('async');

function createStoreDir(name) {
  return new Promise(function(resolve, reject) {
    var counter = 0;
    var created = false;
    var dir = null;

    fs.mkdirAsync(path.join(os.tmpdir(), name))
      .catch(function() { })
      .finally(function() {
        async.doUntil(function(callback) {
          dir = path.join(os.tmpdir(), name, counter.toString());
          fs.mkdirAsync(dir, 0700).then(function() {
            created = true;
            callback();
          }).catch(function(e) {
            if (e.cause.code == 'EEXIST') {
              counter++;
              callback();
            } else {
              reject(e);
            }
          });
        }, function() {
          return created;
        }, function() {
          resolve(dir);
        });
      });
  });
}

function Store() {
  this.storeDir = createStoreDir('astro');
}

Store.prototype.createWriteStream = function(/* path arguments */) {
  var self = this;
  var args = Array.prototype.slice.call(arguments);

  return new Promise(function(resolve, reject) {
    self.storeDir.then(function(dir) {
      // TODO: Files should be in directories rather than joined by '-'.
      // TODO: See https://github.com/substack/node-mkdirp
      var fileName = path.join(dir, args.map(function(x) { return x.toString(); }).join('-'));
      var stream = fs.createWriteStream(fileName);
      resolve(stream);
    });
  });
};

Store.prototype.createReadStream = function(/* path arguments */) {
  var self = this;
  var args = Array.prototype.slice.call(arguments);

  return new Promise(function(resolve, reject) {
    self.storeDir.then(function(dir) {
      // TODO: Files should be in directories rather than joined by '-'.
      // TODO: See https://github.com/substack/node-mkdirp
      var fileName = path.join(dir, args.map(function(x) { return x.toString(); }).join('-'));
      var stream = fs.createReadStream(fileName);
      resolve(stream);
    });
  });
};

module.exports = Store;
