"""
End-to-end test for the CEO job using its existing reusable bulk invite link.

Runs against the live URL (http://localhost:3000 by default), drives
a fresh candidate through registration + all 6 stages, and verifies the result
in the DB.

Run:
    cd /path/to/recruit
    set -a; source .env; set +a
    python3 tests/e2e/test_ceo_e2e.py
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect, Page

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
ROOT = Path(__file__).resolve().parents[2]
SHOTS = ROOT / "tests/e2e/screenshots/ceo_e2e"
SHOTS.mkdir(parents=True, exist_ok=True)
CEO_BULK_TOKEN = "gEn4-cbQmetNVJIC8P02NjkV"

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
CV_PATH = "/tmp/recruit_ceo_e2e_cv.pdf"
Path(CV_PATH).write_bytes(PDF_BYTES)

TS = int(time.time())
TEST_EMAIL = f"e2e-ceo-{TS}@yfs-e2e.invalid"
TEST_NAME = f"E2E Tester {TS}"

LONG_ANSWER = (
    "When I was leading product at my previous role we were running an internal "
    "experimentation platform that had grown organically over three years and "
    "started failing under load. The team's instinct was to rewrite from scratch. "
    "I pushed back: I sat with the on-call engineers for a week, mapped the actual "
    "failure modes, and we found that 80% of incidents were traceable to one badly "
    "tuned queue worker and a missing index. We shipped the targeted fix in ten days, "
    "deferred the rewrite by a quarter, and used the saved engineering capacity to "
    "ship two new product surfaces that had been blocked for months. The lesson: "
    "treat 'rewrite' as the most expensive option, not the default."
)


def shot(page: Page, name: str):
    p = SHOTS / f"{name}.png"
    page.screenshot(path=str(p), full_page=True)
    print(f"    📸 {p.name}")


def db_node(script: str) -> str:
    """Run a small Node.js script with Prisma access."""
    result = subprocess.run(
        ["node", "-e", script],
        env={**os.environ},
        capture_output=True,
        text=True,
        timeout=15,
        cwd=str(ROOT),
    )
    if result.returncode != 0:
        raise RuntimeError(f"DB script failed: {result.stderr}")
    return result.stdout.strip()


def find_candidate(email: str) -> dict | None:
    out = db_node(
        f"""
        const {{ PrismaClient }} = require('@prisma/client');
        const {{ PrismaPg }} = require('@prisma/adapter-pg');
        const adapter = new PrismaPg({{ connectionString: process.env.DATABASE_URL }});
        const prisma = new PrismaClient({{ adapter }});
        (async () => {{
          const c = await prisma.candidate.findFirst({{
            where: {{ email: {json.dumps(email)} }},
            include: {{ submission: true, invite: {{ select: {{ token: true, bulkInviteLinkId: true }} }} }},
          }});
          if (!c) {{ console.log('null'); await prisma.$disconnect(); return; }}
          console.log(JSON.stringify({{
            id: c.id, name: c.name, email: c.email, stage: c.stage,
            currentStage: c.currentStage, completionPercent: c.completionPercent,
            inviteToken: c.invite?.token,
            inviteBulk: c.invite?.bulkInviteLinkId,
            submittedAt: c.submission?.submittedAt,
            consentGiven: c.submission?.consentGiven,
            cvPath: c.submission?.cvPath,
            hasFinalReflection: !!c.submission?.finalReflection,
          }}));
          await prisma.$disconnect();
        }})();
        """
    )
    last = out.splitlines()[-1]
    return None if last == "null" else json.loads(last)


def delete_candidate(candidate_id: str):
    db_node(
        f"""
        const {{ PrismaClient }} = require('@prisma/client');
        const {{ PrismaPg }} = require('@prisma/adapter-pg');
        const adapter = new PrismaPg({{ connectionString: process.env.DATABASE_URL }});
        const prisma = new PrismaClient({{ adapter }});
        (async () => {{
          // Find invite linked to candidate, delete invite (cascades candidate + submission).
          const c = await prisma.candidate.findUnique({{ where: {{ id: {json.dumps(candidate_id)} }} }});
          if (c) await prisma.invite.delete({{ where: {{ id: c.inviteId }} }});
          console.log('deleted');
          await prisma.$disconnect();
        }})();
        """
    )


def register_via_bulk(page: Page):
    page.goto(f"{BASE_URL}/apply/bulk/{CEO_BULK_TOKEN}")
    page.wait_for_load_state("domcontentloaded")
    expect(page.locator('input[name="candidateName"]')).to_be_visible(timeout=10_000)
    shot(page, "01_bulk_landing")

    page.locator('input[name="candidateName"]').fill(TEST_NAME)
    page.locator('input[name="candidateEmail"]').fill(TEST_EMAIL)
    page.locator('button[type="submit"]').click()
    page.wait_for_url("**/stage/1", timeout=15_000)
    shot(page, "02_stage_1")


def fill_stage_1(page: Page):
    page.locator('input[type="checkbox"]').first.check()
    page.locator('button[type="submit"]:visible').first.click()
    page.wait_for_url("**/stage/2", timeout=15_000)
    shot(page, "03_stage_2")


def fill_stage_2(page: Page):
    page.set_input_files('input[type="file"]', CV_PATH)
    page.wait_for_function(
        "() => { const el = document.querySelector('input[name=\"cvPath\"]'); return el && el.value && el.value.length > 0; }",
        timeout=20_000,
    )
    page.locator('textarea[name="coverLetter"]').fill(
        "I'm applying for the CEO role because I want to spend the next chapter "
        "of my career building organisations where young people learn to take "
        "ownership of consequential work, not just consequential ideas."
    )
    page.locator('button[type="submit"]:visible').last.click()
    page.wait_for_url("**/stage/3", timeout=15_000)
    shot(page, "04_stage_3")


def fill_stage_3(page: Page):
    for ta in page.locator('textarea[name^="answer_"]').all():
        ta.fill(LONG_ANSWER)
    page.locator('button[type="submit"]:visible').last.click()
    page.wait_for_url("**/stage/4", timeout=15_000)
    shot(page, "05_stage_4")


def fill_stage_4(page: Page):
    for ta in page.locator('textarea[name^="answer_"]').all():
        ta.fill(LONG_ANSWER)
    page.locator('button[type="submit"]:visible').last.click()
    page.wait_for_url("**/stage/5", timeout=15_000)
    shot(page, "06_stage_5")


def fill_stage_5(page: Page):
    page.wait_for_load_state("domcontentloaded")

    for ta in page.locator('textarea[name^="item_"]').all():
        ta.fill(LONG_ANSWER)

    radio_names = page.evaluate(
        """() => {
            const set = new Set();
            document.querySelectorAll('input[type="radio"][name^="item_"]').forEach(r => set.add(r.name));
            return Array.from(set);
        }"""
    )
    for name in radio_names:
        first_radio = page.locator(f'input[type="radio"][name="{name}"]').first
        first_radio.locator('xpath=ancestor::label[1]').click()

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

    submit = page.locator('button[type="submit"]:has-text("Next: Review")').first
    expect(submit).to_be_enabled(timeout=10_000)
    submit.click()
    page.wait_for_url("**/stage/6", timeout=20_000)
    shot(page, "07_stage_6")


def fill_stage_6(page: Page):
    page.locator('textarea[name="finalReflection"]').fill(
        "Thank you for the structured nature of this assessment. I appreciated "
        "having to work through both behavioural and trade-off thinking in one sitting."
    )
    page.locator('input[type="checkbox"]').last.check()
    submit = page.locator('button[type="submit"]:has-text("Submit application")').first
    expect(submit).to_be_enabled(timeout=10_000)
    submit.click()
    page.wait_for_url("**/submitted", timeout=20_000)
    shot(page, "08_submitted")


def main():
    print("\n" + "═" * 64)
    print("  Recruit — CEO job full e2e (bulk-invite + 6 stages)")
    print("═" * 64)
    print(f"  Target:    {BASE_URL}")
    print(f"  Bulk link: /apply/bulk/{CEO_BULK_TOKEN}")
    print(f"  Identity:  {TEST_NAME} <{TEST_EMAIL}>")
    print()

    failed = False
    candidate_id = None

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()

        try:
            print("  → Register via bulk link")
            register_via_bulk(page)

            print("  → Stage 1 (consent)")
            fill_stage_1(page)

            print("  → Stage 2 (CV + cover letter)")
            fill_stage_2(page)

            print("  → Stage 3 (role-specific answers)")
            fill_stage_3(page)

            print("  → Stage 4 (standard answers)")
            fill_stage_4(page)

            print("  → Stage 5 (psychometric)")
            fill_stage_5(page)

            print("  → Stage 6 (final reflection + submit)")
            fill_stage_6(page)

            print("  → Verifying in DB")
            row = find_candidate(TEST_EMAIL)
            if not row:
                raise RuntimeError("Candidate not found in DB after submit")
            print(f"    DB candidate: id={row['id']} stage={row['stage']} bulk={row['inviteBulk']}")
            candidate_id = row["id"]

            assert row["stage"] == "COMPLETED", f"Expected COMPLETED, got {row['stage']}"
            assert row["submittedAt"], "submittedAt is null"
            assert row["consentGiven"] is True, "consentGiven is false"
            assert row["cvPath"], "cvPath is null"
            assert row["hasFinalReflection"], "finalReflection empty"
            assert row["inviteBulk"], "invite was not linked to the bulk link"

            print("\n  ALL CHECKS PASSED")

        except Exception as e:
            failed = True
            try:
                shot(page, "ZZ_failure")
                print(f"\n  FAILURE: {e}")
                print(f"  Last URL: {page.url}")
            except Exception:
                pass

        finally:
            ctx.close()
            browser.close()

    # Always try to clean up the e2e candidate
    if candidate_id:
        try:
            delete_candidate(candidate_id)
            print(f"  → Cleaned up candidate {candidate_id}")
        except Exception as e:
            print(f"  → Cleanup FAILED: {e}")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
