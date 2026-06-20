import { requireAuth } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { ReviewStatus } from "@prisma/client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();
  const [jobs, pendingReviewCount] = await Promise.all([
    prisma.job.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        title: true,
        status: true,
        _count: {
          select: { candidates: true },
        },
      },
    }),
    prisma.review.count({
      where: {
        reviewerEmail: session.email.toLowerCase(),
        status: ReviewStatus.PENDING,
      },
    }),
  ]);

  return (
    <AdminShell
      jobs={jobs}
      email={session.email}
      pendingReviewCount={pendingReviewCount}
      logoutAction={logoutAction}
    >
      {children}
    </AdminShell>
  );
}
