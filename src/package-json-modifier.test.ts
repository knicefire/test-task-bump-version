import { PackageJsonModifier } from './package-json-modifier';
import { ContentResponseData } from './types';

describe('PackageJsonModifier', () => {
  const mockFile: ContentResponseData = {
    type: 'file',
    encoding: 'base64',
    size: 123,
    name: 'package.json',
    path: 'path/to/package.json',
    content: Buffer.from(
      JSON.stringify({
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          'test-dependency': '1.0.0',
        },
        devDependencies: {
          'test-dev-dependency': '1.0.0',
        },
        peerDependencies: {
          'test-peer-dependency': '1.0.0',
        },
      })
    ).toString('base64'),
    sha: 'mock-sha',
    url: 'mock-url',
    git_url: null,
    html_url: null,
    download_url: null,
    _links: {
      self: 'mock-self-link',
      git: 'mock-git-link',
      html: 'mock-html-link',
    },
  };

  let modifier: PackageJsonModifier;

  beforeEach(() => {
    modifier = new PackageJsonModifier(mockFile);
  });

  it('should initialize with the correct package.json content', () => {
    expect(modifier.isModified).toBe(false);
  });

  it('should update dependencies correctly', () => {
    modifier.updateDependency({ packageName: 'test-dependency', packageVersion: '2.0.0' }, [
      'dependencies',
    ]);
    expect(modifier.isModified).toBe(true);
  });

  it('should update devDependencies correctly', () => {
    modifier.updateDependency(
      { packageName: 'test-dev-dependency', packageVersion: '2.0.0' },
      'devDependencies'
    );
    expect(modifier.isModified).toBe(true);
  });

  it('should update peerDependencies correctly', () => {
    modifier.updateDependency(
      { packageName: 'test-peer-dependency', packageVersion: '2.0.0' },
      'peerDependencies'
    );
    expect(modifier.isModified).toBe(true);
  });

  it('should update multiple dependency types correctly', () => {
    modifier.updateDependency({ packageName: 'test-dependency', packageVersion: '2.0.0' }, [
      'dependencies',
      'peerDependencies',
    ]);
    expect(modifier.isModified).toBe(true);

    const base64Content = modifier.toBase64();
    const decodedContent = JSON.parse(Buffer.from(base64Content, 'base64').toString('utf-8'));
    expect(decodedContent.dependencies['test-dependency']).toBe('2.0.0');
    expect(decodedContent.peerDependencies['test-dependency']).toBeUndefined();
  });

  it('should not update if the version is the same', () => {
    modifier.updateDependency(
      { packageName: 'test-dependency', packageVersion: '1.0.0' },
      'dependencies'
    );
    expect(modifier.isModified).toBe(false);
  });

  it('should convert package.json to base64 correctly', () => {
    modifier.updateDependency(
      { packageName: 'test-dependency', packageVersion: '2.0.0' },
      'dependencies'
    );
    const base64Content = modifier.toBase64();
    const decodedContent = JSON.parse(Buffer.from(base64Content, 'base64').toString('utf-8'));
    expect(decodedContent.dependencies['test-dependency']).toBe('2.0.0');
  });
});
