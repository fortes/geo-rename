/* eslint-env node */
const {promisify} = require('util');

const mkdirp = promisify(require('mkdirp'));
const minimist = require('minimist');
const package = require('./package.json');
const path = require('path');
const rc = require('rc');
const xdgBasedir = require('xdg-basedir');
const {tagFiles} = require('./geo-rename');
const {trace} = require('./log');
const {verbose} = require('./log');

function parseArgsAndLoadConfig(argv) {
  const args = minimist(argv, {
    alias: {
      d: 'debug',
      f: 'force',
      h: 'help',
      q: 'quiet',
      s: 'skip-backup',
      v: 'verbose',
      V: 'version',
    },
    boolean: [
      'debug',
      'force',
      'help',
      'offline',
      'quiet',
      'skip-backup',
      'verbose',
      'version',
    ],
    string: ['cache-folder'],
    unknown: option => {
      if (/^--?/.test(option)) {
        process.stdout.write(`${package.name} unrecognized option: '${option}'
Try '${package.name} --help' for more information\n`);
        process.exit(1);
      }
    },
  });

  return rc(
    package.name,
    {
      'cache-folder': path.join(xdgBasedir.cache, package.name),
    },
    args,
  );
}

function printUsage() {
  process.stdout.write(`${package.name} [OPTIONS] FILE
Find location information from GPS and write to EXIF

  --cache-folder <path>
  -f, --force
  -h, --help
  --offline
  -q, --quiet
  -s, --skip-backup
  -v, --verbose
  -V, --version
`);
}

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
  process.stderr.write(`Uncaught exception: ${e.message}\n`);
  trace(`Exception stack: ${e.stack}`);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  process.stderr.write(`Uncaught rejection at ${promise}: ${reason}\n`);
  trace(`Stack: ${e.stack}`);
  process.exit(1);
});

module.exports.main = async function main(argv) {
  const conf = parseArgsAndLoadConfig(argv);

  if (conf.verbose) {
    verbose.enabled = true;
  }

  if (conf.debug) {
    verbose.enabled = true;
    trace.enabled = true;
  }

  if (conf.help || !conf._.length) {
    printUsage();
    process.exit();
  }

  verbose(`Version ${package.version}`);
  trace('Loaded configuration: %O', conf);
  trace('File arguments: %O', conf._);

  const cachePath = path.join(conf['cache-folder'], 'locations.sqlite');
  verbose(`Cache db location: ${cachePath}`);
  await mkdirp(path.dirname(cachePath));

  await tagFiles(conf._, {
    cachePath,
    force: conf.force,
    offline: conf.offline,
    skipBackup: conf['skip-backup'],
  });
};
