#!/usr/bin/env python3
import argparse
import json
import os
import sys
from pathlib import Path


def frame_name(frame: int, total: int) -> str:
    digits = max(4, len(str(max(0, total - 1))))
    return f"frame_{frame:0{digits}d}.png"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    args = parser.parse_args()

    config_path = Path(args.config).resolve()
    config = json.loads(config_path.read_text(encoding="utf-8"))

    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:
        print(
            "Python Playwright is required for CANO QA Runner V1. "
            "Install it with: python -m pip install playwright\n"
            f"Import error: {exc}",
            file=sys.stderr,
        )
        return 3

    html_path = Path(config["html"]).resolve()
    frames_dir = Path(config["framesDir"]).resolve()
    audit_out = Path(config["auditOut"]).resolve()
    total = int(config["frames"])
    width = int(config.get("width", 720))
    height = int(config.get("height", 1280))
    keyframes = {int(value) for value in config.get("keyframes", [])}
    audit_ids = [str(value) for value in config.get("auditIds", [])]
    chromium_path = config.get("chromiumPath") or None
    launch_args = list(config.get("launchArgs") or [])

    frames_dir.mkdir(parents=True, exist_ok=True)
    audit_out.parent.mkdir(parents=True, exist_ok=True)

    audits = {}
    html = html_path.read_text(encoding="utf-8")

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=chromium_path,
            args=launch_args,
        )
        page = browser.new_page(
            viewport={"width": width, "height": height},
            device_scale_factor=1,
        )
        blocked_network_requests = []

        def route_request(route):
            url = route.request.url
            if url.startswith(("http://", "https://")):
                blocked_network_requests.append(url)
                route.abort()
            else:
                route.continue_()

        page.route("**/*", route_request)

        # Generated CANO project HTML is self-contained. set_content avoids
        # file:// policy differences across managed desktop environments.
        page.set_content(html, wait_until="load")
        page.wait_for_function("typeof window.renderAt === 'function'")

        stage = page.locator("#stage")
        if stage.count() != 1:
            raise RuntimeError("expected exactly one #stage element")

        for frame in range(total):
            page.evaluate("(frame) => window.renderAt(frame)", frame)
            stage.screenshot(
                path=str(frames_dir / frame_name(frame, total)),
                animations="disabled",
            )
            if frame in keyframes:
                audits[str(frame)] = page.evaluate(
                    """(ids) => {
                      if (typeof window.audit === 'function') return window.audit();
                      return ids.map((id) => {
                        const e = document.getElementById(id);
                        if (!e) return {id, missing:true, opacity:0, x:0, y:0, w:0, h:0};
                        const r = e.getBoundingClientRect();
                        const o = Number.parseFloat(getComputedStyle(e).opacity) || 0;
                        return {id, opacity:o, x:r.x, y:r.y, w:r.width, h:r.height};
                      });
                    }""",
                    audit_ids,
                )

        browser_version = browser.version
        browser.close()

    audit_out.write_text(
        json.dumps(
            {
                "browserVersion": browser_version,
                "audits": audits,
                "blockedNetworkRequests": sorted(set(blocked_network_requests)),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "status": "ok",
                "frames": total,
                "browserVersion": browser_version,
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
