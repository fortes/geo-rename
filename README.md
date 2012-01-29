# Edocoeg

Adds IPTC geographic metadata to photos by reverse geocoding from lat/lon

**NOTE:** Google only allows 15,000 requests per IP per day. Script uses a local cache, but if you have many unique locations and photos, you may run over this limit.

## Usage

`python edocoeg.py *root_directory*`

Will run through directory plus subdirectories.

## Warning

I have not tested this other than with my own photos. May or may not work with your photos. Use at your own risk.

## Requirements

0. Python
1. [ExifTool](http://www.sno.phy.queensu.ca/~phil/exiftool/)

## Future Ideas

* Check for updated geo data and overwrite existing City, etc data

# License

MIT
