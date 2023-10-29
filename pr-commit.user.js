// ==UserScript==
// @name        Commit hash for merged PR
// @namespace   Violentmonkey Scripts
// @include     /github\.com\/([\w-]+\/[\w-]+)\/pull\/(\d+)/
// @grant       none
// @version     1.0
// @author      Bryan Go
// @description 10/29/2023, 11:47:39 AM
// ==/UserScript==

(function () {
  'use strict'

  const [, prRepo, prNumber] = document.URL.match(
    /^.*github\.com\/([\w-]+\/[\w-]+)\/pull\/(\d+).*$/
  )

  const apiLink = `https://api.github.com/repos/${prRepo}/pulls/${prNumber}`
  const isNixpkgs = document.URL.includes(
    'github.com/NixOS/nixpkgs/pull'
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

    if (isNixpkgs) {
      const compareLink = `https://github.com/NixOS/nixpkgs/compare/${commitHash}`
      const compareApi = `https://api.github.com/repos/NixOS/nixpkgs/compare/${commitHash}`
      const withMaster = `${compareApi}...master`
      const withNixpkgs = `${compareApi}...nixpkgs-unstable`
      const withNixos = `${compareApi}...nixos-unstable`

      const masterId = 'compare-master'
      const nixpkgsId = 'compare-nixpkgs'
      const nixosId = 'compare-nixos'
      prInfoLine.innerHTML +=
        `&ensp;<a href="${compareLink}...master" id="${masterId}"><b>master</b></a>`
      prInfoLine.innerHTML +=
        `&ensp;<a href="${compareLink}...nixpkgs-unstable" id="${nixpkgsId}"><b>nixpkgs-unstable</b></a>`
      prInfoLine.innerHTML +=
        `&ensp;<a href="${compareLink}...nixos-unstable" id="${nixosId}"><b>nixos-unstable</b></a>`

      const branchIndicate = (success, idSelector) => {
        const indicator = document.querySelector(`#${idSelector}`)
        if (success) {
          indicator.outerHTML = '✅ ' + indicator.outerHTML
        } else {
          indicator.outerHTML = '⚠️ ' + indicator.outerHTML
        }
      }

      const fetchBranchStatus = (link, idSelector) => fetch(`${link}?per_page=1`)
        .then(async (response) => await response.text())
        .then((text) => JSON.parse(text))
        .then((json) => json.status === 'ahead')
        .then((success) => { branchIndicate(success, idSelector) })
        .catch((e) => { console.log(e) })

      fetchBranchStatus(withMaster, masterId)
      fetchBranchStatus(withNixpkgs, nixpkgsId)
      fetchBranchStatus(withNixos, nixosId)
    }
  }

  fetch(apiLink)
    .then(async (response) => await response.text())
    .then((text) => JSON.parse(text))
    .then((json) => { processResponse(json) })
    .catch((e) => { console.log(e) })
})()
