#!/usr/bin/env python3
"""Compare main-content text: live WordPress vs local preview for retained URLs."""
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from collections import Counter
from difflib import SequenceMatcher
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "content-parity-report.json"
MD = ROOT / "docs" / "content-parity-report.md"
LIVE = "https://growgreenweedcontrol.com"
LOCAL = "http://127.0.0.1:4321"
UA = "GrowGreenContentParityBot/1.0 (+local rebuild)"

SKIP_SLUGS = {
    "test",
    "thank-you",
    "thank-you-nextdoor",
    "thank-you-core-aeration",
    "liquid-aeration-quote-request-received",
    "customer-login-pay-bill",  # portal handoff, not article body
}

# Nav/chrome phrases that inflate "matches" without proving body parity
NOISE = re.compile(
    r"(skip to content|customer login|get my free quote|request my free estimate|"
    r"locally owned|serving south louisiana|fields marked|message/data rates|"
    r"©\s*\d{4}|all rights reserved|privacy policy|terms (&|and) conditions|"
    r"prefer to talk|monday.?friday|office@growgreen|facebook|instagram|nextdoor|"
    r"youtube|plans start at \$39|starting at \$39)",
    re.I,
)


def strip_tags(html: str) -> str:
    html = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", html)
    html = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", html)
    html = re.sub(r"(?is)<noscript[^>]*>.*?</noscript>", " ", html)
    html = re.sub(r"(?is)<!--.*?-->", " ", html)
    html = re.sub(r"<[^>]+>", " ", html)
    html = unescape(html)
    return re.sub(r"\s+", " ", html).strip()


