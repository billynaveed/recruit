"""
YFS Recruit — Full E2E Test Suite
Covers TC-001 through TC-012 from TEST_CASES.md

Run with:
    cd /path/to/recruit
    python3 tests/e2e/test_recruit.py
"""

import os
import sys
import time
import traceback
from playwright.sync_api import sync_playwright, Page, Browser

# ─── Config ──────────────────────────────────────────────────────────────────

BASE_URL       = "http://localhost:3000"
ADMIN_EMAIL    = os.environ.get("ADMIN_E2E_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_E2E_PASSWORD", "")
BAD_PASSWORD   = "wrongpassword123"
BAD_EMAIL      = "notallowed@example.com"
SCREENSHOT_DIR = "tests/e2e/screenshots"

TEST_JOB_TITLE = f"E2E Test Job {int(time.time())}"
TEST_JOB_DESCRIPTION = (
    "We are looking for a Senior Software Engineer to join our growing team.\n\n"
    "Responsibilities:\n"
    "- Design and implement scalable backend services using Python and Go\n"
    "- Lead technical architecture discussions and code reviews\n"
    "- Collaborate with product managers and designers to ship new features\n"
    "- Mentor junior engineers and participate in hiring decisions\n"
    "- Ensure high availability and performance of production systems\n\n"
    "Requirements:\n"
    "- 5+ years of professional software engineering experience\n"
    "- Strong proficiency in Python, Go, or similar languages\n"
    "- Experience with distributed systems and microservices architecture\n"
    "- Excellent communication skills and ability to work in a fast-paced startup\n"
    "- BS/MS in Computer Science or equivalent practical experience"
)

# ─── Results tracking ─────────────────────────────────────────────────────────

results: list[dict] = []


def record(name: str, passed: bool, note: str = ""):
    results.append({"name": name, "passed": passed, "note": note})
    icon = "✅ PASS" if passed else "❌ FAIL"
    print(f"  {icon}  {name}")
    if not passed and note:
        print(f"         {note[:140]}")


def ss(page: Page, name: str) -> str:
    path = f"{SCREENSHOT_DIR}/{name}.png"
    page.screenshot(path=path, full_page=True)
    return path


# ─── Auth helpers ─────────────────────────────────────────────────────────────

def do_login(page: Page, email=ADMIN_EMAIL, password=ADMIN_PASSWORD):
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")
    page.locator('input[name="email"]').fill(email)
    page.locator('input[type="password"]').fill(password)
    page.locator('button[type="submit"]').click()
    # Login uses client-side router.push — wait for navigation
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1500)


def do_logout(page: Page):
    # Sidebar has a form with a Sign out button.
    # Responsive shell renders both desktop sidebar + mobile drawer copies — pick the visible one.
    visible_logout = page.locator('button:has-text("Sign out"):visible').first
    visible_logout.click()
    page.wait_for_load_state("networkidle")


# ─── Tests ────────────────────────────────────────────────────────────────────

