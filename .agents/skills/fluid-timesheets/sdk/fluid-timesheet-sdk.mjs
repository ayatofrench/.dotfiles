const CDP_URL = "http://127.0.0.1:9222";

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id === undefined) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener("open", resolve, { once: true });
      socket.addEventListener("error", () => reject(new Error("Could not connect to Chrome CDP")), {
        once: true,
      });
    });
    return new CdpClient(socket);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text;
      throw new Error(`Fluid page evaluation failed: ${detail}`);
    }
    return result.result.value;
  }

  close() {
    this.socket.close();
  }
}

const pageExpression = (body, argument) =>
  `(async () => { const input = ${JSON.stringify(argument)}; ${body} })()`;

const bootstrap = `
  if (location.hostname !== "amnhealthcare.fluid.work") throw new Error("Active target is not AMN Fluid");
  const root = document.querySelector("#mysheetEditDiv");
  if (!root || typeof ko === "undefined") throw new Error("Fluid timesheet editor is not loaded");
  const vm = ko.dataFor(root);
  const sheet = vm.EditItem();
`;

const authHelpers = `
  const cookieMap = Object.fromEntries(document.cookie.split(";").map((part) => {
    const index = part.indexOf("=");
    return [part.slice(0, index).trim(), part.slice(index + 1)];
  }));
  const token = decodeURIComponent(cookieMap["Fluid.WebApi.KentorAuthServices.Auth"] || "");
  if (!token) throw new Error("Fluid API authentication cookie is unavailable");
  const principal = ko.toJS(sheet.EntryPrincipal);
  const apiHeaders = (contentType) => ({
    Authorization: "Bearer " + token,
    path: location.pathname,
    "Fluid.Session.ID": cookieMap["Fluid.Session.ID"] || "",
    "Fluid.User": encodeURIComponent(principal.Name) + " [" + principal.ID + "]",
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json, text/javascript, */*; q=0.01",
    ...(contentType ? { "Content-Type": contentType } : {}),
  });
`;

const unwrapTaskName = (entry) => {
  const task = entry.TaskName ?? {};
  return typeof task.Name === "string" ? task.Name : "";
};

const unwrapProjectId = (entry) => Number(entry.TaskName?.ID ?? entry.Task ?? 0);

const matchingRows = (entries, planned) =>
  entries.filter((entry) =>
    planned.projectId !== undefined
      ? unwrapProjectId(entry) === Number(planned.projectId)
      : unwrapTaskName(entry) === planned.project,
  );

const normalizeDays = (days) => {
  if (!Array.isArray(days) || days.length !== 5) {
    throw new Error("Each plan row must contain exactly five weekday values");
  }
  return days.map((value) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 24 || number * 2 !== Math.round(number * 2)) {
      throw new Error(`Invalid Fluid half-hour value: ${value}`);
    }
    return number.toFixed(2);
  });
};

export class FluidTimesheetSdk {
  constructor(client, target) {
    this.client = client;
    this.target = target;
  }

  static async connect({ tab = 1, cdpUrl = CDP_URL } = {}) {
    const targets = await fetch(`${cdpUrl}/json/list`).then((response) => {
      if (!response.ok) throw new Error(`Chrome CDP returned ${response.status}`);
      return response.json();
    });
    const pages = targets.filter(
      (target) => target.type === "page" && new URL(target.url).hostname === "amnhealthcare.fluid.work",
    );
    const target = pages[tab - 1];
    if (!target) throw new Error(`Fluid tab ${tab} was not found on ${cdpUrl}`);
    const client = await CdpClient.connect(target.webSocketDebuggerUrl);
    return new FluidTimesheetSdk(client, target);
  }

  close() {
    this.client.close();
  }

