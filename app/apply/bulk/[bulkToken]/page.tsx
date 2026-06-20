import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registerFromBulkLinkAction } from "@/actions/bulk-register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORG_NAME } from "@/lib/site-config";

export default async function BulkApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ bulkToken: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { bulkToken } = await params;
  const { error, message } = await searchParams;

  const link = await prisma.bulkInviteLink.findUnique({
    where: { token: bulkToken },
    include: {
      job: { select: { title: true, department: true, status: true } },
    },
  });

  if (!link) redirect(`/apply/bulk/${bulkToken}/expired`);
  if (link.status !== "ACTIVE" || link.expiresAt < new Date()) {
    redirect(`/apply/bulk/${bulkToken}/expired`);
  }
  if (link.job.status === "CLOSED") {
    redirect(`/apply/bulk/${bulkToken}/expired`);
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Apply to
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">{link.job.title}</h1>
          {link.job.department && (
            <p className="text-sm text-slate-500">{link.job.department}</p>
          )}
        </div>

        <p className="mt-6 text-sm text-slate-600 leading-relaxed">
          Enter your name and email to start your application. We will save your progress
          and you can return to your application using the link sent to your email.
        </p>

        {error && message && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {message}
          </div>
        )}

        <form action={registerFromBulkLinkAction} className="mt-6 space-y-4">
          <input type="hidden" name="bulkToken" value={bulkToken} />

          <div className="space-y-2">
            <Label htmlFor="candidateName">Full name</Label>
            <Input
              id="candidateName"
              name="candidateName"
              placeholder="Amina Rahman"
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="candidateEmail">Email</Label>
            <Input
              id="candidateEmail"
              name="candidateEmail"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <Button type="submit" className="w-full">
            Start application
          </Button>
        </form>

        <p className="mt-4 text-xs text-slate-400 leading-relaxed">
          By starting your application you confirm that the information you provide is
          accurate and you consent to its review by the {ORG_NAME} hiring team.
        </p>
      </div>
    </div>
  );
}
