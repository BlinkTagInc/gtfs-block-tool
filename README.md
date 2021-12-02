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

## Quick Start

### Command-line example

    ./bin/gtfs-block-tool.js --configPath /path/to/your/custom-config.json
