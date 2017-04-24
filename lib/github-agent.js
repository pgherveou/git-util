// @flow

const request = require('superagent')

function get(path: string) {
  let req = request.get(`https://api.github.com${path}`)

  if (process.env.GITHUB_TOKEN) {
    req = req.set('Authorization', `token ${process.env.GITHUB_TOKEN}`)
  } else {
    console.warn(
      'Please set GITHUB_TOKEN environment variable so we can make authenticated API call to github.',
      'Visit https://github.com/settings/tokens to learn more'
    )
  }

  return req.then(res => res.body)
}

module.exports = {
  async getUser(): Promise<User> {
    return get('/user')
  },
  async getPullRequestURL(
    user: User,
    repo: string,
    base: string,
    head: string
  ): Promise<string> {
    const pullrequests = await get(
      `/repos/${repo}/pulls?head=${user.login}:${head}`
    )
    return pullrequests.length
      ? pullrequests[0].html_url
      : `https://github.com/${repo}/compare/${base}...${head}?expand=1`
  }
}
