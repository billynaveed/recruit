import { createJobAction } from "@/actions/jobs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Files, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JobStatus } from "@prisma/client";
import Link from "next/link";

export default function NewJobPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Create a new job</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Paste the JD, set the role basics, and generate an editable question pack.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">← Back</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={createJobAction} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Job title</Label>
                <Input id="title" name="title" placeholder="Founding Programme Manager" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yfs-accent"
                  defaultValue={JobStatus.DRAFT}
                >
                  <option value={JobStatus.DRAFT}>Draft</option>
                  <option value={JobStatus.OPEN}>Open</option>
                  <option value={JobStatus.CLOSED}>Closed</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" name="department" placeholder="Programmes" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="Singapore / Remote" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment type</Label>
                <Input id="employmentType" name="employmentType" placeholder="Full-time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionFileName">JD PDF filename reference</Label>
                <Input id="descriptionFileName" name="descriptionFileName" placeholder="programme-manager.pdf" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descriptionText">Job description</Label>
              <Textarea
                id="descriptionText"
                name="descriptionText"
                rows={10}
                placeholder="Paste the full job description here. The generated role questions will use this text."
                required
              />
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Files className="h-3.5 w-3.5" />
                PDF upload parsing comes next. For now, paste the extracted JD text and keep the filename as a reference.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customQuestionPrompt">Optional prompt tweak</Label>
              <Textarea
                id="customQuestionPrompt"
                name="customQuestionPrompt"
                rows={2}
                placeholder="Add a role-specific angle, for example: prioritise community building, programme delivery, and stakeholder management."
              />
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
              <p className="text-sm text-slate-500 max-w-xl">
                Creating the job also generates a first pass of 10 role-specific questions, ready for editing on the job page.
              </p>
              <Button type="submit">Create job</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
