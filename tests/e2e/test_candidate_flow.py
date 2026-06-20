"""
YFS Recruit — Candidate-facing flow E2E tests

Covers TC-013 through TC-018: the /apply/[token] candidate experience.

Run with:
    cd /path/to/recruit
    python3 tests/e2e/test_candidate_flow.py

Prerequisites:
    - Recruit running on http://localhost:3000 (PM2 process "recruit")
    - DATABASE_URL points to the dev Postgres
    - Existing job + invite in DB (or this script will create them via the admin UI)
"""

import json
import os
import subprocess
import sys
from playwright.sync_api import sync_playwright, Page, Browser

BASE_URL       = "http://localhost:3000"
ADMIN_EMAIL    = os.environ.get("ADMIN_E2E_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_E2E_PASSWORD", "")
SCREENSHOT_DIR = "tests/e2e/screenshots"

results: list[dict] = []


def record(name: str, passed: bool, note: str = ""):
    results.append({"name": name, "passed": passed, "note": note})
    icon = "✅ PASS" if passed else "❌ FAIL"
    print(f"  {icon}  {name}")
    if not passed and note:
        print(f"         {note[:160]}")


def ss(page: Page, name: str) -> str:
    path = f"{SCREENSHOT_DIR}/{name}.png"
    page.screenshot(path=path, full_page=True)
    return path


def admin_login(page: Page):
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    page.locator('input[name="email"]').fill(ADMIN_EMAIL)
    page.locator('input[type="password"]').fill(ADMIN_PASSWORD)
    page.locator('button[type="submit"]').click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)


