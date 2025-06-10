
"use client";

// This page is no longer used as the Studio feature has been removed.
// It can be deleted or kept as a placeholder if Studio might be reintroduced later
// in a different form. For now, redirecting or showing a message.

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertTriangle, Construction } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AgentStudioPagePlaceholder() {
  const router = useRouter();
  const params = useParams();
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (agentId) {
      router.replace(`/agents/${agentId}/personality`); // Redirect to personality page as a sensible default
    } else {
      router.replace('/dashboard');
    }
  }, [agentId, router]);

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
          <Construction className="w-6 h-6 text-primary" />
          Visual Flow Builder Removed
        </CardTitle>
        <CardDescription className="text-sm">
          The visual flow builder (Studio) has been removed to simplify agent creation.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Feature Update</AlertTitle>
          <AlertDescription>
            Agents are now configured primarily through their personality, knowledge base, and direct AI prompting.
            You are being redirected...
          </AlertDescription>
        </Alert>
        {agentId && (
          <div className="mt-4 space-y-2">
             <Button asChild variant="link">
                <Link href={`/agents/${agentId}/personality`}>Go to Personality Settings</Link>
             </Button>
             <Button asChild variant="link">
                <Link href={`/agents/${agentId}/knowledge`}>Go to Knowledge Base</Link>
             </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
    