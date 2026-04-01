#!/usr/bin/env python3
"""Star Office UI smoke test (non-destructive).

Usage:
  python3 scripts/smoke_test.py --base-url http://127.0.0.1:19000

Optional env:
  SMOKE_AUTH_BEARER=xxxx   # if your gateway/proxy requires bearer auth
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request


REQUIRED_ENDPOINTS = [
    ("GET", "/", 200, None),                                    # HTML page
    ("GET", "/health", 200, None),                              # JSON health status
    ("GET", "/status", 200, None),                              # JSON status
    ("GET", "/agents", 200, None),                              # JSON array
    ("GET", "/yesterday-memo", 200, {"success": True}),         # Validate success field
    ("GET", "/stats/today-timeline", 200, {"ok": True}),        # Validate ok field
    ("GET", "/stats/weekly", 200, {"ok": True}),                # Validate ok field
    ("GET", "/memo/list", 200, {"ok": True}),                   # Validate ok field
]


def req(method: str, url: str, body: dict | None = None, token: str = "") -> tuple[int, str]:
    data = None
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    r = urllib.request.Request(url=url, method=method, data=data, headers=headers)
    try:
        with urllib.request.urlopen(r, timeout=8) as resp:
            raw = resp.read().decode("utf-8", errors="ignore")
            return resp.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="ignore") if hasattr(e, "read") else str(e)
        return e.code, raw
    except Exception as e:
        return 0, str(e)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base-url", default="http://127.0.0.1:19000", help="Base URL of Star Office UI service")
    args = ap.parse_args()

    base = args.base_url.rstrip("/")
    token = os.getenv("SMOKE_AUTH_BEARER", "").strip()

    failures: list[str] = []
    print(f"[smoke] base={base}")

    for endpoint in REQUIRED_ENDPOINTS:
        method, path, expected_code = endpoint[0], endpoint[1], endpoint[2]
        validate_fields = endpoint[3] if len(endpoint) > 3 else None

        code, body = req(method, base + path, token=token)
        if code != expected_code:
            failures.append(f"{method} {path}: expected {expected_code}, got {code}")
        else:
            # Validate JSON fields if specified
            if validate_fields:
                try:
                    data = json.loads(body)
                    for key, expected_val in validate_fields.items():
                        if data.get(key) != expected_val:
                            failures.append(f"{method} {path}: expected {key}={expected_val}, got {data.get(key)}")
                except json.JSONDecodeError as e:
                    failures.append(f"{method} {path}: invalid JSON response - {str(e)[:100]}")

            if not failures or failures[-1] not in [f for f in failures if path in f]:
                print(f"  OK  {method} {path} -> {code}")

    # non-destructive state update probe
    code, body = req("POST", base + "/set_state", {"state": "idle", "detail": "smoke-check"}, token=token)
    if code != 200:
        failures.append(f"POST /set_state failed: {code}, body={body[:200]}")
    else:
        print("  OK  POST /set_state -> 200")

    if failures:
        print("\n[smoke] FAIL")
        for f in failures:
            print(" -", f)
        return 1

    print("\n[smoke] PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
