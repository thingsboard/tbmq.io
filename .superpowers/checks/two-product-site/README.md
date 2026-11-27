# Browser checks for the two-product site work

Temporary: kept on this branch so the header, the docs picker, the TBMQ Lite product page and the installations hub
can be re-checked while the change is under review. **Remove this folder before the branch merges.** The folder is
git-ignored (`.superpowers/`); these files were added with `git add -f`.

The checks drive headless Chrome (`/usr/bin/google-chrome`) through `puppeteer-core` against a running dev server.

```bash
# once
cd .superpowers/checks/two-product-site && npm install && cd -

# a dev server for this branch, on the port the checks expect (override with BASE=http://host:port)
pnpm dev --port 4331

node .superpowers/checks/two-product-site/docs.mjs                              # docs picker, sidebars, pagination
node .superpowers/checks/two-product-site/pages.mjs product-lite installations  # the two pages
node .superpowers/checks/two-product-site/header.mjs menu bar sheet dialog      # the header, part by part (a few minutes)
```

Each script prints `ok …` / `FAIL …` lines and exits non-zero on a failure.

- `header.mjs` and `docs.mjs` take `SHOT=<dir>` to also save shots of the open panels, the menu sheet, the dialog and the picker.
- `pages.mjs` takes `BANNED_TEXT=<regex>` to also assert that neither page's text matches it.
- `shots.mjs <outDir> <width,width,…> <path>…` takes full-page screenshots (`DARK=1`, `SCROLL=<px>`).
- `crop.py`, `compare.py`, `diffrows.py` cut regions out of shots and compare two shot folders (need Pillow).
- `base-format.sh <file>…` tells whether a file was already off Prettier's style on the base branch.

Restart the dev server after a change to `astro.sidebar.ts` or `astro.config.ts`, and after adding a page whose share
card you want to look at.
