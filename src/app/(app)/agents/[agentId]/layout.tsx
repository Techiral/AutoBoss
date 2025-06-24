
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useAppContext } from '../../layout';
import type { Agent } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Bot, BookOpen, MessageSquare, Share2, Settings } from 'lucide-react';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from 'next/link';

export default function AgentDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
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
      } else if (foundAgent && foundAgent.clientName) {
        setClientName(foundAgent.clientName);
      } else if (foundAgent && !foundAgent.clientId && !isLoadingClients) {
        setClientName(null);
      }
    } else if (!isLoadingAgents && !agentId) {
      setAgent(null); 
    }
  }, [agentId, getAgent, isLoadingAgents, getClientById, isLoadingClients]);

  const isPageLoading = isLoadingAgents || isLoadingClients || (agentId && (agent === undefined || (agent?.clientId && clientName === undefined && agent?.clientName === undefined)));

  const navItems = agentId ? [
      { href: `/agents/${agentId}/personality`, label: 'Personality', icon: Settings },
      { href: `/agents/${agentId}/knowledge`, label: 'Knowledge', icon: BookOpen },
      { href: `/agents/${agentId}/test`, label: 'Test Agent', icon: MessageSquare },
      { href: `/agents/${agentId}/export`, label: 'Deploy & Share', icon: Share2 },
    ] : [];

  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Logo className="mb-4 h-8 sm:h-10" />
        <Loader2 className="h-8 w-8 sm:h-10 animate-spin text-foreground mb-3" />
        <p className="text-sm text-foreground/80">Loading agent details...</p>
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
        <h1 className="font-headline text-foreground text-2xl sm:text-3xl font-bold break-words">
          {agent.generatedName || agent.name}
          {clientName && <span className="text-foreground/80 text-lg sm:text-xl font-normal"> (for {clientName})</span>}
        </h1>
        <p className="text-sm sm:text-base text-foreground/80 break-words">{agent.description}</p>
      </div>
      
      <Tabs value={pathname} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            {navItems.map(item => (
                <TabsTrigger key={item.href} value={item.href} asChild>
                    <Link href={item.href}>
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.label}
                    </Link>
                </TabsTrigger>
            ))}
        </TabsList>
      </Tabs>
      
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}
