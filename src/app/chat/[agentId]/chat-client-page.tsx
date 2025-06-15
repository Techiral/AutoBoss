
"use client"; // This component handles client-side logic

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Removed useParams as agentId is passed as prop
import Link from "next/link";
import { ChatInterface } from "@/components/chat-interface";
import type { Agent } from "@/lib/types";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore'; // Removed Timestamp as it's handled by helper
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/app/(app)/layout"; // Adjusted import path assuming standard structure

// Helper to convert Firestore Timestamps in agent data (can be shared or defined locally if not already)
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

interface ChatClientPageProps {
  agentId: string;
}

export default function ChatClientPage({ agentId }: ChatClientPageProps) {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  let appContextInstance;
  try {
    // This might still throw an error if ChatClientPage is rendered outside AppContext,
    // which is expected for a public page. We catch it.
    appContextInstance = useAppContext();
  } catch (e) {
    appContextInstance = undefined; 
  }

  useEffect(() => {
    if (!agentId) {
      setError("Agent ID is missing.");
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
        <Logo className="mb-4 h-10 sm:h-12" />
        <Loader2 className="h-12 w-12 sm:h-16 sm:h-16 animate-spin text-primary mb-3 sm:mb-4" />
        <p className="text-md sm:text-lg text-muted-foreground">Loading Agent Chat...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertTriangle className="h-6 w-6 sm:h-8 sm:h-8 mx-auto mb-2" />
          <AlertTitle className="text-lg sm:text-xl mb-1">Error Loading Chat</AlertTitle>
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
         <div className="mt-6 sm:mt-8">
           <Link href="/" aria-label="AutoBoss Homepage">
            <Logo className="h-7 sm:h-8"/>
           </Link>
         </div>
          <Button onClick={() => router.push('/dashboard')} className="mt-3 sm:mt-4 text-sm">Go to Dashboard</Button>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
         <Alert variant="destructive" className="max-w-md w-full">
            <AlertTriangle className="h-6 w-6 sm:h-8 sm:h-8 mx-auto mb-2" />
            <AlertTitle className="text-lg sm:text-xl mb-1">Agent Not Found</AlertTitle>
            <AlertDescription className="text-sm">The specified agent could not be loaded.</AlertDescription>
        </Alert>
         <div className="mt-6 sm:mt-8">
           <Link href="/" aria-label="AutoBoss Homepage">
            <Logo className="h-7 sm:h-8"/>
           </Link>
         </div>
         <Button onClick={() => router.push('/dashboard')} className="mt-3 sm:mt-4 text-sm">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="p-3 sm:p-4 border-b flex items-center justify-between bg-card sticky top-0 z-10">
           <Link href="/" aria-label="AutoBoss Homepage" className="hover:opacity-80 transition-opacity">
            <Logo className="h-7 sm:h-8"/>
           </Link>
           <div className="text-right">
             <h1 className="font-headline text-lg sm:text-xl font-semibold truncate max-w-[150px] sm:max-w-xs md:max-w-sm" title={agent.generatedName || agent.name}>{agent.generatedName || agent.name}</h1>
             <p className="text-xs text-muted-foreground">Live Chat</p>
           </div>
        </header>
        <main className="flex-1 p-2 sm:p-4 flex justify-center items-stretch"> 
            <div className="w-full max-w-2xl flex flex-col"> 
                 <ChatInterface agent={agent} appContext={appContextInstance} />
            </div>
        </main>
         <footer className="text-center p-3 sm:p-4 border-t text-xs text-muted-foreground">
            Powered by AutoBoss
        </footer>
    </div>
  );
}
