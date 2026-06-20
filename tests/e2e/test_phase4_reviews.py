"""
Phase 4 reviewer-flow smoke test.

Run with:
    cd /path/to/recruit
    python3 tests/e2e/test_phase4_reviews.py
"""

import os
import sys
import time
from playwright.sync_api import sync_playwright, expect

BASE_URL = "http://localhost:3010"
ADMIN_EMAIL = os.environ.get("ADMIN_E2E_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_E2E_PASSWORD", "")
CANDIDATE_ID = "cmo45gooe0002n46j8vvuqhdd"


def login(page):
    page.goto(f"{BASE_URL}/login")
    page.fill('input[name="email"]', ADMIN_EMAIL)
    page.fill('input[name="password"]', ADMIN_PASSWORD)
    page.click('button[type="submit"]')
    page.wait_for_url(f"{BASE_URL}/admin", timeout=10_000)


def main():
    failures = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1400, "height": 900})
        page = ctx.new_page()

        try:
            print("[1/6] Login as admin")
            login(page)

            print("[2/6] Open candidate detail page")
            page.goto(f"{BASE_URL}/admin/candidates/{CANDIDATE_ID}")
            page.wait_for_load_state("networkidle")
            expect(page.get_by_text("Reviewers", exact=True).first).to_be_visible(timeout=5_000)

            print("[3/6] Assign self as reviewer")
            select = page.locator('select[name="reviewerEmail"]')
            select.wait_for(state="visible", timeout=5_000)
            select.select_option(ADMIN_EMAIL)
            page.click('button:has-text("Assign")')
            page.wait_for_load_state("networkidle")

            # The reviewer should now appear as PENDING with a "you" badge
            reviewer_card = page.locator(f'li:has-text("{ADMIN_EMAIL}")').first
            expect(reviewer_card).to_be_visible(timeout=5_000)
            expect(reviewer_card.get_by_text("Pending", exact=True)).to_be_visible()
            expect(reviewer_card.get_by_text("you", exact=True)).to_be_visible()
            print("    PASS: reviewer assigned and visible")

            print("[4/6] Submit decision (Strong yes)")
            # Decision form is inline within the reviewer's card
            page.locator('input[name="recommendation"][value="STRONG_YES"]').check()
            page.fill(
                'textarea[name="notes"]',
                "Phase 4 smoke test: strong yes — clear ownership in answers.",
            )
            page.click('button:has-text("Submit decision")')
            page.wait_for_load_state("networkidle")

            # Now the row should show "Submitted" and "Strong yes"
            reviewer_card_after = page.locator(f'li:has-text("{ADMIN_EMAIL}")').first
            expect(reviewer_card_after.get_by_text("Submitted", exact=True)).to_be_visible(timeout=5_000)
            expect(reviewer_card_after.get_by_text("Strong yes", exact=True)).to_be_visible()
            expect(
                reviewer_card_after.get_by_text(
                    "Phase 4 smoke test: strong yes — clear ownership in answers."
                )
            ).to_be_visible()
            print("    PASS: decision submitted and visible")

            print("[5/6] Visit /admin/reviews dashboard")
            page.goto(f"{BASE_URL}/admin/reviews")
            page.wait_for_load_state("networkidle")
            expect(page.get_by_role("heading", name="Reviews")).to_be_visible(timeout=5_000)

            # The submitted review should appear under "Assigned to you — submitted"
            submitted_section = page.locator("section:has-text('Assigned to you — submitted')")
            expect(submitted_section).to_be_visible()
            expect(submitted_section.get_by_text("Billy Naveed", exact=True)).to_be_visible()
            expect(submitted_section.get_by_text("Strong yes", exact=True)).to_be_visible()
            print("    PASS: submitted review visible in dashboard")

            # The pending section should NOT contain this candidate now (review was submitted)
            pending_section = page.locator("section:has-text('Assigned to you — pending')")
            pending_count = pending_section.locator("li").count()
            print(f"    Pending review count: {pending_count}")

            print("[6/6] Sidebar reviews link visible")
            # Sidebar shows on lg+; viewport is 1400 wide so it should be visible
            sidebar_link = page.locator('aside a[href="/admin/reviews"]').first
            expect(sidebar_link).to_be_visible()
            print("    PASS: sidebar Reviews link present")

            page.screenshot(path="tests/e2e/screenshots/phase4_reviews_final.png", full_page=True)
            print(f"\nALL CHECKS PASSED")

        except Exception as e:
            failures.append(str(e))
            page.screenshot(path="tests/e2e/screenshots/phase4_failure.png", full_page=True)
            print(f"\nFAILURE: {e}")

        finally:
            ctx.close()
            browser.close()

    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
