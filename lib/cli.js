/* eslint-env node */
const {promisify} = require('util');

const mkdirp = promisify(require('mkdirp'));
const minimist = require('minimist');
const packageInfo = require('../package.json');
const path = require('path');
const rc = require('rc');
const xdgBasedir = require('xdg-basedir');
const {tagFiles} = require('./geo-rename');
const {trace} = require('./log');
const {verbose} = require('./log');

let hasUnknownOption;

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
        hasUnknownOption = true;
        console.error(`${packageInfo.name} unrecognized option: '${option}'
Try '${packageInfo.name} --help' for more information\n`);
        return false;
      }

      return true;
    },
  });

  return rc(
    packageInfo.name,
    {
      'cache-folder': path.join(xdgBasedir.cache, packageInfo.name),
    },
    args,
  );
}

function printUsage() {
  console.log(`${packageInfo.name} [OPTIONS] FILE
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

module.exports.main = async function main(argv) {
  hasUnknownOption = false;
  const conf = parseArgsAndLoadConfig(argv);

  if (conf.verbose) {
    verbose.enabled = true;
  }

  if (conf.debug) {
    verbose.enabled = true;
    trace.enabled = true;
  }

  if (conf.help || !conf._.length || hasUnknownOption) {
    printUsage();
    return 0;
  }

  verbose(`Version ${packageInfo.version}`);
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
