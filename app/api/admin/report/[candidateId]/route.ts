import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import PDFDocument from "pdfkit";
import type { SynthesisResult, DimensionBand, RoleFitBand } from "@/lib/scoring/synthesis";
import { APP_NAME, ORG_NAME } from "@/lib/site-config";

// ─── Display constants ────────────────────────────────────────────────────────

const DIMENSION_LABELS: Record<string, string> = {
  conscientiousness: "Conscientiousness",
  honesty_humility: "Honesty & Humility",
  composure: "Composure",
  learning: "Learning Orientation",
  interpersonal: "Interpersonal",
};

const BAND_LABELS: Record<DimensionBand, string> = {
  unusually_strong: "Unusually Strong",
  strong_positive: "Strong Positive",
  moderate_positive: "Moderate Positive",
  mixed: "Mixed",
  limited_signal: "Limited Signal",
  insufficient_signal: "Insufficient Signal",
  concern: "Concern",
};

const ROLE_FIT_COLOR: Record<RoleFitBand, [number, number, number]> = {
  "Strong fit":      [5, 150, 105],
  "Likely fit":      [14, 165, 233],
  "Mixed fit":       [217, 119, 6],
  "Weak fit":        [234, 88, 12],
  "Likely mis-fit":  [225, 29, 72],
};

type PsychoScores = {
  fcTallies?: Record<string, number>;
  t2Scores?: Record<string, number>;
  t1Ranking?: string[];
  ccValues?: Record<string, number>;
} | null;

// ─── PDF helpers ──────────────────────────────────────────────────────────────

function bufferPdf(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string) {
  doc.moveDown(0.6);
  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor("#64748b")
    .text(title.toUpperCase(), { characterSpacing: 1.2 })
    .moveDown(0.2)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor("#e2e8f0")
    .lineWidth(0.5)
    .stroke()
    .moveDown(0.4);
}

function proseParagraph(doc: PDFKit.PDFDocument, text: string, indent = 0) {
  doc
    .fontSize(10.5)
    .font("Helvetica")
    .fillColor("#1e293b")
    .text(text, { lineGap: 4, indent });
  doc.moveDown(0.3);
}

function bulletItem(doc: PDFKit.PDFDocument, text: string) {
  const x = doc.page.margins.left + 10;
  const textX = x + 12;
  const y = doc.y;
  doc.circle(x + 3, y + 5, 2).fill("#94a3b8");
  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#1e293b")
    .text(text, textX, y, { lineGap: 3, width: doc.page.width - doc.page.margins.right - textX });
  doc.moveDown(0.2);
}

