
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, HomeIcon as RealEstateIcon, CalendarCheck, BotIcon, HelpCircle, Lightbulb, Users, Briefcase, LayoutGrid, Users2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentPurposeType, AgentType, AgentDirection, AgentLogicType } from "@/lib/types"; 
import { Alert, AlertDescription } from "@/components/ui/alert";


export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  detailsLink?: string; 
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
    description: 'Handles common customer questions, tracks orders, and explains returns for your client\'s online store. Saves them time & makes customers happier!',
    icon: ShoppingCart,
    category: "Client Customer Service",
    tags: ["e-commerce", "support", "chat", "save time"],
    defaultValues: {
      agentPurpose: 'support',
      agentType: 'chat',
      primaryLogic: 'rag', // RAG is good for FAQ/Policy based support
      role: "I am a friendly and efficient support assistant for [Client Name]'s online store. I help customers by answering questions about their orders, our products, shipping, and returns. My goal is to provide quick and helpful information.",
      personality: "Patient, clear, and positive. I'm always happy to help!"
    }
  },
  {
    id: 'real_estate_lead_gen',
    name: 'Real Estate Lead Catcher',
    description: 'Talks to website visitors for your real estate client, finds out what they need (buy/sell/rent), gets their contact info, and can even suggest next steps like viewings.',
    icon: RealEstateIcon,
    category: "Client Sales & Lead Gen",
    tags: ["real estate", "leads", "sales", "get clients"],
    defaultValues: {
      agentPurpose: 'sales',
      agentType: 'chat',
      primaryLogic: 'prompt', // Prompt-driven for more conversational lead qualification
      role: "I'm an assistant for [Client Name]'s Real Estate. I chat with visitors to understand their property needs, like if they're looking to buy, sell, or rent, their budget, and preferred areas. I then collect their contact details so an agent can follow up.",
      personality: "Engaging, professional, and helpful. I ask good questions to understand what people are looking for."
    }
  },
  {
    id: 'dental_appointment_voice',
    name: 'Dental Clinic Voice Booker',
    description: 'A voice agent for your client\'s dental clinic. It answers calls 24/7 to book, change, or cancel appointments. Frees up their receptionist!',
    icon: CalendarCheck,
    category: "Client Appointment Scheduling",
    tags: ["healthcare", "dental", "appointments", "voice", "automation"],
    defaultValues: {
      agentPurpose: 'custom', 
      agentType: 'voice',
      direction: 'inbound',
      primaryLogic: 'prompt', // Good for conversational appointment setting
      role: "I'm the automated assistant for [Client Name]'s Dental Clinic. I can help you schedule a new appointment, reschedule, or cancel an existing one. Just tell me what you need!",
      personality: "Clear, calm, and efficient. I speak naturally and confirm details carefully."
    }
  },
  {
    id: 'faq_info_bot',
    name: 'Instant Info Bot (FAQ Master)',
    description: 'Feed this agent your client\'s FAQs, service details, or any documents. It becomes an instant expert, answering questions on their website 24/7.',
    icon: Lightbulb,
    category: "Client Information & Support",
    tags: ["faq", "info", "knowledge base", "website help"],
    defaultValues: {
        agentPurpose: "info",
        agentType: "chat",
        primaryLogic: "rag", // Perfect for RAG
        role: "I'm an information assistant for [Client Name]. I have access to their key documents and FAQs. Ask me anything about their services, policies, or general information, and I'll do my best to answer based on what I've learned.",
        personality: "Factual, direct, and helpful. My main job is to give you the correct information quickly."
    }
  },
  {
    id: 'general_purpose_assistant',
    name: 'General Purpose AI Helper',
    description: 'A flexible starting point for your client. Great for tasks like brainstorming ideas, drafting simple emails, or answering general questions. You define its exact job!',
    icon: BotIcon,
    category: "Client Custom & General",
    tags: ["general", "custom", "creative", "flexible"],
    defaultValues: {
        agentPurpose: "custom",
        agentType: "chat",
        primaryLogic: "prompt", // Good for general, persona-driven tasks
        role: "I am a versatile AI assistant for [Client Name]. You can tell me what you need help with - whether it's brainstorming, summarizing text, or answering general questions. My goal is to be a helpful AI partner.",
        personality: "Adaptable! You can define my tone - friendly, formal, funny, etc. By default, I'm helpful and neutral."
    }
  }
];


export default function TemplatesPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <Card className="bg-card/70 dark:bg-card/60 backdrop-blur-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}>
            <LayoutGrid className="w-6 h-6 sm:w-7 sm:w-7 text-primary" />
            AI Agent Recipes for Client Success
          </CardTitle>
          <CardDescription className="text-sm">
            Don't start from scratch! Use these templates to quickly build AI agents that solve real problems for your clients. Pick one, add it to a client's workspace, then customize!
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {agentTemplates.map((template) => (
          <Card key={template.id} className="flex flex-col hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-md">
                    <template.icon className="w-5 h-5 sm:w-6 sm:w-6 text-primary" />
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
                        <span key={tag} className="text-[10px] sm:text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full">{tag}</span>
                    ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 sm:p-5 pt-2">
              <Button asChild size="sm" className={cn("w-full text-xs sm:text-sm", "btn-gradient-primary")}>
                <Link href={`/dashboard?info=selectClientFirst&templateId=${template.id}`}>
                  Use This Recipe <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <Alert className="mt-4 sm:mt-6 bg-accent/10 dark:bg-accent/20 border-accent/30">
          <Info className="h-4 w-4 text-accent" />
          <AlertDescription className="text-accent/80 dark:text-accent/90 text-xs sm:text-sm">
            <strong className="font-semibold text-accent">How to use these recipes:</strong>
            <ol className="list-decimal list-inside pl-3 mt-1">
                <li>First, go to your <Link href="/dashboard" className="underline hover:text-primary">Client Dashboard</Link>.</li>
                <li>Select an existing client or add a new one (this is who you're building the AI for).</li>
                <li>Once in that client's workspace, click "Create New Agent for [Client Name]".</li>
                <li>You'll then see an option to start with one of these recipes/templates, pre-filled for that client!</li>
            </ol>
          </AlertDescription>
      </Alert>
    </div>
  );
}
