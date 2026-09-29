# tools — how this repository checks itself

Everything here runs on plain Node (no dependencies, no install step) and is meant to be run by
whoever is reading the repository, not just by its author.

| Tool | What it proves | Runs on a fresh clone |
|---|---|---|
| `verify-progress.mjs` | the CSV still rolls up to the numbers the dashboard shows, and Power BI's pre-multiplied weight columns agree with the page's own multiplication | ✅ yes |
| `validate-json.mjs` | the hand-written Power BI project (PBIR + TMDL) parses, the custom theme is wired and shaped correctly, and `*.pbip` / `definition.pbir` paths resolve | ✅ yes |
| `check-page.mjs` | `preview/index.html` still has exactly one `<script>` block and it parses as JavaScript | ✅ yes |
| `anonymize-data.mjs` | turns a **real** export into the publishable one (see NOTICE.md) | needs your data + your rules |
| `leak-check.mjs` | the identifiers of the real project appear nowhere in the tree, binaries included | needs your denylist |
| `lib.mjs` | not a tool — the shared CSV reader and the progress maths the two tools above stand on | — |

```bash
# the three gates a reviewer can run immediately
node tools/verify-progress.mjs --expect "42.1,57.3,-15.1" --leaves 226 --milestones 19 --critical 14
node tools/validate-json.mjs
node tools/check-page.mjs
```

All three run in CI on every push (`.github/workflows/checks.yml`), so their output is visible in
the repository's *Actions* tab rather than taken on trust.

## The machine-local half

`anonymize-data.mjs` and `leak-check.mjs` are the two tools whose *input* is sensitive: the rules
that spell out a real project's vocabulary, the rename map they produce, and the list of words to
hunt for. Those therefore live next to the machine that owns the data, not in the repository:

| File (all gitignored via `tools/*.local.*`) | Purpose |
|---|---|
| `anonymize-rules.local.json` | the match/replace pairs and the forbidden tokens — the real vocabulary |
| `name-map.local.json` | the audit map of every rename, written by `anonymize-data.mjs` |
| `leak-denylist.local.txt` | the identifiers `leak-check.mjs` must never find |
| `leak-allow.local.txt` | the leftovers consciously accepted and disclosed (see NOTICE.md) |

`*.example.*` files are the committed templates for all four. Without them,
`anonymize-data.mjs` and `leak-check.mjs` stop with instructions instead of guessing — the
denylist *is* the sensitive part, so a tool that shrugged and scanned for nothing would be
worse than one that refuses to run.

`leak-check.mjs` reads each file as UTF-8 **and** as UTF-16LE and includes the compiled
launcher `.exe` files, because a string can hide in a binary; screenshots it cannot read, so those
are verified by eye.
