
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, Search, Info, Bot, AlertTriangle, MessageSquare, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/types";
import { db } from '@/lib/firebase-client';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import Image from "next/image";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

const convertAgentTimestamps = (agentData: any): Agent => {
  const newAgent = { ...agentData };
  if (newAgent.createdAt && newAgent.createdAt.toDate) {
    newAgent.createdAt = newAgent.createdAt.toDate().toISOString();
  }
  if (newAgent.sharedAt && newAgent.sharedAt.toDate) {
    newAgent.sharedAt = newAgent.sharedAt.toDate().toISOString();
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

async function getPublicAgents(): Promise<Agent[]> {
  try {
    const agentsRef = collection(db, 'agents');
    const q = query(
      agentsRef,
      where('isPubliclyShared', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const agents: Agent[] = [];
    querySnapshot.forEach((doc) => {
      agents.push(convertAgentTimestamps({ id: doc.id, ...doc.data() }));
    });
    return agents;
  } catch (error) {
    console.error("Error fetching public agents for showcase:", error);
    return [];
  }
}

interface AgentShowcaseCardProps {
  agent: Agent;
  baseUrl: string;
}

function AgentShowcaseCard({ agent, baseUrl }: AgentShowcaseCardProps) {
    const agentChatUrl = `${baseUrl}/chat/${agent.id}`;
    const defaultAgentImage = "https://placehold.co/400x300.png";

    return (
        <Card className="flex flex-col h-full hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <CardHeader className="p-0">
                <div className="aspect-[16/9] relative bg-muted overflow-hidden">
                    <Image
                        src={agent.agentImageUrl || defaultAgentImage}
                        alt={agent.generatedName || agent.name || "Agent Image"}
                        layout="fill"
                        objectFit="cover"
                        className={!agent.agentImageUrl ? "opacity-50" : ""}
                        data-ai-hint={!agent.agentImageUrl ? "abstract placeholder" : "agent brand image"}
                    />
                </div>
            </CardHeader>
            <CardContent className="flex-grow p-4 space-y-2">
                <CardTitle className="font-headline text-lg line-clamp-2">{agent.generatedName || agent.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-3 h-[3.3em]">
                    {agent.ogDescription || agent.description || "An AI agent ready to chat."}
                </CardDescription>
                 <div className="pt-2 flex items-center gap-4 text-xs text-muted-foreground">
                     <Badge variant="outline" className="text-xs capitalize">
                        <Bot className="w-3 h-3 mr-1"/>{agent.agentType || "Chat"}
                    </Badge>
                     {agent.showcaseMetrics?.queriesHandled && (
                         <div className="flex items-center gap-1" title="Queries Handled">
                             <MessageSquare className="w-3 h-3"/>
                             <span>{agent.showcaseMetrics.queriesHandled}</span>
                         </div>
                     )}
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-2 border-t">
                <div className="w-full space-y-2">
                    <Button asChild size="sm" className="w-full text-xs">
                        <Link href={agentChatUrl} target="_blank">
                            Chat with this Agent <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                    </Button>
                    <div className="text-center text-[10px] text-muted-foreground/70">
                        Powered by <Link href={baseUrl} target="_blank" className="hover:underline hover:text-primary">AutoBoss</Link>
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}


export default async function ShowcasePage() {
  const allPublicAgents = await getPublicAgents();
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'http://localhost:3000';

  const sortedAgents = allPublicAgents.sort((a, b) => {
    const dateA = a.sharedAt ? new Date(a.sharedAt as string).getTime() : 0;
    const dateB = b.sharedAt ? new Date(b.sharedAt as string).getTime() : 0;
    return dateB - dateA;
  });

  const agents = sortedAgents.slice(0, 50);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="public-page-header">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/templates">View All Templates</Link>
            </Button>
            <Button asChild size="sm" className="text-xs">
              <Link href="/dashboard">Go to Your Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 sm:py-12 px-4 md:px-6">
        <Card className="mb-8 sm:mb-12 shadow-lg border-transparent bg-secondary">
          <CardHeader className="p-6 text-center">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-3">
              <Eye className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary">
              AI Agent Showcase
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
              Discover innovative AI agents built by the AutoBoss community. See what's possible, get inspired, and try them out!
            </CardDescription>
          </CardHeader>
        </Card>

        {agents.length === 0 ? (
          <div className="space-y-4">
            <Alert className="max-w-lg mx-auto">
              <Search className="h-4 w-4" />
              <AlertTitle>Showcase Is Eagerly Awaiting Agents!</AlertTitle>
              <AlertDescription>
                No agents have been publicly shared yet. Be the first to showcase your creation! You can make your agent public from its 'Deploy & Share' settings page in your dashboard.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive" className="max-w-lg mx-auto bg-destructive/10 border-destructive/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-semibold">Note for Developers</AlertTitle>
                <AlertDescription className="text-xs">
                    If this showcase remains empty after agents have been marked public, your Firestore Security Rules may be blocking the query. This update attempts to fix that.
                </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {agents.map((agent) => (
              <AgentShowcaseCard key={agent.id} agent={agent} baseUrl={appDomain}/>
            ))}
          </div>
        )}
        
        <Alert variant="default" className="mt-8 sm:mt-12 max-w-2xl mx-auto bg-secondary">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-medium">Want to feature your agent?</AlertTitle>
            <AlertDescription className="text-muted-foreground text-xs">
                Go to your agent's "Deploy & Share" settings in your dashboard and enable the "List this agent in the Public Showcase" option.
            </AlertDescription>
        </Alert>

      </main>

      <footer className="public-page-footer">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <Link href="/" className="flex items-center gap-1.5">
            <Logo className="h-5 w-auto" collapsed={true} />
            <span>&copy; {new Date().getFullYear()} AutoBoss</span>
          </Link>
          <nav className="flex gap-3">
            <Link href="/playbook" className="hover:text-primary">Client Playbook</Link>
            <Link href="/templates" className="hover:text-primary">AI Templates</Link>
            <Link href="/support" className="hover:text-primary">Help Center</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
