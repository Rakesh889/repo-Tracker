const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const REPOS_FILE = path.join(DATA_DIR, 'repos.json');

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readRepos() {
  try {
    return JSON.parse(fs.readFileSync(REPOS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

/** Writes via a temp file + rename so a process kill mid-write can't corrupt the JSON. */
function writeRepos(repos) {
  ensureDataDir();
  const tmpFile = `${REPOS_FILE}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(repos, null, 2));
  fs.renameSync(tmpFile, REPOS_FILE);
}

function addRepo(repo) {
  const repos = readRepos();
  repos.unshift(repo);
  writeRepos(repos);
  return repo;
}

function removeRepo(id) {
  const repos = readRepos();
  const repo = repos.find(r => r.id === id);
  writeRepos(repos.filter(r => r.id !== id));
  return repo;
}

function updateRepo(id, patch) {
  const repos = readRepos();
  const updated = repos.map(r => r.id === id ? { ...r, ...patch } : r);
  writeRepos(updated);
  return updated.find(r => r.id === id);
}

function findByFullName(fullName) {
  return readRepos().find(r => r.fullName.toLowerCase() === fullName.toLowerCase());
}

module.exports = { readRepos, addRepo, removeRepo, updateRepo, findByFullName };
