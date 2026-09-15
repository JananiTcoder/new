#!/usr/bin/env node
// Lightweight documentation-drift check.
//
// This is intentionally NOT a full JSX parser and does not try to understand
// UI behavior. It only catches the cheap, common ways PROJECT_REPORT.md goes
// stale: a route added to src/App.jsx but never written into the report, a
// removed-feature phrase left behind, or the deployment URLs going missing.
//
// It reads route paths straight out of src/App.jsx by regex. That file's
// current shape is: two root-level <Route path="..."> entries, then one
// nested <Route path="/app"> block containing every other <Route path="...">
// as a child. If that nesting structure changes, update EXPECTED_ROOT_PATHS
// and the nesting assumption below accordingly — this script trades
// generality for being simple enough to trust.
//
// Usage: node scripts/check-documentation.mjs

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const APP_JSX = join(ROOT, 'src', 'App.jsx')
const REPORT_MD = join(ROOT, 'PROJECT_REPORT.md')

const PRODUCTION_URL = 'https://geosentra.vercel.app'
const GITHUB_URL = 'https://github.com/JananiTcoder/geosentra'

// Root-level routes that are NOT nested under /app. '/app' itself is included
// here because it appears twice in App.jsx: once as the parent layout
// route's own path="/app", and once implicitly via the index route — both
// resolve to the same full path, not a child of itself.
const ROOT_LEVEL_PATH_ATTRS = new Set(['/', '/role-select', '/app'])

// Phrases that describe features which have been deliberately removed from
// the app. If any of these literal strings still appear in the report, the
// report is describing something that no longer exists.
const REMOVED_FEATURE_PHRASES = [
  'Total Monitored Habitations',
  'Active Hazard Warnings',
  'Most Exposed Habitations',
  'Relocation Plan Summary — All Habitations',
  'Bottleneck dimension',
]

let failures = 0
let warnings = 0

function fail(msg) {
  console.error(`✗ ${msg}`)
  failures++
}
function warn(msg) {
  console.warn(`! ${msg}`)
  warnings++
}
function pass(msg) {
  console.log(`✓ ${msg}`)
}

if (!existsSync(APP_JSX)) {
  fail(`Cannot find ${APP_JSX} — has the routing file moved?`)
  process.exit(1)
}
if (!existsSync(REPORT_MD)) {
  fail(`Cannot find ${REPORT_MD} — PROJECT_REPORT.md must exist at the repo root.`)
  process.exit(1)
}

const appSource = readFileSync(APP_JSX, 'utf8')
const reportSource = readFileSync(REPORT_MD, 'utf8')

// Extract every `path="..."` attribute value from App.jsx, in file order.
const pathMatches = [...appSource.matchAll(/<Route\s+(?:index\s+)?path="([^"]*)"/g)].map((m) => m[1])
// Also catch the index route (`<Route index element=...>` has no path attr —
// it inherits the parent's path, i.e. "/app" itself).
const hasIndexRoute = /<Route\s+index\s+element=/.test(appSource)

if (pathMatches.length === 0) {
  fail('No <Route path="..."> entries found in src/App.jsx — regex may need updating for a refactor.')
  process.exit(1)
}

// Build full paths using this file's current (root, then one nested /app
// block) structure.
const fullPaths = []
if (hasIndexRoute) fullPaths.push('/app')
for (const p of pathMatches) {
  if (p === '*') continue // catch-all, not a documentable page
  if (ROOT_LEVEL_PATH_ATTRS.has(`/${p}`) || ROOT_LEVEL_PATH_ATTRS.has(p)) {
    fullPaths.push(p.startsWith('/') ? p : `/${p}`)
  } else {
    fullPaths.push(`/app/${p}`)
  }
}

console.log(`Found ${fullPaths.length} routes in src/App.jsx:\n  ${fullPaths.join('\n  ')}\n`)

for (const route of fullPaths) {
  if (reportSource.includes(route)) {
    pass(`Route documented: ${route}`)
  } else {
    fail(`Route NOT found in PROJECT_REPORT.md: ${route}`)
  }
}

// A bare string match can't tell "this describes a feature as currently
// present" from "this is an honest historical note that it was removed" —
// the report is expected to carry a few of the latter (see Section B/D
// "Not present (removed): ..."). So a hit only fails the check if none of a
// small set of qualifying words appear within the preceding ~160 characters;
// otherwise it's treated as a deliberate, already-qualified historical note.
const REMOVAL_QUALIFIERS = ['removed', 'Not present', 'no longer', 'used to']
for (const phrase of REMOVED_FEATURE_PHRASES) {
  let idx = reportSource.indexOf(phrase)
  let staleHits = 0
  while (idx !== -1) {
    const context = reportSource.slice(Math.max(0, idx - 160), idx)
    const isQualified = REMOVAL_QUALIFIERS.some((q) => context.toLowerCase().includes(q.toLowerCase()))
    if (!isQualified) staleHits++
    idx = reportSource.indexOf(phrase, idx + 1)
  }
  if (staleHits > 0) {
    fail(`PROJECT_REPORT.md mentions a removed feature without noting its removal: "${phrase}"`)
  } else {
    pass(`No unqualified mention of removed feature: "${phrase}"`)
  }
}

if (reportSource.includes(PRODUCTION_URL)) {
  pass(`Production URL present: ${PRODUCTION_URL}`)
} else {
  fail(`Production URL missing from PROJECT_REPORT.md: ${PRODUCTION_URL}`)
}

if (reportSource.includes(GITHUB_URL)) {
  pass(`GitHub repository URL present: ${GITHUB_URL}`)
} else {
  fail(`GitHub repository URL missing from PROJECT_REPORT.md: ${GITHUB_URL}`)
}

// Soft check: every page component under src/pages should be named
// somewhere in the report. This can false-positive on a component that is
// intentionally not a route (rare), hence a warning, not a failure.
const pagesDir = join(ROOT, 'src', 'pages')
if (existsSync(pagesDir)) {
  const { readdirSync } = await import('node:fs')
  const pageFiles = readdirSync(pagesDir).filter((f) => f.endsWith('.jsx'))
  for (const file of pageFiles) {
    const componentName = file.replace(/\.jsx$/, '')
    if (!reportSource.includes(componentName)) {
      warn(`Page component "${componentName}" (src/pages/${file}) is not mentioned by name in PROJECT_REPORT.md.`)
    }
  }
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${failures} failing check(s), ${warnings} warning(s).`)
process.exit(failures === 0 ? 0 : 1)