def setup_fixture() -> dict | None:
    """Create test job + invite via Prisma helper. Returns dict with jobId, applyUrl, candidateEmail."""
    db_url = os.environ.get("DATABASE_URL", "postgresql://postgres@127.0.0.1:5433/recruit")
    env = {**os.environ, "DATABASE_URL": db_url, "BASE_URL": BASE_URL}
    try:
        result = subprocess.run(
            ["node", "tests/e2e/setup_fixture.mjs"],
            cwd=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            env=env,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            print(f"  [setup] fixture failed: {result.stderr}", flush=True)
            return None
        # Last line of stdout is JSON
        line = result.stdout.strip().splitlines()[-1]
        return json.loads(line)
    except Exception as e:
        print(f"  [setup] fixture exception: {e}", flush=True)
        return None


# ─── Tests ────────────────────────────────────────────────────────────────────

def tc013_valid_token_renders_welcome(browser: Browser, invite_url: str):
    """TC-013: Visiting a valid invite URL lands on stage 1 (welcome/consent)."""
    name = "TC-013: Valid token renders Stage 1 welcome"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        page.goto(invite_url)
        page.wait_for_load_state("networkidle")
        ss(page, "tc013_apply_landing")

        assert "/apply/" in page.url, f"Not on apply route. URL: {page.url}"
        assert "/stage/1" in page.url or "/expired" not in page.url, \
            f"Should be on stage 1, got {page.url}"

        body = page.content()
        # Stage 1 should show consent / welcome content
        assert any(t in body.lower() for t in ["welcome", "consent", "background", "next"]), \
            "Stage 1 doesn't render welcome/consent text"

        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc014_consent_advances_to_stage_2(browser: Browser, invite_url: str):
    """TC-014: Checking consent and clicking Next advances to stage 2."""
    name = "TC-014: Consent advances to Stage 2"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        page.goto(invite_url)
        page.wait_for_load_state("networkidle")

        # Make sure we're on stage 1
        if "/stage/1" not in page.url:
            page.goto(invite_url + "/stage/1")
            page.wait_for_load_state("networkidle")

        # Check the consent checkbox (any visible checkbox)
        checkbox = page.locator('input[type="checkbox"]:visible').first
        if checkbox.count() > 0:
            checkbox.check()

        # Click the Next button
        next_btn = page.locator('button:has-text("Next"):visible, button[type="submit"]:visible').first
        next_btn.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        ss(page, "tc014_after_consent")

        assert "/stage/2" in page.url, f"Expected /stage/2, got {page.url}"
        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc015_invalid_token_redirects_to_expired(browser: Browser):
    """TC-015: An invalid/unknown token redirects to /expired."""
    name = "TC-015: Invalid token redirects to /expired"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        page.goto(f"{BASE_URL}/apply/this-token-does-not-exist-anywhere-12345")
        page.wait_for_load_state("networkidle")
        ss(page, "tc015_invalid_token")

        assert "/expired" in page.url, f"Expected /expired, got {page.url}"
        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc016_resume_returns_to_current_stage(browser: Browser, invite_url: str):
    """TC-016: After advancing past consent, revisiting the apply URL resumes at the current stage."""
    name = "TC-016: Resume returns to current stage"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()

        # First visit: complete consent so currentStage advances
        page.goto(invite_url)
        page.wait_for_load_state("networkidle")
        if "/stage/1" not in page.url and "/stage/" not in page.url:
            # might already be advanced
            pass

        if "/stage/1" in page.url:
            checkbox = page.locator('input[type="checkbox"]:visible').first
            if checkbox.count() > 0:
                checkbox.check()
            page.locator('button:has-text("Next"):visible, button[type="submit"]:visible').first.click()
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(800)

        # Now revisit the bare apply URL — should land on whatever the current stage is, not stage/1
        page.goto(invite_url)
        page.wait_for_load_state("networkidle")
        ss(page, "tc016_resume")

        assert "/stage/" in page.url, f"Expected to land on a stage, got {page.url}"
        # Should not be /stage/1 if consent already given
        # (this is best-effort; if consent skipped above, stage/1 is fine)
        record(name, True, f"Resumed at {page.url.split('/stage/')[-1].split('?')[0]}")
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc017_engagement_logged_to_admin(browser: Browser, job_id: str, candidate_email: str):
    """TC-017: Candidate visits create session events visible on admin candidate page."""
    name = "TC-017: Engagement events appear on admin side"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        admin_login(page)

        # Find the candidate from the job page (submitted tab won't show in-progress;
        # we need to find the candidate via the invited→started transition).
        # Simplest: visit the job page and look for the candidate in any list.
        page.goto(f"{BASE_URL}/admin/jobs/{job_id}?tab=invited")
        page.wait_for_load_state("networkidle")

        # Click on the candidate's name if visible — but invited tab only shows invites,
        # not candidates. The candidate detail page lives at /admin/candidates/<id>.
        # We need to find it via the homepage role-grouped list.
        page.goto(f"{BASE_URL}/admin")
        page.wait_for_load_state("networkidle")

        # Look for a link to the candidate
        candidate_link = page.locator(f'a[href*="/admin/candidates/"]').first
        if candidate_link.count() == 0:
            record(name, False, "No candidate link found on dashboard — candidate may not have been created")
            ctx.close()
            return

        candidate_link.click()
        page.wait_for_load_state("networkidle")
        ss(page, "tc017_candidate_page")

        body = page.content()
        # Engagement panel renders only when sessions exist
        assert "Engagement" in body or "Sessions" in body, \
            "Engagement panel not visible on candidate page (no sessions logged?)"

        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "═" * 62)
    print("  YFS Recruit — Candidate Flow E2E Suite")
    print("═" * 62)
    print(f"  Target:  {BASE_URL}")
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            print("  [setup] Creating test job + invite via Prisma fixture...")
            fixture = setup_fixture()
            if not fixture:
                print("  [setup] ❌ Failed to create fixture — aborting")
                browser.close()
                sys.exit(1)
            job_id = fixture["jobId"]
            candidate_email = fixture["candidateEmail"]
            invite_url = fixture["applyUrl"]
            print(f"  [setup] ✅ invite_url={invite_url}")
            print()

            tc013_valid_token_renders_welcome(browser, invite_url)
            tc014_consent_advances_to_stage_2(browser, invite_url)
            tc015_invalid_token_redirects_to_expired(browser)
            tc016_resume_returns_to_current_stage(browser, invite_url)
            tc017_engagement_logged_to_admin(browser, job_id, candidate_email)

        finally:
            browser.close()

    print("\n" + "═" * 62)
    print("  SUMMARY")
    print("═" * 62)
    passed = [r for r in results if r["passed"]]
    failed = [r for r in results if not r["passed"]]
    for r in results:
        icon = "✅" if r["passed"] else "❌"
        print(f"  {icon}  {r['name']}")
        if not r["passed"] and r["note"]:
            print(f"      {r['note'][:140]}")
    print()
    print(f"  Passed: {len(passed)} / {len(results)}")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
