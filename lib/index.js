//  @flow

const { exec } = require('child_process')
const gitRemoteOriginUrl = require('git-remote-origin-url')
const git = require('./git')
const github = require('./github-agent')

// Open a URL in the browser
const open = (url: string) => exec(`open ${url}`)

/*!
 * Start script
 */

async function start() {
  const srcBranchName = git.getCurrentBranch()

  const repo = await gitRemoteOriginUrl().then(url =>
    url.replace('.git', '').replace('git@github.com:', '')
  )

  // Get list of commits from current branch where we want to create an associated branch
  const commits = git
    .getCommits('master', srcBranchName)
    .filter(commit => !commit.message.startsWith('fixup!'))

  // Get Github user
  const user: User = await github.getUser()

  // Setup feature branch
  const featureBranchName = `feature-${srcBranchName}`
  git.checkout('master')
  git.checkoutBranch(featureBranchName)
  git.push(featureBranchName)

  // Iterate over commits
  /* eslint-disable no-await-in-loop */
  for (const [index, commit] of commits.entries()) {
    // Setup branch for commit
    const commitBranchName = `${featureBranchName}-${index + 1}-of-${commits.length}`
    git.checkoutBranch(commitBranchName)

    const commitsToCherryPick = git
      .getCommits(commitBranchName, srcBranchName)
      .filter(c => c.message.includes(commit.message) && c.diff === '+')

    // Cherry pick commit into commit branch if necessary
    for (const commit of commitsToCherryPick) {
      git.cherryPick(commit.id)
    }

    // Push commits
    git.push(commitBranchName)

    // Open pull request
    const pullRequestURL = await github.getPullRequestURL(
      user,
      repo,
      featureBranchName,
      commitBranchName
    )
    open(pullRequestURL)

    // Checkout feature branch
    git.checkout(featureBranchName)
  }

  git.checkout(srcBranchName)
}

start()
