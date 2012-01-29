const debug = require('debug');
const package = require('./package.json');
const trace = debug(`${package.name}:trace`);
const verbose = debug(`${package.name}:verbose`);

module.exports.trace = trace;
module.exports.verbose = verbose;
