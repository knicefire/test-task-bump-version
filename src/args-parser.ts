import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import semver from 'semver';
import packageJson from 'package-json';

import { logger } from './logger';

export type CliOptions = {
  owner: string;
  repo: string;
  packageName: string;
  packageVersion: string;
};

// Ensure package version exist in npm registry
const ensureValidPackageVersion = async (packageName: string, packageVersion: string) => {
  const data = await packageJson(packageName, {
    version: packageVersion,
    omitDeprecated: false,
  }).catch(() => {
    throw new Error(
      `Package "${packageName}" with version "${packageVersion}" not found in npm registry.`
    );
  });

  if (data.deprecated) {
    logger.warn(
      `Package "${packageName}" with version "${packageVersion}" is deprecated. Proceed with caution.`
    );
  }
};

export async function parseArgs(): Promise<CliOptions> {
  const argv = yargs(hideBin(process.argv))
    .version(false)
    .option('owner', {
      type: 'string',
      demandOption: true,
      describe: 'Repo owner',
    })
    .option('repo', { type: 'string', demandOption: true, describe: 'Repo name' })
    .option('packageName', {
      type: 'string',
      alias: 'package',
      demandOption: true,
      describe: 'Package name',
    })
    .option('packageVersion', {
      type: 'string',
      alias: 'version',
      demandOption: true,
      describe: 'Version of the package',
    })
    .check((argv) => {
      if (!semver.validRange(argv.packageVersion)) {
        throw new Error('Invalid semver version or range');
      }

      return true;
    })
    .strict()
    .parseSync();

  await ensureValidPackageVersion(argv.packageName, argv.packageVersion);

  return argv;
}
