"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markInviteCopiedAction } from "@/actions/jobs";

interface CopyLinkButtonProps {
  url: string;
  inviteId: string;
  jobId: string;
}

export function CopyLinkButton({ url, inviteId, jobId }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      await markInviteCopiedAction(inviteId, jobId);
    } catch {
      // clipboard API unavailable — silently ignore
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-emerald-600">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy Link
        </>
      )}
    </Button>
  );
}
