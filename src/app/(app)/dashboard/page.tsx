
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agent-card";
import { PlusCircle, Info, Bot } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className={cn("font-headline text-2xl sm:text-3xl font-bold flex items-center gap-2", "text-gradient-dynamic")}> <Bot className="w-7 h-7 sm:w-8 sm:h-8"/>Your AI Chatbot Agency Hub</h1>
        <Button asChild size="sm" className={cn("w-full sm:w-auto", "btn-gradient-primary")}>
          <Link href="/agents/create">
            <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Build New Client Chatbot
          </Link>
        </Button>
      </div>

      {agents.length === 0 ? (
         <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Start Building Your First Client Chatbot!</AlertTitle>
            <AlertDescription className="text-sm space-y-1">
              <p>Welcome to AutoBoss! Follow these simple steps to create and sell AI chatbots:</p>
              <ol className="list-decimal list-inside pl-2 text-xs">
                <li>Click "Build New Client Chatbot" to define its purpose and personality.</li>
                <li>Go to its "Knowledge" section to train it with your client's business data.</li>
                <li>Use the "Studio" to design its unique conversation flow.</li>
                <li>"Export" the chatbot to easily embed it on your client's website!</li>
              </ol>
            </AlertDescription>
          </Alert>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {agents.map((agent) => (
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
                This action cannot be undone. This will permanently delete the AI chatbot
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