def normalize(s: str) -> str:
    s = s.lower()
    s = s.replace("\u2019", "'").replace("\u2018", "'").replace("\u201c", '"').replace("\u201d", '"')
    s = s.replace("\u2013", "-").replace("\u2014", "-")
    s = re.sub(r"[^a-z0-9$?.'\- ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def extract_main(html: str) -> dict:
    title_m = re.search(r"<title[^>]*>(.*?)</title>", html, re.I | re.S)
    title = strip_tags(title_m.group(1)) if title_m else ""

    main = None
    for pat in (
        r"(?is)<main[^>]*>(.*?)</main>",
        r'(?is)<div[^>]+id=["\']main-content["\'][^>]*>(.*?)</div>',
        r"(?is)<article[^>]*>(.*?)</article>",
    ):
        m = re.search(pat, html)
        if m and len(m.group(1)) > 400:
            main = m.group(1)
            break
    if not main:
        # Divi / WP fallback
        m = re.search(
            r'(?is)<div[^>]+class=["\'][^"\']*et_pb_post_content[^"\']*["\'][^>]*>(.*?)</div>',
            html,
        )
        if m and len(m.group(1)) > 400:
            main = m.group(1)
    if not main:
        bod = re.search(r"(?is)<body[^>]*>(.*?)</body>", html)
        main = bod.group(1) if bod else html

    main = re.sub(r"(?is)<header[^>]*>.*?</header>", " ", main)
    main = re.sub(r"(?is)<footer[^>]*>.*?</footer>", " ", main)
    main = re.sub(r"(?is)<nav[^>]*>.*?</nav>", " ", main)
    main = re.sub(r"(?is)<form[^>]*>.*?</form>", " ", main)

    headings = [strip_tags(h) for h in re.findall(r"(?is)<h[1-6][^>]*>(.*?)</h[1-6]>", main)]
    headings = [h for h in headings if h and 3 < len(h) < 160 and not NOISE.search(h)]

    paragraphs = [strip_tags(p) for p in re.findall(r"(?is)<p[^>]*>(.*?)</p>", main)]
    paragraphs = [
        p
        for p in paragraphs
        if p and len(p) > 40 and not NOISE.search(p) and not p.startswith("http")
    ]

    plain = strip_tags(main)
    # Drop heavy chrome leftovers
    plain_n = normalize(plain)
    return {
        "title": title,
        "headings": headings,
        "paragraphs": paragraphs,
        "plain": plain,
        "plain_n": plain_n,
        "plain_len": len(plain),
    }


def fetch(url: str) -> tuple[int, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    try:
        with urllib.request.urlopen(req, timeout=40) as res:
            return res.status, res.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace") if e.fp else ""
        return e.code, body
    except Exception as e:
        return 0, str(e)


def retained_paths() -> list[str]:
    """Paths we expect to serve content for."""
    paths: list[str] = []
    for name in ("_pages_index.json", "_posts_index.json"):
        data = json.loads((ROOT / "src" / "data" / "content" / name).read_text(encoding="utf-8"))
        for row in data:
            slug = row["slug"]
            if slug in SKIP_SLUGS:
                continue
            if slug == "home":
                paths.append("/")
            else:
                paths.append(f"/{slug}/")
    # de-dupe
    seen = set()
    out = []
    for p in paths:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def token_set(text: str) -> set[str]:
    return {t for t in normalize(text).split() if len(t) > 3}


def paragraph_coverage(live_paras: list[str], local_plain_n: str) -> dict:
    """How many substantial live paragraphs appear in local body (fuzzy)."""
    hits = 0
    misses: list[str] = []
    checked = 0
    for p in live_paras:
        pn = normalize(p)
        if len(pn) < 60:
            continue
        if NOISE.search(p):
            continue
        checked += 1
        # direct substring or high similarity window
        if pn in local_plain_n:
            hits += 1
            continue
        # token overlap
        toks = token_set(p)
        if not toks:
            continue
        local_toks = set(local_plain_n.split())
        overlap = len(toks & local_toks) / max(len(toks), 1)
        if overlap >= 0.82:
            hits += 1
        else:
            misses.append(p[:160])
    rate = (hits / checked) if checked else 1.0
    return {"checked": checked, "hits": hits, "rate": round(rate, 3), "misses": misses[:8]}


def heading_coverage(live_heads: list[str], local_heads: list[str], local_plain_n: str) -> dict:
    hits = 0
    misses = []
    checked = 0
    local_n = [normalize(h) for h in local_heads]
    for h in live_heads:
        hn = normalize(h)
        if len(hn) < 8 or NOISE.search(h):
            continue
        checked += 1
        if any(hn == x or hn in x or x in hn for x in local_n) or hn in local_plain_n:
            hits += 1
        else:
            misses.append(h)
    rate = (hits / checked) if checked else 1.0
    return {"checked": checked, "hits": hits, "rate": round(rate, 3), "misses": misses[:10]}


def classify(para_rate: float, head_rate: float, ratio: float) -> str:
    if para_rate >= 0.85 and head_rate >= 0.7:
        return "strong"
    if para_rate >= 0.6 and head_rate >= 0.5:
        return "partial"
    if para_rate >= 0.35:
        return "weak"
    if ratio < 0.25:
        return "thin_local"
    return "divergent"


def main() -> int:
    paths = retained_paths()
    results = []
    counts = Counter()

    print(f"Comparing {len(paths)} paths live vs local…", flush=True)
    for i, path in enumerate(paths, 1):
        live_url = LIVE.rstrip("/") + path
        local_url = LOCAL.rstrip("/") + path
        live_status, live_html = fetch(live_url)
        time.sleep(0.25)
        local_status, local_html = fetch(local_url)

        row = {
            "path": path,
            "live_status": live_status,
            "local_status": local_status,
        }

        if live_status != 200 or local_status != 200:
            row["verdict"] = "fetch_error"
            row["note"] = f"live={live_status} local={local_status}"
            counts["fetch_error"] += 1
            results.append(row)
            print(f"[{i}/{len(paths)}] {path} FETCH live={live_status} local={local_status}", flush=True)
            continue

        live = extract_main(live_html)
        local = extract_main(local_html)
        ratio = SequenceMatcher(None, live["plain_n"][:12000], local["plain_n"][:12000]).ratio()
        para = paragraph_coverage(live["paragraphs"], local["plain_n"])
        heads = heading_coverage(live["headings"], local["headings"], local["plain_n"])
        verdict = classify(para["rate"], heads["rate"], ratio)
        counts[verdict] += 1

        row.update(
            {
                "verdict": verdict,
                "similarity": round(ratio, 3),
                "live_plain_len": live["plain_len"],
                "local_plain_len": local["plain_len"],
                "paragraph_coverage": para,
                "heading_coverage": heads,
                "live_title": live["title"][:120],
                "local_title": local["title"][:120],
            }
        )
        results.append(row)
        print(
            f"[{i}/{len(paths)}] {path} {verdict} "
            f"para={para['rate']:.0%} head={heads['rate']:.0%} sim={ratio:.2f}",
            flush=True,
        )

    report = {
        "compared": len(results),
        "counts": dict(counts),
        "live_base": LIVE,
        "local_base": LOCAL,
        "results": results,
        "notes": [
            "Exact 1:1 HTML match is not expected: scrubbed claims, rebuilt forms, pricing wording polish, and structured Divi → Astro conversion.",
            "strong = most substantial live paragraphs and headings present in local body text.",
            "partial/weak/divergent = content gaps vs live; review missed paragraph samples.",
            "Thank-you / test / portal handoff pages were skipped as non-article surfaces.",
        ],
    }
    OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Content parity report (live vs local)",
        "",
        f"Compared **{len(results)}** retained page/post URLs.",
        f"Live: `{LIVE}` · Local: `{LOCAL}`",
        "",
        "## Summary",
        "",
        "| Verdict | Count |",
        "| --- | ---: |",
    ]
    for k in ("strong", "partial", "weak", "divergent", "thin_local", "fetch_error"):
        if counts.get(k):
            lines.append(f"| {k} | {counts[k]} |")
    lines += [
        "",
        "## Notes",
        "",
    ]
    lines += [f"- {n}" for n in report["notes"]]
    lines += ["", "## Per-URL results", ""]

    order = {"fetch_error": 0, "divergent": 1, "thin_local": 2, "weak": 3, "partial": 4, "strong": 5}
    for row in sorted(results, key=lambda r: (order.get(r["verdict"], 9), r["path"])):
        if row["verdict"] == "fetch_error":
            lines.append(f"- `{row['path']}` — **fetch_error** ({row.get('note')})")
            continue
        pc = row["paragraph_coverage"]
        hc = row["heading_coverage"]
        lines.append(
            f"- `{row['path']}` — **{row['verdict']}** · para {pc['hits']}/{pc['checked']} "
            f"({pc['rate']:.0%}) · headings {hc['hits']}/{hc['checked']} ({hc['rate']:.0%}) · "
            f"sim {row['similarity']:.2f} · lens {row['live_plain_len']}→{row['local_plain_len']}"
        )
        if row["verdict"] != "strong" and pc.get("misses"):
            for m in pc["misses"][:3]:
                lines.append(f"  - missing sample: {m}")

    MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(counts, indent=2), flush=True)
    print(f"Wrote {OUT}", flush=True)
    print(f"Wrote {MD}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
