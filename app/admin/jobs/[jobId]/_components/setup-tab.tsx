import { RoleQuestionsEditor } from "@/components/admin/role-questions-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { DangerZone } from "./danger-zone";
import { DescriptionEditor } from "./description-editor";

export type SetupQuestion = { prompt: string; wordLimit: number; source: string };

export function SetupTab({
  jobId,
  jobTitle,
  jobStatus,
  descriptionSource,
  descriptionFileName,
  descriptionText,
  questions,
}: {
  jobId: string;
  jobTitle: string;
  jobStatus: string;
  descriptionSource: string | null;
  descriptionFileName: string | null;
  descriptionText: string;
  questions: SetupQuestion[];
}) {
  return (
    <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-slate-400" />
            Job description
          </CardTitle>
          <CardDescription>
            Source text used to generate questions and shown to admins for context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Source</p>
              <p className="text-slate-700">{descriptionSource || "Pasted text"}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">PDF reference</p>
              <p className="text-slate-700">{descriptionFileName || "None"}</p>
            </div>
          </div>
          <DescriptionEditor jobId={jobId} initial={descriptionText} />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <RoleQuestionsEditor jobId={jobId} initialQuestions={questions} />
        <DangerZone jobId={jobId} jobTitle={jobTitle} status={jobStatus} />
      </div>
    </div>
  );
}
