"""
Focused CV upload + text extraction E2E.

Generates a multi-paragraph PDF, runs through stages 1 and 2 of the apply
flow, and verifies the DB has both cvPath set AND cvText extracted with
recognisable content.

Run:
    cd /path/to/recruit
    python3 tests/e2e/test_cv_extraction.py
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000")
ROOT = Path(__file__).resolve().parents[2]
CV_PATH = "/tmp/recruit_e2e_cv.pdf"


def setup_fixture() -> dict:
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
    return json.loads(result.stdout.strip().splitlines()[-1])


def make_cv():
    subprocess.run(
        ["node", "tests/e2e/make_fake_cv.mjs", CV_PATH],
        cwd=str(ROOT),
        check=True,
        capture_output=True,
    )


def query_submission(invite_token: str) -> dict:
    script = f"""
    const {{ PrismaClient }} = require('@prisma/client');
    const {{ PrismaPg }} = require('@prisma/adapter-pg');
    const adapter = new PrismaPg({{ connectionString: process.env.DATABASE_URL }});
    const prisma = new PrismaClient({{ adapter }});
    (async () => {{
      const invite = await prisma.invite.findUnique({{
        where: {{ token: {json.dumps(invite_token)} }},
        include: {{ candidate: {{ include: {{ submission: true }} }} }},
      }});
      const s = invite?.candidate?.submission;
      console.log(JSON.stringify({{
        candidateId: invite?.candidate?.id,
        cvPath: s?.cvPath,
        cvTextLen: s?.cvText?.length ?? 0,
        cvTextSample: s?.cvText?.slice(0, 300) ?? null,
        cvTextFull: s?.cvText ?? null,
        cvExtractedAt: s?.cvExtractedAt,
        cvExtractError: s?.cvExtractError,
      }}));
      await prisma.$disconnect();
    }})();
    """
    result = subprocess.run(
        ["node", "-e", script],
        env={**os.environ},
        capture_output=True,
        text=True,
        timeout=15,
    )
    if result.returncode != 0:
        raise RuntimeError(f"DB verify failed: {result.stderr}")
    return json.loads(result.stdout.strip().splitlines()[-1])


def main() -> int:
    print("\n" + "=" * 64)
    print("  Recruit — CV upload + extraction E2E")
    print("=" * 64)
    print(f"  Target: {BASE_URL}")

    make_cv()
    print(f"  CV:     {CV_PATH}")
    fixture = setup_fixture()
    apply_url = fixture["applyUrl"]
    invite_token = fixture["token"]
    print(f"  Apply:  {apply_url}")

    failed = False
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1200, "height": 900})
        page = ctx.new_page()
        try:
            page.goto(apply_url)
            page.wait_for_load_state("domcontentloaded")
            assert "/stage/1" in page.url, f"Expected stage 1, got {page.url}"

            print("  Stage 1: consent")
            page.locator('input[type="checkbox"]').first.check()
            page.locator('button[type="submit"]:visible').first.click()
            page.wait_for_url("**/stage/2", timeout=15_000)

            print("  Stage 2: uploading CV...")
            page.set_input_files('input[type="file"]', CV_PATH)
            page.wait_for_function(
                "() => { const el = document.querySelector('input[name=\"cvPath\"]'); return el && el.value && el.value.length > 0; }",
                timeout=20_000,
            )
            print("  Upload completed (cvPath populated client-side)")
            # Submit to persist the path
            page.locator('button[type="submit"]:visible').last.click()
            page.wait_for_url("**/stage/3", timeout=15_000)

            print("  Querying DB...")
            row = query_submission(invite_token)
            print(f"  candidateId={row['candidateId']}")
            print(f"  cvPath={row['cvPath']}")
            print(f"  cvTextLen={row['cvTextLen']}")
            print(f"  cvExtractedAt={row['cvExtractedAt']}")
            print(f"  cvExtractError={row['cvExtractError']}")
            print(f"  cvTextSample={row['cvTextSample']!r}")

            assert row["cvPath"], "cvPath is null — upload did not persist"
            assert row["cvExtractError"] is None, f"extraction error: {row['cvExtractError']}"
            assert row["cvTextLen"] >= 500, f"cvText only {row['cvTextLen']} chars, expected at least 500"
            full = row["cvTextFull"] or ""
            assert "Jordan Park" in full, "extracted text missing candidate name"
            assert "Stripe" in full or "Monzo" in full, "extracted text missing employer names"
            assert "BSc Computer Science" in full or "Edinburgh" in full, "extracted text missing education"

            print("\n  ALL CHECKS PASSED")

        except Exception as e:
            failed = True
            page.screenshot(path=str(ROOT / "tests/e2e/screenshots/cv_extract_failure.png"), full_page=True)
            print(f"\n  FAILURE: {e}")
            print(f"  Last URL: {page.url}")

        finally:
            ctx.close()
            browser.close()

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
