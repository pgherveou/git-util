import { gitCommands as git } from './git'

const firstSha = git.mergeBase(git.getCurrentBranch(), 'master')

const filesBySha = git.getStagedFilesBySha()

const branchShas = new Set(git.getShas(firstSha))

console.debug({ filesBySha })

git.resetToHead()

Object.entries(filesBySha)
  .filter(([sha]) => branchShas.has(sha))
  .forEach(([sha, files]) => {
    files.forEach(file => git.add(file))
    git.fixup(sha)
  })
