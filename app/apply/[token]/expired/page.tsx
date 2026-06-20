import { ORG_NAME } from "@/lib/site-config";

export default async function ExpiredPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const isDeleted = reason === "deleted";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {isDeleted ? (
          <>
            <h1 className="text-2xl font-semibold text-slate-900">Application deleted</h1>
            <p className="text-slate-500">
              Your application has been deleted. If you would like to apply again, please contact the team for a new invitation link.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-slate-900">This link is no longer valid</h1>
            <p className="text-slate-500">
              This invitation link has expired, been revoked, or does not exist. Please contact the hiring team if you believe this is an error.
            </p>
          </>
        )}

        <p className="text-sm text-slate-400">{ORG_NAME}</p>
      </div>
    </div>
  );
}
