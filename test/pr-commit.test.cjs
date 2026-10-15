/* eslint-env node */
// Optional test tooling: npm install --no-save --package-lock=false jsdom@26.1.0
// Run: node --test test/pr-commit.test.cjs
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const test = require('node:test')
const { setTimeout: sleep } = require('node:timers/promises')
const { JSDOM } = require('jsdom')

const source = readFileSync(join(__dirname, '../src/pr-commit.user.js'), 'utf8')
const hash = '98ba05085ffa8871c2bd1dccebabe27600e98e45'
// Reduced from the header fetched from NixOS/nixpkgs#573623 on 2026-10-15.
const header = '<main><h1 data-component="PH_Title">PR title</h1>' +
  '<div data-component="PageHeader.Description">' +
  '<span data-status="pullMerged">Merged</span>' +
  '<div class="summaryContainer__6Iz7T9"><button>Copy head branch name</button></div>' +
  '</div></main>'
const infoSelector = '#userjs-pr-commit-info'

async function waitFor (predicate) {
  for (let i = 0; i < 200; i++) {
    if (predicate()) return
    await sleep(10)
  }
  assert.fail('Timed out waiting for the userscript')
}

function setup (t, options = {}) {
  const dom = new JSDOM(options.html ?? header, {
    url: options.url || 'https://github.com/NixOS/nixpkgs/pull/573623',
    runScripts: 'outside-only',
  })
  t.after(() => dom.window.close())
  const { window } = dom
  const calls = []
  const errors = []
  window.console.log = window.console.error = (...args) => errors.push(args)
  window.fetch = async (url, init) => {
    calls.push({ url, init })
    const data = options.respond
      ? await options.respond(url)
      : url.includes('/pulls/')
        ? { merged: true, merge_commit_sha: hash }
        : { status: url.includes('nixpkgs-unstable') ? 'behind' : 'ahead' }
    return {
      ok: !data.httpError,
      status: data.httpError || 200,
      json: async () => data,
      text: async () => JSON.stringify(data),
    }
  }
  window.eval(source)
  return {
    window,
    document: window.document,
    calls,
    errors,
    info: () => window.document.querySelector(infoSelector),
    ready: () => waitFor(() => window.document.querySelector(infoSelector)),
  }
}

test('current header: preserves GitHub nodes and shows commit and branch links', async t => {
  const app = setup(t)
  const button = app.document.querySelector('button')
  let clicked = false
  button.addEventListener('click', () => { clicked = true })
  await app.ready()
  assert.equal(app.document.querySelector('button'), button)
  button.click()
  assert.equal(clicked, true)
  assert.equal(app.info().parentElement.dataset.component, 'PageHeader.Description')
  const links = [...app.info().querySelectorAll('a')]
  assert.equal(links[0].textContent, '98ba050')
  assert.equal(links[0].href, 'https://github.com/NixOS/nixpkgs/commit/' + hash)
  assert.deepEqual(links.slice(1).map(link => link.textContent),
    ['✅ staging-next', '✅ master', '⚠️ nixpkgs-unstable'])
  assert.ok(links[3].href.endsWith('/nixpkgs-unstable...' + hash))
  assert.equal(app.calls.length, 4)
  assert.ok(app.calls.every(call => call.init.credentials === 'include'))
})

test('supports the original header selector', async t => {
  const app = setup(t, { html: '<div class="PullRequestHeaderSummary-old"></div>' })
  await app.ready()
  assert.equal(app.document.querySelectorAll(infoSelector).length, 1)
})

test('does not throw when the header is absent', async t => {
  const app = setup(t, { html: '<main></main>' })
  await waitFor(() => app.calls.length === 1)
  await sleep(10)
  assert.equal(app.info(), null)
  assert.equal(app.errors.length, 0)
})

test('retains case-insensitive repository subscriptions', async t => {
  const app = setup(t, { url: 'https://github.com/nixos/nixpkgs/pull/1' })
  await app.ready()
  assert.ok(app.calls[0].url.includes('/repos/NixOS/nixpkgs/'))
  assert.equal(app.calls.length, 4)
})

test('unmerged PRs only show the commit link', async t => {
  const app = setup(t, { respond: () => ({ merged: false, merge_commit_sha: hash }) })
  await app.ready()
  assert.equal(app.info().querySelectorAll('a').length, 1)
  assert.equal(app.calls.length, 1)
})

for (const [status, indicator] of [
  ['ahead', '✅'],
  ['identical', '✅'],
  ['behind', '⚠️'],
  ['diverged', '⚠️'],
]) {
  test('retains branch comparison result ' + status, async t => {
    const app = setup(t, {
      respond: url => url.includes('/pulls/')
        ? { merged: true, merge_commit_sha: hash }
        : { status },
    })
    await app.ready()
    const links = [...app.info().querySelectorAll('a')].slice(1)
    assert.ok(links.every(link => link.textContent.startsWith(indicator)))
    assert.ok(links.every(link => indicator === '✅'
      ? link.href.includes('/compare/' + hash + '...')
      : link.href.endsWith('...' + hash)))
  })
}
