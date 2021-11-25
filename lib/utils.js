import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';


import csvStringify from 'csv-stringify';
import moment from 'moment';

const stringify = promisify(csvStringify);

/*
 * Initialize configuration with defaults.
 */
export function setDefaultConfig(initialConfig) {
  const defaults = {
  };

  const config = Object.assign(defaults, initialConfig);

  return config;
}

/*
 * Generate the CSV of blocks
 */
export async function generateCSV(blocks) {
  const lines = [];

  lines.push([
    'Block ID',
    'Days',
    'Departure Times'
  ]);

  for (const block of blocks) {
    if (block.blockId === 'null') {
      continue;
    }
  
    lines.push([
      block.blockId,
      block.dayList,
      ...block.departureTimes,
    ]);
  }

  return stringify(lines);
}

/*
 * Convert a GTFS formatted time string into a moment less than 24 hours.
 */
export function fromGTFSTime(timeString) {
  const duration = moment.duration(timeString);

  return moment({
    hour: duration.hours(),
    minute: duration.minutes(),
    second: duration.seconds(),
  });
}