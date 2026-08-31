#!/usr/bin/env python3
"""Fail if a previously exposed credential remains in Git patch history.

The credential itself is intentionally not stored here. Only its SHA-256
fingerprint is retained so CI can verify history remediation without printing or
reintroducing the secret.
"""

from __future__ import annotations

import hashlib
import re
import sys

TARGET_SHA256 = "b50817b634b4ca24602ced4bb4db21298a234881658f887857bcf0bfcb81371d"
TOKEN_PATTERN = re.compile(rb"[A-Za-z0-9]{24,}")


def main() -> int:
    payload = sys.stdin.buffer.read()
    for candidate in TOKEN_PATTERN.findall(payload):
        if hashlib.sha256(candidate).hexdigest() == TARGET_SHA256:
            print(
                "Known exposed credential fingerprint is still present in reachable Git history.",
                file=sys.stderr,
            )
            return 1

    print("Known exposed credential fingerprint not found in reachable Git history.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
