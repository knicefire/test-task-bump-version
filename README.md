# test-task-bump-version

An implementation of a script that bumps the version in a GitHub repository's `package.json` file and creates a pull request.

## Installing Dependencies

Run the following command to install the required dependencies:

```bash
npm install
```

## Requirements

### Variables

- **GITHUB_TOKEN**: A GitHub personal access token with the following scopes:
  - **Contents**: Read and Write
  - **Pull requests**: Read and Write
  - **Metadata**: Read-only

Set the token in your environment:

```bash
export GITHUB_TOKEN=<your-github-token>
```

### Node.js Version

Ensure you are using Node.js version `22.14.0` as specified in the `.node-version` file.

## Usage

To run the script, use the following command:

```bash
npm start -- --owner <repo-owner> --repo <repo-name> --packageName <package-name> --packageVersion <new-version>
```

### Example

```bash
npm start -- --owner my-org --repo my-repo --packageName my-package --packageVersion 1.2.3
```

This will:

1. Locate the `package.json` file containing the specified package.
2. Update the package version in package.json dependency properties .
3. Create a new branch for the update.
4. Push the changes to the branch.
5. Create a pull request for the version bump.

## Features

- Automatically updates all possible dependency reference in package.json.
- Creates a sanitized branch name for the release.
- Logs detailed information about the process.
- Handles multiple `package.json` files in the repository. Warns if there is more than one.
- Capable of finding `package.json` in nested directory tree.

## Ideas for Future Improvements

- Provide options for automatic version bumping to the latest major/minor/patch version.
- Support passing dependency type that needs to be considered
- Support parsing repo and owner from GitHub URLs.
- Implement dry-run capability to preview changes without making them.
- Support repositories with multiple `package.json` files.
- Support multiple dependency updates in one pull request
