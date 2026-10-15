---
name: pstack-swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for /pstack-swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
disable-model-invocation: true
---

Read [the claude execution contract](../poteto-mode/HARNESS.md) before following this skill. It replaces incompatible upstream execution instructions below.

# Swarm

Fan out N parallel native Claude Code agents. They may cover separate slices, race the same brief, or mix both. The parent waits, aggregates, and returns one report.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Set N from the user or derive it from the shape. N is total workers, not the cloud concurrency limit.
4. Resolve `swarm workers` through the host MODELS.md policy and CLAUDE-NATIVE.md execution reference. Dispatch through the native Agent tool. Preserve panel seat counts and the single cross-judge selection. Select a native agent profile that applies both the configured model and effort. Missing assignments, unsupported effort, or unavailable profiles are blocked; never silently use a source default, another family, or the parent model.
5. Give each worker its own writable output when it writes. When workers verify or measure commits, each brief names the exact SHAs. A measurement brief also names the method (sample count, what one sample is, order). The worker records both in its result.

## Phase B: Fan out

Spawn N workers with the native Agent tool, one brief per worker, using reviewed role-specific profiles and background execution when supported. This is local execution; do not send environment or cloud-base parameters. Assign separate Jujutsu workspaces before writable concurrent tasks and pass each workspace path explicitly.

When a worker needs a different base revision, prepare and verify its Jujutsu workspace at that revision before dispatch. Do not assume a native Git-worktree option supports Jujutsu.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that can prove a defect reports `ISSUES` and lists every issue it can prove, not only the first.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. Drop a result that does not record the SHAs and method its brief names, and respawn that worker once. After a second miss, record a gap. A gap does not count as a pass. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

Keep a compact result table, one-line evidenced issues, and explicit gaps or dropouts.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.
