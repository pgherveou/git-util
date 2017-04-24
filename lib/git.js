// @flow

const { spawnSync, execSync } = require('child_process')

function git(command: string) {
  return execSync(`git ${command}`, { encoding: 'utf8' }).trim()
}

// Match the following:
// '+ <commit> <message>'
// '- <commit> <message>'
const cherryRegex = /^([+|-])\s(\S*)\s(.*)$/

module.exports = {
  getCurrentBranch() {
    return git('rev-parse --abbrev-ref HEAD')
  },
  checkout(args: string) {
    return git(`checkout ${args}`)
  },
  branch(args: string) {
    return git(`branch ${args}`)
  },
  cherry(args: string) {
    return git(`cherry ${args}`)
  },
  cherryPick(args: string) {
    return git(`cherry-pick ${args}`)
  },
  checkoutBranch(args: string) {
    return git(`checkout ${args} 2>/dev/null || git checkout -b ${args}`)
  },
  push(name: string) {
    return spawnSync('git', ['push', '--set-upstream', 'origin', name], {
      stdio: 'inherit'
    })
  },
  getCommits(upstream: string, head: string): Commit[] {
    return this.cherry(`-v ${upstream} ${head}`)
      .split('\n')
      .filter(line => cherryRegex.test(line))
      .map(line => {
        const [diff, id, message] = cherryRegex.exec(line).slice(1)
        return { id, message, diff }
      })
  }
}
