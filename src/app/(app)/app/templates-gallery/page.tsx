
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, HomeIcon as RealEstateIcon, CalendarCheck, BotIcon, Lightbulb, LayoutGrid, MessageSquare, Phone, Brain, DatabaseZap, Handshake, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentPurposeType, AgentType, AgentDirection, AgentLogicType, JobId } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Re-defining AgentTemplate interface locally if not imported from public page
export interface AgentTemplate {
  id: JobId; // Use JobId for consistency
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  tags?: string[];
  defaultValues: {
    agentPurpose: AgentPurposeType;
    agentType?: AgentType;
    direction?: AgentDirection;
    primaryLogic?: AgentLogicType;
    role: string;
    personality: string;
  };
}

const agentTemplates: AgentTemplate[] = [
  {
    id: 'website_support',
    name: '24/7 Website Support Agent',
    description: 'Answers store questions, tracks orders, and handles returns. A tireless helper for your client’s customers.',
    icon: MessageSquare,
    category: "Client Customer Service",
    tags: ["support", "chat", "save time", "24/7 help", "e-commerce"],
    defaultValues: {
      agentPurpose: 'support',
      agentType: 'chat',
      primaryLogic: 'rag', 
      role: "I am a friendly and efficient support assistant for [Client Name]'s online store. I help customers by answering questions about their orders, our products, shipping, and returns. My goal is to provide quick and helpful information.",
      personality: "Patient, clear, and positive. I'm always happy to help!"
    }
  },
  {
    id: 'website_lead_gen',
    name: 'Website Lead Catcher',
    description: 'For any service business. Finds out what visitors need, gets their contact info, and qualifies them as leads.',
    icon: Handshake,
    category: "Client Sales & Lead Gen",
    tags: ["real estate", "leads", "sales", "get clients", "services"],
    defaultValues: {
      agentPurpose: 'sales',
      agentType: 'chat',
      primaryLogic: 'prompt', 
      role: "I'm a helpful assistant for [Client Name]. I chat with visitors to understand what they're looking for, then collect their contact details so the team can follow up. My goal is to make sure no potential customer slips through the cracks.",
      personality: "Engaging, professional, and helpful. I ask good questions to understand what people are looking for."
    }
  },
  {
    id: 'inbound_call_answering',
    name: 'AI Voice Receptionist',
    description: 'An AI that answers the phone, provides key business info (like hours/location), and can route calls. Saves receptionist time.',
    icon: PhoneCall,
    category: "Client Operations",
    tags: ["receptionist", "info", "appointments", "voice", "automation"],
    defaultValues: {
      agentPurpose: 'info', 
      agentType: 'voice',
      direction: 'inbound',
      primaryLogic: 'rag', 
      role: "I'm the automated phone assistant for [Client Name]. I can provide information about our hours and services, or connect you to the right department. Just tell me what you need!",
      personality: "Clear, calm, and efficient. I speak naturally and understand various requests."
    }
  },
];

export default function AppTemplatesPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <LayoutGrid className="w-7 h-7 sm:w-8 sm:w-8" />
            <div>
                <CardTitle className="font-headline text-xl sm:text-2xl">
                    AI Agent Job Templates
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                    Instead of starting from scratch, pick a pre-configured job for your new AI employee.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {agentTemplates.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-secondary rounded-md">
                    <template.icon className="w-5 h-5 sm:w-6 sm:w-6" />
                </div>
                <div>
                    <CardTitle className="font-headline text-base sm:text-lg">{template.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{template.category}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow p-4 sm:p-5 pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 mb-2">{template.description}</p>
              {template.tags && (
                <div className="flex flex-wrap gap-1.5">
                    {template.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">{tag}</Badge>
                    ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 sm:p-5 pt-2">
              <Button asChild size="sm" className="w-full text-xs sm:text-sm">
                {/* This link will now go to agent creation, which will handle client selection if needed */}
                <Link href={`/agents/create?templateId=${template.id}`}>
                  Select This Job <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <Alert className="mt-6 sm:mt-8 bg-secondary">
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>How to Use a Job Template:</AlertTitle>
          <AlertDescription className="text-muted-foreground text-xs sm:text-sm">
            Clicking "Select This Job" takes you to the new agent form. If you haven't chosen a client for this AI employee, you'll be prompted to pick one there.
          </AlertDescription>
      </Alert>
    </div>
  );
}
