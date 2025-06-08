
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '../../layout';
import type { Agent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function AgentDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const { getAgent } = useAppContext();
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined); 

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (agentId) {
      const foundAgent = getAgent(agentId);
      setAgent(foundAgent);
    }
  }, [agentId, getAgent]); 

  if (agent === undefined) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <Skeleton className="h-8 sm:h-10 w-3/4 sm:w-1/2" />
        <Skeleton className="h-6 sm:h-8 w-full sm:w-2/3" />
        <div className="p-4 border rounded-lg mt-4">
          <Skeleton className="h-48 sm:h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
       <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Agent Not Found</AlertTitle>
        <AlertDescription>
          The agent you are looking for does not exist or could not be loaded. Please return to the dashboard.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="font-headline text-2xl sm:text-3xl font-bold break-words">{agent.generatedName || agent.name}</h1>
        <p className="text-sm sm:text-base text-muted-foreground break-words">{agent.description}</p>
      </div>
      {children}
    </div>
  );
}

    