#!/usr/bin/env python3
"""
Atlas daily pipeline.

  1. Collect roles from FREE sources only (see sources.py):
       ATS boards (Greenhouse/Lever/Ashby), free public APIs, and JobSpy
  2. Deduplicate against what we already have
  3. Classify each role into a geography bucket
  4. For NEW roles above a score floor, run the recruiter prompt through
     Claude + Gemini + ChatGPT and merge the three verdicts
  5. Emit src/data/atlas.js and a digest of what changed

Environment variables:
  ANTHROPIC_API_KEY  optional   enables Claude
  GEMINI_API_KEY     optional   enables Gemini
  OPENAI_API_KEY     optional   enables ChatGPT
  MAX_ANALYZE        optional   hard cap on deep analyses per run (default 12)
  SCORE_FLOOR        optional   only analyze roles scoring >= this (default 68)
  USE_JOBSPY         optional   "0" disables the JobSpy tier (default on)

Any model whose key is absent is silently skipped. If none are set the
pipeline still scrapes, scores heuristically, and updates the site.
"""

from __future__ import annotations
import json, os, re, sys, time, pathlib, datetime, urllib.request, urllib.error

ROOT = pathlib.Path(__file__).resolve().parents[2]
DATA_JS = ROOT / "src" / "data" / "atlas.js"
STATE = ROOT / "scripts" / "pipeline" / "state.json"
RESUME = (ROOT / "scripts" / "pipeline" / "resume.txt").read_text(encoding="utf-8")

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import sources

MAX_ANALYZE = int(os.environ.get("MAX_ANALYZE", "12"))
SCORE_FLOOR = int(os.environ.get("SCORE_FLOOR", "68"))
USE_JOBSPY = os.environ.get("USE_JOBSPY", "1") != "0"

# Region hubs — first match wins, checked in this order.
SD = ["san diego", "la jolla", "carlsbad", "del mar", "encinitas", "oceanside",
      "escondido", "chula vista", "poway", "vista, ca", "san marcos", "solana beach",
      "rancho bernardo", "sorrento valley"]
LA = ["los angeles", "pasadena", "santa monica", "burbank", "glendale", "torrance",
      "long beach", "el segundo", "culver city", "irvine", "costa mesa", "anaheim",
      "santa ana", "newport beach", "orange, ca", "woodland hills", "van nuys"]
BAY = ["san francisco", "san jose", "palo alto", "mountain view", "sunnyvale",
       "menlo park", "oakland", "berkeley", "santa clara", "cupertino",
       "redwood city", "fremont", "foster city", "south san francisco", "emeryville"]

GEOS = {
    "sd": "San Diego",
    "la": "Los Angeles",
    "bay": "Bay Area",
    "remote": "Remote",
    "out": "Out of state",
}


# ----------------------------------------------------------------- helpers

def post_json(url, payload, headers, timeout=180):
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", **headers}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def get_json(url, timeout=120):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.loads(r.read().decode())


def classify_geo(loc: str, is_remote: bool) -> str:
    l = (loc or "").lower()
    if is_remote or "remote" in l or "anywhere" in l:
        return "remote"
    for k in SD:
        if k in l:
            return "sd"
    for k in LA:
        if k in l:
            return "la"
    for k in BAY:
        if k in l:
            return "bay"
    if re.search(r",\s*ca\b|california", l):
        return "out"          # CA but not a tracked hub
    return "out"


SENIOR = re.compile(
    r"\b(senior|sr\.?|staff|principal|lead|manager|director|head of|architect|"
    r"vp|president|distinguished|fellow)\b", re.I)
JUNIOR = re.compile(r"\b(junior|jr\.?|associate|entry[- ]level|new ?grad|college graduate|i{1,2}\b)", re.I)
CORE = re.compile(r"\b(ios|swift|swiftui|mobile|arkit|embedded|firmware|bluetooth|"
                  r"computer vision|machine learning|bioinformatic|perception)\b", re.I)
NOISE = re.compile(r"\b(sales|account executive|recruiter|construction|nurse|"
                   r"technician|marketing|business development|clinical research associate)\b", re.I)


def heuristic_score(job) -> int:
    """Cheap pre-score so we only spend model tokens on plausible roles."""
    t = job.get("title", "") or ""
    if NOISE.search(t):
        return 0
    s = 58
    if CORE.search(t):
        s += 14
    if JUNIOR.search(t):
        s += 12
    if SENIOR.search(t):
        s -= 18
    if re.search(r"\bintern\b", t, re.I):
        s -= 10
    d = (job.get("description") or "")[:4000]
    for kw, w in [("swift", 5), ("swiftui", 4), ("core bluetooth", 5), ("arkit", 6),
                  ("app store", 4), ("freertos", 4), ("pytorch", 3), ("accessibility", 3)]:
        if kw in d.lower():
            s += w
    smin = job.get("salary_min") or 0
    if 80000 <= smin <= 145000:
        s += 5
    if smin > 190000:
        s -= 8
    return max(0, min(97, s))


