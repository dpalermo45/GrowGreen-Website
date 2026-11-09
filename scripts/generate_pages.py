#!/usr/bin/env python3
"""Generate Astro pages from WP readable extract for retained URLs."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAGES = json.loads((ROOT / "_source_extract/pages_readable.json").read_text(encoding="utf-8"))
POSTS = json.loads((ROOT / "_source_extract/posts_readable.json").read_text(encoding="utf-8"))
OUT = ROOT / "src" / "pages"
SKIP = {"home"}  # hand-authored index.astro


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def scrub(text: str) -> str:
    text = re.sub(r"600\+\s*local lawns[^.]*\.?", "", text, flags=re.I)
    text = re.sub(r"600\+\s*lawns[^.]*\.?", "", text, flags=re.I)
    text = re.sub(r"4\.9[^\n.]*?(rating|reputation|Google)[^.]*\.?", "", text, flags=re.I)
    text = re.sub(r"Satisfaction guaranteed[^.]*\.?", "", text, flags=re.I)
    return re.sub(r"\s{2,}", " ", text).strip()


def body_html(r: dict) -> str:
    paras = [scrub(p) for p in (r.get("paragraphs") or [])]
    paras = [p for p in paras if p and len(p) > 35 and "escapeHtml" not in p and "src=" not in p]
    headings = [scrub(h) for h in (r.get("headings") or []) if h and len(h) < 110]
    lists = [scrub(x) for x in (r.get("list_items") or [])]
    lists = [x for x in lists if x and "escapeHtml" not in x and len(x) < 200 and not x[:1].isdigit()]

    parts: list[str] = []
    for h in headings[1:6]:
        parts.append(f"<h2>{esc(h)}</h2>")
    for p in paras[:12]:
        parts.append(f"<p>{esc(p)}</p>")
    if lists:
        parts.append("<ul>")
        for item in lists[:8]:
            parts.append(f"<li>{esc(item)}</li>")
        parts.append("</ul>")
    if not parts:
        plain = scrub((r.get("plain_text") or "")[:1500])
        parts.append(f"<p>{esc(plain)}</p>")
    return "\n          ".join(parts)


def should_form(slug: str) -> bool:
    keys = (
        "lawn-",
        "weed-control",
        "fire-ant",
        "mosquito",
        "aeration",
        "soil-sample",
        "tree-and-shrub",
        "flower-bed",
        "plant-disease",
        "request-",
        "facebook",
        "nextdoor",
        "trucklead",
        "gym-member",
        "post-card",
        "contact-us",
    )
    return any(k in slug for k in keys) and slug not in {
        "privacy-policy",
        "terms-and-conditions",
        "thank-you",
        "thank-you-nextdoor",
        "thank-you-core-aeration",
        "liquid-aeration-quote-request-received",
        "customer-login-pay-bill",
        "test",
        "careers",
        "lawn-care-blog",
    }


def render(title: str, path: str, seo_title: str, seo_desc: str, body: str, with_form: bool, eyebrow: str = "Grow Green Weed Control") -> str:
    st = esc(seo_title or f"{title} | Grow Green Weed Control")
    sd = esc(seo_desc or f"{title} from Grow Green Weed Control serving South Louisiana.")
    form_import = 'import QuoteForm from "../components/QuoteForm.astro";\n' if with_form else ""
    form_block = (
        """
      <aside class="side-form">
        <QuoteForm source="page-sidebar" />
      </aside>"""
        if with_form
        else ""
    )
    cols = "1fr 0.85fr" if with_form else "1fr"
    return f"""---
import BaseLayout from "../layouts/BaseLayout.astro";
{form_import}---

<BaseLayout
  title="{st}"
  description="{sd}"
  canonicalPath="{path}"
>
  <section class="section page-hero">
    <div class="container">
      <p class="eyebrow">{esc(eyebrow)}</p>
      <h1>{esc(title)}</h1>
    </div>
  </section>
  <section class="section-tight">
    <div class="container page-layout">
      <article class="prose">
          {body}
        <p class="cta-line">
          Lawn fertilization and weed control starts at <strong>$39/month</strong>.
          Final pricing depends on lawn size and selected services.
          Call <a href="tel:+12254613199">(225) 461-3199</a> or
          <a href="/request-a-quote/">request a free estimate</a>.
        </p>
      </article>{form_block}
    </div>
  </section>
</BaseLayout>

