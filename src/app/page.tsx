
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUp, Upload, FileText, LinkIcon, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Agent } from "@/lib/types";
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, doc, setDoc } from 'firebase/firestore';
import { createAgent, CreateAgentOutput } from "@/ai/flows/agent-creation";
import { useAppContext } from "./(app)/layout";

const convertAgentTimestamps = (agentData: any): Agent => {
  const newAgent = { ...agentData };
  if (newAgent.createdAt && newAgent.createdAt.toDate) {
    newAgent.createdAt = newAgent.createdAt.toDate().toISOString();
  }
  if (newAgent.sharedAt && newAgent.sharedAt.toDate) {
    newAgent.sharedAt = newAgent.sharedAt.toDate().toISOString();
  }
  return newAgent as Agent;
};

const builderFormSchema = z.object({
  prompt: z.string().min(10, "Please describe the agent you want to build in more detail.").max(500),
});

type BuilderFormData = z.infer<typeof builderFormSchema>;

function AgentShowcaseCard({ agent }: { agent: Agent }) {
  return (
    <div className="group">
      <Link href={`/chat/${agent.id}`} target="_blank">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted border border-border group-hover:opacity-80 transition-opacity">
          <Image
            src={agent.agentImageUrl || "https://placehold.co/400x300.png"}
            alt={agent.generatedName || "Agent Image"}
            width={400}
            height={300}
            className="h-full w-full object-cover"
            data-ai-hint="abstract technology"
          />
        </div>
      </Link>
      <div className="mt-2">
        <h3 className="text-sm font-medium text-foreground truncate">{agent.generatedName || agent.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{agent.showcaseMetrics?.queriesHandled || 0} Interactions</p>
          <Badge variant="secondary" className="text-xs capitalize">{agent.agentType || "Chat"}</Badge>
        </div>
      </div>
    </div>
  );
}

export default function VibeBuilderHomepage() {
  const [isLoading, setIsLoading] = useState(false);
  const [publicAgents, setPublicAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { addAgent: addAgentToContext } = useAppContext();

  useEffect(() => {
    async function fetchPublicAgents() {
      try {
        const agentsRef = collection(db, 'agents');
        const q = query(agentsRef, where('isPubliclyShared', '==', true));
        const querySnapshot = await getDocs(q);
        const agents: Agent[] = [];
        querySnapshot.forEach((doc) => {
          agents.push(convertAgentTimestamps({ id: doc.id, ...doc.data() }));
        });
        setPublicAgents(agents.sort((a,b) => (b.showcaseMetrics?.queriesHandled || 0) - (a.showcaseMetrics?.queriesHandled || 0)));
      } catch (error) {
        console.error("Error fetching public agents:", error);
        toast({ title: "Error", description: "Could not load community agents.", variant: "destructive" });
      } finally {
        setIsLoadingAgents(false);
      }
    }
    fetchPublicAgents();
  }, [toast]);

  const { register, handleSubmit, formState: { errors } } = useForm<BuilderFormData>({
    resolver: zodResolver(builderFormSchema),
  });

  const onSubmit: SubmitHandler<BuilderFormData> = async (data) => {
    if (!currentUser) {
      toast({
        title: "Please Sign In",
        description: "You need to be logged in to build an agent.",
        action: <Button onClick={() => router.push('/login')}>Login</Button>
      });
      return;
    }
    setIsLoading(true);
    
    try {
      // For simplicity, we create a generic agent for now.
      // The full configuration from your plan (knowledge, tone, etc.) would be added here.
      const agentDescriptionForAI = `Create an AI agent based on this user prompt: "${data.prompt}"`;
      
      const aiResult = await createAgent({
        agentDescription: agentDescriptionForAI,
        agentType: 'chat', // Defaulting to chat for now
      });

      // This part requires a client. In a real scenario, you'd prompt the user to select one.
      // For now, we'll assume there is a client or handle this gracefully.
      // In a full implementation, you'd need a client selection modal here if none exists.
      const tempClientId = "default_client"; // Placeholder
      const tempClientName = "Default Client"; // Placeholder

      const agentDataForContext: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'userId' | 'clientId' | 'clientName'> = {
        name: `Agent: ${data.prompt.substring(0, 20)}...`,
        description: data.prompt,
        agentType: 'chat',
        primaryLogic: 'prompt',
        generatedName: aiResult.agentName,
        generatedPersona: aiResult.agentPersona,
        generatedGreeting: aiResult.agentGreeting,
      };

      // This function needs to be available from a context.
      // We will assume `addAgentToContext` exists and is provided.
      const newAgent = await addAgentToContext(agentDataForContext, tempClientId, tempClientName);

      if (newAgent) {
        toast({ title: "Agent Created!", description: "Redirecting you to your new agent's dashboard." });
        router.push(`/agents/${newAgent.id}/personality`);
      } else {
         throw new Error("Could not create agent in the database. You may need to create a client first in the dashboard.");
      }

    } catch (error: any) {
       toast({ title: "Agent Creation Failed", description: error.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
       setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-full max-w-screen-xl items-center justify-between px-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo className="h-7" />
          </Link>
          <UserNav />
        </div>
      </header>

      <main className="container mx-auto max-w-screen-xl px-4 pt-24 pb-12">
        <div className="text-center">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold">Build something <span className="text-primary">Lovable</span></h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground">
            Create agents, apps, and websites by chatting with AI
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="relative">
              <Textarea
                id="prompt"
                placeholder="Ask AgentVerse to create..."
                {...register("prompt")}
                rows={3}
                className="resize-none rounded-lg border-2 border-border bg-card p-4 pr-20 text-base focus-visible:ring-primary"
              />
              <Button type="submit" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <ArrowUp />}
                <span className="sr-only">Submit</span>
              </Button>
            </div>
            {errors.prompt && <p className="text-xs text-destructive mt-2">{errors.prompt.message}</p>}
          </form>
          <div className="mt-3 flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5"><Upload size={14} /> Attach</Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5"><FileText size={14} /> Paste Text</Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5"><LinkIcon size={14} /> From URL</Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5"><Globe size={14} /> Public</Button>
          </div>
        </div>
        
        <div className="mt-16 sm:mt-20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">From the Community</h2>
            <Button variant="link" asChild>
              <Link href="/showcase">View All</Link>
            </Button>
          </div>
          
          <div className="mt-6">
            {isLoadingAgents ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-[4/3] w-full rounded-lg bg-muted animate-pulse"></div>
                    <div className="h-4 w-3/4 rounded bg-muted animate-pulse"></div>
                    <div className="h-3 w-1/2 rounded bg-muted animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : publicAgents.length > 0 ? (
               <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {publicAgents.slice(0, 4).map((agent) => (
                  <AgentShowcaseCard key={agent.id} agent={agent}/>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No community agents have been shared yet.</p>
                <p className="text-xs mt-1">Be the first to showcase your creation!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
