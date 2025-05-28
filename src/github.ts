import { Octokit } from 'octokit';
import { ContentResponseData, PackageUpdateArgs } from './types';

import { logger } from './logger';

export type GithubRepoOptions = {
  owner: string;
  repo: string;
  branch?: string;
};

export class GitHubRepository {
  constructor(
    private readonly options: GithubRepoOptions,
    private readonly octokit: Octokit
  ) {}

  /**
   * Returns the full name of the repository in the format "owner/repo".
   */
  public get fullName(): string {
    return `${this.options.owner}/${this.options.repo}`;
  }

  /**
   * Finds the package.json file in the repository that contains the specified package name.
   * Searches for the package name in the repository's codebase.
   * Returns the path to the first found package.json file.
   * Throws an error if no package.json file is found or if multiple files are found.
   */
  public async findPackageJsonFile(packageName: string): Promise<string> {
    const result = await this.octokit.rest.search.code({
      q: `"${packageName}": filename:package.json repo:${this.fullName}`,
      headers: {
        accept: 'application/vnd.github.text-match+json',
      },
    });

    // Handling search results
    if (result.data.incomplete_results && result.data.total_count === 0) {
      logger.warn(
        `Results may be incomplete. The ${this.fullName} repository might still be indexing.`
      );
    }

    if (result.data.total_count === 0) {
      logger.error(`No package.json that has dependency to "${packageName}" in ${this.fullName}.`);
      process.exit(1);
    }

    if (result.data.total_count > 1) {
      logger.warn(
        `Found multiple package.json files with "${packageName}" dependency. Using the first one.`
      );
    }

    const filePath = result.data.items[0].path;
    if (!filePath) {
      throw new Error(`No file path found for package.json in ${this.fullName}.`);
    }

    logger.debug(
      `Found ${result.data.total_count} results for "${packageName}" in ${this.fullName}.`
    );

    return filePath;
  }

  /**
   * Fetches the content of the package.json file from the repository.
   * Returns the content as a ContentResponseData object.
   */
  public async getPackageJson(path: string): Promise<ContentResponseData> {
    const { data } = await this.octokit.rest.repos.getContent({
      owner: this.options.owner,
      repo: this.options.repo,
      path,
      ref: await this.getBranch(),
    });

    return data;
  }

  /**
   * Commits the updated package.json file to the repository.
   * Creates or updates the file with the specified content, message, and branch.
   */
  public async commitPackageJsonUpdate(
    options: PackageUpdateArgs & { branchName: string; file: ContentResponseData }
  ): Promise<void> {
    const { packageName, packageVersion, branchName, file } = options;

    await this.octokit.rest.repos.createOrUpdateFileContents({
      owner: this.options.owner,
      repo: this.options.repo,
      path: file.path,
      message: `chore: bump ${packageName} to ${packageVersion}`,
      content: file.content,
      sha: file.sha,
      branch: branchName,
    });
  }

  public async createReleaseBranch(branchName: string) {
    const defaultBranch = await this.getBranch();

    const { data: refData } = await this.octokit.rest.git.getRef({
      owner: this.options.owner,
      repo: this.options.repo,
      ref: `heads/${defaultBranch}`,
    });

    const baseSha = refData.object.sha;
    await this.octokit.rest.git.createRef({
      owner: this.options.owner,
      repo: this.options.repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    });
  }

  public async createReleasePullRequest({
    branchName,
    packageName,
    packageVersion,
  }: PackageUpdateArgs & { branchName: string }): Promise<void> {
    await this.octokit.rest.pulls.create({
      owner: this.options.owner,
      repo: this.options.repo,
      title: `Update ${packageName} to ${packageVersion}`,
      head: branchName,
      base: await this.getBranch(),
      body: `This PR updates '${packageName}' to version '${packageVersion}'`,
    });
  }

  private async getBranch(): Promise<string> {
    if (this.options.branch) {
      return this.options.branch;
    }

    const { data } = await this.octokit.rest.repos.get({
      owner: this.options.owner,
      repo: this.options.repo,
    });

    const defaultBranch = data.default_branch;

    if (!defaultBranch) {
      throw new Error(`Default branch not found for repository ${this.fullName}`);
    }

    this.options.branch = defaultBranch;

    return defaultBranch;
  }
}
