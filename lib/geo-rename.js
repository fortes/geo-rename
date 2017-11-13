/* eslint-env node */
const {promisify} = require('util');

const access = promisify(require('fs').access);
const exiftool = require('node-exiftool');
const fetch = require('node-fetch');
const {getGeoInfo} = require('./get_geo_info');
const glob = promisify(require('glob'));
const {trace} = require('./log');
const {verbose} = require('./log');
const cache = require('./cache.js');

function containsGeotags(exifdata) {
  return 'GPSLatitude' in exifdata && 'GPSLongitude' in exifdata;
}

module.exports.tagFiles = async function tagFiles(
  files,
  {cachePath, force, offline, skipBackup},
) {
  let ep;
  try {
    cache.open(cachePath);
    ep = new exiftool.ExiftoolProcess();
    trace('Spawning exiftool');
    await ep.open();

    for (let file of files) {
      trace(`Sending ${file} to exiftool`);
      // `-n` in order to get decimal lat/lon
      // `-File:all` to get info from everything in directory
      const results = await ep.readMetadata(file, ['n', '-File:all']);
      if (results.error) {
        console.error(results.error);
        // console.log(results)
        // continue;
      }

      for (const data of results.data) {
        if (!containsGeotags(data)) {
          verbose(`Skipping ${data.SourceFile} since it has no geotags`);
          continue;
        }

        const geoInfo = await getGeoInfo(data, {cache, offline});

        // Write tags
        const writeData = {};
        'Country State City Location'.split(' ').forEach(field => {
          if (force || !(field in data)) {
            const value = geoInfo[field.toLowerCase()];
            if (value) {
              writeData[`MWG:${field}`] = value;
            } else {
              trace(
                `${data.SourceFile} does not have field ${
                  field
                } but no value available`,
              );
            }
          } else {
            trace(`${data.SourceFile} already has field ${field}`);
          }
        });

        if (Object.keys(writeData).length) {
          trace(`Writing metadata to ${data.SourceFile} %j`, writeData);
          const writeInfo = await ep.writeMetadata(
            data.SourceFile,
            writeData,
            skipBackup ? ['overwrite_original'] : [],
          );
          trace(`Metadata write output ${writeInfo}`);
        } else {
          trace(`No metadata to write to ${data.SourceFile}`);
        }
      }
    }
  } finally {
    if (ep) {
      trace('Closing exiftool');
      ep.close();
    }

    cache.close();
  }
};
