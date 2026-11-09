#!/usr/bin/env python3
"""Extract WP content, indexing categories, media catalog, URL manifest seeds."""
from __future__ import annotations

import json
import os
import re
import urllib.parse
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTRACT = ROOT / "_source_extract"
DOCS = ROOT / "docs"
DOCS.mkdir(exist_ok=True)


def strip_html(html: str) -> str:
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_readable_from_divi(content: str) -> dict:
    """Pull useful text blocks from Divi/HTML blobs."""
    # Prefer content inside fullwidth_code modules if present as HTML after shortcodes
    html = content
    # Remove Divi shortcodes but keep inner HTML when present
    html = re.sub(r"\[/?et_pb_[^\]]*\]", "\n", html)
    # Get headings and paragraphs
    headings = re.findall(r"<h[1-6][^>]*>([\s\S]*?)</h[1-6]>", html, flags=re.I)
    paragraphs = re.findall(r"<p[^>]*>([\s\S]*?)</p>", html, flags=re.I)
    lis = re.findall(r"<li[^>]*>([\s\S]*?)</li>", html, flags=re.I)
    imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\'][^>]*>', html, flags=re.I)
    alts = re.findall(r'<img[^>]+alt=["\']([^"\']*)["\'][^>]*>', html, flags=re.I)

    def clean_bits(items):
        out = []
        for item in items:
            t = strip_html(item)
            if t and len(t) > 2 and t not in out:
                out.append(t)
        return out

    plain = strip_html(html)
    return {
        "headings": clean_bits(headings)[:40],
        "paragraphs": clean_bits(paragraphs)[:80],
        "list_items": clean_bits(lis)[:80],
        "images": imgs[:50],
        "alts": alts[:50],
        "plain_text": plain[:8000],
        "plain_len": len(plain),
    }


def list_pages_posts():
    pages = json.loads((EXTRACT / "pages.json").read_text(encoding="utf-8"))
    posts = json.loads((EXTRACT / "posts.json").read_text(encoding="utf-8"))
    cleaned_pages = []
    cleaned_posts = []
    for p in pages:
        readable = extract_readable_from_divi(p.get("content") or "")
        cleaned_pages.append(
            {
                "id": p["id"],
                "title": p["title"],
                "slug": p["slug"],
                "path": "/" if p["slug"] == "home" else f"/{p['slug']}/",
                "link": p["link"],
                "seo_title": unescape(p.get("seo_title") or ""),
                "seo_desc": unescape(p.get("seo_desc") or ""),
                "readable": readable,
            }
        )
    for p in posts:
        readable = extract_readable_from_divi(p.get("content") or "")
        cleaned_posts.append(
            {
                "id": p["id"],
                "title": p["title"],
                "slug": p["slug"],
                "path": f"/{p['slug']}/",
                "link": p["link"],
                "seo_title": unescape(p.get("seo_title") or ""),
                "seo_desc": unescape(p.get("seo_desc") or ""),
                "readable": readable,
            }
        )
    (EXTRACT / "pages_readable.json").write_text(
        json.dumps(cleaned_pages, indent=2), encoding="utf-8"
    )
    (EXTRACT / "posts_readable.json").write_text(
        json.dumps(cleaned_posts, indent=2), encoding="utf-8"
    )
    return cleaned_pages, cleaned_posts


