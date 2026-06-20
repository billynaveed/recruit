"""
Full user walkthrough — candidate end-to-end + admin view.
Screenshots at every meaningful step so a human can see it works.

Run:
  python3 tests/e2e/user_walkthrough.py
"""
import json, os, subprocess, sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
ROOT = Path(__file__).resolve().parents[2]
SCREEN = ROOT / "tests/e2e/screenshots/walkthrough"
SCREEN.mkdir(parents=True, exist_ok=True)
CV_PATH = "/tmp/recruit_e2e_cv.pdf"
ADMIN_EMAIL = os.environ.get("ADMIN_E2E_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_E2E_PASSWORD", "")

STAR_ANSWER = (
    "Last quarter I owned the migration of our billing pipeline from a legacy cron-based "
    "system to a queue-driven worker architecture. About halfway through the rollout I "
    "discovered that one of our downstream consumers had been silently relying on a "
    "side-effect of the old cron timing — specifically, a 30-minute delay between "
    "invoice creation and email send that gave finance a window to cancel duplicates. "
    "When my new pipeline shipped, those duplicate-cancel windows shrank to seconds and "
    "we sent four duplicate invoices to a top-tier customer in a single morning. "
    "I paused the rollout, pulled finance and customer success into a call within the "
    "hour, wrote and shipped a hotfix that re-introduced a configurable delay, and wrote "
    "a postmortem identifying the implicit contract I had missed."
)

def setup_fixture():
    env = {**os.environ, "DATABASE_URL": os.environ["DATABASE_URL"], "BASE_URL": BASE_URL}
    r = subprocess.run(["node", "tests/e2e/setup_fixture.mjs"], cwd=str(ROOT), env=env, capture_output=True, text=True, timeout=30)
    return json.loads(r.stdout.strip().splitlines()[-1])

def make_cv():
    subprocess.run(["node", "tests/e2e/make_fake_cv.mjs", CV_PATH], cwd=str(ROOT), check=True, capture_output=True)

def shot(page, name):
    p = SCREEN / f"{name}.png"
    page.screenshot(path=str(p), full_page=True)
    print(f"   📸 {p.name}")

