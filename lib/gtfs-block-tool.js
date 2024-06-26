import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { sortBy } from 'lodash-es'
import { openDb, importGtfs, getStoptimes, getDeadheadTimes } from 'gtfs'
import sanitize from 'sanitize-filename'
import Timer from 'timer-machine'

import { prepDirectory } from './file-utils.js'
import {
  log,
  logWarning,
  logError,
  progressBar,
  logStats,
} from './log-utils.js'
import { fromGTFSTime, generateCSV, setDefaultConfig } from './utils.js'
import { formatTripSegments } from './formatters.js'
import moment from 'moment'

/*
 * GTFS Block Tool
 */
const gtfsBlockTool = async (initialConfig) => {
  const config = setDefaultConfig(initialConfig)
  const timer = new Timer()

  config.log = log(config)
  config.logWarning = logWarning(config)
  config.logError = logError(config)

  timer.start()

  const db = openDb({ sqlitePath: config.sqlitePath })

  if (!config.agencies || config.agencies.length === 0) {
    throw new Error('No agencies defined in `config.json`')
  }

  if (!config.skipImport) {
    // Import GTFS
    await importGtfs(config)
  }

  const agencyKey = config.agencies.map((agency) => agency.agency_key).join('-')
  const exportPath = path.join(process.cwd(), 'output', sanitize(agencyKey))
  const outputStats = {
    trips: 0,
    tripSegments: 0,
    warnings: [],
  }

  const calendars = db
    .prepare(
      'SELECT DISTINCT service_id FROM calendar WHERE start_date <= ? AND end_date >= ?',
    )
    .all([config.date, config.date])

  if (calendars.length === 0) {
    throw new Error(
      `No calendars found for ${moment(config.date, 'YYYYMMDD').format(
        'MMM D, YYYY',
      )}`,
    )
  }

  const serviceIds = calendars.map((calendar) => calendar.service_id)
  const trips = db
    .prepare(
      `SELECT trip_id, direction_id, service_id, block_id, route_id, trip_headsign FROM trips where service_id IN (${serviceIds
        .map(() => '?')
        .join(', ')})`,
    )
    .all(serviceIds)
  const deadheads = config.includeDeadheads
    ? db
        .prepare(
          `SELECT deadhead_id, service_id, block_id FROM deadheads where service_id IN (${serviceIds
            .map(() => '?')
            .join(', ')})`,
        )
        .all(serviceIds)
    : []
  const tripSegments = []

  const bar = progressBar(
    `${agencyKey}: Generating trip segments {bar} {value}/{total}`,
    trips.length,
    config,
  )

  /* eslint-disable no-await-in-loop */
  for (const trip of trips) {
    try {
      const stoptimes = getStoptimes(
        { trip_id: trip.trip_id },
        [],
        [['stop_sequence', 'ASC']],
      )

      for (const [index, stoptime] of stoptimes.entries()) {
        if (index < stoptimes.length - 1) {
          tripSegments.push({
            blockId: trip.block_id,
            routeId: trip.route_id,
            tripId: trip.trip_id,
            tripHeadsign: trip.trip_headsign,
            stopHeadsign: stoptime.stop_headsign,
            directionId: trip.direction_id,
            serviceId: trip.service_id,
            departureStopId: stoptime.stop_id,
            arrivalStopId: stoptimes[index + 1].stop_id,
            departureTime: stoptime.departure_time,
            arrivalTime: stoptimes[index + 1].arrival_time,
            isDeadhead: false,
          })

          outputStats.tripSegments += 1
        }
      }

      outputStats.trips += 1

      bar.increment()
    } catch (error) {
      outputStats.warnings.push(error.message)
      bar.interrupt(error.message)
    }
  }

  for (const deadhead of deadheads) {
    try {
      const deadheadTimes = await getDeadheadTimes(
        { deadhead_id: deadhead.deadhead_id },
        [],
        [['location_sequence', 'ASC']],
      )

      for (const [index, deadheadTime] of deadheadTimes.entries()) {
        if (index < deadheadTimes.length - 1) {
          tripSegments.push({
            blockId: deadhead.block_id,
            tripId: deadhead.deadhead_id,
            serviceId: deadhead.service_id,
            departureStopId:
              deadheadTime.ops_location_id ?? deadheadTime.stop_id,
            arrivalStopId:
              deadheadTimes[index + 1].ops_location_id ??
              deadheadTimes[index + 1].stop_id,
            departureTime: deadheadTime.departure_time,
            arrivalTime: deadheadTimes[index + 1].arrival_time,
            isDeadhead: true,
          })

          outputStats.tripSegments += 1
        }
      }

      outputStats.trips += 1

      bar.increment()
    } catch (error) {
      outputStats.warnings.push(error.message)
      bar.interrupt(error.message)
    }
  }
  /* eslint-enable no-await-in-loop */

  const sortedTripSegments = sortBy(tripSegments, [
    // Sort by integer else alphabetically
    (tripSegment) => parseInt(tripSegment.blockId, 10) || tripSegment.blockId,
    (tripSegment) => fromGTFSTime(tripSegment.departureTime),
  ])

  const formattedTripSegments = formatTripSegments(sortedTripSegments, config)

  await prepDirectory(exportPath)
  await mkdir(exportPath, { recursive: true })
  config.assetPath = '../'

  const csv = await generateCSV(formattedTripSegments)
  const csvPath = path.join(exportPath, 'blocks.csv')
  await writeFile(csvPath, csv)

  // Print stats
  config.log(
    `${agencyKey}: block export for ${moment(config.date, 'YYYYMMDD').format(
      'MMM D, YYYY',
    )} created at ${exportPath}`,
  )

  logStats(outputStats, config)

  const seconds = Math.round(timer.time() / 1000)
  config.log(
    `${agencyKey}: block export generation required ${seconds} seconds`,
  )

  timer.stop()
}

export default gtfsBlockTool
