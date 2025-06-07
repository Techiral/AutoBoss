
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { Agent } from "@/lib/types";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";

const LOCAL_STORAGE_AGENTS_KEY = 'agentVerseAgents';

export default function PublicChatPage() {
  const params = useParams();
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined); // undefined for loading
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (!agentId) {
      setError("Agent ID is missing.");
      setIsLoading(false);
      return;
    }

    try {
      const storedAgentsString = localStorage.getItem(LOCAL_STORAGE_AGENTS_KEY);
      if (storedAgentsString) {
        const storedAgents: Agent[] = JSON.parse(storedAgentsString);
        const foundAgent = storedAgents.find(a => a.id === agentId);
        if (foundAgent) {
          setAgent(foundAgent);
        } else {
          setError(`Agent with ID "${agentId}" not found.`);
        }
      } else {
        setError("No agent data found. This chat may not work correctly outside of the main application.");
      }
    } catch (e) {
      console.error("Error loading agent for public chat:", e);
      setError("Could not load agent data. The stored data might be corrupted.");
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading Agent Chat...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Alert variant="destructive" className="max-w-md text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <AlertTitle className="text-xl mb-1">Error Loading Chat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
         <div className="mt-8">
            <Logo collapsed={false}/>
         </div>
      </div>
    );
  }

  if (!agent) {
    // This case should ideally be caught by the error state from useEffect
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
         <Alert variant="destructive" className="max-w-md text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <AlertTitle className="text-xl mb-1">Agent Not Found</AlertTitle>
            <AlertDescription>The specified agent could not be loaded.</AlertDescription>
        </Alert>
         <div className="mt-8">
            <Logo collapsed={false}/>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="p-4 border-b flex items-center justify-between bg-card">
           <Logo collapsed={false}/>
           <div className="text-right">
             <h1 className="font-headline text-xl font-semibold">{agent.generatedName || agent.name}</h1>
             <p className="text-xs text-muted-foreground">Live Chat</p>
           </div>
        </header>
        <main className="flex-1 p-2 sm:p-4 md:p-6 flex justify-center items-center">
            <div className="w-full max-w-2xl h-[calc(100vh-150px)]"> {/* Adjust height as needed */}
                 <ChatInterface agent={agent} />
            </div>
        </main>
         <footer className="text-center p-4 border-t text-xs text-muted-foreground">
            Powered by AgentVerse
        </footer>
    </div>
  );
}
    
    