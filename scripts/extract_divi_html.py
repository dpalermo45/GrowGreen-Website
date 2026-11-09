#!/usr/bin/env python3
"""Pull HTML blobs from Divi code modules in WP export and clean into page bodies."""
from __future__ import annotations

import json
import re
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = json.loads((ROOT / "_source_extract/pages.json").read_text(encoding="utf-8"))
POSTS = json.loads((ROOT / "_source_extract/posts.json").read_text(encoding="utf-8"))
OUT = ROOT / "_source_extract" / "divi_html"
OUT.mkdir(parents=True, exist_ok=True)


def extract_code_modules(content: str) -> str:
    chunks = []
    # Divi fullwidth / code modules often wrap HTML after the shortcode attrs
    for m in re.finditer(
        r"\[et_pb_(?:fullwidth_)?code[^\]]*\](.*?)\[/et_pb_(?:fullwidth_)?code\]",
        content,
        flags=re.I | re.S,
    ):
        chunks.append(m.group(1))
    if not chunks:
        # sometimes content is almost entirely one HTML document after shortcodes stripped
        stripped = re.sub(r"\[/?et_pb_[^\]]*\]", "\n", content)
        chunks.append(stripped)
    return "\n".join(chunks)


def clean_html(html: str) -> str:
    html = unescape(html)
    # drop scripts/styles/svg noise
    html = re.sub(r"(?is)<script[^>]*>.*?</script>", "", html)
    html = re.sub(r"(?is)<style[^>]*>.*?</style>", "", html)
    html = re.sub(r"(?is)<svg[^>]*>.*?</svg>", "", html)
    # remove WP/divi builder comments
    html = re.sub(r"(?is)<!--.*?-->", "", html)
    return html.strip()


def to_blocks(html: str) -> dict:
    headings = [re.sub(r"<[^>]+>", "", h).strip() for h in re.findall(r"(?is)<h[1-6][^>]*>(.*?)</h[1-6]>", html)]
    headings = [unescape(h) for h in headings if h]
    paras = [re.sub(r"<[^>]+>", " ", p) for p in re.findall(r"(?is)<p[^>]*>(.*?)</p>", html)]
    paras = [re.sub(r"\s+", " ", unescape(p)).strip() for p in paras]
    paras = [p for p in paras if len(p) > 20]
    lis = [re.sub(r"<[^>]+>", " ", li) for li in re.findall(r"(?is)<li[^>]*>(.*?)</li>", html)]
    lis = [re.sub(r"\s+", " ", unescape(x)).strip() for x in lis]
    lis = [x for x in lis if 2 < len(x) < 280 and "escapeHtml" not in x]
    # FAQ pairs: h3/h4 question + following p
    faqs = []
    for m in re.finditer(r"(?is)<h([34])[^>]*>(.*?)</h\1>\s*<p[^>]*>(.*?)</p>", html):
        q = re.sub(r"<[^>]+>", "", m.group(2)).strip()
        a = re.sub(r"<[^>]+>", " ", m.group(3))
        a = re.sub(r"\s+", " ", unescape(a)).strip()
        if q and a and len(a) > 30:
            faqs.append({"q": unescape(q), "a": a})
    plain = re.sub(r"<[^>]+>", " ", html)
    plain = re.sub(r"\s+", " ", unescape(plain)).strip()
    return {
        "headings": headings[:80],
        "paragraphs": paras[:150],
        "list_items": lis[:150],
        "faqs": faqs[:50],
        "plain_len": len(plain),
        "plain_text": plain[:25000],
        "html_len": len(html),
    }


def process(items, kind: str):
    index = []
    for item in items:
        slug = item["slug"]
        raw = item.get("content") or ""
        html = clean_html(extract_code_modules(raw))
        blocks = to_blocks(html)
        payload = {
            "id": item["id"],
            "slug": slug,
            "title": item["title"],
            "seo_title": item.get("seo_title") or "",
            "seo_desc": item.get("seo_desc") or "",
            "link": item.get("link"),
            "kind": kind,
            **blocks,
            "html": html[:200000],  # keep for selective rich rendering
        }
        (OUT / f"{slug}.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
        index.append(
            {
                "slug": slug,
                "title": item["title"],
                "kind": kind,
                "plain_len": blocks["plain_len"],
                "html_len": blocks["html_len"],
                "headings": len(blocks["headings"]),
                "paragraphs": len(blocks["paragraphs"]),
                "faqs": len(blocks["faqs"]),
            }
        )
        print(f"{slug}: plain={blocks['plain_len']} html={blocks['html_len']} h={len(blocks['headings'])} p={len(blocks['paragraphs'])} faq={len(blocks['faqs'])}")
    (OUT / f"_{kind}_index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")


def main():
    process(PAGES, "pages")
    process(POSTS, "posts")


if __name__ == "__main__":
    main()