function dimRow(doc: PDFKit.PDFDocument, label: string, band: string, summary?: string) {
  doc
    .fontSize(9.5)
    .font("Helvetica-Bold")
    .fillColor("#0f172a")
    .text(label, { continued: true })
    .font("Helvetica")
    .fillColor("#475569")
    .text(`  ${BAND_LABELS[band as DimensionBand] ?? band}`);
  if (summary) {
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(summary, { lineGap: 2, indent: 10 });
  }
  doc.moveDown(0.25);
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { candidateId } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      job: { include: { roleQuestions: { orderBy: { sortOrder: "asc" } } } },
      submission: {
        include: { itemScores: { orderBy: { itemId: "asc" } } },
      },
    },
  });

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  const [standardQuestions, psychoItems] = await Promise.all([
    prisma.standardQuestion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.psychometricItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  const sub = candidate.submission;
  const scores = sub?.psychoScores as PsychoScores;
  const psychoAnswers = (sub?.psychoAnswers as Record<string, unknown>) ?? {};
  const roleAnswers = (sub?.roleAnswers as Record<string, string>) ?? {};
  const standardAnswers = (sub?.standardAnswers as Record<string, string>) ?? {};
  const synthesis = sub?.synthesisJson as SynthesisResult | null;

  const doc = new PDFDocument({
    margin: 52,
    size: "A4",
    bufferPages: true,
    info: {
      Title: `Candidate Report — ${candidate.name}`,
      Author: APP_NAME,
    },
  });

  const pdfDone = bufferPdf(doc);

  // ══════════════════════════════════════════════════════════════════════
  // COVER BAND
  // ══════════════════════════════════════════════════════════════════════
  doc.rect(0, 0, doc.page.width, 90).fill("#0f172a");

  doc
    .fontSize(19)
    .font("Helvetica-Bold")
    .fillColor("#ffffff")
    .text("Candidate Report", 52, 22)
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#94a3b8")
    .text(`${ORG_NAME} — Internal & Confidential`, 52, 47);

  // Role-fit band badge (top-right if synthesis exists)
  if (synthesis?.roleFitRead?.band) {
    const band = synthesis.roleFitRead.band;
    const [r, g, b] = ROLE_FIT_COLOR[band] ?? [100, 116, 139];
    const badgeX = doc.page.width - 52 - 130;
    doc
      .roundedRect(badgeX, 22, 130, 46, 6)
      .fill(`rgb(${r},${g},${b})`);
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("ROLE-FIT READ", badgeX + 10, 28, { width: 110, align: "center" });
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text(band, badgeX + 10, 42, { width: 110, align: "center" });
  }

  doc.y = 100;

  // Candidate meta strip
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .fillColor("#0f172a")
    .text(candidate.name)
    .fontSize(10)
    .font("Helvetica")
    .fillColor("#64748b")
    .text(`${candidate.email} · ${candidate.job.title}`)
    .moveDown(0.15);

  const stage = candidate.stage.replace(/_/g, " ");
  const submitted = sub?.submittedAt
    ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(sub.submittedAt)
    : "—";
  doc
    .fontSize(9)
    .fillColor("#94a3b8")
    .text(`Stage: ${stage}   ·   Submitted: ${submitted}`)
    .moveDown(0.6);

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 1 — ASSESSMENT SUMMARY
  // ══════════════════════════════════════════════════════════════════════
  sectionHeader(doc, "Assessment Summary");

  if (synthesis?.roleFitRead) {
    // Role-fit read + confidence
    const band = synthesis.roleFitRead.band;
    const [r, g, b] = ROLE_FIT_COLOR[band] ?? [100, 116, 139];
    doc
      .fontSize(8)
      .font("Helvetica-Bold")
      .fillColor("#64748b")
      .text("ROLE-FIT READ");
    doc
      .fontSize(15)
      .font("Helvetica-Bold")
      .fillColor(`rgb(${r},${g},${b})`)
      .text(band)
      .moveDown(0.15);

    if (synthesis.overallConfidenceDescription || synthesis.overallConfidence) {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#64748b")
        .text(`Confidence: ${synthesis.overallConfidenceDescription ?? synthesis.overallConfidence}`)
        .moveDown(0.3);
    }

    if (synthesis.prose?.roleFitRationale) {
      proseParagraph(doc, synthesis.prose.roleFitRationale);
    }

    if (synthesis.prose?.confidenceRationale) {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#64748b")
        .text(synthesis.prose.confidenceRationale, { lineGap: 2 })
        .moveDown(0.3);
    }

    doc
      .fontSize(8.5)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text("This is a structured summary of observed signal against the hiring frame. It is not a hire or no-hire recommendation — an interview is required.")
      .moveDown(0.4);

    // Strengths
    if (synthesis.prose?.strengths && synthesis.prose.strengths.length > 0) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("Strengths")
        .moveDown(0.2);
      for (const s of synthesis.prose.strengths) {
        bulletItem(doc, s);
      }
      doc.moveDown(0.2);
    }

    // Pattern flags
    if (synthesis.flags && synthesis.flags.length > 0) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#0f172a")
        .text("Pattern Flags")
        .moveDown(0.2);
      for (const flag of synthesis.flags) {
        const color = flag.severity === "high" ? "#991b1b" : flag.severity === "medium" ? "#92400e" : "#475569";
        doc
          .fontSize(9.5)
          .font("Helvetica-Bold")
          .fillColor(color)
          .text(`${flag.label} (${flag.severity})`, { continued: false })
          .font("Helvetica")
          .fillColor("#334155")
          .fontSize(9)
          .text(flag.description, { lineGap: 2, indent: 10 });
        doc.moveDown(0.3);
      }
    }

    // Interview Focus — consolidated (flag probes + signal gap probes)
    const topQ = synthesis.prose?.followUpQuestions?.topThree ?? [];
    const openQ = synthesis.prose?.openQuestions ?? [];
    const hasFlags = synthesis.flags.length > 0;

    if (topQ.length > 0 || openQ.length > 0) {
      sectionHeader(doc, "Interview Focus — Top Questions");
      let qNum = 1;

      if (topQ.length > 0) {
        if (hasFlags) {
          doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b").text("From pattern flags:").moveDown(0.2);
        }
        for (const q of topQ) {
          doc
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .fillColor("#475569")
            .text(`${qNum++}.`, { continued: true })
            .font("Helvetica")
            .fillColor("#0f172a")
            .text(`  ${q}`, { lineGap: 3 });
          doc.moveDown(0.4);
        }
      }

      if (openQ.length > 0) {
        if (topQ.length > 0) doc.moveDown(0.2);
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#64748b").text("From signal gaps:").moveDown(0.2);
        for (const q of openQ) {
          doc
            .fontSize(9.5)
            .font("Helvetica-Bold")
            .fillColor("#475569")
            .text(`${qNum++}.`, { continued: true })
            .font("Helvetica")
            .fillColor("#0f172a")
            .text(`  ${q}`, { lineGap: 3 });
          doc.moveDown(0.4);
        }
      }
    }

    // Dimension estimates with contributing evidence
    sectionHeader(doc, "Dimension Estimates");
    const dimensionOrder = ["conscientiousness", "honesty_humility", "composure", "learning", "interpersonal"];
    for (const dim of dimensionOrder) {
      const result = synthesis.dimensions[dim];
      if (!result) continue;
      const summary = synthesis.prose?.dimensionSummaries?.[dim];
      dimRow(doc, DIMENSION_LABELS[dim] ?? dim, result.band, summary);
      // Contributing evidence — always shown; "none" if no scored sources
      const evItems = result.contributingItems ?? [];
      const evText = evItems.length > 0
        ? evItems
            .map((ci) =>
              typeof ci === "string"
                ? ci
                    .replace(/motivation_(\w+)/g, (_, m) => `Motivation: ${m.charAt(0).toUpperCase() + m.slice(1)}`)
                    .replace(/FC \(honesty_humility tally:/, "FC (Honesty & Humility tally:")
                    .replace(/FC \(conscientiousness tally:/, "FC (Conscientiousness tally:")
                    .replace(/FC \(composure tally:/, "FC (Composure tally:")
                    .replace(/FC \(learning tally:/, "FC (Learning Orientation tally:")
                    .replace(/FC \(interpersonal tally:/, "FC (Interpersonal tally:")
                : String(ci)
            )
            .join(", ")
        : "none";
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#94a3b8")
        .text(`Contributing evidence: ${evText}`, { indent: 10, lineGap: 1 })
        .moveDown(0.3);
    }
  } else {
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text("Assessment analysis has not been run for this candidate yet. Open the admin candidate page and click Re-analyse.")
      .moveDown(0.5);
  }

  // ══════════════════════════════════════════════════════════════════════
  // SECTION 2 — FULL RESPONSES
  // ══════════════════════════════════════════════════════════════════════
  sectionHeader(doc, "Full Responses");

  // Role-specific questions
  if (candidate.job.roleQuestions.length > 0) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Role-Specific Questions").moveDown(0.3);
    for (const q of candidate.job.roleQuestions) {
      const answer = roleAnswers[q.id] ?? "";
      doc
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .fillColor("#334155")
        .text(q.prompt, { lineGap: 2 })
        .moveDown(0.15)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(answer || "(No answer provided)", { lineGap: 3 })
        .moveDown(0.5);
    }
  }

  // Standard questions
  if (standardQuestions.length > 0) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Standard Questions").moveDown(0.3);
    for (const q of standardQuestions) {
      const answer = standardAnswers[q.id] ?? "";
      doc
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .fillColor("#334155")
        .text(q.prompt, { lineGap: 2 })
        .moveDown(0.15)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(answer || "(No answer provided)", { lineGap: 3 })
        .moveDown(0.5);
    }
  }

  // STAR behavioural items
  const starItems = psychoItems.filter((i) => i.itemType === "star_behavioral");
  if (starItems.length > 0) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("STAR Behavioural Responses").moveDown(0.3);
    for (const item of starItems) {
      const answer = psychoAnswers[item.id] as string | undefined;
      const scoredRow = sub?.itemScores?.find((s) => s.itemId === item.itemId);
      const rawBand = scoredRow?.bandEstimate ?? null;
      const status = scoredRow?.status ?? null;
      const bandLabel = rawBand && status === "scored"
        ? ` — ${BAND_LABELS[rawBand as DimensionBand] ?? rawBand}`
        : status === "scoring_failed" ? " — Not scored"
        : status === "insufficient" ? " — Too short to score"
        : "";

      doc
        .fontSize(9.5)
        .font("Helvetica-Bold")
        .fillColor("#334155")
        .text(`${item.itemId}${bandLabel}`, { lineGap: 2 })
        .moveDown(0.15)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(answer ?? "(No response)", { lineGap: 3 })
        .moveDown(0.5);
    }
  }

  // Psychometric summary (FC tallies, T1 ranking, CC values)
  if (scores?.fcTallies && Object.keys(scores.fcTallies).length > 0) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Forced-Choice Tallies").moveDown(0.2);
    const sorted = Object.entries(scores.fcTallies).sort((a, b) => b[1] - a[1]);
    for (const [dim, count] of sorted) {
      const dimLabel = DIMENSION_LABELS[dim] ?? dim.replace(/motivation_(\w+)/, (_, m) => `Motivation: ${m.charAt(0).toUpperCase() + m.slice(1)}`);
      doc
        .fontSize(9.5)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(`${dimLabel}: ${count}`)
        .moveDown(0.1);
    }
    doc.moveDown(0.4);
  }

  if (scores?.t1Ranking && scores.t1Ranking.length > 0) {
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Motivational Ranking (C-T1)").moveDown(0.2);
    scores.t1Ranking.forEach((id, i) => {
      doc
        .fontSize(9.5)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(`${i + 1}. ${id.replace(/_/g, " ")}`)
        .moveDown(0.1);
    });
    doc.moveDown(0.4);
  }

  if (scores?.ccValues && Object.keys(scores.ccValues).length > 0) {
    const likertLabels = ["", "Strongly Disagree", "Disagree", "Neither", "Agree", "Strongly Agree"];
    doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Consistency Checks").moveDown(0.2);
    for (const [itemId, val] of Object.entries(scores.ccValues)) {
      doc
        .fontSize(9.5)
        .font("Helvetica")
        .fillColor("#0f172a")
        .text(`${itemId}: ${likertLabels[val] ?? String(val)} (${val}/5)`)
        .moveDown(0.15);
    }
    doc.moveDown(0.3);
  }

  // Reflection
  const reflectionItem = psychoItems.find((i) => i.itemId === "C-R1");
  if (reflectionItem) {
    const reflAnswer = psychoAnswers[reflectionItem.id] as string | undefined;
    if (reflAnswer) {
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#0f172a").text("Reflection (C-R1)").moveDown(0.2);
      doc.fontSize(9.5).font("Helvetica").fillColor("#0f172a").text(reflAnswer, { lineGap: 3 }).moveDown(0.4);
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // FOOTER on every page
  // ══════════════════════════════════════════════════════════════════════
  doc.end();
  const nodeBuffer = await pdfDone;

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(7.5)
      .fillColor("#94a3b8")
      .font("Helvetica")
      .text(
        `${APP_NAME} — Confidential — ${candidate.name} — Page ${i + 1} of ${range.count}`,
        52,
        doc.page.height - 32,
        { align: "center", width: doc.page.width - 104 }
      );
  }

  const safeName = candidate.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return new NextResponse(new Uint8Array(nodeBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="candidate-report-${safeName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
