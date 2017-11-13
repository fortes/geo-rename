/* eslint-env node */

const Database = require('better-sqlite3');
const {trace} = require('./log');
const {verbose} = require('./log');

let db;
module.exports.open = function openDatabase(cachePath) {
  if (db) {
    throw new Error('Database already open');
  }

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
};

module.exports.get = function(latlng) {
  if (!db) {
    throw new Error('Cache not open');
  }
  return db.prepare('SELECT * FROM cache WHERE latlng=?').get(latlng);
};

module.exports.write = function(geoInfo) {
  if (!db) {
    throw new Error('Cache not open');
  }

  trace(`Writing result to cache %j`, geoInfo);
  const info = db
    .prepare(
      `INSERT INTO cache(latlng, json, country, country_short, state, state_short, city, city_short, location, location_short) VALUES($latlng, $json, $country, $country_short, $state, $state_short, $city, $city_short, $location, $location_short)`,
    )
    .run(geoInfo);
  trace(`Cache write info %j`, info);
};

module.exports.close = function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
};
