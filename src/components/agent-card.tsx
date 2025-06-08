
"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, ArrowRight, Trash2 } from "lucide-react"; // Removed Pencil
import type { Agent } from "@/lib/types";
import { useState, useEffect } from 'react';

interface AgentCardProps {
  agent: Agent;
  onDelete: (agentId: string) => void;
}

export function AgentCard({ agent, onDelete }: AgentCardProps) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    if (agent.createdAt) {
      const dateToFormat = typeof agent.createdAt === 'string' ? new Date(agent.createdAt) : agent.createdAt.toDate();
      setFormattedDate(dateToFormat.toLocaleDateString());
    }
  }, [agent.createdAt]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-4 sm:p-5">
        <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
          <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          <CardTitle className="font-headline text-lg sm:text-xl break-all">{agent.generatedName || agent.name}</CardTitle>
        </div>
        <CardDescription className="line-clamp-2 h-10 text-xs sm:text-sm">{agent.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4 sm:p-5 pt-0">
        {formattedDate ? (
          <p className="text-xs text-muted-foreground">
            Created: {formattedDate}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Loading date...</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 sm:p-5 pt-2 sm:pt-3 border-t">
        <Button variant="ghost" size="sm" onClick={() => onDelete(agent.id)} aria-label="Delete agent" className="text-xs px-2 py-1 h-auto text-destructive hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5 mr-1 sm:mr-1.5" /> Delete
        </Button>
        <Button asChild size="sm" className="text-xs px-2 py-1 h-auto">
          <Link href={`/agents/${agent.id}/studio`}>
            Open Studio <ArrowRight className="ml-1 sm:ml-1.5 w-3.5 h-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

    