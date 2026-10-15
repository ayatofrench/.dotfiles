#!/usr/bin/env python3
"""Estimate daily project mix from Pi session activity.

This measures engaged agent time, not payroll time. Event gaps are capped and
same-category intervals are merged so idle sessions and parallel agents do not
inflate the estimate. The output is intended to apportion an independently
chosen workday total (normally at least eight hours).
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from typing import Iterable
from zoneinfo import ZoneInfo

DEFAULT_ROOT = Path.home() / ".pi" / "agent" / "sessions"
DEFAULT_PATTERNS = {
    "harqen": re.compile(r"(?:^|/)work/va/voice-advantage(?:/|$)"),
    "greenlight": re.compile(r"(?:^|/)work/catalyst(?:/|$)"),
}


def parse_timestamp(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def classify(cwd: str, patterns: dict[str, re.Pattern[str]]) -> str | None:
    for category, pattern in patterns.items():
        if pattern.search(cwd):
            return category
    return None


def iter_session_intervals(
    path: Path,
    category: str,
    start: datetime,
    end: datetime,
    gap_cap: timedelta,
    tail: timedelta,
) -> Iterable[tuple[str, datetime, datetime, Path]]:
    timestamps: list[datetime] = []
    try:
        with path.open(encoding="utf-8") as handle:
            for line in handle:
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if record.get("type") != "message" or not record.get("timestamp"):
                    continue
                timestamp = parse_timestamp(record["timestamp"])
                if start - gap_cap <= timestamp < end:
                    timestamps.append(timestamp)
    except (OSError, UnicodeError):
        return

    timestamps.sort()
    for index, current in enumerate(timestamps):
        following = timestamps[index + 1] if index + 1 < len(timestamps) else current + tail
        interval_end = min(following, current + gap_cap, end)
        interval_start = max(current, start)
        if interval_end > interval_start:
            yield category, interval_start, interval_end, path


def split_at_local_midnight(
    interval_start: datetime, interval_end: datetime, tz: ZoneInfo
) -> Iterable[tuple[date, datetime, datetime]]:
    cursor = interval_start
    while cursor < interval_end:
        local = cursor.astimezone(tz)
        next_day = local.date() + timedelta(days=1)
        midnight = datetime.combine(next_day, time.min, tzinfo=tz).astimezone(timezone.utc)
        segment_end = min(interval_end, midnight)
        yield local.date(), cursor, segment_end
        cursor = segment_end


def merge_seconds(intervals: list[tuple[datetime, datetime]]) -> float:
    if not intervals:
        return 0.0
    intervals.sort()
    merged_start, merged_end = intervals[0]
    total = 0.0
    for start, end in intervals[1:]:
        if start <= merged_end:
            merged_end = max(merged_end, end)
        else:
            total += (merged_end - merged_start).total_seconds()
            merged_start, merged_end = start, end
    return total + (merged_end - merged_start).total_seconds()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start", required=True, help="First local date, YYYY-MM-DD")
    parser.add_argument("--end", required=True, help="Last local date, YYYY-MM-DD (inclusive)")
    parser.add_argument("--timezone", default="America/Chicago")
    parser.add_argument("--sessions-root", type=Path, default=DEFAULT_ROOT)
    parser.add_argument("--gap-cap-minutes", type=int, default=15)
    parser.add_argument("--tail-minutes", type=int, default=5)
    parser.add_argument("--json", action="store_true", dest="as_json")
    args = parser.parse_args()

    tz = ZoneInfo(args.timezone)
    first_day = date.fromisoformat(args.start)
    last_day = date.fromisoformat(args.end)
    if last_day < first_day:
        parser.error("--end must be on or after --start")

    range_start = datetime.combine(first_day, time.min, tzinfo=tz).astimezone(timezone.utc)
    range_end = datetime.combine(last_day + timedelta(days=1), time.min, tzinfo=tz).astimezone(timezone.utc)
    gap_cap = timedelta(minutes=args.gap_cap_minutes)
    tail = timedelta(minutes=args.tail_minutes)

    intervals: dict[tuple[date, str], list[tuple[datetime, datetime]]] = defaultdict(list)
    files: dict[str, set[str]] = defaultdict(set)
    ignored_cwds: set[str] = set()

    for path in args.sessions_root.rglob("*.jsonl"):
        try:
            with path.open(encoding="utf-8") as handle:
                first = json.loads(handle.readline())
        except (OSError, UnicodeError, json.JSONDecodeError):
            continue
        if first.get("type") != "session":
            continue
        cwd = str(first.get("cwd", ""))
        category = classify(cwd, DEFAULT_PATTERNS)
        if category is None:
            ignored_cwds.add(cwd)
            continue
        for _, interval_start, interval_end, source in iter_session_intervals(
            path, category, range_start, range_end, gap_cap, tail
        ):
            files[category].add(str(source))
            for day, segment_start, segment_end in split_at_local_midnight(interval_start, interval_end, tz):
                intervals[(day, category)].append((segment_start, segment_end))

    days = []
    cursor = first_day
    totals = defaultdict(float)
    while cursor <= last_day:
        day_intervals = {
            category: intervals[(cursor, category)] for category in DEFAULT_PATTERNS
        }
        minutes = {
            category: round(merge_seconds(day_intervals[category]) / 60, 1)
            for category in DEFAULT_PATTERNS
        }
        for category, value in minutes.items():
            totals[category] += value
        relevant = sum(minutes.values())
        ratios = {
            category: (round(value / relevant, 4) if relevant else None)
            for category, value in minutes.items()
        }
        combined = [interval for category_intervals in day_intervals.values() for interval in category_intervals]
        union_minutes = round(merge_seconds(combined) / 60, 1)
        first_active = min((start for start, _ in combined), default=None)
        last_active = max((end for _, end in combined), default=None)
        days.append({
            "date": cursor.isoformat(),
            "minutes": minutes,
            "union_minutes": union_minutes,
            "first_active": first_active.astimezone(tz).isoformat() if first_active else None,
            "last_active": last_active.astimezone(tz).isoformat() if last_active else None,
            "ratios": ratios,
        })
        cursor += timedelta(days=1)

    grand = sum(totals.values())
    result = {
        "method": {
            "timezone": args.timezone,
            "gap_cap_minutes": args.gap_cap_minutes,
            "tail_minutes": args.tail_minutes,
            "note": "Engaged Pi activity only; normalize ratios to independently chosen daily hours.",
        },
        "days": days,
        "totals": {
            "minutes": {category: round(value, 1) for category, value in totals.items()},
            "ratios": {
                category: (round(value / grand, 4) if grand else None)
                for category, value in totals.items()
            },
        },
        "evidence": {"session_files": {key: len(value) for key, value in files.items()}},
    }

    if args.as_json:
        print(json.dumps(result, indent=2))
    else:
        print("date        harqen min  greenlight min  union min  harqen %  greenlight %  active span")
        for day in days:
            h = day["minutes"]["harqen"]
            g = day["minutes"]["greenlight"]
            hr = day["ratios"]["harqen"]
            gr = day["ratios"]["greenlight"]
            span = "-" if day["first_active"] is None else f"{day['first_active'][11:16]}-{day['last_active'][11:16]}"
            print(
                f"{day['date']}  {h:10.1f}  {g:14.1f}  {day['union_minutes']:9.1f}  "
                f"{('-' if hr is None else f'{hr * 100:.1f}'):>8}  "
                f"{('-' if gr is None else f'{gr * 100:.1f}'):>12}  {span}"
            )
        print("\nWeekly ratio:", result["totals"]["ratios"])
        print("Session files:", result["evidence"]["session_files"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
