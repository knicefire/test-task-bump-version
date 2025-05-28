import { PackageUpdateArgs } from './types';

/**
 * Replaces invalid characters in a string with dashes, trims leading/trailing dashes,
 * and collapses repeating symbols.
 * This is useful for creating sanitized branch names or identifiers.
 * @param input The input string to sanitize.
 * @returns
 */
function sanitize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-') // replace invalid chars
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
    .replace(/[-.]{2,}/g, '-'); // collapse repeating symbols
}

/**
 * Generates a release branch name based on the package name and version.
 * The branch name is formatted as `release/{packageName}-{packageVersion}`.
 * @param param0
 * @returns
 */
export function getReleaseBranchName({ packageName, packageVersion }: PackageUpdateArgs): string {
  return `release/${sanitize(packageName)}-${sanitize(packageVersion)}`;
}
