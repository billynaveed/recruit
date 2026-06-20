import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { updatePromptTemplateAction } from "@/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const TEMPLATE_META: Record<string, { title: string; description: string }> = {
  star_scoring: {
    title: "STAR rubric scoring prompt",
    description:
      "Template used to extract rubric features from candidate STAR responses. Placeholders: {{item_prompt}}, {{response_text}}, {{rubric_features}}.",
  },
  followup_generation: {
    title: "Follow-up question generation prompt",
    description:
      "Template used to suggest interview follow-ups based on candidate patterns. Placeholders: {{patterns}}, {{excerpts}}. Not yet wired to live generation.",
  },
};

const TEMPLATE_ORDER = ["star_scoring", "followup_generation"];

export default async function SettingsPage() {
  await requireAuth();

  const templates = await prisma.promptTemplate.findMany({ orderBy: { key: "asc" } });
  const byKey = new Map(templates.map((t) => [t.key, t]));

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Edit prompt templates used by the AI scoring pipeline.
        </p>
      </div>

      {TEMPLATE_ORDER.map((key) => {
        const template = byKey.get(key);
        const meta = TEMPLATE_META[key];
        return (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{meta.title}</CardTitle>
              <CardDescription>
                {meta.description}
                {template && (
                  <span className="block mt-1 text-xs text-slate-400">
                    Version {template.version} · last updated{" "}
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(template.updatedAt)}
                    {template.updatedBy ? ` by ${template.updatedBy}` : ""}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updatePromptTemplateAction} className="space-y-3">
                <input type="hidden" name="key" value={key} />
                <Textarea
                  name="body"
                  defaultValue={template?.body ?? ""}
                  rows={16}
                  className="font-mono text-xs leading-relaxed"
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    Save template
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
