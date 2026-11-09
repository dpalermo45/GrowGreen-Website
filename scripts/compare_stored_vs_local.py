#!/usr/bin/env python3
"""Compare stored WP/Divi content JSON paragraphs against local rendered pages."""
from __future__ import annotations

import json
import re
import urllib.request
from collections import Counter
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "src" / "data" / "content"
LOCAL = "http://127.0.0.1:4321"
OUT = ROOT / "docs" / "content-parity-vs-stored.json"
MD = ROOT / "docs" / "content-parity-vs-stored.md"
UA = "GrowGreenContentParityBot/1.0"

SKIP = {
    "test",
    "thank-you",
    "thank-you-nextdoor",
    "thank-you-core-aeration",
    "liquid-aeration-quote-request-received",
    "customer-login-pay-bill",
    "home",  # homepage intentionally redesigned; not a content dump
}

CLAIMISH = re.compile(
    r"600\+|4\.9|★★★★★|satisfaction guaranteed|no long-term contract|8 treatments|"
    r"8 planned|google rating|google review",
    re.I,
)
NOISE = re.compile(
    r"^(src=|https?:|fields marked|escapeHtml|step \d|move the slider)|"
    r"(facebook|instagram|nextdoor|youtube|customer login|get my free)",
    re.I,
)


def strip_tags(html: str) -> str:
    html = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", html)
    html = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", html)
    html = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", unescape(html)).strip()


def normalize(s: str) -> str:
    s = s.lower()
    s = s.replace("\u2019", "'").replace("\u2018", "'")
    s = s.replace("\u2013", "-").replace("\u2014", "-")
    s = re.sub(r"[^a-z0-9$?.'\- ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as res:
        return res.read().decode("utf-8", errors="replace")


def local_plain(slug: str) -> str:
    path = "/" if slug == "home" else f"/{slug}/"
    html = fetch(LOCAL.rstrip("/") + path)
    m = re.search(r"(?is)<main[^>]*>(.*?)</main>", html)
    body = m.group(1) if m else html
    body = re.sub(r"(?is)<form[^>]*>.*?</form>", " ", body)
    return normalize(strip_tags(body))


def substantial_paras(data: dict) -> list[str]:
    out = []
    for p in data.get("paragraphs") or []:
        if not p or len(p) < 70:
            continue
        if NOISE.search(p) or CLAIMISH.search(p):
            continue
        out.append(p)
    # FAQs also matter
    for f in data.get("faqs") or []:
        a = f.get("a") or ""
        if len(a) > 70 and not CLAIMISH.search(a):
            out.append(a)
    # structured feature bodies
    st = data.get("structured") or {}
    for key in ("features", "rounds", "process"):
        for item in st.get(key) or []:
            body = item.get("body") or ""
            if len(body) > 70 and not CLAIMISH.search(body):
                out.append(body)
    for f in st.get("real_faqs") or []:
        a = f.get("a") or ""
        if len(a) > 70 and not CLAIMISH.search(a):
            out.append(a)
    # unique
    seen = set()
    uniq = []
    for p in out:
        k = normalize(p)[:120]
        if k in seen:
            continue
        seen.add(k)
        uniq.append(p)
    return uniq


def coverage(paras: list[str], local_n: str) -> dict:
    hits = 0
    misses = []
    for p in paras:
        pn = normalize(p)
        if pn in local_n:
            hits += 1
            continue
        toks = {t for t in pn.split() if len(t) > 3}
        if not toks:
            continue
        local_toks = set(local_n.split())
        overlap = len(toks & local_toks) / len(toks)
        if overlap >= 0.78:
            hits += 1
        else:
            misses.append(p[:180])
    n = len(paras)
    rate = hits / n if n else 1.0
    return {"checked": n, "hits": hits, "rate": round(rate, 3), "misses": misses[:6]}


def verdict(rate: float) -> str:
    if rate >= 0.85:
        return "strong"
    if rate >= 0.6:
        return "partial"
    if rate >= 0.35:
        return "weak"
    return "thin"


def main() -> int:
    index = []
    for name in ("_pages_index.json", "_posts_index.json"):
        index.extend(json.loads((CONTENT / name).read_text(encoding="utf-8")))

    results = []
    counts = Counter()
    print(f"Comparing {len(index)} stored content files vs local…", flush=True)

    for i, meta in enumerate(index, 1):
        slug = meta["slug"]
        if slug in SKIP:
            continue
        path = CONTENT / f"{slug}.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        paras = substantial_paras(data)
        try:
            local_n = local_plain(slug)
        except Exception as e:
            row = {"slug": slug, "verdict": "fetch_error", "error": str(e)}
            counts["fetch_error"] += 1
            results.append(row)
            print(f"[{i}] {slug} fetch_error", flush=True)
            continue

        cov = coverage(paras, local_n)
        v = verdict(cov["rate"])
        counts[v] += 1
        results.append(
            {
                "slug": slug,
                "path": "/" if slug == "home" else f"/{slug}/",
                "verdict": v,
                "stored_plain_len": data.get("plain_len"),
                "local_len": len(local_n),
                "coverage": cov,
                "kind": meta.get("kind"),
            }
        )
        print(
            f"[{i}] /{slug}/ {v} {cov['hits']}/{cov['checked']} ({cov['rate']:.0%})",
            flush=True,
        )

    report = {
        "method": "stored WP/Divi paragraphs+faqs+structured blocks vs local <main> text",
        "skipped": sorted(SKIP),
        "counts": dict(counts),
        "results": results,
        "caveats": [
            "Scrubbed social-proof claims are excluded from expected copy.",
            "Homepage intentionally redesigned (skipped).",
            "Hub/campaign/careers pages may be partial by design if rebuilt shorter.",
            "Exact HTML/order match is not required — this checks whether original substance is present.",
        ],
    }
    OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    lines = [
        "# Content parity vs stored WordPress extract",
        "",
        "Compares substantial paragraphs / FAQs / structured blocks from `src/data/content/*.json` "
        "against locally rendered `<main>` text.",
        "",
        "## Summary",
        "",
        "| Verdict | Count |",
        "| --- | ---: |",
    ]
    for k in ("strong", "partial", "weak", "thin", "fetch_error"):
        if counts.get(k):
            lines.append(f"| {k} | {counts[k]} |")
    lines += ["", "## Gaps (non-strong)", ""]
    for row in sorted(results, key=lambda r: (0 if r["verdict"] != "strong" else 1, r["slug"])):
        if row["verdict"] == "strong":
            continue
        c = row["coverage"]
        lines.append(
            f"- `{row['path']}` — **{row['verdict']}** · {c['hits']}/{c['checked']} ({c['rate']:.0%})"
        )
        for m in c.get("misses") or []:
            lines.append(f"  - missing: {m}")
    lines += ["", "## Strong matches", ""]
    for row in sorted(results, key=lambda r: r["slug"]):
        if row["verdict"] == "strong":
            c = row["coverage"]
            lines.append(f"- `{row['path']}` · {c['hits']}/{c['checked']}")

    MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(counts, indent=2), flush=True)
    print(f"Wrote {MD}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
