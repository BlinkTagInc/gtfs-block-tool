import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { groupBy, sortBy, uniq } from 'lodash-es';
import { openDb, getDb, importGtfs, getTrips, getStoptimes, getCalendars } from 'gtfs';
import sanitize from 'sanitize-filename';
import Timer from 'timer-machine';

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
import { formatDays } from './formatters.js';

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

  await openDb(config).catch((error) => {
    if (error instanceof Error && error.code === 'SQLITE_CANTOPEN') {
      config.logError(
        `Unable to open sqlite database "${config.sqlitePath}" defined as \`sqlitePath\` config.json. Ensure the parent directory exists or remove \`sqlitePath\` from config.json.`
      );
    }

    throw error;
  });

  if (config.debug === true) {
    const db = getDb();

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
    blocks: 0,
    departureTimes: 0,
    warnings: [],
  };

  const trips = await getTrips();
  const blocks = Object.entries(groupBy(trips, 'block_id')).map(([blockId, blockTrips]) => ({
    blockId,
    trips: blockTrips,
    departureTimes: []
  }));

  await prepDirectory(exportPath);

  const bar = progressBar(
    `${agencyKey}: Generating blocks {bar} {value}/{total}`,
    blocks.length,
    config
  );

  /* eslint-disable no-await-in-loop */
  for (const block of blocks) {
    try {
      const departureTimes = [];
      for (const trip of block.trips) {
        const stoptimes = await getStoptimes({ trip_id: trip.trip_id }, [], [['stop_sequence', 'ASC']]);
        // Ignore last stoptime for each trip.
        departureTimes.push(...stoptimes.map((stoptime) => stoptime.departure_time).slice(0,-1))
      }

      block.departureTimes = sortBy(uniq(departureTimes), (time) => fromGTFSTime(time));
      const calendars = await getCalendars({ service_id: block.trips[0].service_id });
      block.dayList = formatDays(calendars[0]);
      
      outputStats.blocks += 1;
      outputStats.departureTimes += block.departureTimes.length;
      // Make directory if it doesn't exist
      await mkdir(exportPath, { recursive: true });
      config.assetPath = '../';
    } catch (error) {
      outputStats.warnings.push(error.message);
      bar.interrupt(error.message);
    }

    bar.increment();
  }
  /* eslint-enable no-await-in-loop */
  
  // find trips without blocks

  const nullBlock = blocks.find((block) => block.blockId === 'null');

  if (nullBlock) {
    const warningText = `Trips without block_id: ${nullBlock.trips.map((trip) => trip.trip_id).join(', ')}`;
    config.logWarning(warningText);
    outputStats.warnings.push(warningText);
  }

  const csv = await generateCSV(sortBy(blocks, 'dayList'));
  const csvPath = path.join(
    exportPath,
    'blocks.csv'
  );
  await writeFile(csvPath, csv);

  // Print stats
  config.log(
    `${agencyKey}: blocks created at ${exportPath}`
  );

  logStats(outputStats, config);

  const seconds = Math.round(timer.time() / 1000);
  config.log(
    `${agencyKey}: block generation required ${seconds} seconds`
  );

  timer.stop();
};

export default blockIdTool;
