const out = require('child_process').execSync('git status', {
  encoding: 'utf8'
})

console.log(out)
