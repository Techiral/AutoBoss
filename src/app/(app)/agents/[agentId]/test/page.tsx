"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useAppContext } from "../../../layout"; // Adjust path as necessary
import type { Agent } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function TestAgentPage() {
  const params = useParams();
  const { getAgent } = useAppContext();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (agentId) {
      const foundAgent = getAgent(agentId as string);
      setAgent(foundAgent || null); // Set to null if not found after initial check
    }
    setLoading(false);
  }, [agentId, getAgent]);

  if (loading) {
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

  if (!agent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Agent Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The agent you are trying to test could not be found.</p>
        </CardContent>
      </Card>
    );
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
