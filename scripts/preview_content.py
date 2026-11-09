#!/usr/bin/env python3
import json
from pathlib import Path

pages = json.loads(Path("_source_extract/pages_readable.json").read_text(encoding="utf-8"))
posts = json.loads(Path("_source_extract/posts_readable.json").read_text(encoding="utf-8"))

for slug in [
    "home",
    "services",
    "contact-us",
    "request-a-quote",
    "about-us",
    "careers",
    "lawn-fertilization-weed-control",
    "privacy-policy",
]:
    p = next((x for x in pages if x["slug"] == slug), None)
    if not p:
        print("MISSING PAGE", slug)
        continue
    print("=" * 60, slug)
    print("TITLE:", p["title"])
    print("SEO:", (p["seo_title"] or "")[:140])
    print("HEADINGS:", p["readable"]["headings"][:12])
    print("PARAS:", p["readable"]["paragraphs"][:6])
    print("LIST:", p["readable"]["list_items"][:10])

print("\n=== POSTS ===")
for p in posts:
    print(p["slug"], "|", p["title"], "| headings:", len(p["readable"]["headings"]), "plain:", p["readable"]["plain_len"])
