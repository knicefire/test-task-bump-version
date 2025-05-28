import { components } from '@octokit/openapi-types';

export type ContentResponseData = components['schemas']['content-file'];

export type PackageUpdateArgs = {
  packageName: string;
  packageVersion: string;
};
