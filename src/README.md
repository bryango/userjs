# Hey there!
- Click on the `*.user.js` file to examine its code
- Click on the <kbd>Raw</kbd> button at the top of the code view for the raw text

If you have something like [violentmonkey](https://violentmonkey.github.io/) (recommended) already installed,
then <kbd>Raw</kbd> will be redirected to the installation page for the script. Enjoy!

## [`arxiv-inspirehep.user.js`](arxiv-inspirehep.user.js)

![Note the "5636" below "References & Citations"](https://github.com/bryango/userjs/assets/26322692/ea1bd111-d9cc-4ac4-b6aa-9353d90a0318)

- work on https://arxiv.org/abs pages
- <kbd>Enter</kbd> to open the PDF output
- always automatically copy author names to the system clipboard
- display citation numbers from https://inspirehep.net

## [`pr-commit.user.js`](pr-commit.user.js)

![Note the commit and branch info in the PR headline](https://github.com/bryango/userjs/assets/26322692/9ca52c3b-a69e-445d-b9d6-e5abf2ebe3d5)

- work for merged pull requests on github
- display merged commit SHA on the very top

More over, for PRs under NixOS/nixpkgs,
- display selected branch info about the merged commit
- basically, reimplement https://nixpk.gs/pr-tracker.html with github API
