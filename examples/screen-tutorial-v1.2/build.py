from pathlib import Path
import subprocess, sys

HERE = Path(__file__).resolve().parent
V11 = HERE.parent / "screen-tutorial-logos-v1.1"
V11_INDEX = V11 / "index.html"
OUT = HERE / "index.html"

if not V11_INDEX.exists():
    subprocess.run([sys.executable, str(V11 / "build.py")], check=True)

html = V11_INDEX.read_text(encoding="utf-8")
html = html.replace(
    "<title>CANO Screen Tutorial Test 3 · Logos V1.1</title>",
    "<title>CANO Screen Tutorial Mode V1.2</title>",
    1,
)
html = html.replace("SCREEN TUTORIAL · LOGOS V1.1", "SCREEN TUTORIAL · V1.2")

html = html.replace(
    ".phase{position:absolute;left:48px;top:285px;padding:10px 14px;border-radius:999px;background:#101820;color:#fff;font-size:13px;font-weight:850;letter-spacing:.12em;opacity:0}",
    ".phase{position:absolute;left:48px;top:285px;padding:10px 14px;border-radius:999px;background:#101820;color:#fff;font-size:13px;font-weight:850;letter-spacing:.12em;opacity:0;z-index:40}",
    1,
)

html = html.replace(
    "#nStart{left:78px;top:202px}#nWebhook{left:280px;top:202px}#nAI{left:482px;top:202px}",
    "#nStart{left:78px;top:202px}#nWebhook{left:280px;top:202px}#nAI{left:426px;top:202px}",
    1,
)
html = html.replace(
    '<div class="flowLine" style="left:412px;top:246px;width:70px"></div>',
    '<div class="flowLine" style="left:412px;top:246px;width:14px"></div>',
    1,
)

old_camera = """op(E.phase,life(t,.45,14.8,.08,.03));if(t<3.3)E.phase.textContent='01 · ABRE EL FLUJO';else if(t<6.6)E.phase.textContent='02 · AÑADE WEBHOOK';else if(t<10.3)E.phase.textContent='03 · CONFIGURA';else E.phase.textContent='04 · PRUEBA';
 const bw=life(t,1.15,15.01,.12,.02);op(E.browserWrap,bw);let camX=0,camY=0,camS=1;if(t>3.0&&t<6.9){const q=sm(pr(t,3.0,4.2));camX=-65*q;camY=-42*q;camS=1+.17*q}else if(t>=6.9&&t<10.8){const q=sm(pr(t,6.9,8.0));camX=-122*q;camY=-18*q;camS=1+.21*q}else if(t>=10.8){const q=sm(pr(t,10.8,12.0));camX=-32*(1-q);camY=-10*(1-q);camS=1.16-.16*q}tf(E.browserWrap,camX,camY,camS);"""

new_camera = """op(E.phase,life(t,.45,15.5,.08,.02));if(t<3.3)E.phase.textContent='01 · ABRE EL FLUJO';else if(t<6.6)E.phase.textContent='02 · AÑADE WEBHOOK';else if(t<10.3)E.phase.textContent='03 · CONFIGURA';else E.phase.textContent='04 · PRUEBA';
 const bw=life(t,1.15,15.5,.12,.02);op(E.browserWrap,bw);
 let camX=0,camY=0,camS=1;
 if(t>=3.0&&t<4.2){const q=sm(pr(t,3.0,4.2));camX=-65*q;camY=-42*q;camS=1+.17*q}
 else if(t>=4.2&&t<6.45){const q=pr(t,4.2,6.45);camX=-65-5*q;camY=-42-2*q;camS=1.17+.005*q}
 else if(t>=6.45&&t<8.0){const q=sm(pr(t,6.45,8.0));camX=-70+(-52*q);camY=-44+(26*q);camS=1.175+(.035*q)}
 else if(t>=8.0&&t<10.45){const q=pr(t,8.0,10.45);camX=-122+4*q;camY=-18-2*q;camS=1.21-.005*q}
 else if(t>=10.45&&t<12.0){const q=sm(pr(t,10.45,12.0));camX=-118+(106*q);camY=-20+(16*q);camS=1.205-(.165*q)}
 else if(t>=12.0){const q=pr(t,12.0,15.0);camX=-12+4*q;camY=-4-2*q;camS=1.04-(.01*q)}
 tf(E.browserWrap,camX,camY,camS);"""

if old_camera not in html:
    raise RuntimeError("V1.1 camera block not found")
html = html.replace(old_camera, new_camera, 1)

old_success = """else {cursorAt(t,565,850,555,480,10.7,11.65);clickAt(t,555,480,11.65);const sb=life(t,11.45,15.01,.08,.01);op(E.successBox,sb);tf(E.successBox,0,16*(1-ease(sb))-4*pr(t,11.45,15.01),.97+.03*ease(sb));E.nWebhook.classList.toggle('success',t>11.65);op(E.tip,life(t,11.9,13.3,.08,.2));E.tip.style.left='442px';E.tip.style.top='420px';E.tip.textContent='Test recibido ✓'}"""

new_success = """else {cursorAt(t,565,850,555,480,10.7,11.65);clickAt(t,555,480,11.65);const sb=life(t,11.45,15.5,.08,.01);op(E.successBox,sb);const settle=sm(pr(t,12.0,14.8));tf(E.successBox,0,16*(1-ease(sb))-4*pr(t,11.45,15.5)-5*settle,.97+.03*ease(sb)+.008*settle);E.nWebhook.classList.toggle('success',t>11.65);op(E.tip,life(t,11.9,13.3,.08,.2));E.tip.style.left='442px';E.tip.style.top='420px';E.tip.textContent='Test recibido ✓'}"""

if old_success not in html:
    raise RuntimeError("V1.1 success block not found")
html = html.replace(old_success, new_success, 1)

OUT.write_text(html, encoding="utf-8")
print(OUT)
