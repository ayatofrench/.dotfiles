# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
"""
Lightweight Azure DevOps Boards helper around `az` CLI.

Purpose:
- concise story/board output (no giant payloads)
- simple read/update commands for day-to-day board work
- avoid Azure DevOps MCP dependency

Examples:
  uv run ado_board.py setup --org https://dev.azure.com/AMNEngineering --project Catalyst
  uv run ado_board.py list --mine --type "User Story" --limit 20
  uv run ado_board.py get 12345
  uv run ado_board.py update 12345 --state Active --add-tag pipeline:in-progress
  uv run ado_board.py comment 12345 "Started implementation in workspace xyz"
"""

from __future__ import annotations

import argparse
import html
import json
import re
import shlex
import subprocess
import sys
from dataclasses import dataclass
from typing import Any


DEFAULT_LIST_FIELDS = [
    "System.Id",
    "System.Title",
    "System.State",
    "System.WorkItemType",
    "System.AssignedTo",
    "System.Tags",
    "System.IterationPath",
    "System.ChangedDate",
]

DEFAULT_GET_FIELDS = [
    "System.Id",
    "System.Title",
    "System.State",
    "System.WorkItemType",
    "System.AssignedTo",
    "System.Tags",
    "System.IterationPath",
    "System.AreaPath",
    "System.Parent",
    "System.TeamProject",
    "System.CreatedDate",
    "System.ChangedDate",
]


class AzCliError(RuntimeError):
    pass


@dataclass
class CliContext:
    org: str | None
    project: str | None
    as_json: bool
    dry_run: bool


def run_az(args: list[str], *, ctx: CliContext, expect_json: bool = True) -> Any:
    cmd = ["az", *args, "--only-show-errors"]
    if expect_json and "-o" not in args and "--output" not in args:
        cmd += ["-o", "json"]

    if ctx.dry_run:
        print(f"[dry-run] {shlex.join(cmd)}")
        return [] if expect_json else ""

    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise AzCliError(proc.stderr.strip() or proc.stdout.strip() or "Unknown Azure CLI error")

    stdout = proc.stdout.strip()
    if not expect_json:
        return stdout
    if not stdout:
        # az boards query returns empty output instead of [] when nothing matches
        return []
    try:
        return json.loads(stdout)
    except json.JSONDecodeError as exc:
        raise AzCliError(f"Expected JSON from az, got: {stdout[:200]}") from exc


def wiql_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def id_display(identity: Any) -> str:
    if isinstance(identity, dict):
        return identity.get("displayName") or identity.get("uniqueName") or "-"
    if isinstance(identity, str):
        return identity
    return "-"


def split_tags(raw: Any) -> list[str]:
    if not isinstance(raw, str) or not raw.strip():
        return []
    return [t.strip() for t in raw.split(";") if t.strip()]


def merge_tags(existing: list[str], add: list[str], remove: list[str]) -> list[str]:
    # keep insertion order while doing case-insensitive checks
    out: list[str] = []
    seen: set[str] = set()

    for tag in existing:
        key = tag.casefold()
        if key not in seen:
            seen.add(key)
            out.append(tag)

    for tag in add:
        key = tag.casefold()
        if key not in seen:
            seen.add(key)
            out.append(tag)

    remove_set = {t.casefold() for t in remove}
    return [t for t in out if t.casefold() not in remove_set]


