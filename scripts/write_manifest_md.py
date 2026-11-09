import json
from pathlib import Path

data = json.loads(Path("docs/url-migration-manifest.json").read_text(encoding="utf-8"))
lines = [
    "# URL migration manifest",
    "",
    f"Total URLs recorded: **{data['count']}**",
    "",
    "| Path | Outcome | Status | Notes | Sources |",
    "| --- | --- | --- | --- | --- |",
]
for u in data["urls"]:
    notes = (u.get("notes") or "").replace("|", "/")
    if u.get("redirect_to"):
        notes += f" → {u['redirect_to']}"
    if u.get("priority_note"):
        notes += f" | PRIORITY: {u['priority_note']}"
    sources = ", ".join(u.get("sources") or [])
    lines.append(
        f"| `{u['path']}` | {u.get('outcome')} | {u.get('status')} | {notes} | {sources} |"
    )
Path("docs/url-migration-manifest.md").write_text("\n".join(lines), encoding="utf-8")
print("wrote", len(data["urls"]))