def tc001_login_persists(browser: Browser):
    """TC-001: Valid admin login and session survives hard refresh."""
    name = "TC-001: Valid login and session persists on hard refresh"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        do_login(page)
        ss(page, "tc001_after_login")
        assert "/admin" in page.url, f"Expected /admin, got {page.url}"

        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)
        ss(page, "tc001_after_refresh")
        assert "/login" not in page.url, f"Session lost on reload — redirected to {page.url}"
        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc005_wrong_password(browser: Browser):
    """TC-005: Wrong password is rejected."""
    name = "TC-005: Wrong password is rejected"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        do_login(page, password=BAD_PASSWORD)
        ss(page, "tc005_wrong_password")
        assert "/admin" not in page.url, f"Should not reach /admin with wrong password, got {page.url}"
        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc006_bad_email(browser: Browser):
    """TC-006: Non-allowlisted email is rejected."""
    name = "TC-006: Unauthorized email is rejected"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        do_login(page, email=BAD_EMAIL)
        ss(page, "tc006_bad_email")
        assert "/admin" not in page.url, f"Non-allowlisted email should not reach /admin, got {page.url}"
        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc007_create_job(browser: Browser) -> str | None:
    """TC-007: Create a job and verify it appears in sidebar."""
    name = "TC-007: Create a job and verify it appears"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        do_login(page)

        ss(page, "tc007_dashboard")

        # Create-job form lives at /admin/jobs/new (not on /admin)
        page.goto(f"{BASE_URL}/admin/jobs/new")
        page.wait_for_load_state("networkidle")

        # Fill create-job form
        page.locator('input[name="title"]').fill(TEST_JOB_TITLE)
        page.locator('input[name="department"]').fill("Engineering")
        page.locator('input[name="location"]').fill("Remote")
        # descriptionText is the large main textarea (name="descriptionText")
        page.locator('textarea[name="descriptionText"]').fill(TEST_JOB_DESCRIPTION)

        # Submit "Create job"
        page.locator('button:has-text("Create job")').click()
        page.wait_for_load_state("networkidle")
        # AI generation may take several seconds
        page.wait_for_timeout(12000)
        ss(page, "tc007_after_create")

        # The new job should appear in sidebar
        job_link = page.locator(f'a:has-text("{TEST_JOB_TITLE}")')
        assert job_link.count() > 0, f"'{TEST_JOB_TITLE}' not in sidebar after creation"

        job_link.first.click()
        page.wait_for_load_state("networkidle")
        ss(page, "tc007_job_detail")
        assert "/admin/jobs/" in page.url, f"Expected job detail URL, got {page.url}"

        job_id = page.url.split("/admin/jobs/")[-1].rstrip("/")
        record(name, True, f"job_id={job_id}")
        ctx.close()
        return job_id

    except Exception as e:
        record(name, False, f"{e}")
        return None


