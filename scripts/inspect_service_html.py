import json
import re
from pathlib import Path

for slug in [
    "fire-ant-treatment",
    "mosquito-flea-tick-treatments",
    "flower-bed-weed-control-and-fertilization",
    "core-aeration",
    "tree-and-shrub-care",
    "liquid-aeration",
    "lawn-fungus",
]:
    p = json.loads(Path(f"src/data/content/{slug}.json").read_text(encoding="utf-8"))
    html = p.get("html", "")
    classes = sorted(set(re.findall(r'class="([^"]+)"', html)))
    interesting = [c for c in classes if any(k in c for k in ("ggl", "feature", "card", "step", "faq", "round"))]
    print(slug, "html", len(html), "faqs", len(p.get("faqs", [])), "interesting", interesting[:25])
