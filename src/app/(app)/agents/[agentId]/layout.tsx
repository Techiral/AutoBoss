
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '../../layout';
import type { Agent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

export default function AgentDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const { getAgent, isLoadingAgents, getClientById, isLoadingClients } = useAppContext();
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined);
  const [clientName, setClientName] = useState<string | null>(null);

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (!isLoadingAgents && agentId) {
      const foundAgent = getAgent(agentId);
      setAgent(foundAgent);
      if (foundAgent && foundAgent.clientId && !isLoadingClients) {
        const client = getClientById(foundAgent.clientId);
        setClientName(client?.name || null);
      } else if (foundAgent && foundAgent.clientName) { // Fallback to denormalized name
        setClientName(foundAgent.clientName);
      }
    } else if (!isLoadingAgents && !agentId) {
      setAgent(null);
    }
  }, [agentId, getAgent, isLoadingAgents, getClientById, isLoadingClients]);

  if (isLoadingAgents || (agent === undefined && agentId) || (agent?.clientId && isLoadingClients && !clientName) ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Logo className="mb-4 h-8 sm:h-10" />
        <Loader2 className="h-8 w-8 sm:h-10 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading agent details...</p>
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
        <h1 className={cn("font-headline text-2xl sm:text-3xl font-bold break-words", "text-gradient-dynamic")}>
          {agent.generatedName || agent.name}
          {clientName && <span className="text-muted-foreground text-lg sm:text-xl font-normal"> (for {clientName})</span>}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground break-words">{agent.description}</p>
      </div>
      {children}
    </div>
  );
}