def main():
    make_cv()
    fix = setup_fixture()
    apply_url = fix["applyUrl"]
    candidate_email = fix["candidateEmail"]
    print(f"Candidate fixture: {candidate_email}")
    print(f"Apply URL: {apply_url}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ─── Candidate side ───────────────────────────────────────────────
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()

        print("\n[Candidate] Stage 1 — welcome & consent")
        page.goto(apply_url)
        page.wait_for_load_state("domcontentloaded")
        page.wait_for_timeout(500)
        shot(page, "01_stage1_welcome")
        # The consent checkbox is a styled label — clicking the label flips React state
        cb = page.locator('input[type="checkbox"]').first
        cb.locator('xpath=ancestor::label[1]').click()
        # Wait for the Next button to become enabled
        next_btn = page.locator('button[type="submit"]:has-text("Next")').first
        expect(next_btn).to_be_enabled(timeout=5_000)
        next_btn.click()
        page.wait_for_url("**/stage/2", timeout=10_000)

        print("[Candidate] Stage 2 — CV upload + cover letter")
        page.set_input_files('input[type="file"]', CV_PATH)
        page.wait_for_function("() => document.querySelector('input[name=\"cvPath\"]')?.value?.length > 0", timeout=15_000)
        page.locator('textarea[name="coverLetter"]').fill(
            "I am applying because I want to work on systems where reliability is "
            "the product, not an afterthought. Recent work has taught me that the "
            "boring parts of operations are what decide whether a tool is loved."
        )
        page.wait_for_timeout(400)
        shot(page, "02_stage2_cv_uploaded")
        page.locator('button[type="submit"]:visible').last.click()
        page.wait_for_url("**/stage/3", timeout=10_000)

        print("[Candidate] Stage 3 — role-specific questions")
        for ta in page.locator('textarea[name^="answer_"]').all():
            ta.fill(
                "The biggest engineering decision I led recently was keeping our search "
                "infrastructure on Postgres rather than migrating to Elasticsearch. The "
                "team had assumed an Elastic move was inevitable; my push was to first "
                "instrument actual query patterns. Two weeks of telemetry showed our "
                "p90 queries were structured filters that Postgres handles natively, "
                "and the relevance-tuning needs were largely solvable with a small "
                "ranking layer. We avoided a six-month migration. The trade-off I weighed "
                "was operational lock-in versus premature optimisation; I chose the "
                "latter risk because it was reversible."
            )
        page.wait_for_timeout(300)
        shot(page, "03_stage3_role_questions")
        page.locator('button[type="submit"]:visible').last.click()
        page.wait_for_url("**/stage/4", timeout=10_000)

        print("[Candidate] Stage 4 — standard questions")
        for ta in page.locator('textarea[name^="answer_"]').all():
            ta.fill(
                "The most useful thing I have learned about myself professionally is "
                "that I am most effective when I have one thing I am personally "
                "accountable for end-to-end, and the freedom to bring others in on my "
                "own terms. I have shipped my best work where the bar for autonomy was "
                "high and the bar for communication was higher."
            )
        page.wait_for_timeout(300)
        shot(page, "04_stage4_standard")
        page.locator('button[type="submit"]:visible').last.click()
        page.wait_for_url("**/stage/5", timeout=10_000)

        print("[Candidate] Stage 5 — psychometric assessment (long)")
        page.wait_for_load_state("domcontentloaded")
        for ta in page.locator('textarea[name^="item_"]').all():
            ta.fill(STAR_ANSWER)
        radio_names = page.evaluate("""() => {
            const s = new Set();
            document.querySelectorAll('input[type=\"radio\"][name^=\"item_\"]').forEach(r => s.add(r.name));
            return [...s];
        }""")
        for name in radio_names:
            page.locator(f'input[type="radio"][name="{name}"]').first.locator('xpath=ancestor::label[1]').click()
        rank_metas = page.evaluate("""() => {
            const out = [];
            document.querySelectorAll('input[type=\"hidden\"][name^=\"item_\"]').forEach(h => {
                let p = h.parentElement;
                while (p && p.querySelectorAll('select').length === 0) p = p.parentElement;
                if (!p) return;
                const sel = p.querySelectorAll('select');
                if (sel.length < 2) return;
                sel.forEach((s, i) => { s.setAttribute('data-rank-name', h.name); s.setAttribute('data-rank-index', String(i)); });
                out.push({ hidden: h.name, count: sel.length });
            });
            return out;
        }""")
        for m in rank_metas:
            for i in range(m["count"]):
                page.locator(f'select[data-rank-name="{m["hidden"]}"][data-rank-index="{i}"]').select_option(str(i + 1))
        page.wait_for_timeout(400)
        shot(page, "05_stage5_assessment")
        submit = page.locator('button[type="submit"]:has-text("Next: Review")').first
        expect(submit).to_be_enabled(timeout=10_000)
        submit.click()
        page.wait_for_url("**/stage/6", timeout=15_000)

        print("[Candidate] Stage 6 — final reflection + submit")
        page.locator('textarea[name="finalReflection"]').fill(
            "Thank you for taking the time to read this. I appreciate the structured "
            "format and would welcome any feedback regardless of outcome."
        )
        page.locator('input[type="checkbox"]').last.check()
        page.wait_for_timeout(400)
        shot(page, "06_stage6_review_submit")
        page.locator('button[type="submit"]:has-text("Submit application")').first.click()
        page.wait_for_url("**/submitted", timeout=15_000)
        page.wait_for_timeout(500)
        shot(page, "07_submitted_confirmation")

        ctx.close()

        # ─── Admin side ───────────────────────────────────────────────────
        print("\n[Admin] Login")
        ctx2 = browser.new_context(viewport={"width": 1400, "height": 950})
        admin = ctx2.new_page()
        admin.goto(f"{BASE_URL}/login")
        admin.fill('input[name="email"]', ADMIN_EMAIL)
        admin.fill('input[name="password"]', ADMIN_PASSWORD)
        admin.click('button[type="submit"]')
        admin.wait_for_url("**/admin", timeout=15_000)
        admin.wait_for_timeout(800)
        shot(admin, "08_admin_dashboard")

        print("[Admin] Find the new candidate")
        # Click the candidate row by their email — unique per fixture
        admin.click(f'text={fix["candidateEmail"]}')
        admin.wait_for_load_state("domcontentloaded")
        admin.wait_for_timeout(800)
        shot(admin, "09_candidate_detail_top")

        print("[Admin] Expand Full responses tier (where the CV lives)")
        # TierSection for "Full responses" is collapsed by default — open it
        tier4 = admin.locator('button:has-text("Full responses"), [role="button"]:has-text("Full responses"), summary:has-text("Full responses")').first
        if tier4.count() > 0:
            tier4.scroll_into_view_if_needed()
            tier4.click()
            admin.wait_for_timeout(500)

        print("[Admin] Expand CV text")
        cv_summary = admin.locator('summary:has-text("Show extracted CV text")').first
        if cv_summary.count() > 0:
            cv_summary.scroll_into_view_if_needed()
            admin.wait_for_timeout(300)
            cv_summary.click()
            admin.wait_for_timeout(500)
            cv_summary.scroll_into_view_if_needed()
            shot(admin, "10_cv_text_expanded")

        print("[Admin] Analytics page")
        admin.goto(f"{BASE_URL}/admin/analytics")
        admin.wait_for_load_state("domcontentloaded")
        admin.wait_for_timeout(800)
        shot(admin, "11_analytics")

        ctx2.close()
        browser.close()

    print(f"\nAll screenshots in: {SCREEN}")
    print("Done.")

if __name__ == "__main__":
    main()
