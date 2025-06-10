
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppContext } from '../../../layout';
import type { Agent, Client } from '@/lib/types';
import { AgentCard } from '@/components/agent-card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, PlusCircle, Briefcase, Bot } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ClientAgentsDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { 
    agents, 
    isLoadingAgents, 
    getClientById, 
    isLoadingClients, 
    deleteAgent 
  } = useAppContext();
  
  const [client, setClient] = useState<Client | null | undefined>(undefined);
  const [clientAgents, setClientAgents] = useState<Agent[]>([]);
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

  const clientId = Array.isArray(params.clientId) ? params.clientId[0] : params.clientId;

  useEffect(() => {
    if (!isLoadingClients && clientId) {
      const foundClient = getClientById(clientId);
      setClient(foundClient);
    }
  }, [clientId, getClientById, isLoadingClients]);

  useEffect(() => {
    if (client && !isLoadingAgents) {
      setClientAgents(agents.filter(agent => agent.clientId === client.id));
    }
  }, [client, agents, isLoadingAgents]);

  const handleDeleteConfirm = () => {
    if (agentToDelete) {
      deleteAgent(agentToDelete);
      setAgentToDelete(null);
    }
  };
  
  const isLoading = isLoadingClients || (client === undefined && clientId) || isLoadingAgents;


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Loader2 className="h-8 w-8 sm:h-10 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading client workspace...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Client Not Found</AlertTitle>
        <AlertDescription>
          The client you are looking for does not exist or could not be loaded. 
          Please return to the <Link href="/dashboard" className="underline">main dashboard</Link>.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
            <h1 className={cn("font-headline text-2xl sm:text-3xl font-bold flex items-center gap-2", "text-gradient-dynamic")}>
                <Bot className="w-7 h-7 sm:w-8 sm:h-8"/> Agents for: {client.name}
            </h1>
            {client.description && <p className="text-sm text-muted-foreground mt-1">{client.description}</p>}
        </div>
        <Button asChild size="sm" className={cn("w-full sm:w-auto", "btn-gradient-primary")}>
          <Link href={`/agents/create?clientId=${client.id}&clientName=${encodeURIComponent(client.name)}`}>
            <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Create New Agent for {client.name}
          </Link>
        </Button>
      </div>

      {clientAgents.length === 0 ? (
         <Alert className="mt-4">
            <Briefcase className="h-4 w-4" />
            <AlertTitle>No Agents Yet for {client.name}</AlertTitle>
            <AlertDescription className="text-sm space-y-1">
              <p>This client doesn't have any AI agents. Get started by clicking the button above!</p>
              <ol className="list-decimal list-inside pl-2 text-xs">
                <li>Click "Create New Agent for {client.name}".</li>
                <li>Define the agent's purpose, type, and core personality traits.</li>
                <li>Train it with specific knowledge (documents, website URLs).</li>
                <li>Test and then export the agent for your client.</li>
              </ol>
            </AlertDescription>
          </Alert>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {clientAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onDelete={() => setAgentToDelete(agent.id)} />
          ))}
        </div>
      )}

      {agentToDelete && (
        <AlertDialog open={!!agentToDelete} onOpenChange={(isOpen) => !isOpen && setAgentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the AI agent
                "{clientAgents.find(a => a.id === agentToDelete)?.generatedName || clientAgents.find(a => a.id === agentToDelete)?.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAgentToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Agent
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
