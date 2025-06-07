import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, ArrowRight, Pencil, Trash2 } from "lucide-react";
import type { Agent } from "@/lib/types";

interface AgentCardProps {
  agent: Agent;
  onDelete: (agentId: string) => void;
}

export function AgentCard({ agent, onDelete }: AgentCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Bot className="w-8 h-8 text-primary" />
          <CardTitle className="font-headline text-xl">{agent.generatedName || agent.name}</CardTitle>
        </div>
        <CardDescription className="line-clamp-2 h-10">{agent.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-xs text-muted-foreground">
          Created: {new Date(agent.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button variant="ghost" size="sm" onClick={() => onDelete(agent.id)} aria-label="Delete agent">
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </Button>
        <Button asChild size="sm">
          <Link href={`/agents/${agent.id}/studio`}>
            Open Studio <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
