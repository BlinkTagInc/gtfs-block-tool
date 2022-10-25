# GTFS Block Tool

This tool reads transit data in [GTFS format](https://developers.google.com/transit/gtfs/) and outputs a CSV file of all trip segments sorted by block and their departure times.

## Example Output

```csv
Block ID,Trip ID,Days,Departure Location,Arrival Location,Departure Time,Arrival Time
1,t_1960920_b_33130_tn_0,Mon-Fri,Oakland Ferry Terminal,San Francisco Ferry Building Gate G,06:30:00,06:55:00
1,t_1989797_b_33130_tn_0,Mon-Fri,San Francisco Ferry Building Gate G,Oakland Ferry Terminal,07:05:00,07:30:00
1,t_1960965_b_33130_tn_0,Mon-Fri,Oakland Ferry Terminal,San Francisco Ferry Building Gate G,07:35:00,08:00:00
1,t_1989799_b_33130_tn_0,Mon-Fri,San Francisco Ferry Building Gate G,Oakland Ferry Terminal,08:10:00,08:35:00
1,t_1960967_b_33130_tn_0,Mon-Fri,Oakland Ferry Terminal,San Francisco Ferry Building Gate G,08:40:00,09:05:00
1,t_1960893_b_33130_tn_0,Mon-Fri,San Francisco Ferry Building Gate E,Richmond Ferry Terminal,09:55:00,10:30:00
1,t_1960879_b_33130_tn_0,Mon-Fri,Richmond Ferry Terminal,San Francisco Ferry Building Gate E,10:40:00,11:15:00
2,t_1962122_b_33130_tn_0,Mon-Fri,Alameda Seaplane Lagoon Ferry Terminal,San Francisco Ferry Building Gate F,07:00:00,07:20:00
2,t_1989798_b_33130_tn_0,Mon-Fri,San Francisco Ferry Building Gate G,Oakland Ferry Terminal,07:30:00,07:55:00
2,t_1960966_b_33130_tn_0,Mon-Fri,Oakland Ferry Terminal,San Francisco Ferry Building Gate G,08:00:00,08:25:00
2,t_1989800_b_33130_tn_0,Mon-Fri,San Francisco Ferry Building Gate G,Oakland Ferry Terminal,08:35:00,09:00:00
2,t_1960968_b_33130_tn_0,Mon-Fri,Oakland Ferry Terminal,San Francisco Ferry Building Gate G,09:05:00,09:30:00
2,t_1962145_b_33130_tn_0,Mon-Fri,San Francisco Ferry Building Gate F,Alameda Seaplane Lagoon Ferry Terminal,09:40:00,10:00:00
2,t_1962143_b_33130_tn_0,Mon-Fri,Alameda Seaplane Lagoon Ferry Terminal,San Francisco Ferry Building Gate F,10:10:00,10:30:00
2,t_1960934_b_33130_tn_0,Mon-Fri,San Francisco Ferry Building Gate G,Main Street Alameda Ferry Terminal,11:20:00,11:40:00
2,t_1993271_b_33130_tn_0,Mon-Fri,Main Street Alameda Ferry Terminal,Oakland Ferry Terminal,11:45:00,11:55:00
2,t_1962159_b_33130_tn_0,Mon-Fri,Oakland Ferry Terminal,San Francisco Ferry Building Gate G,12:05:00,12:30:00
```

## Installation

    npm install

## Setup

GTFS Block Tool reads its configuration from a JSON file. To get started, copy `config-sample.json` to `config.json` and then add your project's configuration to `config.json`.

    cp config-sample.json config.json

Ensure that your config.json is [valid JSON](https://jsonformatter.curiousconcept.com) before proceeding.

All files starting with `config*.json` are .gitignored - so you can create multiple configuration files such as `config-caltrain.json`.

| option | type | description |
| ------ | ---- | ----------- |
| [`agencies`](#agencies) | array | An array of GTFS files to be imported. |
| [`date`](#date) | string | The date to use for finding trips for the chart. |
| [`timeFormat`](#timeformat) | string | A string defining time format in moment.js style. |

### agencies

{Array} Specify the GTFS files to be imported in an `agencies` array. GTFS files can be imported via a `url` or a local `path`.

Each file needs an `agency_key`, a short name you create that is specific to that GTFS file. For GTFS files that contain more than one agency, you only need to list each GTFS file once in the `agencies` array, not once per agency that it contains.

To find an agency's GTFS file, visit [transitfeeds.com](http://transitfeeds.com). You can use the
URL from the agency's website or you can use a URL generated from the transitfeeds.com
API along with your API token.

* Specify a download URL:
```json
{
  "agencies": [
    {
      "agency_key": "county-connection",
      "url": "http://cccta.org/GTFS/google_transit.zip"
    }
  ]
}
```

* Specify a path to a zipped GTFS file:
```json
{
  "agencies": [
    {
      "agency_key": "myAgency",
      "path": "/path/to/the/gtfs.zip"
    }
  ]
}
```
* Specify a path to an unzipped GTFS file:
```json
{
  "agencies": [
    {
      "agency_key": "myAgency",
      "path": "/path/to/the/unzipped/gtfs/"
    }
  ]
}
```

* Exclude files - if you don't want all GTFS files to be imported, you can specify an array of files to exclude.

```json
{
  "agencies": [
    {
      "agency_key": "myAgency",
      "path": "/path/to/the/unzipped/gtfs/",
      "exclude": [
        "shapes",
        "stops"
      ]
    }
  ]
}
```

### date

{String} The date to use for generating blocks in YYYYMMDD format. Blocks will be generated for all calendars in calendar.txt that overlap with this date. So if a date specified is a weekday, weekend blocks will be generated as well for all calendar.txt entries that overlap the date specified. Defaults to today's date.

```json
"date": "20200505"
```

### timeFormat​

{String} A string defining time format using moment.js tokens. [See full list of formatting options](https://momentjs.com/docs/#/displaying/format/). Defaults to HH:mm:ss which yields "13:14:30".

```json
"timeFormat": "HH:mm:ss"
```

## Quick Start

### Command-line example

    ./bin/gtfs-block-tool.js --configPath /path/to/your/custom-config.json
