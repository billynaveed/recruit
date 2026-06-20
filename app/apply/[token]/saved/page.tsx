import { ORG_NAME } from "@/lib/site-config";

export default async function SavedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-slate-900">Progress saved</h1>
          <p className="text-slate-500">
            Your application has been saved. You can return to it at any time using your invitation link.
          </p>
        </div>

        <a
          href={`/apply/${token}`}
          className="inline-block bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Continue application
        </a>

        <p className="text-sm text-slate-400">{ORG_NAME}</p>
      </div>
    </div>
  );
}
