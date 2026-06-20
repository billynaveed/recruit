import { ORG_NAME } from "@/lib/site-config";

export default function SubmittedPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold text-slate-900">Application submitted</h1>
          <p className="text-slate-500">
            Thank you for completing your application to {ORG_NAME}. We will review your submission carefully and be in touch with next steps.
          </p>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500 text-left space-y-2">
          <p>What happens next:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Our team will review your application</li>
            <li>We aim to respond within two weeks</li>
            <li>You may be invited to an interview</li>
          </ul>
        </div>

        <p className="text-sm text-slate-400">{ORG_NAME}</p>
      </div>
    </div>
  );
}
