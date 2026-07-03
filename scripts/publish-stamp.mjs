// Stamp reviewedAt = today on merged entries and bind each plugin id to its
// GitHub owner on first registration. Called by publish.yml with the changed
// registry/plugins/*.json paths as arguments.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const today = process.env.TODAY || new Date().toISOString().slice(0, 10)
const files = process.argv.slice(2).filter((f) => f && existsSync(f))
if (!files.length) { console.log('no entry files changed; nothing to stamp'); process.exit(0) }

const owners = existsSync('OWNERS.json')
  ? JSON.parse(readFileSync('OWNERS.json', 'utf8'))
  : { plugins: {} }
owners.plugins ||= {}

for (const file of files) {
  const entry = JSON.parse(readFileSync(file, 'utf8'))
  const owner = entry.repo.split('/')[0]
  // Bind owner on first registration; never silently rewrite an existing binding.
  if (!owners.plugins[entry.id]) {
    owners.plugins[entry.id] = { boundOwner: owner, repo: entry.repo, firstReviewedAt: today }
  }
  entry.reviewedAt = today
  entry.boundOwner = owners.plugins[entry.id].boundOwner
  writeFileSync(file, JSON.stringify(entry, null, 2) + '\n')
  console.log('stamped', entry.id, '->', today)
}

writeFileSync('OWNERS.json', JSON.stringify(owners, null, 2) + '\n')
