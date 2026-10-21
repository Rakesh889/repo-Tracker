/** Accepts a full GitHub URL or an "owner/repo" shorthand and returns "owner/repo", or null if unparseable. */
function parseFullName(input) {
  const trimmed = input.trim().replace(/\.git$/, '').replace(/\/$/, '');

  const urlMatch = trimmed.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (urlMatch) return `${urlMatch[1]}/${urlMatch[2]}`;

  const shorthandMatch = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (shorthandMatch) return `${shorthandMatch[1]}/${shorthandMatch[2]}`;

  return null;
}

/** Fetches public repo metadata from the GitHub REST API (unauthenticated — fine for occasional personal use). */
async function fetchRepoMetadata(fullName) {
  const res = await fetch(`https://api.github.com/repos/${fullName}`, {
    headers: { Accept: 'application/vnd.github+json' }
  });

  if (res.status === 404) throw new Error(`Repository "${fullName}" not found`);
  if (res.status === 403) throw new Error('GitHub API rate limit reached — try again later');
  if (!res.ok) throw new Error(`GitHub API error (${res.status})`);

  const data = await res.json();
  return {
    fullName: data.full_name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    language: data.language,
    url: data.html_url,
    openIssues: data.open_issues_count,
    updatedAt: data.updated_at,
    license: data.license?.spdx_id || null
  };
}

/** Searches public repos by keyword, for the "search to add" flow — returns lightweight summaries, not full metadata. */
async function searchRepos(query) {
  const res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`, {
    headers: { Accept: 'application/vnd.github+json' }
  });

  if (res.status === 403) throw new Error('GitHub API rate limit reached — try again later');
  if (!res.ok) throw new Error(`GitHub API error (${res.status})`);

  const data = await res.json();
  return data.items.map(item => ({
    fullName: item.full_name,
    description: item.description,
    stars: item.stargazers_count,
    language: item.language,
    url: item.html_url
  }));
}

module.exports = { parseFullName, fetchRepoMetadata, searchRepos };
