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

conn = sqlite3.connect(CACHE_PATH)
if not os.path.exists('cache.sqlite'):
    print "Creating cache: %s" % CACHE_PATH

    # Create Tables
    conn.execute("""CREATE TABLE info(coords text,
                                      json text,
                                      country text,
                                      state text,
                                      city text,
                                      location text)""")
    conn.commit()

photo_dir = os.path.dirname(os.path.realpath(__file__))
if len(sys.argv) > 1:
    photo_dir = os.path.realpath(sys.argv[1])

for file in os.listdir(photo_dir):
    if file[-3:].lower() != 'jpg':
        continue

    # Grab lat/lon from file
    result = subprocess.check_output(['exiftool', '-gpslatitude',
                                      '-gpslongitude', '-n', '-c', '"%.12f"',
                                      os.path.join(photo_dir, file)])

    if not result:
        # No output means no geodata
        continue

    latitude = None
    longitude = None
    for line in result.splitlines():
        if line[:12] == 'GPS Latitude':
            latitude = line.rpartition(':')[2].strip()
        elif line[:13] == 'GPS Longitude':
            longitude = line.rpartition(':')[2].strip()
        else:
            print "No match for line '%s'" % line

    if not latitude or not longitude:
        print "Could not extract lat & lon from output: %s" % result
        continue

    print latitude, longitude

conn.close()
