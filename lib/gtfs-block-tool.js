import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { sortBy } from 'lodash-es';
import { openDb, importGtfs, getTrips, getStoptimes } from 'gtfs';
import sanitize from 'sanitize-filename';
import Timer from 'timer-machine';
import sqlString from 'sqlstring';

import {
  prepDirectory,
} from './file-utils.js';
import {
  log,
  logWarning,
  logError,
  progressBar,
  logStats,
} from './log-utils.js';
import {
  fromGTFSTime,
  generateCSV,
  setDefaultConfig
} from './utils.js';
import { formatTripSegments } from './formatters.js';
import moment from 'moment';

/*
 * Block ID Tool
 */
const blockIdTool = async (initialConfig) => {
  const config = setDefaultConfig(initialConfig);
  const timer = new Timer();

  config.log = log(config);
  config.logWarning = logWarning(config);
  config.logError = logError(config);

  timer.start();

  const db = await openDb(config).catch((error) => {
    if (error instanceof Error && error.code === 'SQLITE_CANTOPEN') {
      config.logError(
        `Unable to open sqlite database "${config.sqlitePath}" defined as \`sqlitePath\` config.json. Ensure the parent directory exists or remove \`sqlitePath\` from config.json.`
      );
    }

    throw error;
  });

  if (config.debug === true) {
    db.on('profile', (sql, nsecs) => {
      if (sql.startsWith('SELECT')) {
        console.log(sql);
        console.log(nsecs);
      }
    });
  }

  if (!config.agencies || config.agencies.length === 0) {
    throw new Error('No agencies defined in `config.json`');
  }

  if (!config.skipImport) {
    // Import GTFS
    await importGtfs(config);
  }

  const agencyKey = config.agencies
    .map((agency) => agency.agency_key)
    .join('-');
  const exportPath = path.join(process.cwd(), 'output', sanitize(agencyKey));
  const outputStats = {
    trips: 0,
    tripSegments: 0,
    warnings: [],
  };

  const dayOfWeek = moment(config.date, 'YYYYMMDD').format('dddd').toLowerCase();
  const calendars = await db.all(`SELECT DISTINCT service_id FROM calendar WHERE start_date <= ? AND end_date >= ? AND ${sqlString.escapeId(dayOfWeek)} = 1`, [
    config.date,
    config.date
  ]);

  if (calendars.length === 0) {
    throw new Error(`No calendars found for ${moment(config.date, 'YYYYMMDD').format('MMM D, YYYY')}`);
  }

  const serviceIds = calendars.map((calendar) => calendar.service_id);
  const trips = await db.all(`SELECT trip_id, direction_id, service_id, block_id FROM trips where service_id IN (${serviceIds.map(() => '?').join(', ')})`, [
    ...serviceIds
  ]);
  const tripSegments = [];

  const bar = progressBar(
    `${agencyKey}: Generating trip segments {bar} {value}/{total}`,
    trips.length,
    config
  );
  
  /* eslint-disable no-await-in-loop */
  for (const trip of trips) {
    try {
      const stoptimes = await getStoptimes({ trip_id: trip.trip_id }, [], [['stop_sequence', 'ASC']]);

      for (const [index, stoptime] of stoptimes.entries()) {
        if (index < stoptimes.length - 1) {
          tripSegments.push({
            blockId: trip.block_id,
            tripId: trip.trip_id,
            serviceId: trip.service_id,
            departureStopId: stoptime.stop_id,
            arrivalStopId: stoptimes[index + 1].stop_id,
            departureTime: stoptime.departure_time,
            arrivalTime: stoptimes[index + 1].arrival_time
          })

          outputStats.tripSegments += 1;
        }
      }

      outputStats.trips += 1;

      bar.increment();
    } catch (error) {
      outputStats.warnings.push(error.message);
      bar.interrupt(error.message);
    }
  }
  /* eslint-enable no-await-in-loop */

  const sortedTripSegments = sortBy(tripSegments, [
    // Sort by integer else alphabetically
    (tripSegment) => parseInt(tripSegment.blockId, 10) || tripSegment.blockId,
    (tripSegment) => fromGTFSTime(tripSegment.departureTime)
  ])

  const formattedTripSegments = await formatTripSegments(sortedTripSegments, config);

  await prepDirectory(exportPath);
  await mkdir(exportPath, { recursive: true });
  config.assetPath = '../';

  const csv = await generateCSV(formattedTripSegments);
  const csvPath = path.join(
    exportPath,
    'blocks.csv'
  );
  await writeFile(csvPath, csv);

  // Print stats
  config.log(
    `${agencyKey}: block export for ${moment(config.date, 'YYYYMMDD').format('MMM D, YYYY')} created at ${exportPath}`
  );

  logStats(outputStats, config);

  const seconds = Math.round(timer.time() / 1000);
  config.log(
    `${agencyKey}: block export generation required ${seconds} seconds`
  );

  timer.stop();
};

export default blockIdTool;