# ----------------------------------------------------------------- scraping

def scrape() -> list[dict]:
    """All free sources, deduped."""
    try:
        return sources.collect(use_jobspy=USE_JOBSPY)
    except Exception as e:
        print(f"!! collection failed: {e}", file=sys.stderr)
        return []


# ----------------------------------------------------------------- models

PROMPT = """Act as a senior recruiter for {company}. Analyze the resume below against this job description.

Return STRICT JSON only, no prose, with exactly these keys:
{{
 "score": <integer 0-100 match score>,
 "keywords": [<the 5 most important missing keywords, strings>],
 "flags": [<the 3 red flags a hiring manager would spot in under 10 seconds, strings>],
 "rewrite": [<4-5 rewritten experience bullets using the Google XYZ formula: "Accomplished X as measured by Y by doing Z". Naturally include the missing keywords and remove the red flags. Do not invent facts not supported by the resume.>],
 "ats": "<Acting as an ATS filter: which sections parse poorly or get down-ranked, and why>",
 "scan": "<Acting as a hiring manager reading 200 resumes in one sitting: which sections get skipped, and how to rewrite them so they stop the scroll>",
 "verdict": "<one sentence: apply now / apply after X / skip, and why>"
}}

=== JOB: {title} at {company} ({location}) ===
{jd}

=== RESUME ===
{resume}
"""


def call_claude(prompt):
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        return None
    r = post_json("https://api.anthropic.com/v1/messages", {
        "model": "claude-sonnet-4-5",
        "max_tokens": 2000,
        "messages": [{"role": "user", "content": prompt}],
    }, {"x-api-key": key, "anthropic-version": "2023-06-01"})
    return r["content"][0]["text"]


def call_gemini(prompt):
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        return None
    url = ("https://generativelanguage.googleapis.com/v1beta/models/"
           f"gemini-2.0-flash:generateContent?key={key}")
    r = post_json(url, {"contents": [{"parts": [{"text": prompt}]}]}, {})
    return r["candidates"][0]["content"]["parts"][0]["text"]


def call_openai(prompt):
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        return None
    r = post_json("https://api.openai.com/v1/chat/completions", {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 2000,
    }, {"Authorization": f"Bearer {key}"})
    return r["choices"][0]["message"]["content"]


def parse_json_blob(text):
    if not text:
        return None
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None


def analyze(job) -> dict | None:
    """Fan out to all three models; merge into one consensus verdict."""
    jd = (job.get("description") or "")[:9000]
    if len(jd) < 200:
        return None
    prompt = PROMPT.format(
        company=job.get("company") or "the company",
        title=job.get("title") or "",
        location=job.get("location") or "",
        jd=jd, resume=RESUME)

    panel = {}
    for name, fn in (("claude", call_claude), ("gemini", call_gemini), ("chatgpt", call_openai)):
        try:
            got = parse_json_blob(fn(prompt))
            if got:
                panel[name] = got
                print(f"      {name}: {got.get('score')}")
        except Exception as e:
            print(f"      !! {name} failed: {e}", file=sys.stderr)

    if not panel:
        return None

    scores = [v["score"] for v in panel.values() if isinstance(v.get("score"), (int, float))]
    consensus = round(sum(scores) / len(scores)) if scores else None

    def union(field, cap):
        seen, out = set(), []
        for v in panel.values():
            for x in (v.get(field) or []):
                k = str(x).strip().lower()[:60]
                if k and k not in seen:
                    seen.add(k)
                    out.append(str(x).strip())
        return out[:cap]

    best = max(panel.values(), key=lambda v: len(str(v.get("scan", ""))))
    return {
        "consensus": consensus,
        "panel": {k: v.get("score") for k, v in panel.items()},
        "spread": (max(scores) - min(scores)) if len(scores) > 1 else 0,
        "verdict": best.get("verdict", ""),
        "rationale": f"Consensus of {len(panel)} model(s): "
                     + ", ".join(f"{k} {v.get('score')}" for k, v in panel.items()) + ".",
        "keywords": union("keywords", 8),
        "flags": union("flags", 5),
        "rewrite": union("rewrite", 6),
        "ats": best.get("ats", ""),
        "scan": best.get("scan", ""),
    }


# ----------------------------------------------------------------- emit

