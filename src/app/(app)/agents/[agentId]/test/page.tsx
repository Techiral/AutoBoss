
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
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined); // undefined for loading
  // const [loading, setLoading] = useState(true); // Rely on agent state for loading

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (agentId) {
      const foundAgent = getAgent(agentId as string);
      setAgent(foundAgent); // Will be undefined if context hasn't loaded agent, null if not found
    } else {
      setAgent(null); // No agentId, so no agent
    }
    // setLoading(false); // No longer needed
  }, [agentId, getAgent]);

  if (agent === undefined && agentId) { // agentId exists, but agent data is not yet available
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Test Agent</CardTitle>
          <CardDescription>Loading agent emulator...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // If agent is null (either no agentId or getAgent returned null), AgentDetailLayout will handle the "Agent Not Found" message.
  // This page should only render the chat interface if an agent object exists.
  if (!agent) {
    return null; // AgentDetailLayout handles the "not found" UI
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Test Agent: {agent.generatedName || agent.name}</CardTitle>
        <CardDescription>Interact with your agent in real-time to test its responses and flows.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChatInterface agent={agent} />
      </CardContent>
    </Card>
  );
}
