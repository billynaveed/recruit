// Generate a multi-paragraph fake CV PDF for E2E testing of upload + extraction.
// Usage: node tests/e2e/make_fake_cv.mjs <output_path>
import PDFDocument from "pdfkit";
import { createWriteStream } from "node:fs";

const out = process.argv[2] ?? "/tmp/recruit_e2e_cv.pdf";

const doc = new PDFDocument({ margin: 50 });
doc.pipe(createWriteStream(out));

doc.fontSize(20).text("Jordan Park", { align: "left" });
doc.moveDown(0.2);
doc.fontSize(10).fillColor("#555").text("Senior Software Engineer  ·  jordan.park@example.com  ·  +44 7700 900123");
doc.moveDown(1.2);

doc.fillColor("#000").fontSize(13).text("Summary", { underline: true });
doc.moveDown(0.3);
doc.fontSize(11).text(
  "Backend-leaning full-stack engineer with eight years of experience shipping production systems at scale. " +
  "Most recent work has focused on reliability of payment infrastructure: idempotency, queue topology, and " +
  "dead-letter recovery. Comfortable owning a system end-to-end from instrumentation through to incident response."
);
doc.moveDown(1);

doc.fontSize(13).text("Experience", { underline: true });
doc.moveDown(0.3);
doc.fontSize(11).text("Senior Engineer  ·  Stripe  ·  2024 to present");
doc.fontSize(10).fillColor("#444").text(
  "Led the migration of the dispute lifecycle pipeline off legacy cron to a queue-driven architecture. " +
  "Reduced average dispute response latency from 4.2 hours to 38 minutes. Designed the cancel-window contract " +
  "with the finance team after a postmortem caught an implicit timing dependency."
);
doc.moveDown(0.5);
doc.fillColor("#000").fontSize(11).text("Engineer  ·  Monzo  ·  2020 to 2024");
doc.fontSize(10).fillColor("#444").text(
  "Built and operated the realtime fraud-flag pipeline. Reduced false-positive rate by 23% via an offline " +
  "shadow-evaluation harness. Owned PagerDuty rotation for the payments squad for two years."
);
doc.moveDown(1);

doc.fillColor("#000").fontSize(13).text("Skills", { underline: true });
doc.moveDown(0.3);
doc.fontSize(11).text(
  "Languages: Go, Python, TypeScript, SQL.  Infra: PostgreSQL, Redis, Kafka, AWS.  Practices: load testing, " +
  "incident response, on-call discipline."
);
doc.moveDown(1);

doc.fontSize(13).text("Education", { underline: true });
doc.moveDown(0.3);
doc.fontSize(11).text("BSc Computer Science, University of Edinburgh, 2016");

doc.end();
console.log(out);
