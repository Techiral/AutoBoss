
"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2, Bot, Sparkles, Upload, LinkIcon, ArrowUp, Globe, FileText, BotIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

// Mock data for the showcase, this would come from a database call
const mockAgents = [
    { id: '1', name: 'Pulse-Robot-Template', imageUrl: 'https://placehold.co/600x400.png', remixes: 18901, category: 'Website', userAvatar: 'A' },
    { id: '2', name: 'Cryptocurrency-Trading-Bot', imageUrl: 'https://placehold.co/600x400.png', remixes: 12036, category: 'Internal Tools', userAvatar: 'B' },
    { id: '3', name: 'Wrlds-AI-Integration', imageUrl: 'https://placehold.co/600x400.png', remixes: 7300, category: 'Website', userAvatar: 'C' },
    { id: '4', name: 'Crypto-Trade-Template', imageUrl: 'https://placehold.co/600x400.png', remixes: 6550, category: 'Website', userAvatar: 'D' },
    { id: '5', name: 'Modern-Seaside-Stay', imageUrl: 'https://placehold.co/600x400.png', remixes: 5985, category: 'Consumer App', userAvatar: 'E' },
    { id: '6', name: 'Agri-Dom', imageUrl: 'https://placehold.co/600x400.png', remixes: 5410, category: 'Prototype', userAvatar: 'F' },
];


const builderFormSchema = z.object({
  prompt: z.string().min(10, "Please describe the agent you want to build in more detail.").max(500),
});

type BuilderFormData = z.infer<typeof builderFormSchema>;

function AgentShowcaseCard({ agent }: { agent: typeof mockAgents[0] }) {
  return (
    <div className="group">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted border border-border group-hover:opacity-80 transition-opacity">
        <Image
          src={agent.imageUrl}
          alt={agent.name}
          width={400}
          height={300}
          className="h-full w-full object-cover"
          data-ai-hint="abstract technology"
        />
      </div>
      <div className="mt-2">
        <h3 className="text-sm font-medium text-foreground truncate">{agent.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{agent.remixes} Remixes</p>
          <Badge variant="secondary" className="text-xs">{agent.category}</Badge>
        </div>
      </div>
    </div>
  );
}


export default function VibeBuilderHomepage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useAuth();

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
    console.log("Form Data Submitted:", data);
    setTimeout(() => {
        setIsLoading(false);
        const newAgentId = "new-agent-placeholder-id"; 
        toast({ title: "Agent Created!", description: "Redirecting you to your new agent's dashboard." });
        router.push(`/agents/${newAgentId}/personality`);
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
       {/* Page Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-full max-w-screen-xl items-center justify-between px-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo className="h-7" />
          </Link>
          <UserNav />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto max-w-screen-xl px-4 pt-24 pb-12">
        {/* Builder Section */}
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
                placeholder="Ask AgentVerse to create a..."
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
                <Button variant="outline" size="sm" className="text-xs gap-1.5"><Globe size={14}/> Public</Button>
            </div>
        </div>
        
        {/* From the Community Section */}
        <div className="mt-16 sm:mt-20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">From the Community</h2>
            <Button variant="link" asChild>
                <Link href="/showcase">View All</Link>
            </Button>
          </div>
          
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
            {mockAgents.map((agent) => (
                <AgentShowcaseCard key={agent.id} agent={agent}/>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

    