
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '../../layout';
import type { Agent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function AgentDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const { getAgent, isLoadingAgents } = useAppContext(); // Added isLoadingAgents
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined); 

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (!isLoadingAgents && agentId) { // Check isLoadingAgents before trying to getAgent
      const foundAgent = getAgent(agentId);
      setAgent(foundAgent);
    } else if (!isLoadingAgents && !agentId) {
      setAgent(null); // No agentId, so set to null
    }
    // If isLoadingAgents, agent remains undefined, handled by loader below
  }, [agentId, getAgent, isLoadingAgents]); 

  if (isLoadingAgents || agent === undefined) { // Combined loading states
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Logo className="mb-4 h-8 sm:h-10" />
        <Loader2 className="h-8 w-8 sm:h-10 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading agent details...</p>
      </div>
    );
  }

  if (!agent) { // Agent not found after loading
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