<style>
  .page-hero {{
    padding-bottom: 1rem;
    background: linear-gradient(180deg, rgba(47,122,74,0.12), transparent);
  }}
  .page-layout {{
    display: grid;
    gap: 2rem;
  }}
  @media (min-width: 980px) {{
    .page-layout {{
      grid-template-columns: {cols};
      align-items: start;
    }}
  }}
  .prose :global(h2) {{ margin-top: 1.35em; }}
  .side-form {{ position: sticky; top: 6rem; }}
  .cta-line {{
    margin-top: 2rem;
    padding: 1rem;
    background: var(--green-50);
    border-radius: 12px;
  }}
</style>
"""


CAREERS = r'''---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout
  title="Careers | Join Grow Green Weed Control"
  description="Build a career with a firefighter-owned lawn treatment company in South Louisiana."
  canonicalPath="/careers/"
>
  <section class="section">
    <div class="container grid-2">
      <div>
        <p class="eyebrow">Careers at Grow Green</p>
        <h1>Good work. Real responsibility.</h1>
        <p>
          Build a career with a firefighter-owned lawn treatment company serving South Louisiana.
          We train good people and take pride in doing the job right.
        </p>
        <ul>
          <li>Local routes</li>
          <li>Hands-on training</li>
          <li>Performance rewarded</li>
        </ul>
        <p><strong>Applications are kept separate from customer leads.</strong></p>
      </div>
      <div class="form-panel">
        <h2>Apply online</h2>
        <form id="careers-form">
          <div class="hp" aria-hidden="true"><input type="text" name="website" tabindex="-1" autocomplete="off" /></div>
          <div class="field"><label>Full name<input name="name" required /></label></div>
          <div class="field"><label>Email<input type="email" name="email" required /></label></div>
          <div class="field"><label>Phone<input type="tel" name="phone" required /></label></div>
          <div class="field"><label>Role interest<input name="role" placeholder="Technician, office, etc." /></label></div>
          <div class="field"><label>Tell us about yourself<textarea name="message" rows="4"></textarea></label></div>
          <button class="btn btn-gold" type="submit">Submit application</button>
          <div class="form-status" data-status hidden></div>
        </form>
      </div>
    </div>
  </section>
</BaseLayout>
<script>
  const form = document.getElementById("careers-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = form.querySelector("[data-status]");
    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());
    status.hidden = false;
    status.className = "form-status pending";
    status.textContent = "Sending…";
    try {
      const res = await fetch("/api/careers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        status.className = "form-status error";
        status.textContent = data.message || "Could not send application. Please call (225) 461-3199.";
        return;
      }
      status.className = "form-status success";
      status.textContent = data.message || "Application received.";
      form.querySelectorAll("input,textarea,button").forEach((el) => (el.disabled = true));
    } catch {
      status.className = "form-status error";
      status.textContent = "Network error. Please email office@growgreenweedcontrol.com.";
    }
  });
</script>
'''


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    n = 0
    for p in PAGES:
        slug = p["slug"]
        if slug in SKIP:
            continue
        path = f"/{slug}/"
        if slug == "careers":
            (OUT / "careers.astro").write_text(CAREERS, encoding="utf-8")
        elif slug == "customer-login-pay-bill":
            (OUT / f"{slug}.astro").write_text(
                """---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout title="Customer Login / Pay Bill | Grow Green Weed Control" description="Access the Grow Green customer portal." canonicalPath="/customer-login-pay-bill/">
  <section class="section"><div class="container">
    <h1>Customer Portal</h1>
    <p>Payments and account management live in our customer portal.</p>
    <a class="btn btn-green" href="https://portal.growgreenweedcontrol.com/portal/" rel="noopener">Open Customer Portal</a>
  </div></section>
</BaseLayout>
""",
                encoding="utf-8",
            )
        elif slug == "test":
            (OUT / "test.astro").write_text(
                """---
import BaseLayout from "../layouts/BaseLayout.astro";
---
<BaseLayout title="Page retired" description="Retired URL" canonicalPath="/test/" noindex={true}>
  <section class="section"><div class="container"><h1>Page retired</h1><p>This test URL is intentionally retired.</p><a href="/">Home</a></div></section>
</BaseLayout>
""",
                encoding="utf-8",
            )
        else:
            content = render(
                p["title"],
                path,
                p.get("seo_title") or "",
                p.get("seo_desc") or "",
                body_html(p["readable"]),
                should_form(slug),
            )
            (OUT / f"{slug}.astro").write_text(content, encoding="utf-8")
        n += 1

    for post in POSTS:
        content = render(
            post["title"],
            f"/{post['slug']}/",
            post.get("seo_title") or "",
            post.get("seo_desc") or "",
            body_html(post["readable"]),
            False,
            eyebrow="Lawn tips",
        )
        (OUT / f"{post['slug']}.astro").write_text(content, encoding="utf-8")
        n += 1

    print(f"wrote {n} pages")


if __name__ == "__main__":
    main()
