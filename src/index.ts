import { Octokit } from 'octokit';
import { parseArgs } from './args-parser';

import { logger } from './logger';

import { GitHubRepository } from './github';
import { PackageJsonModifier } from './package-json-modifier';
import { getReleaseBranchName } from './utils';

/**
 * TODOs:
 * - [] Implement error handling and logging and clean up functionality (clean up branches, etc. if PR cannot be created)
 * - [] Implement tests for the functionality
 * - [] Support passing branch name and package.json path as arguments
 * - [] Support parsing repo and owner from GitHub URL
 * - [] Consider using `@octokit/auth-app` or `@octokit/auth-token` for better auth management
 * - [] Check if package version is valid (semver, exists in npm registry)
 * - [] Add engine checks for Node.js version compatibility
 * - [] Handle existing branches with the same name
 * - [] Support PR name template customization
 * - [] Support multiple package updates in a single PR
 * - [] Support repositories with multiple package.json files
 * - [] Implement dry run capability to preview changes without making them
 * - [] Figure out how to handle package-lock.json updates (if needed)
 * Done
 * - [x] Prettify the code and ensure it follows best practices
 * - [x] Update README with usage instructions and examples
 * - [x] Skip package.json modification if the version is already up-to-date
 * - [x] Implement branch name sanitization
 * - [x] Implement authentication using GitHub App or Token
 * - [x] Implement branch creation for release
 * - [x] Implement package.json modification to update the package version
 * - [x] Implement pull request creation for the changes
 * - [x] Consider using TypeScript for better type safety
 * - [x] Add support for updating both `dependencies` and `devDependencies`
 */
async function main() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!GITHUB_TOKEN) {
    logger.error('GITHUB_TOKEN environment variable is not set.');
    process.exit(1);
  }

  const argv = await parseArgs();
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  const github = new GitHubRepository(argv, octokit);
  const packageJsonFilePath = await github.findPackageJsonFile(argv.packageName);
  const packageJson = await github.getPackageJson(packageJsonFilePath);

  const fileModifier = new PackageJsonModifier(packageJson);
  fileModifier.updateDependency(argv);

  if (!fileModifier.isModified) {
    logger.info(
      `No changes made to ${argv.packageName} in ${argv.owner}/${argv.repo}/${packageJsonFilePath}.`
    );
    return;
  }

  // Releasing updates
  const releaseBranchName = getReleaseBranchName(argv);
  logger.debug(`Creating release branch: ${releaseBranchName}`);
  await github.createReleaseBranch(releaseBranchName);

  logger.debug(`Updating package.json in ${argv.owner}/${argv.repo}/${packageJsonFilePath}.`);
  await github.commitPackageJsonUpdate({
    packageName: argv.packageName,
    packageVersion: argv.packageVersion,
    branchName: releaseBranchName,
    file: {
      ...packageJson,
      content: fileModifier.toBase64(),
    },
  });

  logger.debug(`Creating pull request for ${argv.packageName} version bump.`);
  await github.createReleasePullRequest({
    branchName: releaseBranchName,
    packageName: argv.packageName,
    packageVersion: argv.packageVersion,
  });

  logger.info(
    `Updated ${argv.packageName} to version ${argv.packageVersion} in ${github.fullName}/${packageJsonFilePath}.`
  );
}

main().catch((error) => {
  logger.error('Error during version bump:', error);
  process.exit(1);
});