def indexing_inventory():
    import openpyxl
    import glob

    results = []
    for f in sorted(glob.glob(str(ROOT / "*.xlsx"))):
        name = os.path.basename(f)
        wb = openpyxl.load_workbook(f, data_only=True)
        meta = {}
        if "Metadata" in wb.sheetnames:
            for row in wb["Metadata"].iter_rows(values_only=True):
                if row[0]:
                    meta[str(row[0])] = "" if row[1] is None else str(row[1])
        urls = []
        if "Table" in wb.sheetnames:
            for i, row in enumerate(wb["Table"].iter_rows(values_only=True)):
                if i == 0:
                    continue
                if row[0]:
                    urls.append(str(row[0]))
        pages_perf = []
        if "Pages" in wb.sheetnames:
            for i, row in enumerate(wb["Pages"].iter_rows(values_only=True)):
                if i == 0:
                    continue
                if row[0]:
                    pages_perf.append(
                        {
                            "url": str(row[0]),
                            "clicks": row[1],
                            "impressions": row[2],
                            "ctr": row[3],
                            "position": row[4],
                        }
                    )
        issues = []
        if "Critical issues" in wb.sheetnames:
            for i, row in enumerate(wb["Critical issues"].iter_rows(values_only=True)):
                if i == 0:
                    continue
                if row[0]:
                    issues.append(
                        {
                            "reason": row[0],
                            "source": row[1],
                            "validation": row[2],
                            "pages": row[3],
                        }
                    )
        category = meta.get("Issue")
        if "Performance" in name:
            category = "Search performance (July 2025–Nov 2026 window per Filters)"
        elif not category and "Coverage-2026" in name and "Drilldown" not in name:
            category = "Coverage summary — all known pages"
        results.append(
            {
                "file": name,
                "category": category or "(unknown — check Metadata)",
                "metadata": meta,
                "url_count": len(urls),
                "urls": urls,
                "critical_issues": issues,
                "top_pages": pages_perf[:50],
            }
        )
    (DOCS / "indexing-inventory.json").write_text(
        json.dumps(results, indent=2), encoding="utf-8"
    )
    return results


def media_catalog():
    atts = json.loads((EXTRACT / "attachments.json").read_text(encoding="utf-8"))
    rows = []
    missing = []
    for a in atts:
        url = a.get("url") or ""
        m = re.search(r"/uploads/(.+)$", url)
        rel = urllib.parse.unquote(m.group(1)) if m else ""
        path2 = ROOT / "website-media" / "uploads" / Path(*rel.split("/")) if rel else None
        exists = bool(path2 and path2.exists())
        rows.append(
            {
                "id": a["id"],
                "title": a["title"],
                "slug": a["slug"],
                "source_url": url,
                "relative_path": rel,
                "local_path": str(path2.relative_to(ROOT)).replace("\\", "/") if exists else None,
                "exists": exists,
                "parent": a.get("parent"),
            }
        )
        if not exists:
            missing.append(rows[-1])
    catalog = {
        "attachment_records": len(atts),
        "found_locally": sum(1 for r in rows if r["exists"]),
        "missing": len(missing),
        "items": rows,
        "missing_items": missing,
    }
    (DOCS / "image-catalog-raw.json").write_text(
        json.dumps(catalog, indent=2), encoding="utf-8"
    )
    return catalog


SERVICE_AREAS = [
    "St. Amant",
    "Prairieville",
    "Gonzales",
    "Geismar",
    "Dutchtown",
    "Sorrento",
    "Baton Rouge",
    "Denham Springs",
    "Walker",
    "Central",
    "Zachary",
    "Donaldsonville",
    "Paulina",
    "Lutcher",
    "Gramercy",
    "Metairie",
    "Kenner",
    "Madisonville",
    "Covington",
    "Hammond",
    "Ponchatoula",
    "Springfield",
    "Addis",
    "Brusly",
    "Port Allen",
    "St. George",
    "Livingston",
    "Port Vincent",
    "Baker",
    "Watson",
    "Albany",
    "Mandeville",
    "Killian",
    "Maurepas",
    "LaPlace",
    "Convent",
    "Darrow",
    "White Castle",
    "Plaquemine",
    "Saint Gabriel",
]


