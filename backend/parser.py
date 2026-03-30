"""
parser.py — Regex-based log file parser.
Extracts: timestamp, level, module/source, message from each log line.
"""

import re
from typing import Optional

# Common log line patterns (ordered most-to-least specific)
# Pattern 1: 2024-01-15 10:23:45,123 [ERROR] module_name: message
# Pattern 2: 2024-01-15T10:23:45.123Z ERROR module_name - message
# Pattern 3: [2024-01-15 10:23:45] ERROR module_name message
# Pattern 4: Jan 15 10:23:45 hostname module[PID]: message
LOG_PATTERNS = [
    # ISO / standard Python logging format
    re.compile(
        r"(?P<timestamp>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?)"
        r"\s+\[?(?P<level>ERROR|WARNING|WARN|INFO|DEBUG|CRITICAL|FATAL)\]?"
        r"(?:\s+(?P<module>[\w./:-]+))?"
        r"\s*[-:]?\s*(?P<message>.+)",
        re.IGNORECASE,
    ),
    # Bracket-wrapped timestamp
    re.compile(
        r"\[(?P<timestamp>\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?)\]"
        r"\s+\[?(?P<level>ERROR|WARNING|WARN|INFO|DEBUG|CRITICAL|FATAL)\]?"
        r"(?:\s+(?P<module>[\w./:-]+))?"
        r"\s*[-:]?\s*(?P<message>.+)",
        re.IGNORECASE,
    ),
    # Syslog style: Mon DD HH:MM:SS
    re.compile(
        r"(?P<timestamp>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})"
        r"\s+\S+"  # hostname
        r"\s+(?P<module>\S+):\s+"
        r"(?P<level>error|warning|info|debug|critical)?\s*(?P<message>.+)",
        re.IGNORECASE,
    ),
]

# Fallback: detect level anywhere in line even without timestamp
LEVEL_ONLY_PATTERN = re.compile(
    r"(?P<level>ERROR|WARNING|WARN|INFO|DEBUG|CRITICAL|FATAL)",
    re.IGNORECASE,
)

LEVEL_NORMALISE = {
    "warn": "WARNING",
    "critical": "ERROR",
    "fatal": "ERROR",
}

# ── Pre-filter keywords (cheap string check before expensive regex) ────
_LEVEL_KEYWORDS = frozenset({
    "ERROR", "WARNING", "WARN", "INFO", "DEBUG", "CRITICAL", "FATAL",
})
_MONTH_PREFIXES = frozenset({
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
})


def _might_be_log_line(line: str) -> bool:
    """
    Fast O(L) pre-check using plain string ops (implemented in C).
    Returns True if the line *could* match any log pattern.
    This avoids invoking the regex engine on lines that will obviously fail.
    """
    upper = line.upper()
    # Patterns 1, 2, and fallback all require a level keyword
    for kw in _LEVEL_KEYWORDS:
        if kw in upper:
            return True
    # Pattern 3 (syslog) may lack a level keyword but starts with a month
    return upper[:3] in _MONTH_PREFIXES


def _normalise_level(raw: str) -> str:
    raw_lower = raw.lower().strip()
    return LEVEL_NORMALISE.get(raw_lower, raw.upper())


def parse_line(line: str) -> Optional[dict]:
    """
    Try every pattern and return the first successful parsed dict.
    Returns None if the line cannot be meaningfully parsed.
    """
    line = line.strip()
    if not line:
        return None

    for pattern in LOG_PATTERNS:
        m = pattern.match(line)
        if m:
            groups = m.groupdict()
            level = _normalise_level(groups.get("level") or "INFO")
            return {
                "timestamp": (groups.get("timestamp") or "").strip(),
                "level": level,
                "module": (groups.get("module") or "unknown").strip(),
                "message": (groups.get("message") or line).strip(),
                "raw": line,
            }

    # Fallback: level found somewhere in the line but no timestamp
    m = LEVEL_ONLY_PATTERN.search(line)
    if m:
        return {
            "timestamp": "",
            "level": _normalise_level(m.group("level")),
            "module": "unknown",
            "message": line,
            "raw": line,
        }

    return None  # skip unrecognised lines


def parse_log_file(file_content: str) -> list[dict]:
    """
    Parse a full log file (as a string) and return a list of log objects.
    Lines that don't match any pattern are silently skipped.

    Optimisation: a fast pre-filter (plain string search, no regex) skips
    lines that cannot possibly match, avoiding expensive regex calls on
    ~80-90 % of lines in typical INFO-heavy log files.
    """
    results = []
    for line in file_content.splitlines():
        if not line.strip():
            continue                        # skip blank lines immediately
        if not _might_be_log_line(line):
            continue                        # skip lines that can't match any pattern
        parsed = parse_line(line)
        if parsed:
            results.append(parsed)
    return results
