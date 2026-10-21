require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const path = require('path');
const { parseFullName, fetchRepoMetadata, searchRepos } = require('./lib/github');
const { readRepos, addRepo, removeRepo, updateRepo, findByFullName } = require('./lib/store');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/repos', (req, res) => {
  res.json(readRepos());
});

app.get('/api/github-search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Enter a search term' });

  try {
    res.json(await searchRepos(q));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/repos', async (req, res) => {
  const { input, tags } = req.body;
  if (!input || !input.trim()) return res.status(400).json({ error: 'Enter a GitHub repo URL or owner/repo' });

  const fullName = parseFullName(input);
  if (!fullName) return res.status(400).json({ error: 'Could not parse a GitHub repo from that input' });

  if (findByFullName(fullName)) return res.status(409).json({ error: `${fullName} is already saved` });

  try {
    const meta = await fetchRepoMetadata(fullName);
    const repo = addRepo({
      id: crypto.randomUUID(),
      ...meta,
      tags: (tags || '').split(',').map(t => t.trim()).filter(Boolean),
      addedAt: new Date().toISOString()
    });
    res.json(repo);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/repos/:id/refresh', async (req, res) => {
  const repos = readRepos();
  const repo = repos.find(r => r.id === req.params.id);
  if (!repo) return res.status(404).json({ error: 'Repo not found' });

  try {
    const meta = await fetchRepoMetadata(repo.fullName);
    res.json(updateRepo(repo.id, meta));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/repos/refresh-all', async (req, res) => {
  const repos = readRepos();
  let refreshed = 0;
  const failed = [];

  for (const repo of repos) {
    try {
      const meta = await fetchRepoMetadata(repo.fullName);
      updateRepo(repo.id, meta);
      refreshed++;
    } catch (e) {
      failed.push({ fullName: repo.fullName, error: e.message });
      if (/rate limit/i.test(e.message)) break; // no point continuing past this point
    }
  }

  res.json({ total: repos.length, refreshed, failed });
});

app.delete('/api/repos/:id', (req, res) => {
  const repo = removeRepo(req.params.id);
  if (!repo) return res.status(404).json({ error: 'Repo not found' });
  res.json({ deleted: true });
});

const PORT = process.env.PORT || 3700;
app.listen(PORT, () => {
  console.log(`Repo tracker running at http://localhost:${PORT}`);
});
