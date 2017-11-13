/* eslint-env node */
const {trace} = require('./log');
const {verbose} = require('./log');

module.exports.getGeoInfo = async function getGeoInfo(
  exifdata,
  {cache, offline},
) {
  const latlng = getLatLng(exifdata);
  return getAddress(latlng, {cache, offline});
};

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

async function getAddress(latlng, {cache, offline}) {
  trace(`Querying cache for ${latlng}`);
  const cacheResult = cache.get(latlng);

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
  cache.write(geoInfo);

  return geoInfo;
}
