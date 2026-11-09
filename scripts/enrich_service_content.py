#!/usr/bin/env python3
"""Enrich content JSON with structured blocks parsed from Divi HTML.

Uses bounded, non-catastrophic patterns (no nested .*? with optional repeats).
"""
from __future__ import annotations

import json
import re
import sys
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "src" / "data" / "content"

# Cap per-file HTML to keep regex work predictable
HTML_CAP = 450_000


def strip_tags(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    return re.sub(r"\s+", " ", unescape(s)).strip()


SKIP_CLASS_SUFFIXES = ("-list", "-icon", "-grid", "-num", "-halo", "-stage", "-board")


def class_matches(attrs: str, needle: str) -> bool:
    """True when a class token contains needle but is not a container/icon wrapper."""
    m = re.search(r'class="([^"]+)"', attrs, re.I)
    tokens = (m.group(1) if m else attrs).lower().split()
    for t in tokens:
        if needle not in t:
            continue
        if any(t.endswith(suf) for suf in SKIP_CLASS_SUFFIXES):
            continue
        return True
    return False


def chunk_by_tag(html: str, tag: str, cls_substr: str | None = None) -> list[str]:
    """Pull balanced <tag ...>...</tag> chunks, optionally requiring a class substring."""
    chunks: list[str] = []
    open_re = re.compile(rf"<{tag}\b([^>]*)>", re.I)
    open_any = re.compile(rf"<{tag}\b[^>]*>", re.I)
    close_re = re.compile(rf"</{tag}\s*>", re.I)
    pos = 0
    while True:
        m = open_re.search(html, pos)
        if not m:
            break
        attrs = m.group(1)
        if cls_substr and not class_matches(attrs, cls_substr):
            pos = m.end()
            continue
        start = m.start()
        depth = 1
        cursor = m.end()
        end = -1
        while depth > 0 and cursor < len(html):
            nxt_open = open_any.search(html, cursor)
            nxt_close = close_re.search(html, cursor)
            if not nxt_close:
                break
            if nxt_open and nxt_open.start() < nxt_close.start():
                depth += 1
                cursor = nxt_open.end()
            else:
                depth -= 1
                cursor = nxt_close.end()
                if depth == 0:
                    end = nxt_close.end()
        if end < 0:
            pos = m.end()
            continue
        chunks.append(html[start:end])
        pos = end
        if len(chunks) >= 24:
            break
    return chunks


def first_heading(chunk: str) -> str:
    m = re.search(r"<h[23][^>]*>(.*?)</h[23]>", chunk, re.I | re.S)
    return strip_tags(m.group(1)) if m else ""


def first_paragraph(chunk: str) -> str:
    m = re.search(r"<p[^>]*>(.*?)</p>", chunk, re.I | re.S)
    return strip_tags(m.group(1)) if m else ""


def span_or_div_text(chunk: str, cls_part: str) -> str:
    m = re.search(
        rf'<(?:span|div)[^>]*class="[^"]*{re.escape(cls_part)}[^"]*"[^>]*>(.*?)</(?:span|div)>',
        chunk,
        re.I | re.S,
    )
    return strip_tags(m.group(1)) if m else ""


def parse_structured(html: str) -> dict:
    html = html[:HTML_CAP]
    features: list[dict] = []
    feature_cls_bits = (
        "feature",
        "benefit",
        "why-card",
        "care-card",
        "expect-card",
        "expectation-card",
        "disease-card",
        "diagnosis-card",
        "pest-card",
        "program-card",
        "local-card",
        "service-card",
        "include-card",
        "fit-card",
        "choice",
        "clue",
        "help-item",
        "compare",
    )

    # Prefer article/div cards with known class fragments
    for tag in ("article", "div"):
        for bit in feature_cls_bits:
            for chunk in chunk_by_tag(html, tag, bit):
                title, body = first_heading(chunk), first_paragraph(chunk)
                if title and body and len(body) > 30 and not title.endswith("?"):
                    features.append({"title": title, "body": body})
            if len(features) >= 8:
                break
        if len(features) >= 8:
            break

    # Fallback: article > h3 + p
    if len(features) < 3:
        for chunk in chunk_by_tag(html, "article"):
            title, body = first_heading(chunk), first_paragraph(chunk)
            if title and body and len(body) > 40 and not title.endswith("?"):
                features.append({"title": title, "body": body})
            if len(features) >= 10:
                break

    # Deduplicate features
    seen: set[str] = set()
    uniq_features: list[dict] = []
    for f in features:
        key = f["title"].lower()
        if key in seen:
            continue
        seen.add(key)
        uniq_features.append(f)
    features = uniq_features[:12]

    rounds: list[dict] = []
    for tag in ("article", "div"):
        for chunk in chunk_by_tag(html, tag, "round"):
            number = (
                span_or_div_text(chunk, "round-number")
                or span_or_div_text(chunk, "round-num")
                or span_or_div_text(chunk, "round-tag")
            )
            date = span_or_div_text(chunk, "round-date")
            title, body = first_heading(chunk), first_paragraph(chunk)
            if title and body:
                rounds.append(
                    {
                        "number": number or str(len(rounds) + 1).zfill(2),
                        "date": date,
                        "title": title,
                        "body": body,
                    }
                )
            if len(rounds) >= 12:
                break
        if len(rounds) >= 12:
            break

    process: list[dict] = []
    for tag in ("article", "div"):
        for bit in ("process-step", "step-card", "how-step"):
            for chunk in chunk_by_tag(html, tag, bit):
                number = (
                    span_or_div_text(chunk, "step-number")
                    or span_or_div_text(chunk, "step-num")
                    or str(len(process) + 1)
                )
                title, body = first_heading(chunk), first_paragraph(chunk)
                if title and body:
                    process.append({"number": number, "title": title, "body": body})
                if len(process) >= 8:
                    break
            if len(process) >= 8:
                break
        if len(process) >= 8:
            break

    # Generic numbered steps: div.step / article.step
    if len(process) < 2:
        for tag in ("article", "div"):
            for chunk in chunk_by_tag(html, tag, "step"):
                if "process" in chunk.lower()[:80] or "step" in chunk.lower()[:120]:
                    title, body = first_heading(chunk), first_paragraph(chunk)
                    if title and body and len(body) > 25:
                        process.append(
                            {
                                "number": str(len(process) + 1),
                                "title": title,
                                "body": body,
                            }
                        )
                if len(process) >= 8:
                    break

    faqs: list[dict] = []
    for m in re.finditer(
        r"<details[^>]*>\s*<summary[^>]*>(.*?)</summary>\s*(?:<div[^>]*>)?(.*?)(?:</div>)?\s*</details>",
        html,
        re.I | re.S,
    ):
        q, a = strip_tags(m.group(1)), strip_tags(m.group(2))
        q = re.sub(r"^\+\s*", "", q)
        if q and a and len(a) > 25:
            faqs.append({"q": q, "a": a})
        if len(faqs) >= 16:
            break

    hero_sub = ""
    for cls in (
        "ggl-hero-sub",
        "ggfa-hero-sub",
        "ggmft-hero-sub",
        "ggfb-hero-sub",
        "ggts-hero-sub",
        "ggca-hero-sub",
        "hero-sub",
    ):
        m = re.search(rf'<p[^>]*class="[^"]*{cls}[^"]*"[^>]*>(.*?)</p>', html, re.I | re.S)
        if m:
            hero_sub = strip_tags(m.group(1))
            break
    if not hero_sub:
        m = re.search(r"<h1[^>]*>.*?</h1>\s*<p[^>]*>(.*?)</p>", html, re.I | re.S)
        if m:
            cand = strip_tags(m.group(1))
            if 40 < len(cand) < 400:
                hero_sub = cand

    local_title = ""
    m = re.search(r"<h2[^>]*>(Louisiana lawns.*?)</h2>", html, re.I | re.S)
    if m:
        local_title = strip_tags(m.group(1))
    if not local_title:
        h2s = [strip_tags(x) for x in re.findall(r"<h2[^>]*>(.*?)</h2>", html, re.I | re.S)]
        h2s = [h for h in h2s if h and 20 < len(h) < 120 and not h.lower().startswith("get ")]
        if h2s:
            local_title = h2s[0]

    local_lead = ""
    leads = [strip_tags(x) for x in re.findall(r'<p[^>]*class="[^"]*lead[^"]*"[^>]*>(.*?)</p>', html, re.I | re.S)]
    leads = [x for x in leads if len(x) > 50]
    if leads:
        local_lead = leads[0]

    honest = ""
    for bit in ("honest", "expectation", "note-card"):
        for chunk in chunk_by_tag(html, "div", bit) + chunk_by_tag(html, "aside", bit):
            strong = ""
            sm = re.search(r"<strong[^>]*>(.*?)</strong>", chunk, re.I | re.S)
            if sm:
                strong = strip_tags(sm.group(1))
            body = first_paragraph(chunk)
            if body:
                honest = f"{strong} {body}".strip()
                break
        if honest:
            break

    return {
        "hero_sub": hero_sub,
        "local_title": local_title,
        "local_lead": local_lead,
        "honest_note": honest,
        "features": features,
        "rounds": rounds[:12],
        "process": process[:8],
        "real_faqs": faqs[:16],
    }


def main() -> int:
    n = 0
    paths = sorted(CONTENT.glob("*.json"))
    for i, path in enumerate(paths, 1):
        if path.name.startswith("_"):
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        html = data.get("html") or ""
        structured = parse_structured(html)
        data["structured"] = structured
        if structured["real_faqs"]:
            data["faqs"] = structured["real_faqs"]
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        hit = (
            structured["features"]
            or structured["rounds"]
            or structured["real_faqs"]
            or structured["process"]
        )
        if hit:
            n += 1
            print(
                f"{path.stem}: features={len(structured['features'])} "
                f"rounds={len(structured['rounds'])} "
                f"faqs={len(structured['real_faqs'])} "
                f"process={len(structured['process'])}",
                flush=True,
            )
        if i % 10 == 0:
            print(f"... {i}/{len(paths)}", flush=True)
    print(f"enriched {n} pages", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
