# Welcome to Alore Login as a Service

## Licensing

By contributing to alore-js, you agree to release your contribution under
the terms of the license. Except for the `examples` and the
dependencies directories in any folder of this repo, like `package.json` for example.
All code is released under the LGPL v2.

The bundled dependencies in this repo are governed
by the following licenses:

- MIT license
- APACHE license v2
- APACHE license v3
- LESSER GENERAL PUBLIC LICENSE v2 (LGPL)
- LESSER GENERAL PUBLIC LICENSE v3 (LGPL)

## Support

If you want to request a feature or contact us for any other reason, contact us in support@bealore.com

## Contributing Code and Releasing New Versions

This project uses [Changesets](https://github.com/changesets/changesets) to manage releases. The workflow is designed to be simple for contributors while providing robust automation for maintainers.

When you contribute code that you believe should trigger a new version of a package, you must include a changeset file in your pull request.

### Your Contribution Workflow

1.  **Make Your Code Changes**: Edit the code in the package(s) as you normally would, using clear, [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) messages. These messages will be used to automatically generate the changelog.

2.  **Run the Changeset Command**: Before committing, run the following command from the project root:

    ```sh
    pnpm changeset
    ```

3.  **Follow the Prompts**:

    - The tool will ask you to select which packages need a version bump. Use the arrow keys and spacebar to select all affected packages.
    - For each package, you'll choose whether the change is a `major`, `minor`, or `patch` release.
    - You will be asked for a summary. Since our changelogs are generated from commit messages, you only need to enter a minimal summary (e.g., a single dot `.`) and hit enter.

4.  **Commit the Changeset File**: A new markdown file will be generated in the `.changeset` directory. Add this file to your commit.

### The Release Process (for Maintainers)

Once a pull request with a changeset is merged into `main`, a GitHub Action automatically creates a new "Version Packages" pull request. This PR contains the version bumps and the generated changelogs. Merging this PR will publish the packages to npm.

## Reporting Bugs

Bug reports can be done with an issue, a pull request, or contacting us at support@bealore.com

If you're not running against the latest `main` branch version,
please compile and test against that to avoid re-reporting an issue that's
already been fixed.

It's _incredibly_ helpful to be able to reproduce the problem. Please
include a list of steps, a bit of code, and/or a zipped repository (if
possible).