def strip_html(content: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", content, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def truncate(s: str, n: int) -> str:
    if len(s) <= n:
        return s
    return s[: n - 1] + "…"


def normalize_item(item: dict[str, Any]) -> dict[str, Any]:
    fields = item.get("fields", {})
    desc = fields.get("System.Description")
    return {
        "id": fields.get("System.Id", item.get("id")),
        "title": fields.get("System.Title", ""),
        "state": fields.get("System.State", ""),
        "type": fields.get("System.WorkItemType", ""),
        "assignedTo": id_display(fields.get("System.AssignedTo")),
        "tags": split_tags(fields.get("System.Tags")),
        "iteration": fields.get("System.IterationPath", ""),
        "area": fields.get("System.AreaPath", ""),
        "parent": fields.get("System.Parent"),
        "project": fields.get("System.TeamProject", ""),
        "created": fields.get("System.CreatedDate", ""),
        "changed": fields.get("System.ChangedDate", ""),
        "description": strip_html(desc) if isinstance(desc, str) else "",
        "url": item.get("url", ""),
    }


def print_item_summary(item: dict[str, Any], *, show_description: bool = False) -> None:
    tags = ", ".join(item["tags"]) if item["tags"] else "-"
    print(f"#{item['id']} [{item['type']}] {item['state']} — {item['title']}")
    print(f"Assigned:  {item['assignedTo']}")
    print(f"Project:   {item['project'] or '-'}")
    print(f"Area:      {item['area'] or '-'}")
    print(f"Iteration: {item['iteration'] or '-'}")
    print(f"Parent:    {item['parent'] if item['parent'] is not None else '-'}")
    print(f"Tags:      {tags}")
    print(f"Changed:   {item['changed'] or '-'}")
    print(f"URL:       {item['url'] or '-'}")
    if show_description and item.get("description"):
        print("\nDescription:\n")
        print(item["description"])


def scoped_args(ctx: CliContext, *, include_project: bool, project_override: str | None = None) -> list[str]:
    args: list[str] = []
    if ctx.org:
        args += ["--org", ctx.org]
    if include_project:
        project_value = project_override or ctx.project
        if project_value:
            args += ["--project", project_value]
    return args


def resolve_project(ctx: CliContext) -> str:
    if ctx.project:
        return ctx.project

    config_text = run_az(["devops", "configure", "--list"], ctx=ctx, expect_json=False)
    match = re.search(r"^\s*project\s*=\s*(.+)\s*$", config_text, flags=re.MULTILINE)
    if match:
        return match.group(1).strip()

    raise AzCliError(
        "Project not set. Pass --project <name> or run: ado_board.py setup --project <name>"
    )


def cmd_setup(args: argparse.Namespace, ctx: CliContext) -> None:
    run_az(["extension", "add", "--name", "azure-devops", "-y"], ctx=ctx, expect_json=False)

    defaults: list[str] = []
    if args.org:
        defaults.append(f"organization={args.org}")
    if args.project:
        defaults.append(f"project={args.project}")

    if defaults:
        run_az(["devops", "configure", "--defaults", *defaults], ctx=ctx, expect_json=False)
        print("Configured defaults:")
        for default in defaults:
            print(f"  - {default}")
    else:
        print("No defaults changed (pass --org and/or --project).")

    print("\nTip: set AZURE_DEVOPS_EXT_PAT in your shell profile to avoid interactive login prompts.")


def build_list_wiql(args: argparse.Namespace, project: str) -> str:
    conditions = [f"[System.TeamProject] = {wiql_quote(project)}"]

    if args.mine:
        conditions.append("[System.AssignedTo] = @Me")
    elif args.assigned_to:
        conditions.append(f"[System.AssignedTo] = {wiql_quote(args.assigned_to)}")

    if args.type:
        if len(args.type) == 1:
            conditions.append(f"[System.WorkItemType] = {wiql_quote(args.type[0])}")
        else:
            types = ", ".join(wiql_quote(t) for t in args.type)
            conditions.append(f"[System.WorkItemType] IN ({types})")

    if args.state:
        if len(args.state) == 1:
            conditions.append(f"[System.State] = {wiql_quote(args.state[0])}")
        else:
            states = ", ".join(wiql_quote(s) for s in args.state)
            conditions.append(f"[System.State] IN ({states})")
    elif not args.include_closed:
        conditions += [
            "[System.State] <> 'Closed'",
            "[System.State] <> 'Done'",
            "[System.State] <> 'Removed'",
            "[System.State] <> 'Completed'",
        ]

    if args.parent is not None:
        conditions.append(f"[System.Parent] = {args.parent}")

    for tag in args.tag:
        conditions.append(f"[System.Tags] CONTAINS {wiql_quote(tag)}")

    if args.changed_since:
        conditions.append(f"[System.ChangedDate] >= {wiql_quote(args.changed_since)}")

    fields = ", ".join(f"[{field}]" for field in DEFAULT_LIST_FIELDS)
    where = "\n  AND ".join(conditions)
    return (
        f"SELECT {fields}\n"
        "FROM WorkItems\n"
        f"WHERE {where}\n"
        "ORDER BY [System.ChangedDate] DESC"
    )


def print_list(items: list[dict[str, Any]], *, limit: int) -> None:
    rows = [normalize_item(item) for item in items]
    rows = rows[:limit]

    if not rows:
        print("No work items found.")
        return

    print(f"Found {len(rows)} work item(s):\n")
    header = f"{'ID':>7}  {'Type':<14}  {'State':<12}  {'Assigned':<24}  Title"
    print(header)
    print("-" * len(header))
    for row in rows:
        print(
            f"{str(row['id']):>7}  "
            f"{truncate(row['type'] or '-', 14):<14}  "
            f"{truncate(row['state'] or '-', 12):<12}  "
            f"{truncate(row['assignedTo'] or '-', 24):<24}  "
            f"{truncate(row['title'] or '-', 80)}"
        )


def cmd_list(args: argparse.Namespace, ctx: CliContext) -> None:
    resolved_project = resolve_project(ctx)
    wiql = args.wiql or build_list_wiql(args, resolved_project)

    cmd = [
        "boards",
        "query",
        "--wiql",
        wiql,
        *scoped_args(ctx, include_project=True, project_override=resolved_project),
    ]
    result = run_az(cmd, ctx=ctx, expect_json=True)

    if isinstance(result, dict):
        items = [result]
    else:
        items = result

    if ctx.as_json:
        normalized = [normalize_item(item) for item in items[: args.limit]]
        print(json.dumps(normalized, indent=2))
        return

    print_list(items, limit=args.limit)


def cmd_get(args: argparse.Namespace, ctx: CliContext) -> None:
    include_description = not getattr(args, "no_description", False)

    fields = list(DEFAULT_GET_FIELDS)
    if include_description:
        fields.append("System.Description")
    fields.extend(args.field)

    cmd = [
        "boards",
        "work-item",
        "show",
        "--id",
        str(args.id),
        "--expand",
        "none",
        "--fields",
        ",".join(fields),
        *scoped_args(ctx, include_project=False),
    ]
    result = run_az(cmd, ctx=ctx, expect_json=True)
    item = normalize_item(result)

    if ctx.as_json:
        print(json.dumps(item, indent=2))
    else:
        print_item_summary(item, show_description=include_description)


def get_current_tags(item_id: int, ctx: CliContext) -> list[str]:
    result = run_az(
        [
            "boards",
            "work-item",
            "show",
            "--id",
            str(item_id),
            "--expand",
            "none",
            "--fields",
            "System.Tags",
            *scoped_args(ctx, include_project=False),
        ],
        ctx=ctx,
        expect_json=True,
    )
    return split_tags(result.get("fields", {}).get("System.Tags"))


def cmd_update(args: argparse.Namespace, ctx: CliContext) -> None:
    cmd = ["boards", "work-item", "update", "--id", str(args.id), *scoped_args(ctx, include_project=False)]

    if args.title:
        cmd += ["--title", args.title]
    if args.state:
        cmd += ["--state", args.state]
    if args.assigned_to:
        cmd += ["--assigned-to", args.assigned_to]
    if args.area:
        cmd += ["--area", args.area]
    if args.iteration:
        cmd += ["--iteration", args.iteration]
    if args.reason:
        cmd += ["--reason", args.reason]
    if args.description:
        cmd += ["--description", args.description]
    if args.comment:
        cmd += ["--discussion", args.comment]

    fields = list(args.field)
    if args.add_tag or args.remove_tag:
        current_tags = get_current_tags(args.id, ctx)
        merged = merge_tags(current_tags, args.add_tag, args.remove_tag)
        fields.append(f"System.Tags={'; '.join(merged)}")

    if fields:
        cmd += ["--fields", *fields]

    run_az(cmd, ctx=ctx, expect_json=True)

    # Follow with summary that includes description by default.
    get_args = argparse.Namespace(id=args.id, no_description=False, field=[])
    cmd_get(get_args, ctx)


def cmd_comment(args: argparse.Namespace, ctx: CliContext) -> None:
    update_args = argparse.Namespace(
        id=args.id,
        title=None,
        state=None,
        assigned_to=None,
        area=None,
        iteration=None,
        reason=None,
        description=None,
        comment=args.text,
        field=[],
        add_tag=[],
        remove_tag=[],
    )
    cmd_update(update_args, ctx)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Concise Azure DevOps Boards helper")
    parser.add_argument("--org", help="Azure DevOps organization URL")
    parser.add_argument("--project", help="Azure DevOps project name/id (used for query/list/create flows)")
    parser.add_argument("--json", action="store_true", help="Emit normalized JSON")
    parser.add_argument("--dry-run", action="store_true", help="Print az command(s) without executing")

    sub = parser.add_subparsers(dest="command", required=True)

    p_setup = sub.add_parser("setup", help="Install extension + set az devops defaults")
    p_setup.add_argument("--org", required=False, help="Organization URL to set as default")
    p_setup.add_argument("--project", required=False, help="Project to set as default")
    p_setup.set_defaults(func=cmd_setup)

    p_list = sub.add_parser("list", help="List board items using WIQL")
    p_list.add_argument("--wiql", help="Custom WIQL (overrides generated query)")
    p_list.add_argument("--mine", action="store_true", help="Only items assigned to @Me")
    p_list.add_argument("--assigned-to", help="Filter by assigned user display name/email")
    p_list.add_argument("--type", action="append", default=["User Story"], help="Work item type filter (repeatable)")
    p_list.add_argument("--state", action="append", default=[], help="State filter (repeatable)")
    p_list.add_argument("--include-closed", action="store_true", help="Include Closed/Done/Removed/Completed")
    p_list.add_argument("--tag", action="append", default=[], help="Tag contains filter (repeatable)")
    p_list.add_argument("--parent", type=int, help="Filter by parent work item id")
    p_list.add_argument("--changed-since", help="Filter changed date >= value (e.g. 2026-04-01)")
    p_list.add_argument("--limit", type=int, default=25, help="Max rows to display (default: 25)")
    p_list.set_defaults(func=cmd_list)

    p_get = sub.add_parser("get", help="Get one work item with concise fields")
    p_get.add_argument("id", type=int, help="Work item id")
    p_get.add_argument("--no-description", action="store_true", help="Hide description text")
    p_get.add_argument("--description", action="store_true", help=argparse.SUPPRESS)  # backwards-compat
    p_get.add_argument("--field", action="append", default=[], help="Extra field to fetch (repeatable)")
    p_get.set_defaults(func=cmd_get)

    p_update = sub.add_parser("update", help="Update one work item")
    p_update.add_argument("id", type=int, help="Work item id")
    p_update.add_argument("--title")
    p_update.add_argument("--state")
    p_update.add_argument("--assigned-to")
    p_update.add_argument("--area")
    p_update.add_argument("--iteration")
    p_update.add_argument("--reason")
    p_update.add_argument("--description")
    p_update.add_argument("--comment", help="Adds discussion comment")
    p_update.add_argument("--field", action="append", default=[], help="Raw field update pair, e.g. System.Tags=a; b")
    p_update.add_argument("--add-tag", action="append", default=[], help="Tag(s) to add")
    p_update.add_argument("--remove-tag", action="append", default=[], help="Tag(s) to remove")
    p_update.set_defaults(func=cmd_update)

    p_comment = sub.add_parser("comment", help="Add a discussion comment to a work item")
    p_comment.add_argument("id", type=int, help="Work item id")
    p_comment.add_argument("text", help="Comment text")
    p_comment.set_defaults(func=cmd_comment)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    # subparser args shadow top-level args for setup; use whichever exists
    org = getattr(args, "org", None)
    project = getattr(args, "project", None)

    ctx = CliContext(
        org=org,
        project=project,
        as_json=bool(getattr(args, "json", False)),
        dry_run=bool(getattr(args, "dry_run", False)),
    )

    try:
        args.func(args, ctx)
        return 0
    except AzCliError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("Interrupted", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
