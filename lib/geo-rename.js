/* eslint-env node */
const {promisify} = require('util');

const Database = require('better-sqlite3');
const access = promisify(require('fs').access);
const exiftool = require('node-exiftool');
const fetch = require('node-fetch');
const glob = promisify(require('glob'));
const {trace} = require('./log');
const {verbose} = require('./log');

let db;
function openDatabase(cachePath) {
  trace(`Opening database at ${cachePath}`);
  db = new Database(cachePath, {memory: false, readonly: false});

  // TODO: Version
  trace('Running CREATE TABLE IF NOT EXISTS');
  db
    .prepare(
      `CREATE TABLE IF NOT EXISTS cache(
                latlng text,
                json text,
                country text,
                country_short text,
                state text,
                state_short text,
                city text,
                city_short text,
                location text,
                location_short text)`,
    )
    .run();
  return db;
}

function containsGeotags(exifdata) {
  return 'GPSLatitude' in exifdata && 'GPSLongitude' in exifdata;
}

function roundDegrees(degrees) {
  // Truncate to 4 decimal places to encourage cache hits.
  // 4 decimal places  works out to about 100m of accuracy
  // http://en.wikipedia.org/wiki/Decimal_degrees
  return Math.round(degrees * 1000) / 1000;
}

function getLatLng(exifdata) {
  const {GPSLatitude, GPSLongitude} = exifdata;
  trace(`Rounding raw coordinates ${GPSLatitude}, ${GPSLongitude}`);
  const latitude = roundDegrees(parseFloat(GPSLatitude));
  const longitude = roundDegrees(parseFloat(GPSLongitude));
  return `${latitude},${longitude}`;
}

async function getAddress(latlng, offline) {
  trace(`Querying cache for ${latlng}`);
  const cacheResult = db
    .prepare('SELECT * FROM cache WHERE latlng=?')
    .get(latlng);

  if (cacheResult) {
    trace(`Found ${latlng} in cache %j`, cacheResult);
    return cacheResult;
  }

  trace(`${latlng} not found in cache`);

  if (offline) {
    trace(`Not querying for ${latlng} because offline`);
    return null;
  }

  // TODO: obey the rules here:
  // https://developers.google.com/maps/documentation/geocoding/intro
  trace(`Querying Google for ${latlng}`);
  const res = await fetch(
    `http://maps.googleapis.com/maps/api/geocode/json?latlng=${
      latlng
    }&sensor=false&language=en`,
  );

  const {results} = await res.json();
  if (!results.length) {
    trace(`No results found for ${latlng}`);
    return null;
  }

  trace(`Found result for ${latlng} %j`, results[0]);
  const address = results[0].address_components;
  const geoInfo = {
    latlng,
    json: JSON.stringify(address),
    country: null,
    country_short: null,
    state: null,
    state_short: null,
    city: null,
    city_short: null,
    location: null,
    location_short: null,
  };

  for (const component of address) {
    switch (component.types[0]) {
      case 'country':
        geoInfo.country = component.long_name;
        geoInfo.country_short = component.short_name;
        break;
      case 'administrative_area_level_1':
        geoInfo.state = component.long_name;
        geoInfo.state_short = component.short_name;
        break;
      case 'locality':
        geoInfo.city = component.long_name;
        geoInfo.city_short = component.short_name;
        break;
      case 'neighborhood':
      case 'sublocality':
        geoInfo.location = component.long_name;
        geoInfo.location_short = component.short_name;
        break;
    }
  }

  // Write to cache
  trace(`Writing result to cache %j`, geoInfo);
  const info = db
    .prepare(
      `INSERT INTO cache(latlng, json, country, country_short, state, state_short, city, city_short, location, location_short) VALUES($latlng, $json, $country, $country_short, $state, $state_short, $city, $city_short, $location, $location_short)`,
    )
    .run(geoInfo);
  trace(`Cache write info %j`, info);

  return geoInfo;
}

async function getGeoInfo(exifdata, offline) {
  const latlng = getLatLng(exifdata);
  const address = await getAddress(latlng, offline);
  return address;
}

module.exports.tagFiles = async function tagFiles(
  files,
  {cachePath, force, offline, skipBackup},
) {
  let db;
  let ep;
  try {
    db = openDatabase(cachePath);
    ep = new exiftool.ExiftoolProcess();
    trace('Spawning exiftool');
    await ep.open();

    for (let file of files) {
      trace(`Sending ${file} to exiftool`);
      // `-n` in order to get decimal lat/lon
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

        const geoInfo = await getGeoInfo(data, offline);

        // Write tags
        const writeData = {};
        'Country State City Location'.split(' ').forEach(field => {
          if (force || !(field in data)) {
            const value = geoInfo[field.toLowerCase()];
            if (value) {
              writeData[`MWG:${field}`] = value;
            } else {
              trace(
                `${data.SourceFile} does not have field ${field} but no value available`,
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

    if (db) {
      trace('Closing database');
      db.close();
    }
  }
};
