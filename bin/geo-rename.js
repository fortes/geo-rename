#!/usr/bin/env node
'use strict';

const {callbackify} = require('util');
const main = callbackify(require('../cli').main);
const {trace} = require('../log');
const {verbose} = require('../log');

main(process.argv.slice(2), err => {
  if (err) {
    process.stderr.write(`Unhandled error: ${err.message}\n`);
    trace(`Stack: ${err.stack}`);
    process.exit(1);
  }
});
