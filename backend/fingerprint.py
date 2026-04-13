"""
fingerprint.py — Log Deduplication & Fingerprinting Engine.

Normalises log messages by stripping variable data (timestamps, IPs, UUIDs,
numbers, paths, hex strings) and hashes the normalised form to produce a
stable fingerprint.  Logs that share a fingerprint are grouped together,
dramatically reducing noise in UI and reports.

Complexity: O(n) time, O(k) space  (n = total logs, k = unique patterns).
No external dependencies — uses only hashlib and re from the standard library.
"""

import hashlib
import re
from typing import Optional


# ── Normalisation patterns (order matters — most specific first) ─────────────

_NORMALISE_RULES: list[tuple[re.Pattern, str]] = [
    # ISO timestamps: 2024-01-15T10:23:45.123Z, 2024-01-15 10:23:45,123+05:30
    (re.compile(
        r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?"
    ), "<TIMESTAMP>"),

    # Syslog timestamps: Jan 15 10:23:45
    (re.compile(
        r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}"
    ), "<TIMESTAMP>"),

    # UUIDs: 550e8400-e29b-41d4-a716-446655440000
    (re.compile(
        r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
    ), "<UUID>"),

    # IPv4 addresses: 192.168.1.5
    (re.compile(
        r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"
    ), "<IP>"),

    # IPv6 addresses (simplified)
    (re.compile(
        r"\b[0-9a-fA-F]{1,4}(?::[0-9a-fA-F]{1,4}){7}\b"
    ), "<IP>"),

    # File / URL paths: /var/log/app.log, C:\logs\app.log
    (re.compile(
        r"(?:[A-Za-z]:)?(?:[/\\][\w.\-@]+){2,}"
    ), "<PATH>"),

    # Hex strings (8+ chars): 0x7ffab3c, deadbeef01
    (re.compile(
        r"\b(?:0x)?[0-9a-fA-F]{8,}\b"
    ), "<HEX>"),

    # Numbers: port numbers, IDs, byte counts, etc.  Kept last so that IPs
    # and timestamps are already replaced before this fires.
    (re.compile(
        r"\b\d+\b"
    ), "<NUM>"),
]


def normalize_message(message: str) -> str:
    """
    Replace variable tokens in a log message with stable placeholders.
    The resulting string is the "pattern template" used for fingerprinting.
    """
    result = message
    for pattern, replacement in _NORMALISE_RULES:
        result = pattern.sub(replacement, result)

    # Collapse multiple consecutive placeholders of the same kind
    result = re.sub(r"(<\w+>)(\s*\1)+", r"\1", result)

    # Collapse excessive whitespace
    result = re.sub(r"\s+", " ", result).strip()

    return result


def generate_fingerprint(normalized_message: str, level: str) -> str:
    """
    Produce a short, stable SHA-256 hash from the level + normalised message.
    Returns the first 12 hex characters (48-bit collision space — more than
    enough for log-scale deduplication).
    """
    raw = f"{level.upper()}::{normalized_message}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:12]


def build_fingerprint_groups(logs: list[dict]) -> list[dict]:
    """
    Main entry point.  Takes the full list of parsed log dicts and returns a
    list of fingerprint group objects sorted by count (noisiest first).

    Each group:
    {
        "fingerprint_id": "a3f8c2d1e4b7",
        "pattern":        "Connection timeout to <IP>:<NUM>",
        "level":          "ERROR",
        "count":          47,
        "first_seen":     "2024-01-15T10:23:45",
        "last_seen":      "2024-01-15T14:55:12",
        "sample_message": "Connection timeout to 192.168.1.5:3306",
        "modules":        ["db_connector", "api_gateway"]
    }
    """
    if not logs:
        return []

    # Accumulator keyed by fingerprint_id
    groups: dict[str, dict] = {}

    for log in logs:
        message = log.get("message", "")
        level = log.get("level", "INFO").upper()
        module = log.get("module", "unknown")
        timestamp = log.get("timestamp", "")

        normalized = normalize_message(message)
        fp_id = generate_fingerprint(normalized, level)

        if fp_id not in groups:
            groups[fp_id] = {
                "fingerprint_id": fp_id,
                "pattern": normalized,
                "level": level,
                "count": 0,
                "first_seen": timestamp,
                "last_seen": timestamp,
                "sample_message": message,
                "modules": set(),
            }

        grp = groups[fp_id]
        grp["count"] += 1
        if timestamp:
            if not grp["first_seen"] or timestamp < grp["first_seen"]:
                grp["first_seen"] = timestamp
            if not grp["last_seen"] or timestamp > grp["last_seen"]:
                grp["last_seen"] = timestamp
        grp["modules"].add(module)

    # Convert sets → sorted lists for JSON serialisation
    result = []
    for grp in groups.values():
        grp["modules"] = sorted(grp["modules"])
        result.append(grp)

    # Sort by count descending (noisiest patterns first)
    result.sort(key=lambda g: g["count"], reverse=True)

    return result
