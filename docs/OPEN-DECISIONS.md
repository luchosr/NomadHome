# Open Decisions — NomadHome

> **Canonical tracker**: [`openspec/project.md`](../openspec/project.md) §8.
>
> This file is the **docs/-side landing page** for the same information. The full table — with the Owner / Blocks / Deadline / Tiebreaker / Source columns — lives at the canonical location to avoid drift. Use this file when scanning `docs/`; use the canonical table when working a change.

## Why two locations

- `openspec/project.md` §8 is the authoritative table. It lives next to scope boundaries, tech-stack lockdown, and the conflict-resolution hierarchy because every open decision is, by construction, a deferred resolution of one of those things.
- `docs/OPEN-DECISIONS.md` (this file) is the **discoverable entry point**. Someone scanning the `docs/` folder will find it; from here they get pointed at the canonical table and at the `[OPEN]` markers inside individual capability specs.

There is **no duplication of decision rows**. The synopsis below names the decisions; the canonical table holds the actual data.

## Synopsis of currently-open decisions

Three decisions are deferred from the MVP baseline. Each blocks a specific future change-id; each is owned by **Luciano** (product owner) with the tiebreaker defaults proposed in the canonical table. (The access-token TTL decision was resolved to 15 minutes by `add-identity-login`.)

| Decision                                                          | Capability | Blocks change-id |
| ----------------------------------------------------------------- | ---------- | ---------------- |
| Guest service fee % and host commission %                         | `payments` | `add-payments`   |
| Cancellation policy windows and refund tiers                      | `booking`  | `add-booking`    |
| Photo storage backend (Cloudflare R2 vs. S3 vs. Supabase Storage) | `listings` | `add-listings`   |

For owners, deadlines, tiebreaker defaults, and source citations, see [`openspec/project.md` §8](../openspec/project.md).

For the actual deferral marker in the spec, see the `[OPEN]` annotation inside the corresponding `openspec/specs/<capability>/spec.md`.

## Lifecycle

A new open decision is **created** when a change proposal cannot resolve a sub-question inside its own scope. The proposing change MUST update `openspec/project.md` §8 (per §8.2 "Adding a new open decision") and SHOULD update this file's synopsis if the new entry helps `docs/`-side discoverability.

An open decision is **closed** when the first ticket that touches the affected capability resolves it. That ticket:

1. Records the decision and the trade-offs accepted in the change's `design.md` as a short ADR.
2. Replaces the `[OPEN]` marker in the delta `openspec/changes/<change-id>/specs/<capability>/spec.md` with the concrete value.
3. Removes the corresponding row from `openspec/project.md` §8.
4. Removes the corresponding row from this file's synopsis.

All four steps land in the **same PR** so the workspace never enters a state where the marker, the canonical table, and this file disagree.

## What this file is NOT

- **Not a release backlog.** A decision being open does not block the workspace; it blocks the _implementing change_. Other changes proceed freely.
- **Not a product roadmap.** Roadmap concerns live in `docs/PRD.md` §13 (Rollout).
- **Not a tech-debt register.** Tech debt is something we built and want to revisit; open decisions are something we deliberately deferred and have a plan to resolve.

If you find a deferred item that doesn't fit any of the above (e.g. a research question, a vendor evaluation), open a discussion in the relevant change's `design.md` first. If it then warrants tracking, add it to `openspec/project.md` §8 via §8.2.
