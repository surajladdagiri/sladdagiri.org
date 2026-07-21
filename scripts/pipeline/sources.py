"""
Free job sources for the Atlas pipeline. No paid APIs, no API keys required
for any of these.

Three tiers, most-to-least reliable:

  1. ATS boards (Greenhouse / Lever / Ashby)
     Public JSON endpoints every company using these platforms exposes.
     100% free, never rate-limited in practice, and they include the FULL
     job description — which is what the model analysis actually needs.
     The only cost is maintaining the company slug list below.

  2. Public job APIs (Remotive, Arbeitnow)
     Free, keyless, CORS-open. Remote-heavy but real.

  3. JobSpy (LinkedIn / Indeed / Glassdoor / Google / ZipRecruiter)
     Open-source scraper: pip install python-jobspy
     Broadest coverage, but these boards actively block datacenter IPs.
     From a GitHub Actions runner expect Indeed and Google to work most of
     the time and LinkedIn to be unreliable. It degrades, it doesn't break.
"""

from __future__ import annotations
import json, re, time, urllib.request, urllib.error

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " \
     "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def _get(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def _strip_html(s: str) -> str:
    if not s:
        return ""
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", s, flags=re.S | re.I)
    s = re.sub(r"<br\s*/?>|</p>|</li>", "\n", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = (s.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
           .replace("&nbsp;", " ").replace("&#39;", "'").replace("&quot;", '"'))
    return re.sub(r"[ \t]{2,}", " ", re.sub(r"\n{3,}", "\n\n", s)).strip()


def _row(title, company, location, url, desc, site, posted=None,
         smin=None, smax=None, remote=False):
    return {
        "title": (title or "").strip(),
        "company": (company or "").strip(),
        "location": (location or "").strip(),
        "job_url": url,
        "description": _strip_html(desc)[:12000],
        "site": site,
        "date_posted": posted or "",
        "salary_min": smin,
        "salary_max": smax,
        "is_remote": remote,
    }


# --------------------------------------------------------------------------
# 1. ATS boards — free, reliable, full descriptions
# --------------------------------------------------------------------------

# Add or remove slugs freely. A wrong slug just 404s and is skipped.
# Find a company's slug by opening its careers page and looking at the URL:
#   boards.greenhouse.io/SLUG   |   jobs.lever.co/SLUG   |   jobs.ashbyhq.com/SLUG
GREENHOUSE = [
    "databricks", "figma", "anthropic", "openai", "ramp", "notion",
    "scaleai", "rippling", "cruise", "verkada", "samsara", "benchling",
    "sofi", "brex", "airtable", "vercel",
]
LEVER = [
    "netflix", "spotify", "plaid", "attentive", "gopuff", "eventbrite",
]
ASHBY = [
    "linear", "supabase", "runwayml", "cohere", "modal", "clay",
]


def greenhouse(slug):
    try:
        d = _get(f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true")
    except Exception:
        return []
    out = []
    for j in d.get("jobs", []):
        out.append(_row(
            j.get("title"), slug.title(),
            (j.get("location") or {}).get("name", ""),
            j.get("absolute_url"),
            j.get("content", ""), "Greenhouse",
            (j.get("updated_at") or "")[:10],
        ))
    return out


def lever(slug):
    try:
        d = _get(f"https://api.lever.co/v0/postings/{slug}?mode=json")
    except Exception:
        return []
    out = []
    for j in d:
        cat = j.get("categories") or {}
        out.append(_row(
            j.get("text"), slug.title(), cat.get("location", ""),
            j.get("hostedUrl"),
            (j.get("descriptionPlain") or j.get("description") or ""),
            "Lever",
        ))
    return out


def ashby(slug):
    try:
        d = _get(f"https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true")
    except Exception:
        return []
    out = []
    for j in d.get("jobs", []):
        out.append(_row(
            j.get("title"), slug.title(), j.get("location", ""),
            j.get("jobUrl"),
            j.get("descriptionPlain") or j.get("descriptionHtml") or "",
            "Ashby", (j.get("publishedAt") or "")[:10],
            remote=bool(j.get("isRemote")),
        ))
    return out


def ats_boards():
    rows = []
    for fn, slugs in ((greenhouse, GREENHOUSE), (lever, LEVER), (ashby, ASHBY)):
        for s in slugs:
            got = fn(s)
            if got:
                print(f"   {fn.__name__:>10} {s:<14} {len(got):>4}")
            rows.extend(got)
            time.sleep(0.25)
    return rows


# --------------------------------------------------------------------------
# 2. Free public APIs — keyless
# --------------------------------------------------------------------------

def remotive():
    try:
        d = _get("https://remotive.com/api/remote-jobs?category=software-dev&limit=200")
    except Exception:
        return []
    return [_row(j.get("title"), j.get("company_name"),
                 j.get("candidate_required_location") or "Remote",
                 j.get("url"), j.get("description", ""), "Remotive",
                 (j.get("publication_date") or "")[:10], remote=True)
            for j in d.get("jobs", [])]


def arbeitnow():
    rows = []
    for page in (1, 2):
        try:
            d = _get(f"https://www.arbeitnow.com/api/job-board-api?page={page}")
        except Exception:
            break
        for j in d.get("data", []):
            rows.append(_row(j.get("title"), j.get("company_name"),
                             j.get("location", ""), j.get("url"),
                             j.get("description", ""), "Arbeitnow",
                             remote=bool(j.get("remote"))))
        time.sleep(0.3)
    return rows


def free_apis():
    out = []
    for fn in (remotive, arbeitnow):
        got = fn()
        print(f"   {fn.__name__:>10} {'':<14} {len(got):>4}")
        out.extend(got)
    return out


# --------------------------------------------------------------------------
# 3. JobSpy — open-source scraper for the big boards
# --------------------------------------------------------------------------

JOBSPY_TERMS = [
    "iOS engineer", "Swift developer", "mobile software engineer",
    "software engineer new grad", "computer vision engineer",
    "embedded software engineer", "machine learning engineer",
    "bioinformatics engineer",
]
JOBSPY_LOCATIONS = [
    "San Diego, CA", "Los Angeles, CA", "San Francisco, CA", "United States",
]


def jobspy(per_search=40, hours_old=48):
    try:
        from jobspy import scrape_jobs
    except ImportError:
        print("   !! python-jobspy not installed — skipping (pip install python-jobspy)")
        return []

    rows = []
    for loc in JOBSPY_LOCATIONS:
        for term in JOBSPY_TERMS:
            try:
                df = scrape_jobs(
                    site_name=["indeed", "google", "zip_recruiter", "linkedin"],
                    search_term=term,
                    google_search_term=f"{term} jobs near {loc}",
                    location=loc,
                    results_wanted=per_search,
                    hours_old=hours_old,
                    country_indeed="USA",
                    linkedin_fetch_description=True,
                    verbose=0,
                )
            except Exception as e:
                print(f"   !! jobspy {term} @ {loc}: {str(e)[:90]}")
                continue

            if df is None or len(df) == 0:
                continue
            print(f"   {'jobspy':>10} {term[:14]:<14} {len(df):>4}  ({loc})")
            for _, r in df.iterrows():
                g = lambda k: (None if k not in r or r[k] != r[k] else r[k])
                rows.append(_row(
                    g("title"), g("company"), g("location"), g("job_url"),
                    g("description") or "", str(g("site") or "JobSpy").title(),
                    str(g("date_posted") or "")[:10],
                    g("min_amount"), g("max_amount"),
                    bool(g("is_remote")),
                ))
            time.sleep(2)      # be polite; reduces block rate
    return rows


# --------------------------------------------------------------------------

def collect(use_jobspy=True):
    """Everything, deduped by URL."""
    rows = []
    print("-- ATS boards")
    rows += ats_boards()
    print("-- free APIs")
    rows += free_apis()
    if use_jobspy:
        print("-- jobspy")
        rows += jobspy()

    seen, out = set(), []
    for r in rows:
        u = r.get("job_url")
        if u and u not in seen:
            seen.add(u)
            out.append(r)
    print(f"-- collected {len(out)} unique rows from {len(rows)} raw")
    return out
