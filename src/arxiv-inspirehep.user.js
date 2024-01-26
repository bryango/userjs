// ==UserScript==
// @name         arXiv with inspirehep
// @namespace    Violentmonkey Scripts
// @match        https://arxiv.org/abs/*
// @version      0.5
// @author       Bryan Lai <bryanlais@gmail.com>
// @grant        GM.setClipboard
// @grant        GM.xmlHttpRequest
// ==/UserScript==

/* global GM */
(function () {
  'use strict'

  // capture <Enter> to open PDF
  document.addEventListener('keyup', event => {
    if (event.key === 'Enter') {
      // cancel the default action, if needed
      event.preventDefault()

      // trigger new action
      const pdfButton = document.getElementsByClassName('download-pdf')[0]
      pdfButton.target = '_blank'
      pdfButton.click()
    }
  })

  // copy authors
  const authors = document.querySelector('div.authors')
  if (authors) {
    // first, send full names to clipboard
    GM.setClipboard(`[${authors.innerText}]`)

    // then, send last names to clipboard as well
    const surnames =
      Array
        .from(authors.querySelectorAll('a'))
        .map(
          author => author.innerText.split(' ').at(-1)
        )
    GM.setClipboard(`[${surnames.join(', ')}]`)
  };

  // inspirehep citations overview
  const refCiteElement = document.getElementsByClassName('extra-ref-cite')[0]
  const inspirehepUrl =
    Array
      .from(refCiteElement.getElementsByTagName('a'))
      .filter(x => x.href.includes('inspirehep'))[0].href
      .replace(
        'https://inspirehep.net/arxiv',
        'https://inspirehep.net/api/arxiv'
      )

  // cross origin request to inspirehep
  GM.xmlHttpRequest({
    method: 'GET',
    url: inspirehepUrl,
    onload: function (response) {
      // console.log(inspirehepUrl);
      // console.log(response);
      const cites = JSON.parse(response.responseText).metadata.citation_count
      // console.log("### inspirehep citations:", cites);
      refCiteElement.children[0].innerHTML +=
        `<span style="color: #b31b1b; font-weight: bold;"> ${cites} </span>`
    }
  })
})()
