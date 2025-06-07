"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agent-card";
import { PlusCircle, Info } from "lucide-react";
import { useAppContext } from "../layout"; // Adjust path as necessary
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardPage() {
  const { agents, addAgent } = useAppContext(); // Using addAgent to potentially remove agents for now.

  // Placeholder for delete functionality
  const handleDeleteAgent = (agentId: string) => {
    // In a real app, this would call an API. For now, filter out from local state.
    // For simplicity, this example won't implement deletion to keep context usage straightforward.
    // A proper implementation would require `setAgents` in the context.
    console.log("Delete agent:", agentId);
    alert("Delete functionality is a placeholder.");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold">Your Agents</h1>
        <Button asChild>
          <Link href="/agents/create">
            <PlusCircle className="mr-2 h-5 w-5" /> Create New Agent
          </Link>
        </Button>
      </div>

      {agents.length === 0 ? (
         <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>No Agents Yet!</AlertTitle>
            <AlertDescription>
              You haven't created any AI agents. Click the "Create New Agent" button to get started.
            </AlertDescription>
          </Alert>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onDelete={handleDeleteAgent} />
          ))}
        </div>
      )}
    </div>
  );
}
