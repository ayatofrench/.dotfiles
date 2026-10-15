---
name: fluid-timesheets
description: Estimates and enters AMN Fluid timesheet hours from prior-week rows and Pi session evidence. Use when asked to fill, reconstruct, copy, save, or submit Fluid timesheets for Harqen Support & Sustain and AI Credentialing Application - Greenlight.
compatibility: Requires Chrome CDP on port 9222, an authenticated Fluid tab, Python 3.9+, and local Pi sessions.
---

# Fluid Timesheets

Build a defensible daily timesheet proposal, review it with the user, then apply it through the browser-backed Fluid SDK without UI control.

## Safety rules

- Treat Pi activity as allocation evidence, not literal payroll duration.
- Never fabricate PTO, holidays, company meetings, or administrative time. Copy those only as a proposed assumption and verify them with the user or another source.
- Never overwrite a non-empty or non-Open sheet without explicit approval.
- Saving a draft and submitting for approval are separate actions.
- Always show the proposed rows and daily totals before any write.
- Save only after the user says to apply/save. Submit only when the user explicitly says to submit for approval.

## Setup

Chrome should already expose the authenticated Fluid tab on `:9222`; do not launch a new profile when it is available. Read [SDK usage](references/sdk.md). Use the `web-browser` skill only for investigation or SDK troubleshooting; routine work must use:

```bash
SKILL=~/.agents/skills/fluid-timesheets
$SKILL/scripts/fluid-timesheet.mjs inspect
```

Read [Fluid controls and API](references/fluid-controls-and-api.md) only when the API/page model changes.

## Workflow

### 1. Inspect without changing anything

Run SDK `inspect` with `--tab N` when needed. Verify:

- Host is `amnhealthcare.fluid.work`
- Page is a Timesheet Edit page
- Visible week range, owner, status, existing entries, and daily totals

If the sheet has saved or unsaved hours, report them and ask before replacing anything.

### 2. Collect prior-week structure

Run SDK `previous`. Capture:

- Project and non-project row names
- Activity/type-of-work
- Day values and weekly totals
- Project IDs/external references

Use prior entries as a row/activity template and fallback ratio—not proof that the same leave, holiday, or meeting happened again.

Expected mapping:

| Pi work | Fluid project | Typical activity |
|---|---|---|
| `work/va/voice-advantage` | Harqen Support & Sustain (10087) | Support & Maintenance |
| `work/catalyst` and its worktrees | AI Credentialing Application - Greenlight (10176) | Copied activity, usually Build Test and Deploy |

For Greenlight, use Requirements and Design when session content is predominantly planning/design. Use Build Test and Deploy for implementation, tests, CI, and releases. Do not choose an unavailable activity.

### 3. Estimate daily project mix

Run:

```bash
./scripts/analyze_pi_work.py --start YYYY-MM-DD --end YYYY-MM-DD
```

Dates are the Fluid Monday-Friday range. The analyzer:

- Reads Pi JSONL session events
- Classifies Voice Advantage as Harqen and Catalyst as Greenlight
- Caps idle gaps at 15 minutes
- Merges same-project overlap from parallel agents
- Reports daily and weekly percentages

Ignore unrelated project directories. Mention that unrecorded meetings/manual work may not appear in Pi.

### 4. Build the proposal

For each weekday:

1. Treat 8 hours as a floor, not a target.
2. Use the analyzer's cross-project `union_minutes` as project-work duration evidence; round supported project time to the nearest 0.5 hour without double-counting parallel agents.
3. Add verified non-project hours (for example recurring meetings) to evidenced project time, then apply the 8-hour daily floor to the combined total.
4. Split project hours using that day's Pi ratio.
5. If a day has no Pi evidence, use the weekly Pi ratio; if the whole week has none, use the prior week's project ratio.
6. Round to Fluid's 0.5-hour increments while preserving the daily total. Assign rounding remainder to the larger share.
7. Do not add weekend time unless requested and evidenced.

Show a table with each row, activity, Mon-Fri hours, daily totals, weekly totals, Pi percentages, and all assumptions. Flag days with weak/no evidence.

### 5. Apply only after approval

After the user approves the proposal:

1. Write the reviewed project rows to a temporary plan JSON using the format in [SDK usage](references/sdk.md).
2. Run SDK `preview PLAN.json`; do not use `--replace` unless replacement was approved.
3. Verify every weekday total and each activity against the reviewed table.
4. Run SDK `save PLAN.json --commit` only if the user authorized saving.
5. Run SDK `inspect` again and report persisted values/status.

The SDK invokes Fluid's own page validators before calling the Save API. If validation fails, report it; never bypass validation.

### 6. Submit only on explicit instruction

**Submit For Approval** is consequential. Require a separate explicit instruction containing “submit” or equivalent after the saved draft has been verified. Then run SDK `submit --confirm-submit` and inspect/report the resulting status. If overtime is present, stop for explicit confirmation because the SDK does not reproduce the UI overtime prompt.
