"""
correlator.py — Multi-file Correlation Engine.

Given logs from multiple source files (e.g., app.log, db.log, nginx.log),
this module:

1. Builds per-source breakdowns (error/warning/info/debug counts).
2. Constructs a unified timeline sorted by timestamp.
3. Detects cascading errors — when an ERROR in source A is followed by
   ERRORs in other sources within a configurable time window.

Complexity: O(n log n) for sorting + O(n) for cascade detection.
"""

from __future__ import annotations

import re
from datetime import datetime, timedelta
from typing import Optional


# ── Timestamp parsing helpers ────────────────────────────────────────────────

_TS_FORMATS = [
    "%Y-%m-%dT%H:%M:%S",
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S.%f",
    "%Y-%m-%d %H:%M:%S,%f",
    "%Y-%m-%d %H:%M:%S.%f",
]

# Strip timezone suffixes before parsing
_TZ_STRIP = re.compile(r"[+-]\d{2}:?\d{2}$|Z$")


def _parse_ts(raw: str) -> Optional[datetime]:
    """Best-effort timestamp parsing.  Returns None if unparseable."""
    if not raw:
        return None
    cleaned = _TZ_STRIP.sub("", raw.strip())
    for fmt in _TS_FORMATS:
        try:
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue
    return None


# ── Per-source breakdown ─────────────────────────────────────────────────────

def _build_source_breakdown(logs: list[dict], sources: list[str]) -> dict:
    """
    For each source file, count total / error / warning / info / debug lines.
    """
    breakdown: dict[str, dict] = {}
    for src in sources:
        breakdown[src] = {"total": 0, "errors": 0, "warnings": 0, "info": 0, "debug": 0}

    for log in logs:
        src = log.get("source", "unknown")
        if src not in breakdown:
            breakdown[src] = {"total": 0, "errors": 0, "warnings": 0, "info": 0, "debug": 0}
        breakdown[src]["total"] += 1
        lvl = log.get("level", "").upper()
        if lvl == "ERROR":
            breakdown[src]["errors"] += 1
        elif lvl == "WARNING":
            breakdown[src]["warnings"] += 1
        elif lvl == "INFO":
            breakdown[src]["info"] += 1
        elif lvl == "DEBUG":
            breakdown[src]["debug"] += 1

    return breakdown


# ── Cascade detection ────────────────────────────────────────────────────────

def _detect_cascades(
    logs: list[dict],
    sources: list[str],
    window_seconds: int = 60,
) -> list[dict]:
    """
    Find cascading error patterns:  an ERROR in one source followed by ERRORs
    in *different* sources within `window_seconds`.

    Algorithm:
    1. Filter to ERROR logs only, sorted by parsed timestamp.
    2. For each ERROR, look forward in the window for ERRORs from different
       sources.  If found, record a cascade event.
    3. De-duplicate: once an error is "consumed" as an effect, skip it as a
       potential new trigger.
    """
    if len(sources) < 2:
        return []  # need multi-source for correlation

    # Attach parsed timestamps and filter to errors only
    error_events = []
    for log in logs:
        if log.get("level", "").upper() != "ERROR":
            continue
        ts = _parse_ts(log.get("timestamp", ""))
        if ts is None:
            continue
        error_events.append({**log, "_ts": ts})

    error_events.sort(key=lambda e: e["_ts"])

    if not error_events:
        return []

    consumed = set()  # indices already used as effects
    cascades = []
    window = timedelta(seconds=window_seconds)

    for i, trigger in enumerate(error_events):
        if i in consumed:
            continue

        affected = []
        for j in range(i + 1, len(error_events)):
            if j in consumed:
                continue
            candidate = error_events[j]
            delta = candidate["_ts"] - trigger["_ts"]
            if delta > window:
                break  # past the window
            if candidate.get("source") != trigger.get("source"):
                affected.append({
                    "source": candidate.get("source", "unknown"),
                    "message": candidate.get("message", ""),
                    "time": candidate.get("timestamp", ""),
                    "level": candidate.get("level", "ERROR"),
                    "module": candidate.get("module", "unknown"),
                })
                consumed.add(j)

        if affected:
            consumed.add(i)
            cascades.append({
                "trigger_source": trigger.get("source", "unknown"),
                "trigger_message": trigger.get("message", ""),
                "trigger_time": trigger.get("timestamp", ""),
                "trigger_module": trigger.get("module", "unknown"),
                "affected": affected,
            })

    return cascades


# ── Unified timeline ─────────────────────────────────────────────────────────

def _build_timeline(logs: list[dict], limit: int = 200) -> list[dict]:
    """
    Build a chronologically sorted timeline of ERROR and WARNING logs
    across all sources.  Limited to `limit` entries to keep payloads sane.
    """
    significant = [
        log for log in logs
        if log.get("level", "").upper() in ("ERROR", "WARNING")
    ]

    # Sort by parsed timestamp
    def sort_key(log: dict):
        ts = _parse_ts(log.get("timestamp", ""))
        return ts if ts else datetime.min

    significant.sort(key=sort_key)

    timeline = []
    for log in significant[:limit]:
        timeline.append({
            "time": log.get("timestamp", ""),
            "source": log.get("source", "unknown"),
            "level": log.get("level", ""),
            "module": log.get("module", "unknown"),
            "message": log.get("message", ""),
        })

    return timeline


# ── Public API ───────────────────────────────────────────────────────────────

def detect_correlations(
    logs: list[dict],
    sources: list[str],
    window_seconds: int = 60,
) -> dict:
    """
    Main entry point.  Returns a correlation report dict.

    Parameters
    ----------
    logs     : full list of parsed log dicts (must include "source" field)
    sources  : list of unique source filenames
    window_seconds : cascade detection window (default 60s)

    Returns
    -------
    {
        "sources": [...],
        "source_breakdown": { ... },
        "cascades": [ ... ],
        "timeline": [ ... ]
    }
    """
    return {
        "sources": sorted(sources),
        "source_breakdown": _build_source_breakdown(logs, sources),
        "cascades": _detect_cascades(logs, sources, window_seconds),
        "timeline": _build_timeline(logs),
    }
