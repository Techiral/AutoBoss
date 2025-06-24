
"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, ArrowRight, Trash2, MessageSquare, Phone, Info, Brain, DatabaseZap, ArrowDownCircle, ArrowUpCircle } from "lucide-react"; 
import type { Agent, AgentLogicType, AgentType, AgentDirection } from "@/lib/types";
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agent: Agent;
  onDelete: (agentId: string) => void;
}

function getAgentTypeIcon(agentType?: AgentType) {
  switch (agentType) {
    case 'chat':
      return <MessageSquare className="w-3 h-3" />;
    case 'voice':
      return <Phone className="w-3 h-3" />;
    case 'hybrid':
      return <Bot className="w-3 h-3" />;
    default:
      return <Info className="w-3 h-3" />;
  }
}

function getLogicTypeDisplayInfo(logicType?: AgentLogicType): { label: string | null; icon: React.ReactNode | null } {
  if (!logicType) return { label: "Prompt", icon: <Brain className="w-3 h-3 mr-1" /> }; // Default if undefined
  switch (logicType) {
    case 'prompt':
      return { label: "AI Prompt", icon: <Brain className="w-3 h-3 mr-1" /> };
    case 'rag':
      return { label: "Knowledge Q&A", icon: <DatabaseZap className="w-3 h-3 mr-1" /> };
    default: 
      return { label: "Custom", icon: <Info className="w-3 h-3 mr-1" /> }; // Should not be reached
  }
}

function getDirectionDisplayInfo(direction?: AgentDirection): { label: string | null; icon: React.ReactNode | null } {
  if (!direction) return { label: null, icon: null };
  switch (direction) {
    case 'inbound':
      return { label: "Inbound", icon: <ArrowDownCircle className="w-3 h-3 mr-1" /> };
    case 'outbound':
      return { label: "Outbound", icon: <ArrowUpCircle className="w-3 h-3 mr-1" /> };
    default:
      return { label: "N/A", icon: <Info className="w-3 h-3 mr-1" /> };
  }
}


export function AgentCard({ agent, onDelete }: AgentCardProps) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    if (agent.createdAt) {
      const dateToFormat = typeof agent.createdAt === 'string' ? new Date(agent.createdAt) : agent.createdAt.toDate();
      setFormattedDate(dateToFormat.toLocaleDateString());
    }
  }, [agent.createdAt]);

  const { label: logicTypeLabel, icon: logicTypeIcon } = getLogicTypeDisplayInfo(agent.primaryLogic);
  const { label: directionLabel, icon: directionIcon } = getDirectionDisplayInfo(agent.direction);

  const defaultNavigationPage = agent.primaryLogic === 'rag' ? 'knowledge' : 'personality';


  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-1.5 sm:mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Bot className="w-7 h-7 sm:w-8 sm:w-8 text-primary shrink-0" />
            <CardTitle className="font-headline text-lg sm:text-xl break-all">{agent.generatedName || agent.name}</CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1">
            {agent.agentType && (
              <Badge variant="outline" className="text-xs capitalize h-fit px-1.5 py-0.5 sm:px-2">
                {getAgentTypeIcon(agent.agentType)}
                <span className="ml-1">{agent.agentType}</span>
              </Badge>
            )}
            {directionLabel && (
              <Badge variant="secondary" className="text-xs capitalize h-fit px-1.5 py-0.5 sm:px-2">
                {directionIcon} {directionLabel}
              </Badge>
            )}
            {logicTypeLabel && (
              <Badge variant="secondary" className="text-xs capitalize h-fit px-1.5 py-0.5 sm:px-2">
                {logicTypeIcon} {logicTypeLabel}
              </Badge>
            )}
          </div>
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
          <Link href={`/agents/${agent.id}/${defaultNavigationPage}`}>
            Configure Agent
            <ArrowRight className="ml-1 sm:ml-1.5 w-3.5 h-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
