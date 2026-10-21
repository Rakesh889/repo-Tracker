# Repo Tracker

Save GitHub repos you want to keep an eye on — stars, forks, language, and license pulled live from GitHub's API.

## Features

- Add a repo by pasting a URL, `owner/repo`, or just a keyword (falls back to a GitHub search so you can pick from real results)
- Tag repos, filter by tag, search, and sort (recently added, most stars, recently updated, name)
- Cards or compact table view
- Per-repo refresh, or "Refresh All" to pull the latest stats for everything at once

## Running locally

```bash
npm install
npm start
```

Then open http://localhost:3700 (override with a `PORT` env var).

## How it works

`server.js` is an Express app backed by a JSON file store (`data/repos.json`, gitignored) with atomic writes. All repo metadata comes from GitHub's public REST API — no authentication required, but subject to GitHub's unauthenticated rate limit (60 requests/hour).

## License

MIT
