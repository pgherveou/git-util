This repo provides commands to break down a big PR into child PRs while still working from a single branch.

## Install

```bash
npm install -g @pgherveou/git-util
```

## Prerequisites

- A gitub token with repo perimissions stored into `GITHUB_TOKEN` environment variable

### 1 generate-pull-requests

This command does the following:

- Create a feature branch `feature-important-stuff`
- Create child branchs for each commit that is not a fixup! e.g `important-stuff-1-of-n`, `important-stuff-2-of-n`
- Cherry pick fixup commits to their associated child branch
- Open your browser so you can edit each pull request using `feature-important-stuff` as the base branch.

### fixup-staged-files

This command create a fixup commit for each staged file.
You can re-run `generate-pull-requests` after that so that each modification get push to the child branch
