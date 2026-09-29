from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE.parent / "hybrid-tutorial-v2.1" / "index.html"
OUT = HERE / "index.html"

html = BASE.read_text(encoding="utf-8")
html = html.replace("CANO Hybrid Tutorial V2.1", "CANO Hybrid Tutorial V2.2")
html = html.replace("HYBRID TUTORIAL V2.1", "HYBRID TUTORIAL V2.2")

css = (HERE / "motion_v22.css").read_text(encoding="utf-8")
html = html.replace("</style></head>", css + "\n</style></head>")

anchor = "</svg>\n\n<div class=\"heroCard\""
inject = """</svg>
<div class="motionAura" id="auraAI"></div>
<div class="motionAura" id="auraAction"></div>
<div id="handoffDot"></div>
<div id="aiOrbitDot"></div>
<div id="actionPulseDot"></div>
<div id="confirmPulseDot"></div>

<div class="heroCard""""
html = html.replace(anchor, inject, 1)

old_e = 'const $=id=>document.getElementById(id),E={kicker:$("kicker"),title:$("title"),sub:$("sub"),phase:$("phase"),hero:$("hero"),bubble:$("bubble"),pulse:$("pulse"),p1:$("p1"),ai:$("ai"),aiRing:$("aiRing"),aiTag:$("aiTag"),extract:$("extract"),hub:$("hub"),p2:$("p2"),p3:$("p3"),crm:$("crm"),cal:$("cal"),crmStatus:$("crmStatus"),selected:$("selected"),confirm:$("confirm"),caption:$("caption"),capText:$("capText"),prog:$("prog")};'
new_e = 'const $=id=>document.getElementById(id),E={stage:$("stage"),kicker:$("kicker"),title:$("title"),sub:$("sub"),phase:$("phase"),hero:$("hero"),bubble:$("bubble"),pulse:$("pulse"),p1:$("p1"),ai:$("ai"),aiRing:$("aiRing"),aiTag:$("aiTag"),extract:$("extract"),hub:$("hub"),p2:$("p2"),p3:$("p3"),crm:$("crm"),cal:$("cal"),crmStatus:$("crmStatus"),selected:$("selected"),confirm:$("confirm"),caption:$("caption"),capText:$("capText"),prog:$("prog"),auraAI:$("auraAI"),auraAction:$("auraAction"),handoffDot:$("handoffDot"),aiOrbitDot:$("aiOrbitDot"),actionPulseDot:$("actionPulseDot"),confirmPulseDot:$("confirmPulseDot")};'
html = html.replace(old_e, new_e, 1)

start = html.index("function renderAt(frame){")
end = html.index("window.renderAt=renderAt;", start)
render = (HERE / "renderAt_v22.js").read_text(encoding="utf-8").rstrip() + "\n"
html = html[:start] + render + html[end:]
OUT.write_text(html, encoding="utf-8")
print(OUT)
