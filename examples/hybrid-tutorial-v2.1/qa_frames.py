import json
from pathlib import Path
import numpy as np
from PIL import Image

BASE = Path(__file__).resolve().parent
FRAMES = BASE / "output" / "frames"
paths = sorted(FRAMES.glob("*.jpg"))

def frame_diff(a, b):
    ia = np.asarray(Image.open(a).convert("L").resize((180, 320)), dtype=np.float32)
    ib = np.asarray(Image.open(b).convert("L").resize((180, 320)), dtype=np.float32)
    return float(np.mean(np.abs(ia - ib)))

diffs = []
duplicates = []
for i in range(len(paths)-1):
    d = frame_diff(paths[i], paths[i+1])
    diffs.append((i, i+1, d))
    if d == 0:
        duplicates.append((i, i+1))

report = {
    "frame_count": len(paths),
    "exact_adjacent_duplicates": duplicates,
    "mean_diff": float(np.mean([x[2] for x in diffs])) if diffs else 0,
    "min_diff": min(diffs, key=lambda x:x[2]) if diffs else None,
    "max_diff": max(diffs, key=lambda x:x[2]) if diffs else None,
    "low_motion_pairs_lt_0_18": sum(1 for _,_,d in diffs if d < 0.18),
    "very_low_motion_pairs_lt_0_08": sum(1 for _,_,d in diffs if d < 0.08),
}
(BASE / "output" / "qa_metrics.json").write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
