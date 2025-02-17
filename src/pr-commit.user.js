// ==UserScript==
// @name        Info for merged pull requests
// @namespace   Violentmonkey Scripts
// @include     /github\.com\/([\w-]+\/[\w-]+)\/pull\/(\d+).*$/
// @grant       none
// @version     1.9
// @author      Bryan Lai <bryanlais@gmail.com>
// @description 10/29/2023, 11:47:39 AM
// ==/UserScript==

(function () {
  'use strict'

  /**
   * Configure repo branches to watch for the merge commit.
   */
  const subscribedRepos = {

    // e.g. this would only show up under github.com/NixOS/nixpkgs/pull/
    'NixOS/nixpkgs': [
      'staging-next',
      'master',
      'nixpkgs-unstable',
    ],

  }

  /**
   * Parse the URL of repo and pull request ID.
   * @type {string[]}
   */
  const [, prRepoURL, prNumber] = document.URL.match(
    /^.*github\.com\/([\w-]+\/[\w-]+)\/pull\/(\d+).*$/
  )

  /**
   * Normalize the repo name if it has been subscribed.
   * @param {string} prRepoURL
   * @returns {string}
   */
  const normalizeRepoName = prRepoURL => {
    const localesUndefined = undefined
    for (const prRepo in subscribedRepos) {
      if (prRepo.localeCompare(prRepoURL, localesUndefined, { sensitivity: 'accent' }) === 0) {
        return prRepo
      }
    }
    return prRepoURL
  }

  const prRepo = normalizeRepoName(prRepoURL)
  const prApi = `https://api.github.com/repos/${prRepo}/pulls/${prNumber}`

  const processResponse = json => {
    // surprise: even unmerged commit will have a `merge_commit_sha`
    // this can be used to test the pr before it's merged
    const commitHash = json.merge_commit_sha
    const commitShort = commitHash.slice(0, 7)
    const commitLink = `https://github.com/${prRepo}/commit/${commitHash}`

    const prInfoSelector = '.gh-header-meta div:last-child'
    const prInfoLine = document.querySelector(prInfoSelector)
    prInfoLine.innerHTML +=
      `&ensp;<a href="${commitLink}"><code class="Link--primary text-bold">${commitShort}</code></a>`

    if (!(json.merged && prRepo in subscribedRepos)) {
      return
    }

    const compareLink = `https://github.com/${prRepo}/compare`
    const compareApi = `https://api.github.com/repos/${prRepo}/compare/${commitHash}`

    const subscribedBranches = subscribedRepos[prRepo]
    const branches = subscribedBranches.map(branchName => {
      return {
        name: branchName,
        id: `compare-${branchName}`,
        // ^ used internally to identify the element and decorate it
      }
    })

    // javascript trap: `for...in` is not the right one!
    // must use `for...of` (see mdn).
    for (const branch of branches) {
      prInfoLine.innerHTML +=
        `&ensp;<a href="${compareLink}/${commitHash}...${branch.name}" id="${branch.id}"><b>${branch.name}</b></a>`
    }

    const branchIndicate = (success, branch) => {
      const branchInfo = document.querySelector(`#${branch.id}`)
      let indicator = '⚠️ '
      if (success) {
        indicator = '✅ '
      } else {
        // swap the comparison to show how far behind the branch is
        branchInfo.href = `${compareLink}/${branch.name}...${commitHash}`
      }
      branchInfo.outerHTML = indicator + branchInfo.outerHTML
    }

    const fetchBranchStatus = (branch) => fetch(
      `${compareApi}...${branch.name}?per_page=1000000&page=100`
      // this trick uses pagination to not return files or commits
      // only need to know whether 'ahead' or 'behind'
    )
      .then(async (response) => await response.text())
      .then((text) => JSON.parse(text))
      .then((json) => json.status === 'ahead' || json.status === 'identical')
      .then((success) => { branchIndicate(success, branch) })
      .catch((e) => { console.log(e) })

    branches.forEach(fetchBranchStatus)
  }

  fetch(prApi)
    .then(async (response) => await response.text())
    .then((text) => JSON.parse(text))
    .then((json) => { processResponse(json) })
    .catch((e) => { console.log(e) })
})()
