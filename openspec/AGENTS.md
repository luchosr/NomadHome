# OpenSpec Agent Instructions — NomadHome

> Read this file **and** `openspec/project.md` **and** [../CLAUDE.md](../CLAUDE.md) at the start of every session. They are the OpenSpec contract for this repo. `CLAUDE.md` is the longer-form Orchestrator playbook; this file is the OpenSpec-specific digest.

## 1. Source of truth, in order

When two documents disagree, the higher-numbered source wins. Always.

1. An approved **OpenSpec delta** in `openspec/changes/<change-id>/specs/<capability>/spec.md` — once archived, it is merged into `openspec/specs/<capability>/spec.md` and becomes the canonical requirement.
2. The **canonical capability spec** in `openspec/specs/<capability>/spec.md` — current shipped behavior.
3. **`openspec/project.md`** — tech stack, conventions, MVP scope boundaries, conflict-resolution rules.
4. **`docs/data-model.md`** — canonical for database schema details that have no spec-level scenario yet.
5. **`docs/PRD.md`** — business context, personas, motivation. Authoritative on *why*, not on *what the system does*.
6. **`CLAUDE.md`** — orchestrator workflow, sub-agent protocol, communication contract.

If you find yourself acting on something from a lower level that contradicts a higher level, stop and update the higher level first.

## 2. The four phases

```
Proposal (the why) ─► Spec-First (the what) ─► Implementation (TDD) ─► Archive
        Gate 1               Gate 2                   Gate 3
```

Every gate requires explicit human approval. No phase advances without it.

| Phase | Required artifact(s) | Validation |
| --- | --- | --- |
| Proposal | `openspec/changes/<change-id>/proposal.md` | Reviewed for fit and scope |
| Spec | `openspec/changes/<change-id>/specs/<capability>/spec.md` + `tasks.md` (+ optional `design.md`) | `openspec validate <change-id> --strict` passes |
| Implementation | Code + tests in feature worktree, tasks ticked in `tasks.md` | `pnpm lint && pnpm typecheck && pnpm test && pnpm build` all green |
| Archive | Move via `openspec archive <change-id> --yes` after PR merges | `openspec validate --specs --strict` passes after archive |

## 3. Delta operation grammar

In `openspec/changes/<change-id>/specs/<capability>/spec.md`, use exactly these top-level headers:

- `## ADDED Requirements` — new requirements introduced by this change
- `## MODIFIED Requirements` — copy the **entire** existing requirement block from `openspec/specs/<capability>/spec.md` and edit it in place; partial copies silently lose detail on archive
- `## REMOVED Requirements` — include `**Reason**:` and `**Migration**:` lines
- `## RENAMED Requirements` — `FROM:` / `TO:` pairs

Inside each:

- `### Requirement: <name>` — one descriptive sentence using `SHALL` / `MUST`, optionally followed by more narrative paragraphs
- `#### Scenario: <name>` — exactly four hash marks; three will silently pass parsing but produce no scenario
- Each scenario uses `**GIVEN**`, `**WHEN**`, `**THEN**`, `**AND**` bullets
- Every requirement MUST have at least one scenario

## 4. Workflow commands

| Command | When |
| --- | --- |
| `openspec new change <id>` | Scaffold a change directory after Gate 1 |
| `openspec instructions <artifact> --change <id>` | Get the template for `proposal`, `tasks`, `specs`, or `design` |
| `openspec validate <id> --strict` | Before requesting Gate 2 |
| `openspec validate --specs --strict` | After archive, to confirm the canonical specs still parse |
| `openspec show <id>` | Human-readable view of a pending change |
| `openspec list --specs` | What capabilities currently exist |
| `openspec archive <id> --yes` | After PR merges to `main` |

## 5. Bright-line rules

- ❌ Do not write to `openspec/specs/<capability>/spec.md` by hand. The archive step is what materializes those files; doing it manually breaks the change-id provenance chain.
- ❌ Do not propose features listed under "Out of MVP" in `openspec/project.md` §3. They need explicit scope promotion first. Before opening any PR that touches `openspec/changes/`, run `node scripts/check-mvp-scope.mjs` — it blocks ❌ Never terms and warns on ⏸ Post-MVP terms. CI / Husky wiring lands later, but the script is runnable today.
- ❌ Do not skip the Gate handshakes documented in `CLAUDE.md` §9 — even for "small" changes that already have a proposal.
- ✅ Do append `[OPEN]` markers inside scenarios when a downstream decision is required (TTLs, percentages, naming conventions). Track them as follow-up tasks in `tasks.md` §5.
- ✅ Do keep changes atomic — one capability area or one cross-cutting concern per change. Do not bundle "add booking" + "add payments" into one proposal.
