# pstack in dotfiles

The dotfiles repository owns a vendored pstack source, shared principles, separate Claude and Pi adaptations, and a reviewed upstream lock. Updates are opt-in. Checking or staging an update does not change live skills.

## Files

| Path | Purpose |
| --- | --- |
| `pstack.lock.json` | Accepted repository, tracked ref, exact commit, source-content integrity, and file count |
| `reference/pstack/` | Unmodified upstream source at the accepted revision |
| `reference/pstack-source.json` | SHA-256 hash for every vendored source file |
| `pstack/hosts/` | Maintained native skill overrides and agent definitions |
| `scripts/pstack-claude-adapter.mjs` | Claude-only instruction translation |
| `.agents/skills/` | Generated Pi skills and shared principle skills |
| `.claude/skills/` | Generated Claude skills and shared-principle links |
| `.cache/pstack-updates/` | Ignored candidate snapshots and review diffs; safe to remove when not in use |

The lock hashes file contents and paths, not file modes. The manifest and lock are verified before importing or updating. The updater does not use a VCS CLI, create commits, push, run upstream code, or install personal links.

## Check for an update

Run from the dotfiles root with Node.js 22 or later:

```bash
node scripts/update-pstack.mjs check
```

The checker resolves the latest commit that touches `pstack/` on the lock's `ref` (`main` initially). It prints the accepted revision, candidate revision, and GitHub compare URL. Changes to unrelated plugins do not trigger an update.

Exit codes: **0** means current, **1** means a different candidate exists, and **2** means an error. An error is not a successful update check. A different commit can have identical source content, for example after a revert; the staged diff shows actual content changes.

Public GitHub access needs no token. Set `GITHUB_TOKEN` at runtime if API rate limits require authentication. The token is sent only to the GitHub API and is not saved in review files.

## Stage and review

Copy the full candidate SHA from the checker:

```bash
node scripts/update-pstack.mjs stage --revision FULL_COMMIT_SHA
```

`stage` without `--revision` resolves the latest candidate itself. An explicit revision makes the choice stable if upstream moves between checking and staging.

The updater downloads that immutable commit archive and extracts only pstack into:

```text
.cache/pstack-updates/FULL_COMMIT_SHA/
  proposal.json     # Base revision, content integrity, archive hash, changed paths
  upstream.patch    # Unified source diff, including additions and removals
  source/           # Complete candidate source tree
```

Staging requires `tar` and `diff`. Archive paths, links, and special files are checked before extraction. Existing stages are not overwritten. To restage, remove only the relevant candidate directory first.

Read `proposal.json` and `upstream.patch`. Review the following before acceptance:

- Workflow, safeguard, model-default, and tool changes.
- Script changes. A source update is **not** approval to execute bundled scripts.
- Changes masked by native definitions in `pstack/hosts/`. Merge relevant upstream improvements into those definitions explicitly; acceptance never overwrites them.
- Added or removed skills, principles, and files. Generated trees are copy-based, not destructive mirrors: reconcile removed or renamed files explicitly. Do not delete unrelated local skills.
- Claude translation tests and native mappings. New upstream language may need a new adapter rule.

## Accept a reviewed candidate

```bash
node scripts/update-pstack.mjs apply --revision FULL_COMMIT_SHA
```

This updates **only** the vendored source, source manifest, and lock. It does not regenerate skills, change host policies, or write into your home directory. Acceptance requires an explicit staged revision and refuses:

- Source edits that no longer match the accepted lock.
- A stage prepared against another accepted revision or source integrity.
- Candidate source edits made after staging.
- A concurrent acceptance operation.

Ordinary write failures roll back source and metadata. This is not a crash-atomic multi-file transaction. If the process or machine stops during acceptance, inspect `reference/.pstack-update-*` recovery data and the `.pstack-update.lock` directory. Restore a consistent source, manifest, and lock before retrying. Remove a stale writer guard only after confirming no updater is running.

## Adapt, regenerate, and verify

After acceptance, merge relevant changes into host overrides and the Claude adapter. Then run:

```bash
node scripts/import-pstack.mjs
node --test scripts/pstack-source.test.mjs scripts/pstack-claude-adapter.test.mjs
node scripts/check-pstack-port.mjs
jj diff
```

The importer reads the accepted revision from `pstack.lock.json`. It updates shared principles and both host skill trees. It preserves native overrides and local mode contracts/model policies. Regeneration writes into directories already linked into the home configuration, so this is an explicit live-skill change, not a preview. Do not edit generated upstream files as a customization mechanism; use maintained overrides.

Tests intentionally include reviewed workflow/count expectations. If upstream adds a playbook or changes an assumption, inspect it before adjusting the tests. Passing structural checks does not establish live agent dispatch or approve autonomous execution.

New shared principles also need Claude project links. New Claude personal skills need entries in `install.conf.yaml` and reviewed personal links. Removed skills need the reverse cleanup. These installation changes are explicit; the updater does not replace the whole personal skill directory or force links. Pi's existing skill-directory link exposes new generated Pi skills. Do not run the full installer just to accept source changes: it has unrelated operations.

Use Jujutsu to review and record the source, lock, adaptations, generated output, and installation changes together. Do not commit `.cache/pstack-updates/`. The previously accepted snapshot remains recoverable through repository history.

See [the compatibility ledger](../reference/pstack-port.md) for runtime verification status and remaining host-specific work.
