const debug = require('debug');
const packageInfo = require('../package.json');
const trace = debug(`${packageInfo.name}:trace`);
const verbose = debug(`${packageInfo.name}:verbose`);

module.exports.trace = trace;
module.exports.verbose = verbose;
