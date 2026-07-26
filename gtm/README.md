# GTM Container Exports

Export of container `GTM-NHRCHKWS` (Admin → Export Container), committed after
each publish.

- `container-export.json` — always the **latest published version**.

## Versioning convention

The file name carries no version number. Git already versions this file: the
history of `container-export.json` *is* the history of the container. Adding
`_v6`, `_v7`, `_v8` suffixes would duplicate that history in the file tree and
make diffs impossible — you can't diff two files that never share a path.

The container version number lives in the **commit message** instead:

```
chore(gtm): export container v7 — disable phantom GA4 Event tag (Bug #6)
```

To see how the container changed between publishes:

```bash
git log --oneline -- gtm/container-export.json
git diff <commit-a> <commit-b> -- gtm/container-export.json
```

The container configuration is treated as code: it lives in version control
alongside the site that hosts it.
