# prify

> Break down each individual commits from a branch into individual Pull requests

## Install

```bash
npm instal -g prify
```

## Usage
prify break down each individual commits from a branch individual Pull requests. This let you create simpler pull requests that people can review. 

Here is a typical workflow, when working on large feature

### 1/ Create a functional branch.

This will be the only branch where you add commits. `prify` will take care of cherry-picking commits from this branch into individual `commits branches`. 

```bash
git checkout -b "important-stuff"
```

### 2/ Append a bunch of commits

```bash
git commit -a -m "add abc"
git commit -a -m "add xyz"
```

### 3/ Cleanup commits
Eventually if things get messy during devloment make a soft reset to reorganise your branch into a list of `reviewable` commits.

```bash
git reset --soft <merge-base>
git commit ...
```

### 3/ pullrequestify
Execute prify.

```bash
prify
```

This will 
- Create a feature branch `feature-important-stuff`
- Create a branch foreach commit `important-stuff-1-of-n`, `important-stuff-2-of-n`, ...
- Open your browser so you can edit each pull request using `feature-important-stuff` as the base branch.

### 4/ Address PR-reviews
Once you start getting some reviews, you can simply use fixup to fix your commits, and execute prify again to update your `commits branches`

```bash
git commit --fixup <commit 1>
git commit --fixup <commit 2>
prify
```

This will 
- Cherry pick fixup into your `commits branches`
- Open previously created pull-request in your browser.

## License

[MIT](http://vjpr.mit-license.org)