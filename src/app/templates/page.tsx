
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, HomeIcon as RealEstateIcon, CalendarCheck, BotIcon, Lightbulb, Users, Briefcase, LayoutGrid, Users2, Info, MessageSquare, Phone, Brain, DatabaseZap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentPurposeType, AgentType, AgentDirection, AgentLogicType } from "@/lib/types"; 
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge"; 

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
    description: 'Instantly answer store questions, track orders, and handle return queries. Make your client’s customers happier, 24/7.',
    icon: ShoppingCart,
    category: "Client Customer Service",
    tags: ["e-commerce", "support", "chat", "save time", "24/7 help"],
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
    description: 'Never miss a lead for your real estate client. This AI qualifies buyers/sellers and schedules viewings, even after hours.',
    icon: RealEstateIcon,
    category: "Client Sales & Lead Gen",
    tags: ["real estate", "leads", "sales", "get clients", "automation"],
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
    description: 'AI Voice agent that books, reschedules, or cancels dental appointments over the phone. Frees up your client’s receptionist.',
    icon: CalendarCheck,
    category: "Client Appointment Scheduling",
    tags: ["healthcare", "dental", "appointments", "voice", "efficiency"],
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
    description: 'Train this AI on your client’s FAQs or documents. It becomes their 24/7 know-it-all expert on their website.',
    icon: Lightbulb,
    category: "Client Information & Support",
    tags: ["faq", "info", "knowledge base", "website help", "self-service"],
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
    name: 'General AI Helper (Your Client’s Sidekick)',
    description: 'A flexible AI for any client. Helps brainstorm ideas, draft emails, summarize content, or answer general questions.',
    icon: BotIcon,
    category: "Client Custom & General",
    tags: ["general", "custom", "creative", "flexible", "productivity"],
    defaultValues: {
        agentPurpose: "custom",
        agentType: "chat",
        primaryLogic: "prompt", 
        role: "I am a versatile AI assistant for [Client Name]. You can tell me what you need help with - whether it's brainstorming, summarizing text, or answering general questions. My goal is to be a helpful AI partner.",
        personality: "Adaptable! You can define my tone - friendly, formal, funny, etc. By default, I'm helpful and neutral."
    }
  }
];


export default function PublicTemplatesPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="public-page-header">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-7 w-auto" />
          </Link>
          <Button asChild variant="outline" size="sm" className="btn-outline-themed transition-colors btn-interactive text-xs">
            <Link href="/dashboard">Go to Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 sm:py-12 px-4 md:px-6">
        <Card className="mb-8 sm:mb-12 shadow-lg border-transparent bg-gradient-to-br from-card via-card to-muted/30">
          <CardHeader className="p-6 text-center">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-3">
              <LayoutGrid className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className={cn("font-headline text-2xl sm:text-3xl md:text-4xl", "text-gradient-dynamic")}>
              Kickstart Your Client Projects: AI Agent Templates
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
              Why start from scratch? Use these pre-built AI agent templates to deliver value to your clients faster. Select, customize, and deploy!
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
                          <Badge key={tag} variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">{tag}</Badge>
                      ))}
                  </div>
                )}
                 <div className="mt-2 space-y-0.5 text-xs">
                    {template.defaultValues.agentType && <Badge variant="outline" className="mr-1 border-accent/50 text-accent text-[10px]"><MessageSquare className="w-2.5 h-2.5 mr-1"/>{template.defaultValues.agentType}</Badge>}
                    {template.defaultValues.primaryLogic && <Badge variant="outline" className="border-secondary text-secondary-foreground text-[10px]"><Brain className="w-2.5 h-2.5 mr-1"/>{template.defaultValues.primaryLogic === 'rag' ? 'Knowledge-Based' : 'Persona-Driven'}</Badge>}
                 </div>
              </CardContent>
              <CardFooter className="p-4 sm:p-5 pt-2">
                <Button asChild size="sm" className={cn("w-full text-xs sm:text-sm", "btn-gradient-primary")}>
                  <Link href={`/dashboard?templateId=${template.id}&info=selectClientFirst`}>
                    Use This Template (Go to Dashboard) <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
         <Alert className="mt-6 sm:mt-8 bg-accent/10 dark:bg-accent/20 border-accent/30">
            <Info className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent/80 dark:text-accent/90 text-xs sm:text-sm">
              <strong className="font-semibold text-accent">Quick Start with Templates:</strong>
              <ol className="list-decimal list-inside pl-3 mt-1">
                  <li>Click "Use This Template". This takes you to your AutoBoss Dashboard.</li>
                  <li>If you're not logged in, you'll be prompted to log in or sign up.</li>
                  <li>In your Dashboard, simply select an existing client or create a new one for this agent.</li>
                  <li>The agent creation form will auto-fill with the template's settings. Customize as needed and launch!</li>
              </ol>
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
            <Link href="/support" className="hover:text-primary">Help Center</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

