# Fluid Timesheet SDK

The SDK attaches to an authenticated Fluid Chrome tab through CDP, then calls Fluid APIs directly from the page's authenticated origin. It does not click or manipulate visible controls.

## Why browser-backed authentication

Fluid's API requires a bearer token decoded from `Fluid.WebApi.KentorAuthServices.Auth` plus `path`, `Fluid.Session.ID`, `Fluid.User`, and `X-Requested-With` headers. A plain unauthenticated fetch returns 403. The SDK reads session context from the authenticated page without printing tokens.

## CLI

```bash
SKILL=~/.agents/skills/fluid-timesheets

$SKILL/scripts/fluid-timesheet.mjs inspect
$SKILL/scripts/fluid-timesheet.mjs previous
$SKILL/scripts/fluid-timesheet.mjs open-week 2026-07-20
$SKILL/scripts/fluid-timesheet.mjs ensure-misc 592 --apply
$SKILL/scripts/fluid-timesheet.mjs preview /tmp/plan.json
$SKILL/scripts/fluid-timesheet.mjs save /tmp/plan.json --commit # saves draft after preview
$SKILL/scripts/fluid-timesheet.mjs submit --confirm-submit      # consequential
```

Use `--tab N` to select among Fluid page targets and `--replace` only after the user approves replacing existing hours.

## Plan format

```json
{
  "weekStart": 1783296000000,
  "rows": [
    {
      "projectId": 1125,
      "project": "Harqen Support & Sustain",
      "activity": "Support & Maintenance",
      "days": [3, 3.5, 4.5, 5, 5]
    },
    {
      "projectId": 1274,
      "project": "AI Credentialing Application - Greenlight",
      "activity": "Build Test and Deploy",
      "days": [5, 4.5, 3.5, 3, 3]
    }
  ]
}
```

`days` means Monday-Friday. Values must be in half-hour increments. Committed rows require stable `projectId` values. Preview refuses a mismatched week, non-open sheet, unknown or duplicate row, accidental replacement, or a weekday total below eight hours.

## Library

```js
import { FluidTimesheetSdk } from "./sdk/fluid-timesheet-sdk.mjs";

const sdk = await FluidTimesheetSdk.connect({ tab: 1 });
try {
  const sheet = await sdk.inspect();
  const previous = await sdk.previousEntries();
  const preview = await sdk.previewPlan(plan);
  const saved = await sdk.saveDraft(plan, { commit: true });
} finally {
  sdk.close();
}
```

Methods:

- `inspect()` — full current page model and totals
- `previousEntries()` — `GET /api/Timesheet/GetPreviousWeekEntries`
- `openWeek("YYYY-MM-DD")` — navigate the authenticated tab to a Monday timesheet
- `ensureMiscRow(taskId, { apply })` — add an allowed non-project row before saving
- `previewPlan(plan, options)` — local guarded preview; no writes
- `saveDraft(plan, { commit, replace })` — runs Fluid's page validators, then `POST /api/Timesheet/Save`
- `submit({ confirm })` — runs submit validators, then `POST /api/Timesheet/Submit`

The SDK never persists or logs authentication values. Chrome must remain open and authenticated because Fluid controls session lifetime.
