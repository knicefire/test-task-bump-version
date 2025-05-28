import { createMock } from '@golevelup/ts-jest';
import { Octokit } from 'octokit';
import { GitHubRepository } from './github';
import { ContentResponseData } from './types';

describe('GitHubRepository', () => {
  let githubRepo: GitHubRepository;
  let mockOctokit: Octokit;

  beforeEach(() => {
    mockOctokit = createMock<Octokit>();
    githubRepo = new GitHubRepository({ owner: 'test-owner', repo: 'test-repo' }, mockOctokit);
  });

  it('should return the full name of the repository', () => {
    expect(githubRepo.fullName).toBe('test-owner/test-repo');
  });

  it('should find the package.json file in the repository', async () => {
    mockOctokit.rest.search.code.mockResolvedValue({
      data: {
        incomplete_results: false,
        total_count: 1,
        items: [{ path: 'path/to/package.json' }],
      },
    });

    const result = await githubRepo.findPackageJsonFile('test-package');
    expect(result).toBe('path/to/package.json');
  });

  it('should fetch the content of the package.json file', async () => {
    mockOctokit.rest.repos.getContent.mockResolvedValue({
      data: {
        type: 'file',
        encoding: 'base64',
        content: 'eyJrZXkiOiAidmFsdWUifQ==',
      },
    });

    const result = await githubRepo.getPackageJson('path/to/package.json');
    expect(result).toEqual({
      type: 'file',
      encoding: 'base64',
      content: 'eyJrZXkiOiAidmFsdWUifQ==',
    });
  });

  it('should commit the updated package.json file', async () => {
    mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({});
    const file = {
      path: 'path/to/package.json',
      content: 'eyJrZXkiOiAidmFsdWUifQ==',
      sha: 'mock-sha',
    } as ContentResponseData;

    await expect(
      githubRepo.commitPackageJsonUpdate({
        packageName: 'test-package',
        packageVersion: '1.0.0',
        branchName: 'test-branch',
        file,
      })
    ).resolves.not.toThrow();

    expect(mockOctokit.rest.repos.createOrUpdateFileContents).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        message: expect.stringContaining('chore: bump test-package to 1.0.0'),
        path: file.path,
        content: file.content,
        sha: file.sha,
        branch: 'test-branch',
      })
    );
  });

  it('should create a release branch', async () => {
    mockOctokit.rest.git.getRef.mockResolvedValue({
      data: { object: { sha: 'mock-sha' } },
    });
    mockOctokit.rest.git.createRef.mockResolvedValue({});

    await expect(githubRepo.createReleaseBranch('release-branch')).resolves.not.toThrow();
  });

  it('should create a release pull request', async () => {
    mockOctokit.rest.pulls.create.mockResolvedValue({});
    mockOctokit.rest.repos.get = jest.fn().mockResolvedValue({
      data: { default_branch: 'main' },
    });

    await expect(
      githubRepo.createReleasePullRequest({
        branchName: 'release-branch',
        packageName: 'test-package',
        packageVersion: '1.0.0',
      })
    ).resolves.not.toThrow();

    expect(mockOctokit.rest.pulls.create).toHaveBeenCalledWith({
      owner: 'test-owner',
      repo: 'test-repo',
      title: `Update test-package to 1.0.0`,
      head: 'release-branch',
      base: 'main',
      body: `This PR updates 'test-package' to version '1.0.0'`,
    });
  });
});