def tc002_job_links(browser: Browser):
    """TC-002: Sidebar and recent-jobs links open job detail without redirect."""
    name = "TC-002: Sidebar and recent-jobs links open job detail"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        do_login(page)

        job_links = page.locator('a[href*="/admin/jobs/"]').all()
        assert job_links, "No job links found — need at least one job in the system"

        # Click sidebar link
        href = job_links[0].get_attribute("href")
        job_links[0].click()
        page.wait_for_load_state("networkidle")
        ss(page, "tc002_sidebar_click")
        assert "/login" not in page.url, f"Sidebar click redirected to login. URL: {page.url}"
        assert "/admin/jobs/" in page.url

        # Go back and click main content link
        page.go_back()
        page.wait_for_load_state("networkidle")
        # Recent jobs links are typically in the main content area (not sidebar)
        main_links = page.locator('main a[href*="/admin/jobs/"], [class*="grid"] a[href*="/admin/jobs/"]').all()
        if main_links:
            main_links[0].click()
            page.wait_for_load_state("networkidle")
            ss(page, "tc002_recent_jobs_click")
            assert "/login" not in page.url, f"Recent jobs click redirected to login. URL: {page.url}"

        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc003_deep_link(browser: Browser, job_id: str):
    """TC-003: Direct deep link to a job page works."""
    name = "TC-003: Direct deep link to job page works"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        do_login(page)

        deep_url = f"{BASE_URL}/admin/jobs/{job_id}"
        page.goto(deep_url)
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)
        ss(page, "tc003_deep_link")

        assert "/login" not in page.url, f"Deep link redirected to login. URL: {page.url}"
        assert job_id in page.url, f"Not on expected job page. URL: {page.url}"
        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc008_edit_questions(browser: Browser, job_id: str):
    """TC-008: Edit a role question and verify it persists after refresh."""
    name = "TC-008: Edit role questions and verify persistence"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        do_login(page)
        page.goto(f"{BASE_URL}/admin/jobs/{job_id}")
        page.wait_for_load_state("networkidle")
        ss(page, "tc008_before_edit")

        # Questions editor renders textareas for each question prompt
        # The textarea for each question has no fixed name — they're inside the client component
        question_textareas = page.locator('textarea').all()
        # Filter out named ones (notes, csvText are named; question textareas are not)
        q_textareas = [t for t in question_textareas
                       if t.get_attribute("name") not in ("notes", "csvText", "descriptionText", "customQuestionPrompt")]

        assert q_textareas, "No question textareas found on job detail page"

        original = q_textareas[0].input_value()
        edited = "EDITED E2E: " + (original[:70] if original else "Describe your most relevant experience for this role.")
        q_textareas[0].fill(edited)

        # Save questions
        page.locator('button:has-text("Save questions")').click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        ss(page, "tc008_after_save")

        # Reload and verify
        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)
        refreshed_textareas = [t for t in page.locator('textarea').all()
                               if t.get_attribute("name") not in ("notes", "csvText", "descriptionText", "customQuestionPrompt")]
        assert refreshed_textareas, "Question textareas gone after reload"
        persisted = refreshed_textareas[0].input_value()
        assert "EDITED E2E:" in persisted, f"Edit did not persist. Got: {persisted[:80]}"
        ss(page, "tc008_verified")
        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc009_create_invite(browser: Browser, job_id: str):
    """TC-009: Create a single invite and verify session survives the reload."""
    name = "TC-009: Create invite and session persists after reload"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        do_login(page)
        page.goto(f"{BASE_URL}/admin/jobs/{job_id}")
        page.wait_for_load_state("networkidle")
        ss(page, "tc009_before")

        page.locator('input[name="candidateName"]').fill("Alice Testcandidate")
        page.locator('input[name="candidateEmail"]').fill("alice.testcandidate@example.com")
        page.locator('button:has-text("Create invite link")').click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        # Invites live on the "invited" tab — the default tab is "submitted"
        page.goto(f"{BASE_URL}/admin/jobs/{job_id}?tab=invited")
        page.wait_for_load_state("networkidle")
        ss(page, "tc009_after_invite")

        body = page.content()
        assert "Alice Testcandidate" in body or "alice.testcandidate" in body, \
            "Invite not visible after creation"

        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)
        ss(page, "tc009_after_reload")
        assert "/login" not in page.url, f"Session lost after invite creation. URL: {page.url}"
        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc010_bulk_import(browser: Browser, job_id: str):
    """TC-010: Bulk CSV import creates multiple invites."""
    name = "TC-010: Bulk CSV import creates multiple invites"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        do_login(page)
        page.goto(f"{BASE_URL}/admin/jobs/{job_id}")
        page.wait_for_load_state("networkidle")

        csv_data = (
            "name,email,notes\n"
            "Bob Bulkimport,bob.bulkimport@example.com,Referred by Alice\n"
            "Carol Csvtest,carol.csvtest@example.com,Strong portfolio"
        )
        page.locator('textarea[name="csvText"]').fill(csv_data)
        page.locator('button:has-text("Import invites")').click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        # Invites live on the "invited" tab
        page.goto(f"{BASE_URL}/admin/jobs/{job_id}?tab=invited")
        page.wait_for_load_state("networkidle")
        ss(page, "tc010_after_import")

        body = page.content()
        assert "Bob Bulkimport" in body or "bob.bulkimport" in body, \
            "Bulk-imported invite for Bob not found"
        assert "Carol Csvtest" in body or "carol.csvtest" in body, \
            "Bulk-imported invite for Carol not found"
        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc011_revoke_invite(browser: Browser, job_id: str):
    """TC-011: Revoke an invite and verify REVOKED status persists."""
    name = "TC-011: Revoke an invite and verify REVOKED status"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        do_login(page)
        page.goto(f"{BASE_URL}/admin/jobs/{job_id}?tab=invited")
        page.wait_for_load_state("networkidle")
        ss(page, "tc011_before_revoke")

        revoke_btn = page.locator('button:has-text("Revoke")').first
        assert revoke_btn.count() > 0 or revoke_btn.is_visible(), \
            "No Revoke button — need at least one active invite"

        revoke_btn.click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)

        page.reload()
        page.wait_for_load_state("networkidle")
        ss(page, "tc011_after_revoke")
        assert "REVOKED" in page.content(), "REVOKED status not visible after revoking"
        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc004_logout_clears_access(browser: Browser, job_id: str | None):
    """TC-004: Sign out clears session — /admin and job deep links redirect to login."""
    name = "TC-004: Sign out clears session and access"
    try:
        ctx = browser.new_context()
        page = ctx.new_page()
        do_login(page)
        assert "/admin" in page.url

        do_logout(page)
        ss(page, "tc004_after_logout")
        assert "/login" in page.url, f"Expected /login after logout, got {page.url}"

        page.goto(f"{BASE_URL}/admin")
        page.wait_for_load_state("networkidle")
        ss(page, "tc004_admin_post_logout")
        assert "/login" in page.url, f"/admin should redirect to /login, got {page.url}"

        if job_id:
            page.goto(f"{BASE_URL}/admin/jobs/{job_id}")
            page.wait_for_load_state("networkidle")
            ss(page, "tc004_job_post_logout")
            assert "/login" in page.url, f"Job deep link accessible after logout. URL: {page.url}"

        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


