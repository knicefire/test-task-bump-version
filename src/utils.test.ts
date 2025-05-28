import { getReleaseBranchName } from './utils';

describe('getReleaseBranchName', () => {
  it('should generate a valid release branch name', () => {
    const mockArgs = {
      packageName: 'my-package',
      packageVersion: '1.0.0',
    };

    const result = getReleaseBranchName(mockArgs);

    expect(result).toBe('release/my-package-1.0.0');
  });

  it('should sanitize invalid characters in package name and version', () => {
    const mockArgs = {
      packageName: 'my@package!',
      packageVersion: '1.0.0-beta',
    };

    const result = getReleaseBranchName(mockArgs);

    expect(result).toBe('release/my-package-1.0.0-beta');
  });
});
