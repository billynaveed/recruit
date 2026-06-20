"use client";

import { useState } from "react";
import { saveStage1Action } from "@/actions/apply";
import { ORG_NAME } from "@/lib/site-config";

export function Stage1({
  token,
  candidateName,
  jobTitle,
  consentGiven,
}: {
  token: string;
  candidateName: string;
  jobTitle: string;
  consentGiven: boolean;
}) {
  const [checked, setChecked] = useState(consentGiven);

  return (
    <form action={saveStage1Action} className="space-y-8">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="consentGiven" value={String(checked)} />

      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome, {candidateName}
        </h1>
        <p className="text-slate-500">
          You have been invited to apply for the role of{" "}
          <span className="font-medium text-slate-700">{jobTitle}</span> at {ORG_NAME}.
        </p>
        <p className="text-slate-500">
          This application has six short sections and should take around 45 to 60 minutes to complete. You can save your progress and return at any time using this link.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4 text-sm text-slate-600">
        <h2 className="font-semibold text-slate-900">Privacy notice</h2>
        <p>
          {ORG_NAME} will use the information you provide in this application solely for the purpose of assessing your suitability for the role described. Your data will be stored securely and will not be shared with third parties outside of the hiring team.
        </p>
        <p>
          We retain application data for up to 24 months. You may request deletion of your data at any time by contacting us. Submitting this form constitutes your consent to process your personal data for recruitment purposes.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-slate-900"
        />
        <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
          I understand and consent to {ORG_NAME} processing my application data as described above.
        </span>
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!checked}
          className="bg-slate-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next: Background
        </button>
      </div>
    </form>
  );
}
