
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agent-card";
import { PlusCircle, Info } from "lucide-react";
import { useAppContext } from "../layout"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function DashboardPage() {
  const { agents, deleteAgent } = useAppContext();
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

  const handleDeleteConfirm = () => {
    if (agentToDelete) {
      deleteAgent(agentToDelete);
      setAgentToDelete(null); 
    }
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
            <AgentCard key={agent.id} agent={agent} onDelete={() => setAgentToDelete(agent.id)} />
          ))}
        </div>
      )}

      {agentToDelete && (
        <AlertDialog open={!!agentToDelete} onOpenChange={() => setAgentToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the agent
                "{agents.find(a => a.id === agentToDelete)?.generatedName || agents.find(a => a.id === agentToDelete)?.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setAgentToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
    
    