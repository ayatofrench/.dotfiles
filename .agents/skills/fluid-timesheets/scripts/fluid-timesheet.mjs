#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { FluidTimesheetSdk } from "../sdk/fluid-timesheet-sdk.mjs";

const usage = () => {
  console.error(`Usage:
  fluid-timesheet.mjs inspect [--tab N]
  fluid-timesheet.mjs previous [--tab N]
  fluid-timesheet.mjs open-week YYYY-MM-DD [--tab N]
  fluid-timesheet.mjs ensure-misc TASK_ID --apply [--tab N]
  fluid-timesheet.mjs preview PLAN.json [--replace] [--tab N]
  fluid-timesheet.mjs save PLAN.json --commit [--replace] [--tab N]
  fluid-timesheet.mjs submit --confirm-submit [--confirm-overtime] [--tab N]

Writes are guarded: save requires --commit; submit requires --confirm-submit.`);
};

const rawArgs = process.argv.slice(2);
const command = rawArgs.shift();
if (!command || command === "--help" || command === "-h") {
  usage();
  process.exit(command ? 0 : 2);
}

const args = [...rawArgs];
const takeOption = (name, fallback) => {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (value === undefined || value.startsWith("--")) throw new Error(`${name} requires a value`);
  args.splice(index, 2);
  return value;
};
const takeFlag = (name) => {
  const index = args.indexOf(name);
  if (index === -1) return false;
  args.splice(index, 1);
  return true;
};

let sdk;
try {
  const tab = Number(takeOption("--tab", "1"));
  if (!Number.isInteger(tab) || tab < 1) throw new Error("--tab must be a positive integer");
  const replace = takeFlag("--replace");
  const commit = takeFlag("--commit");
  const confirmSubmit = takeFlag("--confirm-submit");
  const confirmOvertime = takeFlag("--confirm-overtime");
  const apply = takeFlag("--apply");

  let planPath;
  if (command === "inspect" || command === "previous") {
    if (replace || commit || confirmSubmit || confirmOvertime || apply || args.length) {
      throw new Error(`Unexpected arguments for ${command}: ${args.join(" ")}`);
    }
  } else if (command === "open-week") {
    planPath = args.shift();
    if (!planPath || replace || commit || confirmSubmit || confirmOvertime || apply || args.length) {
      throw new Error(`Unexpected arguments for open-week: ${args.join(" ")}`);
    }
  } else if (command === "ensure-misc") {
    planPath = args.shift();
    if (!planPath || replace || commit || confirmSubmit || confirmOvertime || args.length) {
      throw new Error(`Unexpected arguments for ensure-misc: ${args.join(" ")}`);
    }
    if (apply !== true) throw new Error("ensure-misc requires --apply");
  } else if (command === "preview" || command === "save") {
    planPath = args.shift();
    if (!planPath) throw new Error(`${command} requires PLAN.json`);
    if (confirmSubmit || confirmOvertime || apply || args.length) {
      throw new Error(`Unexpected arguments for ${command}: ${args.join(" ")}`);
    }
    if (command === "preview" && commit) throw new Error("preview does not accept --commit");
    if (command === "save" && commit !== true) throw new Error("save requires --commit");
  } else if (command === "submit") {
    if (replace || commit || apply || args.length) throw new Error(`Unexpected arguments for submit: ${args.join(" ")}`);
    if (confirmSubmit !== true) throw new Error("submit requires --confirm-submit");
  } else {
    throw new Error(`Unknown command: ${command}`);
  }

  sdk = await FluidTimesheetSdk.connect({ tab });
  let result;
  if (command === "inspect") {
    result = await sdk.inspect();
  } else if (command === "previous") {
    result = await sdk.previousEntries();
  } else if (command === "open-week") {
    result = await sdk.openWeek(planPath);
  } else if (command === "ensure-misc") {
    result = await sdk.ensureMiscRow(Number(planPath), { apply: true });
  } else if (command === "preview" || command === "save") {
    const plan = JSON.parse(await readFile(planPath, "utf8"));
    result =
      command === "preview"
        ? await sdk.previewPlan(plan, { replace })
        : await sdk.saveDraft(plan, { replace, commit: true });
  } else {
    const inspection = await sdk.inspect();
    result = await sdk.submit({
      confirm: true,
      confirmOvertime,
      expectedWeekStart: inspection.sheet.StartDay,
      expectedSheetId: inspection.sheet.Id,
      expectedPrincipalId: inspection.sheet.EntryPrincipal.ID,
    });
  }
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  sdk?.close();
}
