switch (process.platform) {
  case 'darwin':
    module.exports = require('./settings-osx');
    break;
  case 'linux':
    module.exports = require('./settings-linux');
    break;
  case 'win32':
    module.exports = require('./settings-windows');
    break;
  case 'freebsd':
    //
    break;
  case 'sunos':
    //
    break;
}
