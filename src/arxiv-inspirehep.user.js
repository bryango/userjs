// ==UserScript==
// @name         arXiv with inspirehep
// @namespace    http://tampermonkey.net/
// @version      0.4
// @author       Bryan
// @match        https://arxiv.org/abs/*
// @grant        GM.setClipboard
// @grant        GM.xmlHttpRequest
// ==/UserScript==

(function() {
  'use strict';

  // capture keyup
  document.addEventListener("keyup", function(event) {
      // <Enter> key
      if (event.keyCode === 13) {
          // cancel the default action, if needed
          event.preventDefault();
          // trigger new action: open PDF
          let pdf_button = document.getElementsByClassName("download-pdf")[0];
          pdf_button.target = "_blank";
          pdf_button.click();
      }
  });

  // copy authors
  let authors = document.querySelector("div.authors");
  if (authors) {
      GM.setClipboard(
          "[" + authors.innerText + "]"
      );
      // abbreviated
      authors = Array.from(authors.querySelectorAll("a"));
      GM.setClipboard(
          "["
          + authors.map(
              author => author.innerText.split(' ').at(-1)
          ).join(", ")
          + "]"
      );
  };


  // function waitExec(trigger_func, func, marker) {
  //     if (trigger_func() == "EXIT") {
  //         return;
  //     }
  //     if (typeof trigger_func() !== "undefined" && trigger_func() !== null && trigger_func() != '') {
  //         func();
  //     } else {
  //         console.log('Waiting for:', marker, '/ now:', trigger_func());
  //         setTimeout(function() {
  //             waitExec(trigger_func, func, marker);
  //         }, 200);
  //     }
  // }

  function getTarget() {
      return document.getElementsByClassName("extra-ref-cite")[0];
  }

  // waitExec(
  //     getTarget,
  //     function () {

          let links = Array.from(document.getElementsByClassName("extra-ref-cite")[0].getElementsByTagName("a"));
          let inspirehep_url = links.filter(x => x.href.includes("inspirehep"))[0].href;

          // New API
          inspirehep_url = inspirehep_url.replace(
              "https://inspirehep.net/arxiv",
              "https://inspirehep.net/api/arxiv"
          );

          let req = GM.xmlHttpRequest({
            method: "GET",
            url: inspirehep_url,
            onload: function(response) {
                // console.log(inspirehep_url);
                // console.log(response);
                var cites = JSON.parse(response.responseText).metadata.citation_count;
                // console.log("### inspirehep citations:", cites);
                getTarget().children[0].innerHTML
                    += '<span style="color: #b31b1b; font-weight: bold;"> {'
                    + cites
                    + "} </span>";
            }
          });

  //     },
  //     "citations div"
  // );

})();
