
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, HomeIcon as RealEstateIcon, CalendarCheck, BotIcon, Lightbulb, LayoutGrid, MessageSquare, Phone, Brain, DatabaseZap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentPurposeType, AgentType, AgentDirection, AgentLogicType } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Re-defining AgentTemplate interface locally if not imported from public page
export interface AgentTemplate {
  id: string;
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
    id: 'ecommerce_support',
    name: 'E-commerce Support Bot',
    description: 'Answers store questions, tracks orders, handles returns. Keeps client customers happy.',
    icon: ShoppingCart,
    category: "Client Customer Service",
    tags: ["e-commerce", "support", "chat", "save time"],
    defaultValues: {
      agentPurpose: 'support',
      agentType: 'chat',
      primaryLogic: 'rag',
      role: "I am a friendly and efficient support assistant for [Client Name]'s online store. I help customers by answering questions about their orders, our products, shipping, and returns. My goal is to provide quick and helpful information.",
      personality: "Patient, clear, and positive. I'm always happy to help!"
    }
  },
  {
    id: 'real_estate_lead_gen',
    name: 'Real Estate Lead Catcher',
    description: 'For real estate clients. Finds buyer/seller needs, gets contacts, suggests viewings.',
    icon: RealEstateIcon,
    category: "Client Sales & Lead Gen",
    tags: ["real estate", "leads", "sales", "get clients"],
    defaultValues: {
      agentPurpose: 'sales',
      agentType: 'chat',
      primaryLogic: 'prompt',
      role: "I'm an assistant for [Client Name]'s Real Estate. I chat with visitors to understand their property needs, like if they're looking to buy, sell, or rent, their budget, and preferred areas. I then collect their contact details so an agent can follow up.",
      personality: "Engaging, professional, and helpful. I ask good questions to understand what people are looking for."
    }
  },
  {
    id: 'dental_appointment_voice',
    name: 'Dental Clinic Voice Booker',
    description: 'Voice agent for dental clinics. Books, changes, cancels appointments 24/7. Saves receptionist time.',
    icon: CalendarCheck,
    category: "Client Appointment Scheduling",
    tags: ["healthcare", "dental", "appointments", "voice", "automation"],
    defaultValues: {
      agentPurpose: 'custom',
      agentType: 'voice',
      direction: 'inbound',
      primaryLogic: 'prompt',
      role: "I'm the automated assistant for [Client Name]'s Dental Clinic. I can help you schedule a new appointment, reschedule, or cancel an existing one. Just tell me what you need!",
      personality: "Clear, calm, and efficient. I speak naturally and confirm details carefully."
    }
  },
  {
    id: 'faq_info_bot',
    name: 'Instant Info Bot (FAQ Master)',
    description: 'Feed it client FAQs or docs. It becomes an expert, answering questions on their site 24/7.',
    icon: Lightbulb,
    category: "Client Information & Support",
    tags: ["faq", "info", "knowledge base", "website help"],
    defaultValues: {
        agentPurpose: "info",
        agentType: "chat",
        primaryLogic: "rag",
        role: "I'm an information assistant for [Client Name]. I have access to their key documents and FAQs. Ask me anything about their services, policies, or general information, and I'll do my best to answer based on what I've learned.",
        personality: "Factual, direct, and helpful. My main job is to give you the correct information quickly."
    }
  },
  {
    id: 'general_purpose_assistant',
    name: 'General AI Helper',
    description: 'Flexible AI for your client. Brainstorms ideas, drafts emails, answers general questions.',
    icon: BotIcon,
    category: "Client Custom & General",
    tags: ["general", "custom", "creative", "flexible"],
    defaultValues: {
        agentPurpose: "custom",
        agentType: "chat",
        primaryLogic: "prompt",
        role: "I am a versatile AI assistant for [Client Name]. You can tell me what you need help with - whether it's brainstorming, summarizing text, or answering general questions. My goal is to be a helpful AI partner.",
        personality: "Adaptable! You can define my tone - friendly, formal, funny, etc. By default, I'm helpful and neutral."
    }
  }
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
                    AI Agent Templates Gallery
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                    Browse these pre-configured AI agent templates to quickly start a new project for one of your clients.
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
               <div className="mt-2 space-y-0.5 text-xs">
                  {template.defaultValues.agentType && <Badge variant="outline" className="mr-1"><MessageSquare className="w-2.5 h-2.5 mr-1"/>{template.defaultValues.agentType}</Badge>}
                  {template.defaultValues.primaryLogic && <Badge variant="outline"><Brain className="w-2.5 h-2.5 mr-1"/>{template.defaultValues.primaryLogic === 'rag' ? 'Knowledge-Based' : 'Persona-Driven'}</Badge>}
               </div>
            </CardContent>
            <CardFooter className="p-4 sm:p-5 pt-2">
              <Button asChild size="sm" className="w-full text-xs sm:text-sm">
                {/* This link will now go to agent creation, which will handle client selection if needed */}
                <Link href={`/agents/create?templateId=${template.id}`}>
                  Use This Template <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <Alert className="mt-6 sm:mt-8 bg-secondary">
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Using a Template:</AlertTitle>
          <AlertDescription className="text-muted-foreground text-xs sm:text-sm">
            Clicking "Use This Template" will take you to the agent creation form.
            If you haven't selected a client yet for this new agent, you'll be prompted to choose or create one on that page.
          </AlertDescription>
      </Alert>
    </div>
  );
}