  async openWeek(startDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error("startDate must be YYYY-MM-DD");
    const inspection = await this.inspect();
    const start = Date.parse(`${startDate}T00:00:00Z`);
    if (!Number.isFinite(start)) throw new Error("Invalid startDate");
    const end = start + 6 * 24 * 60 * 60 * 1000;
    const principalId = Number(inspection.sheet.EntryPrincipal.ID);
    const url = `https://amnhealthcare.fluid.work/Timesheet/Edit/${start}-${end}/${principalId}`;
    await this.client.send("Page.navigate", { url });
    const deadline = Date.now() + 15000;
    let lastError;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      try {
        const current = await this.inspect();
        if (Number(current.sheet.StartDay) === start) return current;
      } catch (error) {
        lastError = error;
      }
    }
    throw new Error(`Fluid week did not load: ${lastError?.message ?? url}`);
  }

  async inspect() {
    return this.client.evaluate(
      pageExpression(
        `${bootstrap}
         const value = ko.toJS(sheet);
         return {
           title: document.title,
           url: location.href,
           selectedWeek: ko.unwrap(vm.selectedWeek),
           sheet: value,
           totals: [1,2,3,4,5,6,7].map((day) => ko.unwrap(vm[\`Day\${day}Total\`])),
           weekTotal: ko.unwrap(vm.WeekTotal),
         };`,
        null,
      ),
    );
  }

  async previousEntries() {
    return this.client.evaluate(
      pageExpression(
        `${bootstrap}${authHelpers}
         const query = new URLSearchParams({
           weekStart: String(ko.unwrap(sheet.StartDay)),
           principalId: String(principal.ID),
         });
         const response = await fetch(\`/api/Timesheet/GetPreviousWeekEntries?\${query}\`, {
           headers: apiHeaders(),
         });
         if (!response.ok) throw new Error(\`Previous entries API returned \${response.status}\`);
         return response.json();`,
        null,
      ),
    );
  }

  async ensureMiscRow(taskId, { apply = false } = {}) {
    if (!Number.isInteger(taskId) || taskId <= 0) throw new Error("taskId must be a positive integer");
    return this.client.evaluate(
      pageExpression(
        `${bootstrap}
         const taskId = Number(input.taskId);
         const misc = ko.toJS(vm.MiscTasks).find((item) => Number(item.Value) === taskId);
         if (!misc) throw new Error("Task is not an allowed non-project category: " + taskId);
         const existing = sheet.Entries().find((entry) => Number(ko.unwrap(entry.Task)) === taskId);
         if (existing) return { added: false, taskId, name: misc.Text };
         if (input.apply !== true) return { added: false, wouldAdd: true, taskId, name: misc.Text };
         vm.selectedTask(String(taskId));
         vm.selectedTaskType("Miscellaneous");
         vm.addNewEntry();
         const deadline = Date.now() + 10000;
         while (ko.unwrap(vm.adding) && Date.now() < deadline) {
           await new Promise((resolve) => setTimeout(resolve, 50));
         }
         const added = sheet.Entries().find((entry) => Number(ko.unwrap(entry.Task)) === taskId);
         if (!added) throw new Error("Fluid did not add non-project category " + misc.Text);
         return { added: true, taskId, name: misc.Text };`,
        { taskId, apply: apply === true },
      ),
    );
  }

  async previewPlan(plan, { replace = false, minimumDailyHours = 8 } = {}) {
    const inspection = await this.inspect();
    const sheet = structuredClone(inspection.sheet);
    if (plan.weekStart !== undefined && Number(plan.weekStart) !== Number(sheet.StartDay)) {
      throw new Error(`Plan weekStart ${plan.weekStart} does not match open sheet ${sheet.StartDay}`);
    }
    if (sheet.Status !== "Open" && sheet.Status !== "Not Started") {
      throw new Error(`Timesheet status is ${sheet.Status}; expected Open or Not Started`);
    }
    if (!Array.isArray(plan.rows) || plan.rows.length === 0) throw new Error("Plan has no rows");

    const planKeys = new Set();
    const applied = [];
    for (const planned of plan.rows) {
      if (planned.projectId !== undefined && (!Number.isInteger(planned.projectId) || planned.projectId <= 0)) {
        throw new Error(`projectId must be a positive integer: ${planned.projectId}`);
      }
      const key = planned.projectId === undefined ? `name:${planned.project}` : `id:${Number(planned.projectId)}`;
      if (planKeys.has(key)) throw new Error(`Duplicate plan row: ${key}`);
      planKeys.add(key);
      const matches = matchingRows(sheet.Entries, planned);
      if (matches.length !== 1) {
        throw new Error(`Expected one timesheet row for ${key}; found ${matches.length}`);
      }
      const row = matches[0];
      const days = normalizeDays(planned.days);
      const existing = [row.Day1, row.Day2, row.Day3, row.Day4, row.Day5].map(Number);
      if (!replace && existing.some((value, index) => value !== 0 && value !== Number(days[index]))) {
        throw new Error(`Refusing to replace existing hours for ${planned.project} without replace=true`);
      }
      row.Activity = planned.activity;
      days.forEach((value, index) => {
        row[`Day${index + 1}`] = value;
      });
      applied.push({ projectId: unwrapProjectId(row), project: unwrapTaskName(row), activity: planned.activity, days });
    }

    const totals = [1, 2, 3, 4, 5].map((day) =>
      sheet.Entries.reduce((total, entry) => total + Number(entry[`Day${day}`] || 0), 0),
    );
    const belowMinimum = totals
      .map((hours, index) => ({ day: index + 1, hours }))
      .filter(({ hours }) => hours < minimumDailyHours);
    if (belowMinimum.length) {
      throw new Error(`Daily totals below ${minimumDailyHours} hours: ${JSON.stringify(belowMinimum)}`);
    }
    return {
      sheetId: sheet.Id,
      principalId: sheet.EntryPrincipal.ID,
      weekStart: sheet.StartDay,
      status: sheet.Status,
      applied,
      totals,
      weekTotal: totals.reduce((a, b) => a + b, 0),
    };
  }

  async saveDraft(plan, options = {}) {
    const preview = await this.previewPlan(plan, options);
    if (options.commit !== true) return { committed: false, preview };
    if (plan.weekStart === undefined) throw new Error("Committed plans require weekStart");
    if (plan.rows.some((row) => !Number.isInteger(row.projectId) || row.projectId <= 0)) {
      throw new Error("Committed plan rows require a positive integer projectId");
    }

    const result = await this.client.evaluate(
      pageExpression(
        `${bootstrap}${authHelpers}
         const plan = input.plan;
         const replace = input.replace;
         if (Number(ko.unwrap(sheet.StartDay)) !== input.expectedWeekStart) {
           throw new Error("Open sheet changed after preview");
         }
         const currentPrincipal = ko.toJS(sheet.EntryPrincipal);
         if (Number(ko.unwrap(sheet.Id)) !== input.expectedSheetId || Number(currentPrincipal.ID) !== input.expectedPrincipalId) {
           throw new Error("Open timesheet or owner changed after preview");
         }
         const originalStatus = ko.unwrap(sheet.Status);
         const originalModified = ko.unwrap(sheet.Modified);
         if (originalStatus !== fluid.timesheet.status.Open && originalStatus !== fluid.timesheet.status.NotStarted) {
           throw new Error("Cannot save timesheet with status " + originalStatus);
         }
         const changed = [];
         const restore = () => changed.forEach(({ row, activity, days, target, task, parent }) => {
           row.Activity(activity);
           days.forEach((value, index) => row[\`Day\${index + 1}\`](value));
           if (typeof row.TargetPrincipalId === "function") row.TargetPrincipalId(target);
           if (typeof row.Task === "function") row.Task(task);
           if (typeof row.ParentProject === "function") row.ParentProject(parent);
           else row.ParentProject = parent;
         });
         const restoreSheetMetadata = () => {
           sheet.Status(originalStatus);
           sheet.Modified(originalModified);
         };
         try {
           for (const planned of plan.rows) {
             const matches = sheet.Entries().filter((entry) => {
               const task = ko.unwrap(entry.TaskName);
               const taskId = task == null ? Number(ko.unwrap(entry.Task) || 0) : Number(ko.unwrap(task.ID));
               return taskId === Number(planned.projectId);
             });
             if (matches.length !== 1) {
               throw new Error("Expected one timesheet row for projectId " + planned.projectId + "; found " + matches.length);
             }
             const row = matches[0];
             const days = planned.days.map((value) => Number(value).toFixed(2));
             const oldDays = [1,2,3,4,5].map((day) => ko.unwrap(row[\`Day\${day}\`]));
             if (!replace && oldDays.some((value, index) => Number(value) !== 0 && Number(value) !== Number(days[index]))) {
               throw new Error(\`Refusing to replace existing hours for \${planned.project}\`);
             }
             changed.push({
               row,
               activity: ko.unwrap(row.Activity),
               days: oldDays,
               target: ko.unwrap(row.TargetPrincipalId),
               task: ko.unwrap(row.Task),
               parent: ko.unwrap(row.ParentProject),
             });
             row.Activity(planned.activity);
             days.forEach((value, index) => row[\`Day\${index + 1}\`](value));

             if (ko.unwrap(row.AllowSubProjectTimeBooking) && Number(ko.unwrap(row.TargetPrincipalId)) === 0) {
               const task = ko.unwrap(row.TaskName);
               const projectId = Number(ko.unwrap(task.ID));
               const children = ko.unwrap(row.AllChildProjects) || [];
               const child = children.find((candidate) => Number(ko.unwrap(candidate.PrincipalId)) === projectId);
               if (!child) throw new Error(\`No valid subproject option for \${planned.project}\`);
               row.TargetPrincipalId(projectId);
             }
           }

           const totals = [1,2,3,4,5].map((day) => sheet.Entries().reduce(
             (total, entry) => total + Number(ko.unwrap(entry["Day" + day]) || 0),
             0,
           ));
           const belowMinimum = totals
             .map((hours, index) => ({ day: index + 1, hours }))
             .filter(({ hours }) => hours < input.minimumDailyHours);
           if (belowMinimum.length) {
             throw new Error("Daily totals below " + input.minimumDailyHours + " hours: " + JSON.stringify(belowMinimum));
           }

           vm.validation([]);
           vm.validateSubprojects("save");
           vm.ReverseMapSubprojectTask();
           vm.AllocationZeroCheck();
           vm.validateHoursPerDay();
           vm.validateActivities("save");
           const validation = ko.toJS(vm.validation());
           if (validation.length) throw new Error(\`Fluid validation failed: \${validation.join("; ")}\`);

           sheet.Modified(moment().toDate());
           if (sheet.Entries().length > 0 && sheet.Status() === fluid.timesheet.status.NotStarted) {
             sheet.Status(fluid.timesheet.status.Open);
           }
           const payload = ko.toJS(sheet);
           const response = await fetch("/api/Timesheet/Save", {
             method: "POST",
             headers: apiHeaders("application/x-www-form-urlencoded; charset=UTF-8"),
             body: $.param(payload),
           });
           const rawText = await response.text();
           let text = rawText;
           try { text = JSON.parse(rawText); } catch {}
           if (!response.ok || text !== "success") throw new Error(\`Save failed (\${response.status}): \${text}\`);
           if (typeof vm.dirtyFlag === "function") vm.dirtyFlag().reset();
           return { committed: true, response: text, status: ko.unwrap(sheet.Status) };
         } catch (error) {
           restore();
           restoreSheetMetadata();
           throw error;
         }`,
        {
          plan,
          replace: options.replace === true,
          expectedWeekStart: Number(plan.weekStart),
          expectedSheetId: Number(preview.sheetId),
          expectedPrincipalId: Number(preview.principalId),
          minimumDailyHours: options.minimumDailyHours ?? 8,
        },
      ),
    );
    return { ...result, preview };
  }

  async submit({
    confirm = false,
    confirmOvertime = false,
    expectedWeekStart,
    expectedSheetId,
    expectedPrincipalId,
  } = {}) {
    if (confirm !== true) throw new Error("submit requires confirm=true");
    if (expectedWeekStart === undefined || expectedSheetId === undefined || expectedPrincipalId === undefined) {
      throw new Error("submit requires expected week, sheet, and principal identity");
    }
    return this.client.evaluate(
      pageExpression(
        `${bootstrap}${authHelpers}
         if (Number(ko.unwrap(sheet.StartDay)) !== Number(input.expectedWeekStart)) {
           throw new Error("Open sheet changed before submit");
         }
         const currentPrincipal = ko.toJS(sheet.EntryPrincipal);
         if (Number(ko.unwrap(sheet.Id)) !== Number(input.expectedSheetId) || Number(currentPrincipal.ID) !== Number(input.expectedPrincipalId)) {
           throw new Error("Open timesheet or owner changed before submit");
         }
         if (ko.unwrap(sheet.Status) !== fluid.timesheet.status.Open) {
           throw new Error("Cannot submit timesheet with status " + ko.unwrap(sheet.Status));
         }
         if (typeof vm.dirtyFlag === "function" && vm.dirtyFlag().isDirty()) {
           throw new Error("Refusing to submit unsaved page-model changes");
         }
         if (vm.hasOvertime() && input.confirmOvertime !== true) {
           throw new Error("Timesheet contains overtime; explicit overtime confirmation is required");
         }
         vm.validation([]);
         vm.validateSubprojects("submit");
         vm.ReverseMapSubprojectTask();
         vm.AllocationZeroCheck();
         vm.validateHoursPerDay();
         vm.validateActivities("submit");
         const validation = ko.toJS(vm.validation());
         if (validation.length) throw new Error(\`Fluid validation failed: \${validation.join("; ")}\`);
         const payload = ko.toJS(sheet);
         cleanPropForSerialize(payload);
         const response = await fetch("/api/Timesheet/Submit", {
           method: "POST",
           headers: apiHeaders("application/json; charset=utf-8"),
           body: JSON.stringify(payload),
         });
         const rawText = await response.text();
         let text = rawText;
         try { text = JSON.parse(rawText); } catch {}
         if (!response.ok || text !== "success") throw new Error(\`Submit failed (\${response.status}): \${text}\`);
         return { submitted: true, response: text };`,
        {
          expectedWeekStart: Number(expectedWeekStart),
          expectedSheetId: Number(expectedSheetId),
          expectedPrincipalId: Number(expectedPrincipalId),
          confirmOvertime: confirmOvertime === true,
        },
      ),
    );
  }
}
