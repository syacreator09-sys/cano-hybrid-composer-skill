import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE = Path(__file__).resolve().parent
HTML = (BASE / "index.html").read_text(encoding="utf-8")
OUT = BASE / "output" / "frames"
OUT.mkdir(parents=True, exist_ok=True)

FPS = 24
TOTAL = 288

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
        )
        page = await browser.new_page(
            viewport={"width": 720, "height": 1280},
            device_scale_factor=1,
        )
        await page.set_content(HTML, wait_until="load")
        for frame in range(TOTAL):
            await page.evaluate("(f) => window.renderAt(f)", frame)
            await page.screenshot(
                path=str(OUT / f"{frame:03d}.jpg"),
                type="jpeg",
                quality=92,
                full_page=False,
            )
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
