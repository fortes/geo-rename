# geo-rename

[![build status](https://travis-ci.org/fortes/geo-rename.svg?branch=master)](https://travis-ci.org/fortes/geo-rename/) [![codecov](https://codecov.io/gh/fortes/geo-rename/branch/master/graph/badge.svg)](https://codecov.io/gh/fortes/geo-rename) [![Greenkeeper badge](https://badges.greenkeeper.io/fortes/geo-rename.svg)](https://greenkeeper.io/)

Adds IPTC geographic metadata to photos by reverse geocoding from lat/lon, the following IPTC tags are added:

* Country
* State
* City
* Location

## Installation

0. Install [Node](https://nodejs.org/en/download/)
1. Install [ExifTool](http://www.sno.phy.queensu.ca/~phil/exiftool/)
2. Run `npm install -g geo-rename` (or `yarn global add geo-rename` if you have [Yarn](https://yarnpkg.com))

## Usage

`geo-rename [OPTIONS] [FILES]`

Options:

```
  --cache-folder <path>
  -f, --force
  -h, --help
  --offline
  -q, --quiet
  -s, --skip-backup
  -v, --verbose
  -V, --version
```

## Warning

* I have not tested this other than with my own photos. May or may not work with your photos. Use at your own risk.
* Google only allows 15,000 requests per IP per day. Script uses a local cache, but if you have many unique locations and photos, you may run over this limit.

## Changelog

* `0.0.0`: Poor quality code sitting on GitHub for the world to see

## Roadmap / TODO

- [x] Query Google
- [x] Cache in db
- [x] Write to files
- [x] Support reading directories
- [ ] Write tests
- [ ] Consider [`exiftool-vendored`](https://github.com/mceachen/exiftool-vendored.js) (check performance)
- [ ] Setup code auto-formatting & lint
- [ ] Consider using flow https://javascriptplayground.com/blog/2017/01/npm-flowjs-javascript/
- [ ] Allow configuring Google API key
- [ ] Renaming
   - [ ] Preview
   - [ ] Allow output to destination directory
- [ ] Bash completion via tabtab or other
- [ ] Ditch `debug` for verbose output for better output
- [ ] Progress bar
- [ ] Emoji / prettier output? https://github.com/sindresorhus/awesome-nodejs#command-line-utilities
- [ ] Update notification https://github.com/yeoman/update-notifier

# License

MIT
