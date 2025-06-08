
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import type { Agent } from "@/lib/types";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

// Helper to convert Firestore Timestamps in agent data to ISO strings
const convertTimestampsToISOForChat = (agentData: any): Agent => {
  const newAgent = { ...agentData };
  if (newAgent.createdAt && newAgent.createdAt.toDate) {
    newAgent.createdAt = newAgent.createdAt.toDate().toISOString();
  }
  if (newAgent.knowledgeItems) {
    newAgent.knowledgeItems = newAgent.knowledgeItems.map((item: any) => {
      if (item.uploadedAt && item.uploadedAt.toDate) {
        return { ...item, uploadedAt: item.uploadedAt.toDate().toISOString() };
      }
      return item;
    });
  }
  return newAgent as Agent;
};


export default function PublicChatPage() {
  const params = useParams();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (!agentId) {
      setError("Agent ID is missing in the URL.");
      setIsLoading(false);
      return;
    }

    const fetchAgent = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const agentRef = doc(db, 'agents', agentId as string);
        const agentSnap = await getDoc(agentRef);

        if (agentSnap.exists()) {
          const agentData = agentSnap.data();
          // Convert Firestore Timestamps to ISO strings before setting state
          setAgent(convertTimestampsToISOForChat({ id: agentSnap.id, ...agentData }));
        } else {
          setError(`Agent with ID "${agentId}" not found.`);
          setAgent(null);
        }
      } catch (e: any) {
        console.error("Error loading agent for public chat:", e);
        setError(`Could not load agent data: ${e.message}`);
        setAgent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgent();
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
          <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  if (!agent) {
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
         <Button onClick={() => router.push('/dashboard')} className="mt-4">Go to Dashboard</Button>
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
            <div className="w-full max-w-2xl h-[calc(100vh-150px)]">
                 <ChatInterface agent={agent} />
            </div>
        </main>
         <footer className="text-center p-4 border-t text-xs text-muted-foreground">
            Powered by AgentVerse
        </footer>
    </div>
  );
}
