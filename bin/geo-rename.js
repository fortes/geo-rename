#!/usr/bin/env node
'use strict';

const {callbackify} = require('util');
const main = callbackify(require('../cli').main);
const {trace} = require('../log');
const {verbose} = require('../log');

main(process.argv.slice(2), (exitCode, err) => {
  if (err) {
    process.stderr.write(`Unhandled error: ${err.message}\n`);
    trace(`Stack: ${err.stack}`);
    process.exit(1);
  }

  process.exit(exitCode);
});

function exitHandler(code) {
  trace(`Exiting with code ${code}`);
}

process.on('exit', exitHandler);
process.on('SIGINT', () => {
  trace(`Received SIGINT, exiting`);
  process.exit(1);
});
process.on('SIGTERM', () => {
  trace(`Received SIGTERM, exiting`);
  process.exit(130);
});
process.on('uncaughtException', e => {
  console.error(`Uncaught exception: ${e.message}\n`);
  trace(`Exception stack: ${e.stack}`);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error(`Uncaught rejection at ${promise}: ${reason}\n`);
  trace(`Stack: ${e.stack}`);
  process.exit(1);
});
