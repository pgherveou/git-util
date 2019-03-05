import { spawnSync, execSync } from 'child_process'

// Match the following:
// '+ <commit> <message>'
// '- <commit> <message>'
const cherryRegex = /^([+|-])\s(\S*)\s(.*)$/

export type Commit = { id: string; message: string; diff: '+' | '-' }

function git(command: string) {
  console.debug({ command })

  if (process.env.SIMULATE) {
    return ''
  }

  return execSync(`git ${command}`, { encoding: 'utf8' }).trim()
}

export const gitCommands = {
  // Read commands
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
  checkoutBranch(args: string) {
    return git(`checkout ${args} 2>/dev/null || git checkout -b ${args}`)
  },
  getCommits(upstream: string, head: string): Array<Commit> {
    return this.cherry(`-v ${upstream} ${head}`)
      .split('\n')
      .filter((line: string) => cherryRegex.test(line))
      .map((line: string) => {
        const [diff, id, message] = cherryRegex.exec(line)!.slice(1)
        return { id, message, diff } as Commit
      })
  },

  // Write commands
  cherryPick(args: string) {
    return git(`cherry-pick ${args}`)
  },
  push(name: string) {
    return spawnSync('git', ['push', '--set-upstream', 'origin', name], {
      stdio: 'inherit'
    })
  }
}
