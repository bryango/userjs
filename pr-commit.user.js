// ==UserScript==
// @name        Commit hash for merged PR
// @namespace   Violentmonkey Scripts
// @include     /github\.com\/([\w-]+\/[\w-]+)\/pull\/(\d+)/
// @grant       none
// @version     1.2
// @author      Bryan Go
// @description 10/29/2023, 11:47:39 AM
// ==/UserScript==

(function () {
  'use strict'

  const [, prRepo, prNumber] = document.URL.match(
    /^.*github\.com\/([\w-]+\/[\w-]+)\/pull\/(\d+).*$/
  )

  const prApi = `https://api.github.com/repos/${prRepo}/pulls/${prNumber}`
  const isNixpkgs = document.URL.includes(
    'github.com/NixOS/nixpkgs/pull/'
  )

  const processResponse = json => {
    if (!json.merged) {
      return
    }

    const commitHash = json.merge_commit_sha
    const commitShort = commitHash.slice(0, 7)
    const commitLink = `https://github.com/${prRepo}/commit/${commitHash}`

    const prInfoSelector = '.rgh-conversation-activity-filter-wrapper'
    const prInfoLine = document.querySelector(prInfoSelector)
    prInfoLine.innerHTML +=
      `&ensp;<a href="${commitLink}"><code class="Link--primary text-bold">${commitShort}</code></a>`

    if (!isNixpkgs) {
      return
    }

    const compareLink = `https://github.com/NixOS/nixpkgs/compare/${commitHash}`
    const compareApi = `https://api.github.com/repos/NixOS/nixpkgs/compare/${commitHash}`

    const branches = [
      { name: 'master', id: 'compare-master' },
      { name: 'nixpkgs-unstable', id: 'compare-nixpkgs' },
      { name: 'nixos-unstable', id: 'compare-nixos' }
    ]

    // NOTE: `for...in` is not the right one!
    // must use `for...of` (see mdn).
    for (const branch of branches) {
      prInfoLine.innerHTML +=
        `&ensp;<a href="${compareLink}...${branch.name}" id="${branch.id}"><b>${branch.name}</b></a>`
    }

    const branchIndicate = (success, branchId) => {
      const branchInfo = document.querySelector(`#${branchId}`)
      let indicator = '⚠️ '
      if (success) {
        indicator = '✅ '
      }
      branchInfo.outerHTML = indicator + branchInfo.outerHTML
    }

    const fetchBranchStatus = (branch) => fetch(
      `${compareApi}...${branch.name}?per_page=1`
    )
      .then(async (response) => await response.text())
      .then((text) => JSON.parse(text))
      .then((json) => json.status === 'ahead')
      .then((success) => { branchIndicate(success, branch.id) })
      .catch((e) => { console.log(e) })

    branches.forEach(fetchBranchStatus)
  }

  fetch(prApi)
    .then(async (response) => await response.text())
    .then((text) => JSON.parse(text))
    .then((json) => { processResponse(json) })
    .catch((e) => { console.log(e) })
})()
