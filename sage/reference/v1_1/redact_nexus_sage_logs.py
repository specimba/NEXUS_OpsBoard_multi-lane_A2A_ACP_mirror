"""Create redacted copies of NEXUS logs without changing forensic originals."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
from typing import Iterable

TOKEN_PATTERNS = [
    re.compile(r"nxs_sage_[A-Za-z0-9_-]{24,}"),
    re.compile(r"(?i)(Authorization:\s*Bearer\s+)[A-Za-z0-9._~-]+"),
]


def redact(text: str) -> tuple[str, int]:
    count = 0
    redacted = text

    def token_replacement(match: re.Match[str]) -> str:
        nonlocal count
        count += 1
        prefix = match.group(1) if match.lastindex else ""
        return f"{prefix}<REDACTED_NEXUS_SAGE_SECRET>"

    for pattern in TOKEN_PATTERNS:
        redacted = pattern.sub(token_replacement, redacted)
    return redacted, count


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def process_file(source: Path, destination: Path) -> dict[str, object]:
    original = source.read_bytes()
    text = original.decode("utf-8", errors="replace")
    cleaned, replacements = redact(text)
    encoded = cleaned.encode("utf-8")

    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(encoded)

    return {
        "source": str(source),
        "destination": str(destination),
        "replacements": replacements,
        "source_sha256": sha256_bytes(original),
        "redacted_sha256": sha256_bytes(encoded),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("sources", nargs="+", type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    arguments = parser.parse_args()

    manifest = []
    for source in arguments.sources:
        if not source.is_file():
            raise SystemExit(f"Not a file: {source}")
        destination = arguments.output_dir / source.name
        manifest.append(process_file(source, destination))

    manifest_path = arguments.output_dir / "redaction_manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2),
        encoding="utf-8",
    )
    print(f"Created {len(manifest)} redacted copies.")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
