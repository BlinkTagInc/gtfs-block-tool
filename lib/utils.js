import { stringify } from 'csv-stringify';
import moment from 'moment';

/*
 * Initialize configuration with defaults.
 */
export function setDefaultConfig(initialConfig) {
  const defaults = {
    timeFormat: 'HH:mm:ss',
    date: moment().format('YYYYMMDD'),
  };

  const config = Object.assign(defaults, initialConfig);

  return config;
}

/*
 * Generate the CSV of trip segments
 */
export async function generateCSV(tripSegments) {
  const lines = [];

  lines.push([
    'Block ID',
    'Trip ID',
    'Direction ID',
    'Days',
    'Departure Location',
    'Arrival Location',
    'Departure Time',
    'Arrival Time',
    'Is Deadhead',
  ]);

  for (const tripSegment of tripSegments) {
    lines.push([
      tripSegment.blockId,
      tripSegment.tripId,
      tripSegment.directionId,
      tripSegment.dayList,
      tripSegment.departureLocation,
      tripSegment.arrivalLocation,
      tripSegment.departureTime,
      tripSegment.arrivalTime,
      tripSegment.isDeadhead,
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
