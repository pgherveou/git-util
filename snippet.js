const out = require('child_process').execSync('git checkout example', {
  encoding: 'utf8',
  stdio: 'pipe'
})

// console.log(out)
