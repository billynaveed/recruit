"use client";

import { useState, useRef } from "react";
import { saveStage2Action } from "@/actions/apply";
import { WordCountTextarea } from "./word-count";
import { deleteApplicationAction } from "@/actions/apply";

type Project = {
  title: string;
  url: string;
  description: string;
  filePath?: string;
};

const EMPTY_PROJECT: Project = { title: "", url: "", description: "" };

export function Stage2({
  token,
  candidateId,
  initialCvPath,
  initialCoverLetter,
  initialProjects,
  error,
}: {
  token: string;
  candidateId: string;
  initialCvPath: string | null;
  initialCoverLetter: string | null;
  initialProjects: Project[];
  error?: string | null;
}) {
  const [cvPath, setCvPath] = useState(initialCvPath ?? "");
  const [cvFileName, setCvFileName] = useState(initialCvPath ? initialCvPath.split("/").pop() ?? "" : "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [projects, setProjects] = useState<Project[]>(
    initialProjects.length > 0 ? initialProjects : []
  );
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const form = new FormData();
    form.append("file", file);
    form.append("candidateId", candidateId);
    form.append("field", "cv");

    try {
      const res = await fetch("/api/apply/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.error ?? "Upload failed. Please try again.");
        return;
      }
      const data = await res.json();
      setCvPath(data.path);
      setCvFileName(file.name);
    } catch {
      setUploadError("Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function addProject() {
    if (projects.length < 3) setProjects((p) => [...p, { ...EMPTY_PROJECT }]);
  }

  function removeProject(i: number) {
    setProjects((p) => p.filter((_, idx) => idx !== i));
  }

  function updateProject(i: number, field: keyof Project, value: string) {
    setProjects((p) => p.map((proj, idx) => idx === i ? { ...proj, [field]: value } : proj));
  }

  return (
    <form action={saveStage2Action} className="space-y-8">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="cvPath" value={cvPath} />
      <input type="hidden" name="projectsJson" value={JSON.stringify(projects)} />

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Your background</h1>
        <p className="text-slate-500 text-sm">
          Tell us about your work history and things you have built.
        </p>
      </div>

      {error === "cv_required" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Please upload your CV before continuing.
        </div>
      )}

      {/* CV Upload */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            CV / Resume <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-2">PDF or DOCX, max 10 MB.</p>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className={`rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors ${
            cvPath ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
          }`}
        >
          {cvPath ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-emerald-700">{cvFileName}</p>
              <p className="text-xs text-emerald-600">Uploaded. Click to replace.</p>
            </div>
          ) : uploading ? (
            <p className="text-sm text-slate-500">Uploading...</p>
          ) : (
            <div className="space-y-1">
              <p className="text-sm text-slate-600">Click to upload your CV</p>
              <p className="text-xs text-slate-400">PDF or DOCX</p>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleCvUpload}
          className="hidden"
        />
        {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      </div>

      {/* Cover letter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-900">
          Cover letter <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <WordCountTextarea
          name="coverLetter"
          defaultValue={initialCoverLetter ?? ""}
          wordLimit={500}
          placeholder="Tell us why this role interests you and what you would bring to the team."
          rows={5}
        />
      </div>

      {/* Projects */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            Proof of work <span className="text-slate-400 font-normal">(optional, up to 3)</span>
          </label>
          <p className="text-xs text-slate-500">
            Share projects, products, or pieces of work you are proud of. A link is enough.
          </p>
        </div>

        {projects.map((proj, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Project {i + 1}</p>
              <button
                type="button"
                onClick={() => removeProject(i)}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Title</label>
                <input
                  type="text"
                  value={proj.title}
                  onChange={(e) => updateProject(i, "title", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="My project"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">Link</label>
                <input
                  type="url"
                  value={proj.url}
                  onChange={(e) => updateProject(i, "url", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Description (optional)</label>
              <textarea
                value={proj.description}
                onChange={(e) => updateProject(i, "description", e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none"
                placeholder="What did you build and what was your role?"
              />
            </div>
          </div>
        ))}

        {projects.length < 3 && (
          <button
            type="button"
            onClick={addProject}
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors border border-dashed border-slate-200 rounded-lg px-4 py-2 w-full hover:border-slate-300"
          >
            + Add project
          </button>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="submit"
          formAction={deleteApplicationAction}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
          onClick={(e) => {
            if (!confirm("Are you sure you want to delete your application? This cannot be undone.")) {
              e.preventDefault();
            }
          }}
        >
          Delete my application
        </button>

        <button
          type="submit"
          className="bg-slate-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Next: Role questions
        </button>
      </div>
    </form>
  );
}
