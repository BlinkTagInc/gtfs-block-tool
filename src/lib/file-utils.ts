import path from 'node:path'
import { readFile, rm, mkdir } from 'node:fs/promises'
import untildify from 'untildify'

/*
 * Attempt to parse the specified config JSON file.
 */
export async function getConfig(argv) {
  try {
    const data = await readFile(
      path.resolve(untildify(argv.configPath)),
      'utf8',
    ).catch((error) => {
      console.error(
        new Error(
          `Cannot find configuration file at \`${argv.configPath}\`. Use config-sample.json as a starting point, pass --configPath option`,
        ),
      )
      throw error
    })
    const config = JSON.parse(data)

    if (argv.skipImport === true) {
      config.skipImport = argv.skipImport
    }

    return config
  } catch (error) {
    console.error(
      new Error(
        `Cannot parse configuration file at \`${argv.configPath}\`. Check to ensure that it is valid JSON.`,
      ),
    )
    throw error
  }
}

/*
 * Prepare the specified directory for saving block CSV output by deleting everything.
 */
export async function prepDirectory(exportPath) {
  await rm(exportPath, { recursive: true, force: true })
  try {
    await mkdir(exportPath, { recursive: true })
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        `Unable to write to ${exportPath}. Try running this command from a writable directory.`,
      )
    }

    throw error
  }
}