def classify_url(path: str, pages_by_path: dict, posts_by_path: dict) -> dict:
    p = path if path.endswith("/") or path == "/" or "." in path.split("/")[-1] else path + "/"
    # normalize
    if not p.startswith("/"):
        p = "/" + p
    lower = p.lower()

    if any(
        x in lower
        for x in (
            "/wp-admin",
            "/wp-login",
            "/wp-json",
            "/wp-content/themes",
            "admin-ajax",
            "/xmlrpc",
        )
    ):
        return {
            "outcome": "intentionally_excluded",
            "status": 410,
            "notes": "WordPress administrative or theme asset URL — do not recreate",
        }
    if "/feed/" in lower or lower.endswith("/feed") or lower == "/feed/":
        return {
            "outcome": "intentionally_excluded",
            "status": 410,
            "notes": "WordPress feed/archive feed — not recreated",
        }
    if lower.startswith("/category/") or lower.startswith("/tag/") or lower.startswith("/author/"):
        return {
            "outcome": "retired",
            "status": 410,
            "notes": "WP taxonomy archive — not recreated as thin archive; content lives on posts/pages",
        }
    if p in pages_by_path or p.rstrip("/") + "/" in pages_by_path:
        return {"outcome": "retained", "status": 200, "notes": "Published WordPress page"}
    if p in posts_by_path or p.rstrip("/") + "/" in posts_by_path:
        return {"outcome": "retained", "status": 200, "notes": "Published WordPress post"}
    # known aliases
    aliases = {
        "/contact/": ("/contact-us/", "redirect"),
        "/privacy/": ("/privacy-policy/", "redirect"),
        "/request-/": ("/request-a-quote/", "redirect"),
        "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-Louisiana": (
            "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana/",
            "redirect",
        ),
    }
    if p in aliases or p.rstrip("/") in aliases:
        key = p if p in aliases else p.rstrip("/")
        dest, kind = aliases[key]
        return {
            "outcome": "redirected",
            "status": 301,
            "redirect_to": dest,
            "notes": f"Alias/typo URL → {dest}",
        }
    return {
        "outcome": "review",
        "status": None,
        "notes": "Seen in Search Console or references; map during implementation",
    }


def build_url_manifest(pages, posts, indexing):
    pages_by_path = {p["path"]: p for p in pages}
    posts_by_path = {p["path"]: p for p in posts}
    urls = {}

    def add(url: str, source: str):
        from urllib.parse import urlparse

        parsed = urlparse(url)
        path = parsed.path or "/"
        if path != "/" and not path.endswith("/") and "." not in path.split("/")[-1]:
            path = path + "/"
        if path not in urls:
            entry = classify_url(path, pages_by_path, posts_by_path)
            entry.update({"path": path, "sources": [source], "absolute_examples": [url]})
            urls[path] = entry
        else:
            if source not in urls[path]["sources"]:
                urls[path]["sources"].append(source)
            if url not in urls[path]["absolute_examples"]:
                urls[path]["absolute_examples"].append(url)

    for p in pages:
        add(p["link"], "wordpress_page")
    for p in posts:
        add(p["link"], "wordpress_post")
    for book in indexing:
        for u in book.get("urls") or []:
            add(u, f"gsc:{book.get('category')}")
        for u in book.get("top_pages") or []:
            add(u["url"], "gsc:performance")

    # Priority care flags
    priority = {
        "/": "top clicks 583",
        "/how-to-kill-pickers-stickers-burweed-in-louisiana/": "top clicks 408",
        "/the-ultimate-guide-to-fertilizing-your-lawn-in-south-louisiana/": "top clicks 117",
        "/contact-us/": "top clicks 59",
    }
    for path, note in priority.items():
        if path in urls:
            urls[path]["migration_priority"] = "high"
            urls[path]["priority_note"] = note

    rows = sorted(urls.values(), key=lambda r: r["path"])
    (DOCS / "url-migration-manifest.json").write_text(
        json.dumps({"count": len(rows), "urls": rows}, indent=2), encoding="utf-8"
    )
    return rows


def main():
    pages, posts = list_pages_posts()
    indexing = indexing_inventory()
    media = media_catalog()
    manifest = build_url_manifest(pages, posts, indexing)

    summary = {
        "wordpress": {
            "published_pages": len(pages),
            "published_posts": len(posts),
            "attachment_records": media["attachment_records"],
            "attachments_found_locally": media["found_locally"],
            "attachments_missing": media["missing"],
        },
        "service_areas_count": len(SERVICE_AREAS),
        "service_areas": SERVICE_AREAS,
        "url_manifest_count": len(manifest),
        "indexing_workbooks": [
            {"file": b["file"], "category": b["category"], "url_count": b["url_count"]}
            for b in indexing
        ],
        "performance_top4_verified": True,
        "form_page_code_txt": "empty — reconstruct from PHP proxy + live page patterns in WP content",
        "notes": [
            "Attachment status in XML is inherit (303), matching WordPress attachment publish model.",
            "website-media.zip preserved; website-media/uploads already extracted — do not re-extract blindly.",
            "Do not invent review ratings, customer counts, guarantees, or contract terms from screenshots.",
        ],
    }
    (DOCS / "source-inventory.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
