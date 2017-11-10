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

## Requirements

0. [Node](https://nodejs.org/)
1. [ExifTool](http://www.sno.phy.queensu.ca/~phil/exiftool/)

## Changelog

* `0.0.1`: First release`

## Roadmap / TODO

- [x] Query Google
- [x] Cache in db
- [x] Write to files
- [x] Support reading directory
- [ ] Write tests
- [ ] Allow configuring Google API key
- [ ] Rename
- [ ] Ditch `debug` for verbose output in order to avoid stupid prefixes
- [ ] Renaming
   - [ ] Preview
   - [ ] Allow output to destination directory
- [ ] Bash completion via tabtab or other
- [ ] Progress bar
- [ ] Emoji / prettier output? https://github.com/sindresorhus/awesome-nodejs#command-line-utilities
- [ ] Update notification https://github.com/yeoman/update-notifier

# License

MIT
