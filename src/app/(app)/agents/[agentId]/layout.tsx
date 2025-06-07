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
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined); // undefined for loading, null for not found

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (agentId) {
      const foundAgent = getAgent(agentId);
      setAgent(foundAgent);
      if (!foundAgent && agent === undefined) { // only redirect if not found on initial load check
         // Small delay to ensure context is potentially updated if agents list is async (not in this mock)
        setTimeout(() => {
          const stillNotFoundAgent = getAgent(agentId);
          if(!stillNotFoundAgent) {
            // router.push('/dashboard'); // Redirect if agent not found
          } else {
            setAgent(stillNotFoundAgent);
          }
        }, 100);
      }
    }
  }, [agentId, getAgent, router, agent]);

  if (agent === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-8 w-1/3" />
        <div className="p-4 border rounded-lg">
          <Skeleton className="h-64 w-full" />
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
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold">{agent.generatedName || agent.name}</h1>
        <p className="text-muted-foreground">{agent.description}</p>
      </div>
      {children}
    </div>
  );
}
