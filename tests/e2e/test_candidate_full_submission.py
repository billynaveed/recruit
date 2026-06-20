"""
YFS Recruit — Full candidate submission E2E.

Drives a brand-new candidate through every stage (1-6) and submits.
Verifies via DB that the candidate is COMPLETED and the submission has a
submittedAt timestamp.

Run with:
    cd /path/to/recruit
    python3 tests/e2e/test_candidate_full_submission.py

Prerequisites:
    - Recruit running on http://localhost:3000
    - DATABASE_URL set in env (so the fixture script and DB verifier can connect)
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect, Page

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
ROOT = Path(__file__).resolve().parents[2]
SCREENSHOT_DIR = ROOT / "tests/e2e/screenshots"

# Minimal valid PDF (one blank page, ~ 700 bytes). Good enough for upload validation.
PDF_BYTES = bytes.fromhex(
    "255044462d312e340a25c4e5f2e5eba7f3a04d0a342030206f626a0a3c3c2f4c656e677468"
    "203520302052202f46696c746572202f466c6174654465636f64653e3e0a73747265616d0a"
    "789c2b2934537038339d8b8b50522d562a2dd28b50922e29cf4d2c2949ce4f2dac4f4d49c9"
    "cc4b07000a47083f0a656e6473747265616d0a656e646f626a0a3520302072082020202020"
    "202020202020202020202020202020202020202020202020200a322030206f626a0a3c3c2f"
    "54797065202f50616765202f506172656e74203120302052202f5265736f75726365732033"
    "2030205220202f436f6e74656e747320342030205220203e3e0a656e646f626a0a33203020"
    "6f626a0a3c3c2f50726f635365745b2f504446202f546578745d3e3e0a656e646f626a0a31"
    "2030206f626a0a3c3c2f54797065202f50616765732f4b6964735b32203020525d2f436f75"
    "6e7420313e3e0a656e646f626a0a362030206f626a0a3c3c2f54797065202f436174616c6f"
    "67202f50616765732031203020523e3e0a656e646f626a0a78726566203020370a30303030"
    "303030303030203635353335206620200a30303030303030323733203030303030206e2020"
    "0a30303030303030313737203030303030206e20200a3030303030303032343220303030"
    "3030206e20200a30303030303030303135203030303030206e20200a3030303030303031"
    "3539203030303030206e20200a30303030303030333231203030303030206e20200a7472"
    "61696c65720a3c3c2f53697a6520370a2f526f6f742036203020520a3e3e0a737461727478"
    "7265660a3336380a2525454f460a"
)


def write_test_pdf() -> str:
    p = Path("/tmp/recruit_e2e_cv.pdf")
    p.write_bytes(PDF_BYTES)
    return str(p)


def setup_fixture() -> dict:
    """Create test job + invite via Prisma helper. Returns dict with applyUrl, candidateEmail, jobId."""
    db_url = os.environ.get("DATABASE_URL", "postgresql://postgres@127.0.0.1:5433/recruit")
    env = {**os.environ, "DATABASE_URL": db_url, "BASE_URL": BASE_URL}
    result = subprocess.run(
        ["node", "tests/e2e/setup_fixture.mjs"],
        cwd=str(ROOT),
        env=env,
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0:
        print(f"[setup] fixture failed:\n{result.stderr}", flush=True)
        sys.exit(1)
    line = result.stdout.strip().splitlines()[-1]
    return json.loads(line)


def verify_submission_in_db(invite_token: str) -> dict:
    """Query DB and return {stage, submittedAt, completionPercent} for the candidate."""
    script = f"""
    const {{ PrismaClient }} = require('@prisma/client');
    const {{ PrismaPg }} = require('@prisma/adapter-pg');
    const adapter = new PrismaPg({{ connectionString: process.env.DATABASE_URL }});
    const prisma = new PrismaClient({{ adapter }});
    (async () => {{
      const invite = await prisma.invite.findUnique({{
        where: {{ token: {json.dumps(invite_token)} }},
        include: {{
          candidate: {{
            include: {{ submission: true }},
          }},
        }},
      }});
      const c = invite?.candidate;
      const s = c?.submission;
      console.log(JSON.stringify({{
        stage: c?.stage,
        completionPercent: c?.completionPercent,
        submittedAt: s?.submittedAt,
        consentGiven: s?.consentGiven,
        cvPath: s?.cvPath,
        hasFinalReflection: !!s?.finalReflection,
        hasItemScores: undefined,
      }}));
      await prisma.$disconnect();
    }})();
    """
    result = subprocess.run(
        ["node", "-e", script],
        env={**os.environ},
        capture_output=True,
        text=True,
        timeout=10,
    )
    if result.returncode != 0:
        raise RuntimeError(f"DB verify failed: {result.stderr}")
    return json.loads(result.stdout.strip().splitlines()[-1])


# ─── Stage helpers ───────────────────────────────────────────────────────────

STAR_ANSWER = (
    "Last quarter I owned the migration of our billing pipeline from a legacy cron-based "
    "system to a queue-driven worker architecture. About halfway through the rollout I "
    "discovered that one of our downstream consumers had been silently relying on a "
    "side-effect of the old cron timing — specifically, a 30-minute delay between "
    "invoice creation and email send that gave finance a window to cancel duplicates. "
    "When my new pipeline shipped, those duplicate-cancel windows shrank to seconds and "
    "we sent four duplicate invoices to a top-tier customer in a single morning. "
    "I paused the rollout, pulled finance and the customer success lead into a call within "
    "the hour, wrote and shipped a hotfix that re-introduced a configurable delay, and "
    "wrote a postmortem identifying the implicit contract I had missed. The migration "
    "shipped a week later than planned but with the cancel window made explicit and "
    "documented. Finance now treats it as a first-class feature."
)


def fill_stage_1(page: Page):
    print("  Stage 1: consent")
    expect(page.locator('input[type="checkbox"]').first).to_be_visible(timeout=10_000)
    page.locator('input[type="checkbox"]').first.check()
    page.locator('button[type="submit"]:visible').first.click()
    page.wait_for_url("**/stage/2", timeout=10_000)


def fill_stage_2(page: Page, cv_path: str):
    print("  Stage 2: CV + cover letter")
    page.set_input_files('input[type="file"]', cv_path)
    # Wait for upload to complete (cvPath hidden input gets populated)
    page.wait_for_function(
        "() => { const el = document.querySelector('input[name=\"cvPath\"]'); return el && el.value && el.value.length > 0; }",
        timeout=15_000,
    )
    page.locator('textarea[name="coverLetter"]').fill(
        "I am applying because I want to work on systems where the engineering decisions "
        "compound into customer trust. The recent work I have shipped has taught me that the "
        "boring parts of reliability are the ones that decide whether a product is loved."
    )
    page.locator('button[type="submit"]:visible').last.click()
    page.wait_for_url("**/stage/3", timeout=10_000)


def fill_stage_3(page: Page):
    print("  Stage 3: role-specific")
    # One textarea per role question, name=`answer_<id>`
    answer = (
        "The biggest engineering decision I led recently was the choice to keep our search "
        "infrastructure on Postgres rather than migrate to Elasticsearch. The team had "
        "assumed an Elastic move was inevitable; my push was to first instrument actual "
        "query patterns. Two weeks of telemetry showed our 90th-percentile queries were "
        "structured filters that Postgres handles natively, and the relevance-tuning needs "
        "people had cited were largely solvable with a small ranking layer. We avoided a "
        "six-month migration and a recurring infra bill. The trade-off I weighed was the "
        "cost of operational lock-in versus the cost of premature optimization, and I "
        "chose the latter risk because it was reversible."
    )
    for ta in page.locator('textarea[name^="answer_"]').all():
        ta.fill(answer)
    page.locator('button[type="submit"]:visible').last.click()
    page.wait_for_url("**/stage/4", timeout=10_000)


def fill_stage_4(page: Page):
    print("  Stage 4: standard questions")
    answer = (
        "I think the most useful thing I have learned about myself professionally is that "
        "I am most effective when I have one thing I am personally accountable for, end "
        "to end, and the freedom to bring others in on my own terms. I have shipped my best "
        "work in environments where the bar for autonomy was high and the bar for "
        "communication was higher."
    )
    for ta in page.locator('textarea[name^="answer_"]').all():
        ta.fill(answer)
    page.locator('button[type="submit"]:visible').last.click()
    page.wait_for_url("**/stage/5", timeout=10_000)


def fill_stage_5(page: Page):
    print("  Stage 5: psychometric battery")
    page.wait_for_load_state("domcontentloaded")

    # Star behavioral textareas (long-form, must meet minLength)
    for ta in page.locator('textarea[name^="item_"]').all():
        # Some are reflection (optional). Fill all with a long enough answer.
        ta.fill(STAR_ANSWER)

    # Radios (forced_choice / tradeoff_choice / consistency_check) are sr-only —
    # clicking the wrapping <label> fires the React onChange.
    radio_names = page.evaluate(
        """() => {
            const set = new Set();
            document.querySelectorAll('input[type="radio"][name^="item_"]').forEach(r => set.add(r.name));
            return Array.from(set);
        }"""
    )
    for name in radio_names:
        first_radio = page.locator(f'input[type="radio"][name="{name}"]').first
        # The radio is wrapped by a <label>; click that label.
        first_radio.locator('xpath=ancestor::label[1]').click()

    # Tradeoff rank: hidden input name=`item_<id>` lives next to a list of <select>s.
    # Use Playwright's select_option (proper React change event) on each.
    rank_metas = page.evaluate(
        """() => {
            const out = [];
            document.querySelectorAll('input[type="hidden"][name^="item_"]').forEach(h => {
                let parent = h.parentElement;
                while (parent && parent.querySelectorAll('select').length === 0) {
                    parent = parent.parentElement;
                }
                if (!parent) return;
                const selects = parent.querySelectorAll('select');
                if (selects.length < 2) return;
                // Tag each select so Playwright can find them
                selects.forEach((sel, i) => {
                    sel.setAttribute('data-rank-name', h.name);
                    sel.setAttribute('data-rank-index', String(i));
                });
                out.push({ hiddenName: h.name, count: selects.length });
            });
            return out;
        }"""
    )

    for meta in rank_metas:
        for i in range(meta["count"]):
            sel = page.locator(
                f'select[data-rank-name="{meta["hiddenName"]}"][data-rank-index="{i}"]'
            )
            sel.select_option(str(i + 1))

    # Submit
    submit = page.locator('button[type="submit"]:has-text("Next: Review")').first
    expect(submit).to_be_enabled(timeout=10_000)
    submit.click()
    page.wait_for_url("**/stage/6", timeout=15_000)


def fill_stage_6(page: Page):
    print("  Stage 6: final reflection + submit")
    page.locator('textarea[name="finalReflection"]').fill(
        "Thank you for taking the time to read this. I appreciate the structured nature "
        "of this assessment and would welcome any feedback regardless of outcome."
    )
    # Tick the "I am ready to submit" checkbox
    page.locator('input[type="checkbox"]').last.check()
    submit = page.locator('button[type="submit"]:has-text("Submit application")').first
    expect(submit).to_be_enabled(timeout=5_000)
    submit.click()
    page.wait_for_url("**/submitted", timeout=15_000)


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "═" * 64)
    print("  Recruit — Full candidate submission E2E")
    print("═" * 64)
    print(f"  Target:   {BASE_URL}")

    fixture = setup_fixture()
    apply_url = fixture["applyUrl"]
    invite_token = fixture["token"]
    print(f"  Fixture:  {apply_url}")

    cv_path = write_test_pdf()
    print(f"  CV file:  {cv_path}")
    print()

    failed = False
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1200, "height": 900})
        page = ctx.new_page()

        try:
            page.goto(apply_url)
            page.wait_for_load_state("domcontentloaded")
            assert "/stage/1" in page.url, f"Expected to land on stage 1, got {page.url}"

            fill_stage_1(page)
            fill_stage_2(page, cv_path)
            fill_stage_3(page)
            fill_stage_4(page)
            fill_stage_5(page)
            fill_stage_6(page)

            print("  Verifying submission landing page")
            page.wait_for_load_state("domcontentloaded")
            assert "/submitted" in page.url, f"Did not reach /submitted, got {page.url}"
            page.screenshot(path=str(SCREENSHOT_DIR / "candidate_full_submitted.png"), full_page=True)

            print("  Querying DB for final state")
            state = verify_submission_in_db(invite_token)
            print(f"    DB state: {state}")
            assert state["stage"] == "COMPLETED", f"Expected COMPLETED, got {state['stage']}"
            assert state["submittedAt"], "submittedAt is null"
            assert state["consentGiven"] is True, "consentGiven is false"
            assert state["cvPath"], "cvPath is null"
            assert state["hasFinalReflection"], "finalReflection is empty"

            print("\n  ALL CHECKS PASSED")

        except Exception as e:
            failed = True
            page.screenshot(path=str(SCREENSHOT_DIR / "candidate_full_failure.png"), full_page=True)
            print(f"\n  FAILURE: {e}")
            print(f"  Last URL: {page.url}")

        finally:
            ctx.close()
            browser.close()

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
