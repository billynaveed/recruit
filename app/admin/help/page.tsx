import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import {
  Briefcase,
  Send,
  Users,
  ClipboardCheck,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

export default async function HelpPage() {
  await requireAuth();

  return (
    <div className="max-w-[760px] space-y-8 pb-12">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900">How to use Recruit</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          A quick walkthrough of the main flows. Skim it once and you should not need it again.
        </p>
      </div>

      <Section
        icon={Briefcase}
        title="1. Create a job"
        steps={[
          <>Click <Code>Create job</Code> in the top-right (or the <Code>+ New</Code> button next to <em>Jobs</em> in the sidebar).</>,
          <>Paste the job description as plain text. PDF upload also works but plain text is more reliable.</>,
          <>The system generates ten role-specific questions based on the JD. Edit, delete, reorder, or add custom situational questions before opening the role.</>,
          <>Toggle the role from <Code>Draft</Code> to <Code>Open</Code> when you are ready to invite candidates.</>,
        ]}
      />

      <Section
        icon={Send}
        title="2. Invite candidates"
        steps={[
          <>Open the job and click the <Code>Invites</Code> tab.</>,
          <>Add a single invite by name and email, or use <Code>Bulk import</Code> with a CSV when you have more than three candidates.</>,
          <>Each invite gets a unique magic link. Click <Code>Copy link</Code> and send it however you normally reach the candidate.</>,
          <>Links expire after 14 days. You can revoke an invite at any time before the candidate submits.</>,
        ]}
      />

      <Section
        icon={Users}
        title="3. Track applications"
        steps={[
          <>The dashboard groups candidates by role. Click a role header to expand or collapse it.</>,
          <>Stages flow from <em>Not started</em> through <em>In progress</em> and <em>Completed</em>, then onto reviewer outcomes (<em>Reviewing</em>, <em>Shortlisted</em>, <em>Offer</em>, <em>Hired</em>, or <em>Rejected</em>).</>,
          <>Click any candidate name to open their full assessment, engagement panel, and reviewer panel.</>,
          <>The KPI strip at the top of the dashboard shows pipeline-wide counts at a glance.</>,
        ]}
      />

      <Section
        icon={ClipboardCheck}
        title="4. Assign and run reviews"
        steps={[
          <>On a candidate page, the <em>Reviewers</em> panel sits near the top. Pick a teammate from the <Code>Assign to</Code> dropdown and click <Code>Assign</Code>. You can self-assign too.</>,
          <>Each reviewer has their own queue. Open <Link href="/admin/reviews" className="text-blue-600 hover:underline">Reviews</Link> from the sidebar to see your pending assignments, your past decisions, and the team queue.</>,
          <>To submit a decision, open the candidate page where you are the assigned reviewer, choose <em>Strong yes / Yes / Lean no / No</em>, add notes, and click <Code>Submit decision</Code>.</>,
          <>Pending assignments can be withdrawn by either the reviewer or the person who assigned them. Submitted decisions are final — withdraw and reassign if you need to redo one.</>,
        ]}
      />

      <Section
        icon={CheckCircle2}
        title="5. Make a final decision"
        steps={[
          <>From a completed candidate page, use the action bar near the top: <Code>Shortlist</Code>, <Code>Reject</Code>, or <Code>Hire</Code>.</>,
          <>Rejected candidates can be moved back to the shortlist if you change your mind.</>,
          <>Every decision writes to the audit log so the team can see who did what and when.</>,
        ]}
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
        <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-900 leading-relaxed">
          <p className="font-semibold mb-1">A few habits that help</p>
          <ul className="list-disc pl-5 space-y-1 opacity-90">
            <li>Run <Code>Analyse candidate</Code> before assigning a reviewer. The structured assessment gives them something concrete to react to instead of a blank page.</li>
            <li>Keep notes short. Future-you will thank you when comparing across candidates.</li>
            <li>Use the same reviewer rubric across a single role so decisions are comparable.</li>
            <li>If something looks broken, check the audit log on the job page first — it captures every admin action with timestamps.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  steps,
}: {
  icon: typeof Briefcase;
  title: string;
  steps: React.ReactNode[];
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <ol className="space-y-2 text-sm text-slate-700 leading-relaxed list-decimal pl-5 marker:text-slate-400">
        {steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-100 text-slate-700 px-1.5 py-0.5 text-[12px] font-medium">
      {children}
    </code>
  );
}
