
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAppContext } from "../../../layout";
import type { Agent } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

export default function TestAgentPage() {
  // --- All Hooks must be called at the top level, unconditionally ---
  const params = useParams();
  const appContextValue = useAppContext(); // Call useAppContext ONCE and store its value
  const { getAgent, isLoadingAgents } = appContextValue; // Destructure from the stored value
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined);

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (!isLoadingAgents && agentId) {
      const foundAgent = getAgent(agentId as string);
      setAgent(foundAgent);
    } else if (!isLoadingAgents && !agentId) {
      setAgent(null);
    }
  }, [agentId, getAgent, isLoadingAgents]);

  // --- Conditional returns can now happen after all hooks have been called ---
  if (isLoadingAgents || (agent === undefined && agentId) ) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl", "text-gradient-dynamic")}>Test Agent</CardTitle>
          <CardDescription className="text-sm">Loading agent emulator...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] p-4 sm:p-6">
          <Logo className="mb-3 h-8" />
          <Loader2 className="h-10 w-10 sm:h-12 sm:h-12 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground mt-2">Initializing agent test environment...</p>
        </CardContent>
      </Card>
    );
  }

  if (!agent) { // Agent not found or no agentId after loading
    return null;
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className={cn("font-headline text-xl sm:text-2xl", "text-gradient-dynamic")}>Test Agent: {agent.generatedName || agent.name}</CardTitle>
        <CardDescription className="text-sm">Interact with your agent in real-time to test its responses and flows.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-2 sm:p-4 md:p-6 min-h-0">
        <div className="h-full max-h-[calc(100vh-250px)] sm:max-h-[calc(100vh-280px)]">
         <ChatInterface agent={agent} appContext={appContextValue} /> {/* Pass the stored context value */}
        </div>
      </CardContent>
    </Card>
  );
}
