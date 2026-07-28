# Running Atlas on your Ubuntu server

Why bother, when GitHub Actions already works: **residential IP**. GitHub runners
use datacenter IPs, which LinkedIn and Indeed block aggressively. Running from
home should noticeably improve how many roles JobSpy actually returns — it's the
weakest link in the pipeline and this is the fix.

Everything below runs as your normal user. No root, no sudo except one line.

---

## 1. Get the code and a Python env

```bash
mkdir -p ~/atlas && cd ~/atlas
git clone https://github.com/surajladdagiri/sladdagiri.org.git
python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install python-jobspy
```

## 2. Let the server push to GitHub

Two options — a deploy key is cleaner.

**Deploy key (recommended)**

```bash
ssh-keygen -t ed25519 -C "atlas-server" -f ~/.ssh/atlas_deploy -N ""
cat ~/.ssh/atlas_deploy.pub
```

Paste that into GitHub → your repo → Settings → Deploy keys → Add deploy key.
**Tick "Allow write access."** Then:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github-atlas
  HostName github.com
  User git
  IdentityFile ~/.ssh/atlas_deploy
  IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config

cd ~/atlas/sladdagiri.org
git remote set-url origin git@github-atlas:surajladdagiri/sladdagiri.org.git
ssh -T git@github-atlas   # expect: "Hi surajladdagiri/sladdagiri.org! You've successfully authenticated"
```

**Or a fine-grained PAT** — create one with Contents: Read and write, then
`git remote set-url origin https://USER:TOKEN@github.com/surajladdagiri/sladdagiri.org.git`
(less tidy; the token ends up in `.git/config`).

## 3. Secrets

```bash
cat > ~/atlas/.env <<'EOF'
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
MAX_ANALYZE=5
SCORE_FLOOR=68
USE_JOBSPY=1
# VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/...
EOF
chmod 600 ~/atlas/.env
```

Any model key you leave out is skipped. All three absent still works — you just
get heuristic scores instead of the three-model panel.

Start at `MAX_ANALYZE=5` and raise it once you've seen a week of real bills.

## 4. Test it by hand

```bash
chmod +x ~/atlas/sladdagiri.org/scripts/pipeline/atlas-refresh.sh
~/atlas/sladdagiri.org/scripts/pipeline/atlas-refresh.sh
```

You should see per-source row counts, then any analyses, then either
"no changes" or a push. **Do this before setting up the timer.**

## 5. Schedule it

```bash
mkdir -p ~/.config/systemd/user
cp ~/atlas/sladdagiri.org/scripts/pipeline/systemd/atlas.{service,timer} ~/.config/systemd/user/

systemctl --user daemon-reload
systemctl --user enable --now atlas.timer

# Critical: without this, user services stop when you log out.
sudo loginctl enable-linger "$USER"
```

Verify:

```bash
systemctl --user list-timers atlas.timer   # shows next run time
systemctl --user start atlas.service       # run once, now
journalctl --user -u atlas -n 200 -f       # watch the log
```

`Persistent=true` means if the server is off at 08:00 it runs as soon as it's
back up. `RandomizedDelaySec=180` spreads the request burst over three minutes
so you're not hitting job boards on the exact same second daily.

---

## Turn off the GitHub Actions schedule

Otherwise you get two runs a day. The second is harmless — it dedupes and exits
— but it wastes Actions minutes and muddies your logs.

In `.github/workflows/atlas-daily.yml`, comment out the two `- cron:` lines and
keep `workflow_dispatch`. That leaves the Action as a manual fallback for when
the server is down.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `Permission denied (publickey)` on push | Deploy key missing **write access**, or `git remote` still on https |
| Timer never fires while logged out | `loginctl enable-linger` not run |
| `python: command not found` in the journal | `ATLAS_VENV` path wrong — the script defaults to `~/atlas/venv` |
| JobSpy returns 0 everywhere | Boards are rate-limiting you. Lower the term list in `sources.py`, or set `USE_JOBSPY=0` and lean on the ATS tier |
| Pipeline runs but nothing deploys | Check Vercel is watching `main`; or set `VERCEL_DEPLOY_HOOK` in `.env` |
| Want a different hour | Edit `OnCalendar` in `atlas.timer`, then `systemctl --user daemon-reload && systemctl --user restart atlas.timer` |

The script overrides three paths via environment if your layout differs:
`ATLAS_REPO`, `ATLAS_VENV`, `ATLAS_ENV`.

## One safety note

The script does `git reset --hard origin/main` before running, so **never keep
uncommitted work in `~/atlas/sladdagiri.org`**. Treat it as a throwaway checkout;
do your actual development elsewhere.
