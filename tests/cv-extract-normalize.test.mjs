// Regression test for lib/cv-extract.ts `normalize()`.
//
// Background: 22 prod uploads failed between 2026-05-04 and 2026-05-22 with
// Postgres "invalid byte sequence for encoding UTF8: 0x00" because pdf-parse
// emits NUL bytes for some PDFs and we wrote those bytes straight into a TEXT
// column. This asserts they're stripped.
//
// Run:
//   node --experimental-strip-types tests/cv-extract-normalize.test.mjs

import assert from "node:assert/strict";
import { normalize } from "../lib/cv-extract.ts";

let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failures += 1;
    console.log(`  FAIL ${name}`);
    console.log(`       ${err.message}`);
  }
}

check("strips embedded NUL bytes", () => {
  const input = "Hello\u0000World\u0000\u0000!";
  const out = normalize(input);
  assert.equal(out, "HelloWorld!");
  assert.ok(!out.includes("\u0000"), "NUL still present");
});

check("strips NULs interspersed with newlines and CRLFs", () => {
  const input = "Line one\u0000\r\nLine\u0000 two\r\n\u0000\u0000\u0000";
  const out = normalize(input);
  assert.ok(!out.includes("\u0000"), "NUL still present");
  assert.ok(out.includes("Line one"), "content lost");
  assert.ok(out.includes("Line two"), "content lost");
});

check("returns null for input that is only NULs", () => {
  const out = normalize("\u0000\u0000\u0000\u0000");
  assert.equal(out, null);
});

check("preserves regular content unchanged in shape", () => {
  const input = "Jordan Park\n\nSummary\n\n\nDeep paragraph text.\n";
  const out = normalize(input);
  assert.ok(out.startsWith("Jordan Park"));
  assert.ok(out.includes("Summary"));
  assert.ok(out.includes("Deep paragraph text."));
  // Triple+ newlines collapsed to double
  assert.ok(!out.includes("\n\n\n"));
});

check("collapses non-breaking spaces to regular spaces", () => {
  const input = "Stripe 2024";
  const out = normalize(input);
  assert.equal(out, "Stripe 2024");
});

check("returns null for empty input", () => {
  assert.equal(normalize(""), null);
});

if (failures > 0) {
  console.log(`\n  ${failures} test(s) failed`);
  process.exit(1);
}
console.log("\n  all normalize() tests passed");
