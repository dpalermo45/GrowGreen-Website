#!/usr/bin/env python3
"""Crawl live Grow Green pages and store cleaned main-content HTML/text."""
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "_source_extract" / "live_crawl"
OUT.mkdir(parents=True, exist_ok=True)

UA = "GrowGreenWebsiteMigrationBot/1.0 (+local rebuild; contact office@growgreenweedcontrol.com)"


def load_urls() -> list[str]:
    pages = json.loads((ROOT / "_source_extract" / "pages_readable.json").read_text(encoding="utf-8"))
    posts = json.loads((ROOT / "_source_extract" / "posts_readable.json").read_text(encoding="utf-8"))
    urls = []
    for p in pages + posts:
        link = p.get("link") or ""
        if link.startswith("https://growgreenweedcontrol.com"):
            # skip utility/test thin pages from crawl priority but still include most
            if p.get("slug") in {"test"}:
                continue
            urls.append(link)
    # unique preserve order
    seen = set()
    out = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=45) as res:
        return res.read().decode("utf-8", errors="replace")


def strip_tags(html: str) -> str:
    html = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", html)
    html = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", html)
    html = re.sub(r"(?is)<noscript[^>]*>.*?</noscript>", " ", html)
    html = re.sub(r"(?is)<!--.*?-->", " ", html)
    html = re.sub(r"<[^>]+>", " ", html)
    html = unescape(html)
    html = re.sub(r"\s+", " ", html).strip()
    return html


def extract_main(html: str) -> dict:
    title_m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    title = strip_tags(title_m.group(1)) if title_m else ""
    desc_m = re.search(
        r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',
        html,
        re.I | re.S,
    ) or re.search(
        r'<meta[^>]+content=["\'](.*?)["\'][^>]+name=["\']description["\']',
        html,
        re.I | re.S,
    )
    description = unescape(desc_m.group(1)).strip() if desc_m else ""

    # Prefer main / article / #main-content; fall back to body
    main = None
    for pat in (
        r'(?is)<main[^>]*>(.*?)</main>',
        r'(?is)<div[^>]+id=["\']main-content["\'][^>]*>(.*?)</div>',
        r'(?is)<article[^>]*>(.*?)</article>',
        r'(?is)<div[^>]+class=["\'][^"\']*et_builder_inner_content[^"\']*["\'][^>]*>(.*?)</div>',
    ):
        m = re.search(pat, html)
        if m and len(m.group(1)) > 500:
            main = m.group(1)
            break
    if not main:
        bod = re.search(r"(?is)<body[^>]*>(.*?)</body>", html)
        main = bod.group(1) if bod else html

    # Remove chrome-ish blocks
    main = re.sub(r'(?is)<header[^>]*>.*?</header>', " ", main)
    main = re.sub(r'(?is)<footer[^>]*>.*?</footer>', " ", main)
    main = re.sub(r'(?is)<nav[^>]*>.*?</nav>', " ", main)

    heading_matches = re.findall(r"(?is)<h([1-6])[^>]*>(.*?)</h\1>", main)
    headings = [strip_tags(h[1] if isinstance(h, tuple) else h) for h in heading_matches]
    headings = [h for h in headings if h and len(h) < 180]

    paragraphs = [strip_tags(p) for p in re.findall(r"(?is)<p[^>]*>(.*?)</p>", main)]
    paragraphs = [p for p in paragraphs if p and len(p) > 25]

    lis = [strip_tags(li) for li in re.findall(r"(?is)<li[^>]*>(.*?)</li>", main)]
    lis = [x for x in lis if x and 2 < len(x) < 300]

    # FAQ-ish dt/dd or details
    faqs = []
    for q, a in re.findall(r"(?is)<h3[^>]*>(.*?)</h3>\s*<p[^>]*>(.*?)</p>", main):
        qq, aa = strip_tags(q), strip_tags(a)
        if qq.endswith("?") or len(qq) < 90:
            if aa and len(aa) > 40:
                faqs.append({"q": qq, "a": aa})

    plain = strip_tags(main)
    return {
        "title": title,
        "description": description,
        "headings": headings[:60],
        "paragraphs": paragraphs[:120],
        "list_items": lis[:120],
        "faqs": faqs[:40],
        "plain_text": plain[:20000],
        "plain_len": len(plain),
    }


def main():
    urls = load_urls()
    results = []
    errors = []
    for i, url in enumerate(urls, 1):
        slug = url.rstrip("/").split("/")[-1] or "home"
        print(f"[{i}/{len(urls)}] {url}")
        try:
            html = fetch(url)
            data = extract_main(html)
            data["url"] = url
            data["slug"] = "home" if url.rstrip("/").endswith("growgreenweedcontrol.com") else slug
            (OUT / f"{data['slug']}.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
            results.append(
                {
                    "slug": data["slug"],
                    "url": url,
                    "plain_len": data["plain_len"],
                    "headings": len(data["headings"]),
                    "paragraphs": len(data["paragraphs"]),
                    "faqs": len(data["faqs"]),
                }
            )
            time.sleep(0.35)
        except Exception as e:
            errors.append({"url": url, "error": str(e)})
            print("  ERROR", e)
    summary = {"crawled": len(results), "errors": errors, "pages": results}
    (OUT / "_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps({"crawled": len(results), "errors": len(errors)}, indent=2))


if __name__ == "__main__":
    main()
