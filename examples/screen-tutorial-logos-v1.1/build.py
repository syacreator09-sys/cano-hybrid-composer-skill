from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE.parent / "screen-tutorial-test3" / "index.html"
OUT = HERE / "index.html"

html = BASE.read_text(encoding="utf-8")
n8n_icon = (HERE / "assets" / "n8n-logo-icon.svg").read_text(encoding="utf-8")
n8n_text = (HERE / "assets" / "n8n-logo-text.svg").read_text(encoding="utf-8")
wa = (HERE / "assets" / "whatsapp.svg").read_text(encoding="utf-8")

# Add stable CSS hooks without changing the approved Test 3 layout.
old_css = '.address{margin-left:8px;height:30px;flex:1;border-radius:8px;background:#f1f2f4;display:flex;align-items:center;padding:0 12px;color:#8a929b;font-size:11px}.brand{font-size:13px;font-weight:900;color:#ff6d3b;letter-spacing:.04em}'
new_css = '.address{margin-left:8px;height:30px;flex:1;border-radius:8px;background:#f1f2f4;display:flex;align-items:center;padding:0 12px;color:#8a929b;font-size:11px}.brand{display:flex;align-items:center;gap:2px;height:30px;padding:0 4px}.brand .n8nLogoIcon{width:23px;height:19px}.brand .n8nLogoText{width:22px;height:22px}.sidebarBrand{display:grid;place-items:center}.sidebarBrand .n8nLogoIcon{width:27px;height:22px}.nodeIcon.wa{background:#fff;padding:0;overflow:hidden}.waLogo{width:34px;height:34px;display:block}'
html = html.replace(old_css, new_css, 1)

# Add classes to source SVGs so they can be sized safely without editing paths.
n8n_icon = n8n_icon.replace('<svg ', '<svg class="n8nLogoIcon" aria-label="n8n" ', 1)
n8n_text = n8n_text.replace('<svg ', '<svg class="n8nLogoText" ', 1)
wa = wa.replace('<svg ', '<svg class="waLogo" aria-label="WhatsApp" ', 1)

html = html.replace('<title>CANO Screen Tutorial Test 3</title>', '<title>CANO Screen Tutorial Test 3 · Logos V1.1</title>', 1)
html = html.replace('<div class="brand">n8n</div>', f'<div class="brand">{n8n_icon}{n8n_text}</div>', 1)
html = html.replace('<div class="sideIcon active">◆</div>', f'<div class="sideIcon active sidebarBrand">{n8n_icon}</div>', 1)
html = html.replace('<div class="nodeIcon wa">WA</div>', f'<div class="nodeIcon wa">{wa}</div>', 1)
html = html.replace('SCREEN TUTORIAL · TEST 3', 'SCREEN TUTORIAL · LOGOS V1.1')

required = ['n8nLogoIcon', 'n8nLogoText', 'waLogo', 'LOGOS V1.1']
for token in required:
    if token not in html:
        raise RuntimeError(f'Missing expected token after build: {token}')

OUT.write_text(html, encoding="utf-8")
print(OUT)
