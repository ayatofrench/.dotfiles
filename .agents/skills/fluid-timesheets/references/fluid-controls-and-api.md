# Fluid Timesheet Controls and API

Observed on `amnhealthcare.fluid.work` in July 2026. Fluid uses Knockout, Kendo dropdowns, and jQuery AJAX.

## Page model

Run browser commands from the `web-browser` skill directory. The active timesheet model is:

```js
const vm = ko.dataFor(document.querySelector("#mysheetEditDiv"));
const sheet = vm.EditItem();
```

Useful observables:

- `sheet.StartDay`, `sheet.EndDay`, `sheet.EntryPrincipal().ID`
- `sheet.Status()`, `sheet.Entries()`
- Entry: `TaskName`, `Activity`, `Day1` through `Day7`, `Note`, `IsMiscTask`
- `vm.Day1Total()` through `vm.Day7Total()`, `vm.WeekTotal()`

Use `ko.unwrap` because mapped properties can be observables. Day values are decimal-hour strings in 0.5-hour increments, e.g. `"2.50"`.

## Controls

- **Copy From Previous Week** calls `vm.addEntriesFromPreviousWeek()` and opens a Bootbox confirmation.
- Confirm with `.bootbox [data-bb-handler=success]`; cancel with `[data-bb-handler=main]`.
- **Save Draft** calls `vm.PostForm()` -> `vm.saveTimesheet(false)`.
- **Submit For Approval** calls `vm.SubmitTimesheet()` and is a separate, consequential action.
- Previous/next week arrows call `vm.CloseTimesheet(vm.PrevWeek())` / `vm.CloseTimesheet(vm.NextWeek())` and may prompt to save dirty changes.

Prefer the visible controls for writes. Use model/API inspection for reads.

## Endpoints

The page's configured jQuery AJAX carries authentication/anti-forgery behavior that plain `fetch` may lack.

### Read previous week's entries

```js
new Promise((resolve) => $.ajax({
  url: "/api/Timesheet/GetPreviousWeekEntries",
  data: {
    weekStart: vm.EditItem().StartDay,
    principalId: vm.EditItem().EntryPrincipal().ID,
  },
  dataType: "json",
  type: "GET",
  contentType: "application/json; charset=utf-8",
  success: resolve,
  error: (xhr, status, error) => resolve({ status: xhr.status, error }),
}))
```

### Save draft

`POST /api/Timesheet/Save` with `ko.toJS(vm.EditItem())`. Use `vm.PostForm()` instead of posting directly because the model validates activities, subprojects, allocations, and daily limits first.

### Submit

`POST /api/Timesheet/Submit` with a cleaned JSON model. Use the visible Submit control only after explicit user approval.

## Snapshot entries

```js
vm.EditItem().Entries().map((entry) => {
  const task = ko.unwrap(entry.TaskName);
  return {
    project: ko.unwrap(task.Name),
    externalReference: ko.unwrap(task.ExternalReference),
    activity: ko.unwrap(entry.Activity),
    isMisc: ko.unwrap(entry.IsMiscTask),
    days: [1, 2, 3, 4, 5, 6, 7].map((day) => ko.unwrap(entry[`Day${day}`])),
  };
})
```

## Apply a reviewed plan

After copying rows and confirming that projects/activities exist, set observables rather than manipulating Kendo's generated markup:

```js
const row = vm.EditItem().Entries().find((entry) => {
  const task = ko.unwrap(entry.TaskName);
  return ko.unwrap(task.Name) === "Harqen Support & Sustain";
});
row.Activity("Support & Maintenance");
["2.00", "3.00", "4.00", "5.00", "2.00"].forEach((value, index) => row[`Day${index + 1}`](value));
```

Re-snapshot and inspect `vm.DayNTotal()` before saving. Never invent or carry forward PTO, holidays, or meetings without evidence or explicit user confirmation.
