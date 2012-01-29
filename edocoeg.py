#!/usr/bin/python

import os
import sqlite3
import sys
import urllib2
import subprocess
import pipes
import re
import json

CACHE_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                          'cache.sqlite')

db_exists = os.path.exists('cache.sqlite')
conn = sqlite3.connect(CACHE_PATH)
if not db_exists:
    print "Creating cache: %s" % CACHE_PATH

    # Create Tables
    conn.execute("""CREATE TABLE geocache(coords text,
                                          json text,
                                          country text,
                                          state text,
                                          city text,
                                          location text)""")
    conn.commit()

photo_dir = os.path.dirname(os.path.realpath(__file__))
if len(sys.argv) > 1:
    photo_dir = os.path.realpath(sys.argv[1])

for root, dirs, files in os.walk(photo_dir):
    for file in files:
        if file[-3:].lower() != 'jpg':
            continue

        filepath = os.path.join(root, file)

        # First check if we already have data, country being pretty much
        # a shoe-in
        result = subprocess.check_output(['exiftool', '-country', filepath])
        if result:
            print "Skipping %s" % (filepath)
            continue

        # Grab lat/lon from file
        result = subprocess.check_output(['exiftool', '-gpslatitude',
                                        '-gpslongitude', '-n', filepath])

        if not result:
            # No output means no geodata
            continue

        latitude = None
        longitude = None
        for line in result.splitlines():
            if line[:12] == 'GPS Latitude':
                latitude = float(line.rpartition(':')[2].strip())
            elif line[:13] == 'GPS Longitude':
                longitude = float(line.rpartition(':')[2].strip())
            else:
                print "No match for line '%s'" % line

        if not latitude or not longitude:
            print "Could not extract lat & lon from output: %s" % result
            continue

        # Truncate to 4 decimal places, which works out to about 100m of accuracy
        # http://en.wikipedia.org/wiki/Decimal_degrees
        # This encourages cache hits
        coords = "%.3f,%.3f" % (latitude, longitude)

        # Query db to see if we have an entry
        values = conn.execute("SELECT * FROM geocache WHERE coords=?", [coords]).fetchall()

        if not len(values):
            print "Fetching coords from Google for %s" % coords
            maps_response = urllib2.urlopen("http://maps.googleapis.com/maps/api/geocode/json?latlng=%s&sensor=false" % coords).read()
            json_result = json.loads(maps_response)

            country = state = city = location = None
            if json_result['results'] and len(json_result['results']) > 0 and json_result['results'][0]['address_components']:
                address = json_result['results'][0]['address_components']
                for value in address:
                    types = value['types']
                    if 'country' in types:
                        country = value['long_name']
                    elif 'administrative_area_level_1' in types:
                        state = value['long_name']
                    elif 'locality' in types:
                        city = value['long_name']
                    elif 'neighborhood' in types:
                        location = value['long_name']
                    elif 'sublocality' in types and not location:
                        location = value['long_name']
            else:
                print "Invalid JSON for coords %s: %s" % (coords, maps_response)
                continue

            # Store tuple and send to database
            geoinfo = [coords, maps_response.decode('utf-8'), country, state, city, location]

            print "Found values: %s, %s, %s, %s" % (country, state, city, location)

            conn.execute("""INSERT INTO geocache(coords, json, country, state, city,
                    location) VALUES(?, ?, ?, ?, ?, ?)""", geoinfo)
            conn.commit()
        else:
            geoinfo = values[0]
            _, _, country, state, city, location = geoinfo

        if not (country or state or city or location):
            print 'No values for coords %s. Response(%s)' % (coords, maps_response)
            continue

        print "%s: %s, %s, %s, %s" % (filepath, country, state, city, location)
        args = ['exiftool', '-overwrite_original']
        if country:
            args.append('-country=%s' % country)
        if state:
            args.append('-state=%s' % state)
        if city:
            args.append('-city=%s' % city)
        if location:
            args.append('-location=%s' % location)

        args.append(filepath)

        try:
            subprocess.check_call(args)
        except subprocess.CalledProcessError as e:
            print "Error for file %s" % filepath
            if e.output:
                print e.output
            continue

conn.close()
