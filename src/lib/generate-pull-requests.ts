import { exec } from 'child_process'
import gitRemoteOriginUrl from 'git-remote-origin-url'
import { gitCommands as git } from './git'
import { githubAgent as github } from './github-agent'

// Open a URL in the browser
const openInBrowser = (url: string) => exec(`open ${url}`)

/*!
 * Start script
 */

async function start() {
  const srcBranchName = git.getCurrentBranch()

  const repo = await gitRemoteOriginUrl().then((url: string) =>
    url.replace('.git', '').replace('git@github.com:', '')
  )
  console.debug({ repo })

  // Get list of commits from current branch where we want to create an associated branch
  const commits = git
    .getCommits('master', srcBranchName)
    .filter(commit => !commit.message.startsWith('fixup!'))
  console.debug({ commits })

  // Get Github user
  const user = await github.getUser()
  console.debug({ user })

  // Setup feature branch
  const featureBranchName = `feature-${srcBranchName}`
  git.checkout('master')
  git.checkoutBranch(featureBranchName)
  git.push(featureBranchName)
  console.debug({ featureBranchName })

  // Iterate over commits
  for (const [index, commit] of commits.entries()) {
    // Setup branch for commit
    const commitBranchName = `${featureBranchName}-${index + 1}-of-${
      commits.length
    }`
    git.checkoutBranch(commitBranchName)
    console.debug({ commitBranchName })

    const commitsToCherryPick = git
      .getCommits(commitBranchName, srcBranchName)
      .filter(c => c.message.includes(commit.message) && c.diff === '+')
    console.debug({ commitsToCherryPick })

    // Cherry pick commit into commit branch if necessary
    for (const commit of commitsToCherryPick) {
      git.cherryPick(commit.id)
    }

    // Push commits
    git.push(commitBranchName)

    // Open pull request
    try {
      const pullRequestURL = await github.getPullRequestURL(
        user,
        repo,
        featureBranchName,
        commitBranchName
      )
      console.debug(pullRequestURL)
      openInBrowser(pullRequestURL)
    } catch (err) {
      console.warn('Failed to create Github PR')
    }

    // Checkout feature branch
    git.checkout(featureBranchName)
  }

  git.checkout(srcBranchName)
}

// execute the script
;(async () => {
  try {
    await start()
  } catch (err) {
    console.error(err)
  }
})()
