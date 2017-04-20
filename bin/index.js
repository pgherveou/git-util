#!/usr/bin/env node

const { exec, spawnSync, execSync } = require('child_process')
const gitRemoteOriginUrl = require('git-remote-origin-url')
const request = require('superagent')

/// Ensure GITHUB_TOKEN exists
if (!process.env.GITHUB_TOKEN) {
  console.warn(
    'Please setup a GITHUB_TOKEN environment variable so we can make authenticated API call to github.',
    'Visit https://github.com/settings/tokens to learn more'
  )
}

/**
 * execute a git command
 */
function git(command) {
  return execSync(`git ${command}`, { encoding: 'utf8' }).trim()
}

/// Get Repository URL
getRepositoryPath = gitRemoteOriginUrl().then(url =>
  url.replace('.git', '').replace('git@github.com:', '')
)

/**
 * Open a url in the browser
 * 
 * @param {String} url 
 */
const open = url => exec(`open ${url}`)

/// Get github user
const getUser = request
  .get('https://api.github.com/user')
  .set('Authorization', `token ${process.env.GITHUB_TOKEN}`)
  .then(res => res.body)

/**
 * Open or create pull request url
 * 
 * @param {String} head head git node 
 * @param {String} base base git node
 */
async function openPullRequestURL(base, head) {
  const user = await getUser

  // get existing pull requests
  const repo = await getRepositoryPath
  const url = `https://api.github.com/repos/${repo}/pulls?head=${user.login}:${head}`

  const pullrequests = await request
    .get(url)
    .set('Authorization', `token ${process.env.GITHUB_TOKEN}`)
    .then(res => res.body)

  // open existing PR
  if (pullrequests.length) {
    return open(pullrequests[0].html_url)
  }

  open(`https://github.com/${repo}/compare/${base}...${head}?expand=1`)
}

/**
 * get current branch
 */
const getCurrentBranchName = () => git('rev-parse --abbrev-ref HEAD')

/**
 * git checkout
 * 
 * @param {string} args command argument
 */
const checkout = args => git(`checkout ${args}`)

/**
 * git branch
 * 
 * @param {string} args command argument
 */
const branch = args => git(`branch ${args}`)

/**
 * git cherry
 * 
 * @param {string} args command argument
 */
const cherry = args => git(`cherry ${args}`)

/**
 * git cherry-pick
 * 
 * @param {string} args command argument
 */
const cherryPick = args => git(`cherry-pick ${args}`)

/**
 * create if needed and checkout branch
 * 
 * @param {string} args command argument
 */
const checkoutBranch = args =>
  git(`checkout ${args} 2>/dev/null || git checkout -b ${args}`)

/**
 * git push
 * 
 * @param {string} args command argument
 */
const push = name =>
  spawnSync('git', ['push', '--set-upstream', 'origin', name], {
    stdio: 'inherit'
  })

// match
// + <commit> <message>
const cherryRegex = /^([+|-])\s(\S*)\s(.*)$/

/**
 * get commits in branch 
 * 
 * @param {string} upstream upstream node
 * @param {string} head head node
 */
const getCommits = (upstream, head) =>
  cherry(`-v ${upstream} ${head}`)
    .split('\n')
    .filter(line => cherryRegex.test(line))
    .map(line => {
      const [_, diff, id, message] = cherryRegex.exec(line)
      return { id, message, diff }
    })

/*!
 * Start script
 */

async function start() {
  // get current branch name
  const srcBranchName = await getCurrentBranchName()

  // get list of commits from current branch where we want to create an associated branch
  const commits = getCommits('master', srcBranchName).filter(
    commit => !commit.message.startsWith('fixup!')
  )

  // setup feature branch
  const featureBranchName = `feature-${srcBranchName}`
  checkout('master')
  checkoutBranch(featureBranchName)
  push(featureBranchName)

  // iterate over commits
  for (let [index, commit] of commits.entries()) {
    // setup branch for commit
    const commitBranchName = `${featureBranchName}-${index + 1}-of-${commits.length}`
    checkoutBranch(commitBranchName)

    const commitsToCherryPick = getCommits(
      commitBranchName,
      srcBranchName
    ).filter(c => c.message.includes(commit.message) && c.diff == '+')

    // cherry pick commit into commit branch if necessary
    for (let commit of commitsToCherryPick) {
      cherryPick(commit.id)
    }

    // push commits
    push(commitBranchName)

    // open pull request
    await openPullRequestURL(featureBranchName, commitBranchName)

    // checkout feature branch
    await checkout(featureBranchName)
  }

  checkout(srcBranchName)
}

start()