def tc012_visual_sanity(browser: Browser, job_id: str | None):
    """TC-012: Dashboard and job detail render cleanly at desktop width."""
    name = "TC-012: Visual shell renders at 1440px desktop width"
    try:
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        do_login(page)
        page.wait_for_load_state("networkidle")
        ss(page, "tc012_dashboard_1440")

        # Key structural elements
        assert page.locator('nav, aside, [class*="sidebar"]').count() > 0, "No sidebar/nav found"
        # Stats cards or job list visible
        assert page.locator('[class*="card"], section, main').count() > 0, "No content area found"

        if job_id:
            page.goto(f"{BASE_URL}/admin/jobs/{job_id}")
            page.wait_for_load_state("networkidle")
            ss(page, "tc012_job_detail_1440")
            assert page.locator('textarea').count() > 0, "Question editor not rendered on job detail"
            assert page.locator('input[name="candidateName"]').count() > 0, "Invite form not rendered"
            assert page.locator('textarea[name="csvText"]').count() > 0, "CSV import not rendered"

        record(name, True)
        ctx.close()
    except Exception as e:
        record(name, False, f"{e}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "═" * 62)
    print("  YFS Recruit — E2E Test Suite")
    print("═" * 62)
    print(f"  Target:  {BASE_URL}")
    print(f"  Admin:   {ADMIN_EMAIL}")
    print(f"  New job: {TEST_JOB_TITLE}")
    print()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            # Auth tests — no shared state
            tc001_login_persists(browser)
            tc005_wrong_password(browser)
            tc006_bad_email(browser)

            # Create the test job — all subsequent tests depend on this
            print()
            job_id = tc007_create_job(browser)

            # Tests that need a real job
            print()
            tc002_job_links(browser)
            if job_id:
                tc003_deep_link(browser, job_id)
                tc008_edit_questions(browser, job_id)
                tc009_create_invite(browser, job_id)
                tc010_bulk_import(browser, job_id)
                tc011_revoke_invite(browser, job_id)
            else:
                for tc in ["TC-002", "TC-003", "TC-008", "TC-009", "TC-010", "TC-011"]:
                    record(f"{tc}: skipped — TC-007 failed", False, "No job_id available")

            # Logout test (run last so session is still valid)
            print()
            tc004_logout_clears_access(browser, job_id)

            # Visual
            print()
            # Need fresh login for visual test
            with browser.new_context() as ctx:
                page = ctx.new_page()
                do_login(page)
                if "/admin" in page.url:
                    ctx.close()
                    tc012_visual_sanity(browser, job_id)
                else:
                    record("TC-012: Visual shell renders at 1440px desktop width", False, "Could not login for visual test")

        finally:
            browser.close()

    # ── Summary ───────────────────────────────────────────────────────────────
    passed = [r for r in results if r["passed"]]
    failed = [r for r in results if not r["passed"]]

    print("\n" + "═" * 62)
    print("  SUMMARY")
    print("═" * 62)
    for r in results:
        icon = "✅" if r["passed"] else "❌"
        print(f"  {icon}  {r['name']}")
        if not r["passed"] and r["note"]:
            print(f"      {r['note'][:120]}")

    print()
    print(f"  {'✅' if not failed else '❌'}  {len(passed)} passed  /  {len(failed)} failed  /  {len(results)} total")
    print(f"  Screenshots: {SCREENSHOT_DIR}/")
    print()

    sys.exit(0 if not failed else 1)


if __name__ == "__main__":
    main()
