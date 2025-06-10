
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, HomeIcon as RealEstateIcon, CalendarCheck, BotIcon, HelpCircle, Lightbulb, Users, Briefcase, LayoutGrid, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentPurposeType, AgentType, AgentDirection, AgentLogicType } from "@/lib/types"; 

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
    description: 'Handles customer inquiries, tracks orders, and assists with returns for your client\'s online store. Reduces their support tickets.',
    icon: ShoppingCart,
    category: "Client Customer Service",
    tags: ["e-commerce", "support", "orders", "chat"],
    defaultValues: {
      agentPurpose: 'support',
      agentType: 'chat',
      primaryLogic: 'rag',
      role: "I am a customer support specialist for [Client Name]. My main tasks are to help customers track their orders, answer questions about products, explain return policies, and resolve any shopping issues they might have. I aim to provide quick and accurate assistance to ensure a smooth and positive customer experience.",
      personality: "Friendly, patient, and highly efficient. I'm knowledgeable about our products and policies, and I communicate clearly and politely. I'm always ready to help with a positive attitude."
    }
  },
  {
    id: 'real_estate_lead_gen',
    name: 'Real Estate Lead Assistant',
    description: 'Engages website visitors for your client\'s real estate agency, qualifies leads, and schedules property viewings.',
    icon: RealEstateIcon,
    category: "Client Sales & Lead Gen",
    tags: ["real estate", "leads", "sales", "chat"],
    defaultValues: {
      agentPurpose: 'sales',
      agentType: 'chat',
      primaryLogic: 'prompt',
      role: "I'm a lead generation assistant for [Client Name]'s Real Estate Agency. I interact with website visitors to understand their property needs (buying, selling, or renting), gather their contact details, and schedule appointments for property viewings or consultations with an agent. My goal is to capture and qualify potential leads effectively.",
      personality: "Professional, engaging, and knowledgeable about the local real estate market. I'm proactive in asking relevant questions and persuasive in guiding users towards the next step. I build trust and rapport with potential clients."
    }
  },
  {
    id: 'dental_appointment_voice',
    name: 'Dental Clinic Voice Booker',
    description: 'A voice-based agent for your client\'s dental clinic that books, reschedules, or cancels appointments over the phone 24/7.',
    icon: CalendarCheck,
    category: "Client Appointment Scheduling",
    tags: ["healthcare", "dental", "appointments", "voice"],
    defaultValues: {
      agentPurpose: 'custom', 
      agentType: 'voice',
      direction: 'inbound',
      primaryLogic: 'prompt',
      role: "I am the automated voice assistant for [Client Name]'s Dental Clinic. I can help you schedule a new dental appointment, reschedule an existing one, or cancel an appointment if needed. I can also provide basic information about our clinic's services, hours, and location.",
      personality: "Clear, calm, and friendly. I speak at a moderate pace and understand various ways users might state their requests. I confirm details carefully to ensure accuracy and provide a pleasant scheduling experience over the phone."
    }
  },
  {
    id: 'faq_info_bot',
    name: 'FAQ & Information Bot',
    description: 'Provides instant answers to common questions for your client, based on documents or website content you upload.',
    icon: Lightbulb,
    category: "Client Information & Support",
    tags: ["faq", "info", "knowledge base", "chat"],
    defaultValues: {
        agentPurpose: "info",
        agentType: "chat",
        primaryLogic: "rag",
        role: "I am an informational assistant for [Client Name]. I provide answers to frequently asked questions and explain specific topics based on the knowledge I've been trained on from your documents and website content. My goal is to be a reliable and instant source of information.",
        personality: "Factual, concise, and helpful. I focus on delivering accurate information clearly and directly. I can point to source documents when useful."
    }
  },
  {
    id: 'general_purpose_assistant',
    name: 'General Purpose AI Assistant',
    description: 'A flexible agent for your client, customizable for various tasks like creative brainstorming or general assistance.',
    icon: BotIcon,
    category: "Client Custom & General",
    tags: ["general", "custom", "creative", "chat"],
    defaultValues: {
        agentPurpose: "custom",
        agentType: "chat",
        primaryLogic: "prompt",
        role: "I am a versatile AI assistant for [Client Name]. I can help with tasks like brainstorming ideas, drafting content, answering general questions, or performing custom actions you define. My capabilities are flexible based on your specific instructions and persona requirements.",
        personality: "Adaptable based on your needs. You can define whether I should be witty, formal, creative, analytical, or any other style that fits your purpose. Default is neutral and helpful."
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
            AI Agent Templates for Your Clients
          </CardTitle>
          <CardDescription className="text-sm">
            Kickstart agent creation for your clients with these pre-configured templates. Choose one that best fits your client's business needs, then customize it further in their dedicated workspace.
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
                {/* Note: You'll need to select a client *before* using a template, or adjust the flow */}
                <Link href={`/dashboard?info=selectClientFirst&templateId=${template.id}`}>
                  Use This Template <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       <Card className="mt-4 sm:mt-6 bg-accent/10 dark:bg-accent/20 border-accent/30">
          <CardContent className="p-4 sm:p-5 text-xs sm:text-sm text-accent/90">
            <strong className="font-semibold">How to use templates:</strong> First, go to your <Link href="/dashboard" className="underline hover:text-primary">Client Dashboard</Link> and either select an existing client or add a new one. Once you're in a client's workspace, you can then create a new agent and select one of these templates as a starting point. The template will be customized for that specific client.
          </CardContent>
      </Card>
    </div>
  );
}