def emit(roles, labs, pass_hash, digest):
    body = [
        "// Auto-generated by scripts/pipeline/run.py — do not hand-edit ROLES.",
        f"// Last run: {digest['date']}",
        "",
        f"export const PASS_HASH = {json.dumps(pass_hash)};",
        "",
        f"export const DIGEST = {json.dumps(digest, ensure_ascii=False, indent=1)};",
        "",
        f"export const ROLES = {json.dumps(roles, ensure_ascii=False, indent=1)};",
        "",
        f"export const LABS = {json.dumps(labs, ensure_ascii=False, indent=1)};",
        "",
    ]
    DATA_JS.write_text("\n".join(body), encoding="utf-8")


def _extract(src: str, name: str, default):
    """Pull `export const NAME = <json>;` out of the generated module.

    Uses balanced-delimiter scanning rather than a regex: the emitted file has
    blank lines between exports, which trivially defeats lookahead patterns and
    silently concatenates two values into one (JSONDecodeError: Extra data).
    String literals are tracked so brackets inside descriptions don't confuse
    the depth counter.
    """
    m = re.search(rf"export\s+const\s+{name}\s*=\s*", src)
    if not m:
        return default
    i = m.end()
    if i >= len(src):
        return default

    open_ch = src[i]
    if open_ch == '"':                       # plain string export (PASS_HASH)
        j, esc = i + 1, False
        while j < len(src):
            c = src[j]
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                return json.loads(src[i:j + 1])
            j += 1
        return default

    close_ch = {"[": "]", "{": "}"}.get(open_ch)
    if not close_ch:
        return default

    depth, j, in_str, esc = 0, i, False, False
    while j < len(src):
        c = src[j]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == open_ch:
                depth += 1
            elif c == close_ch:
                depth -= 1
                if depth == 0:
                    return json.loads(src[i:j + 1])
        j += 1
    return default


def read_existing():
    """Current ROLES / LABS / PASS_HASH from the generated module."""
    if not DATA_JS.exists():
        return [], [], ""
    src = DATA_JS.read_text(encoding="utf-8")
    return (_extract(src, "ROLES", []),
            _extract(src, "LABS", []),
            _extract(src, "PASS_HASH", ""))


def main():
    roles, labs, pass_hash = read_existing()
    known = {r.get("url") for r in roles if r.get("url")}
    for r in roles:
        r.setdefault("geo", classify_geo(r.get("loc", ""), False))

    print(f"-- existing: {len(roles)} roles, {len(labs)} labs")
    raw = scrape()
    print(f"-- scraped {len(raw)} raw rows")

    fresh = []
    for j in raw:
        url = j.get("job_url")
        if not url or url in known:
            continue
        s = heuristic_score(j)
        if s < 50:
            continue
        known.add(url)
        fresh.append({
            "id": "auto-" + re.sub(r"\W+", "", (j.get("id") or url))[-18:],
            "title": (j.get("title") or "").strip(),
            "company": (j.get("company") or "Unknown").strip(),
            "loc": j.get("location") or "",
            "url": url,
            "site": (j.get("site") or "").title(),
            "posted": j.get("date_posted") or "",
            "smin": j.get("salary_min"),
            "smax": j.get("salary_max"),
            "track": "Auto",
            "score": s,
            "geo": classify_geo(j.get("location"), bool(j.get("is_remote"))),
            "analyzed": False,
            "_jd": (j.get("description") or "")[:9000],
            "new": True,
        })

    print(f"-- {len(fresh)} new after dedupe + filter")

    queue = sorted([f for f in fresh if f["score"] >= SCORE_FLOOR],
                   key=lambda x: -x["score"])[:MAX_ANALYZE]
    print(f"-- analyzing {len(queue)} (floor {SCORE_FLOOR}, cap {MAX_ANALYZE})")

    for f in queue:
        print(f"   → {f['title'][:52]} @ {f['company'][:24]}")
        a = analyze({**f, "description": f["_jd"], "location": f["loc"]})
        if a:
            if a.get("consensus"):
                f["score"] = a["consensus"]
            f["analysis"] = a
            f["analyzed"] = True

    for f in fresh:
        f.pop("_jd", None)

    for r in roles:
        r["new"] = False

    allroles = sorted(fresh + roles, key=lambda x: -x.get("score", 0))

    counts = {k: 0 for k in GEOS}
    for f in fresh:
        counts[f["geo"]] = counts.get(f["geo"], 0) + 1

    digest = {
        "date": datetime.datetime.now(datetime.timezone.utc)
                .astimezone(datetime.timezone(datetime.timedelta(hours=-8)))
                .strftime("%Y-%m-%d"),
        "total_new": len(fresh),
        "analyzed": sum(1 for f in fresh if f.get("analyzed")),
        "counts": {GEOS[k]: v for k, v in counts.items()},
    }

    emit(allroles, labs, pass_hash, digest)
    print(f"-- wrote {len(allroles)} roles. digest: {digest}")


if __name__ == "__main__":
    main()
