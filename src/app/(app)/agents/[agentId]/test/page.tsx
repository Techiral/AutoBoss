
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAppContext } from "../../../layout"; 
import type { Agent } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function TestAgentPage() {
  const params = useParams();
  const { getAgent } = useAppContext();
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined);

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (agentId) {
      const foundAgent = getAgent(agentId as string);
      setAgent(foundAgent); 
    } else {
      setAgent(null); 
    }
  }, [agentId, getAgent]);

  if (agent === undefined && agentId) { 
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-headline text-xl sm:text-2xl">Test Agent</CardTitle>
          <CardDescription className="text-sm">Loading agent emulator...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px] sm:min-h-[300px] p-4 sm:p-6">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!agent) {
    return null; 
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="font-headline text-xl sm:text-2xl">Test Agent: {agent.generatedName || agent.name}</CardTitle>
        <CardDescription className="text-sm">Interact with your agent in real-time to test its responses and flows.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-2 sm:p-4 md:p-6 min-h-0"> {/* Allow chat interface to take remaining height */}
        <div className="h-full max-h-[calc(100vh-250px)] sm:max-h-[calc(100vh-280px)]"> {/* Constrain height */}
         <ChatInterface agent={agent} />
        </div>
      </CardContent>
    </Card>
  );
}

    