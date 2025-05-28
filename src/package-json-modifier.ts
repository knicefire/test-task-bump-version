import { ContentResponseData } from './types';

type PackageJson = Record<string, any> & {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export class PackageJsonModifier {
  private packageJson: PackageJson;
  private isUpdated: boolean = false;

  public get isModified(): boolean {
    return this.isUpdated;
  }

  constructor(file: ContentResponseData) {
    const decodedContent = Buffer.from(file.content, file.encoding as BufferEncoding).toString(
      'utf-8'
    );

    this.packageJson = JSON.parse(decodedContent);
  }

  public updateDependency(
    {
      packageName,
      packageVersion,
    }: {
      packageName: string;
      packageVersion: string;
    },
    dependencyType: 'dependencies' | 'devDependencies' | 'all' = 'all'
  ): void {
    const dependencyProps =
      dependencyType == 'all' ? ['dependencies', 'devDependencies'] : [dependencyType];

    // Modifying dependencies only if package is defined and version is different
    dependencyProps.forEach((prop) => {
      if (
        this.packageJson[prop]?.[packageName] &&
        this.packageJson[prop][packageName] !== packageVersion
      ) {
        this.isUpdated = true;
        this.packageJson[prop][packageName] = packageVersion;
      }
    });
  }

  public toBase64(): string {
    return Buffer.from(JSON.stringify(this.packageJson, null, 2), 'utf-8').toString('base64');
  }
}
