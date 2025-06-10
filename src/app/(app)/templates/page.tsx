
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, HomeIcon as RealEstateIcon, CalendarCheck, BotIcon, HelpCircle, Lightbulb, Users, Briefcase, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentPurposeType, AgentType, AgentDirection, AgentLogicType } from "@/lib/types"; // Assuming these types are exported

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  detailsLink?: string; // For a future "learn more"
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
    description: 'Handles customer inquiries, tracks orders, and assists with returns for online stores. Reduces support tickets.',
    icon: ShoppingCart,
    category: "Customer Service",
    tags: ["e-commerce", "support", "orders", "chat"],
    defaultValues: {
      agentPurpose: 'support',
      agentType: 'chat',
      role: "I am a customer support specialist for [Your Client's E-commerce Store]. My main tasks are to help customers track their orders, answer questions about products, explain return policies, and resolve any shopping issues they might have. I aim to provide quick and accurate assistance to ensure a smooth and positive customer experience.",
      personality: "Friendly, patient, and highly efficient. I'm knowledgeable about our products and policies, and I communicate clearly and politely. I'm always ready to help with a positive attitude."
    }
  },
  {
    id: 'real_estate_lead_gen',
    name: 'Real Estate Lead Assistant',
    description: 'Engages website visitors, qualifies real estate leads by asking key questions, and schedules property viewings.',
    icon: RealEstateIcon,
    category: "Sales & Lead Gen",
    tags: ["real estate", "leads", "sales", "chat"],
    defaultValues: {
      agentPurpose: 'sales',
      agentType: 'chat',
      role: "I'm a lead generation assistant for [Your Client's Real Estate Agency]. I interact with website visitors to understand their property needs (buying, selling, or renting), gather their contact details, and schedule appointments for property viewings or consultations with an agent. My goal is to capture and qualify potential leads effectively.",
      personality: "Professional, engaging, and knowledgeable about the local real estate market. I'm proactive in asking relevant questions and persuasive in guiding users towards the next step. I build trust and rapport with potential clients."
    }
  },
  {
    id: 'dental_appointment_voice',
    name: 'Dental Clinic Voice Booker',
    description: 'A voice-based agent that books, reschedules, or cancels dental appointments over the phone 24/7.',
    icon: CalendarCheck,
    category: "Appointment Scheduling",
    tags: ["healthcare", "dental", "appointments", "voice"],
    defaultValues: {
      agentPurpose: 'custom', // Or a new "appointment_booking"
      agentType: 'voice',
      direction: 'inbound',
      role: "I am the automated voice assistant for [Your Client's Dental Clinic]. I can help you schedule a new dental appointment, reschedule an existing one, or cancel an appointment if needed. I can also provide basic information about our clinic's services, hours, and location.",
      personality: "Clear, calm, and friendly. I speak at a moderate pace and understand various ways users might state their requests. I confirm details carefully to ensure accuracy and provide a pleasant scheduling experience over the phone."
    }
  },
  {
    id: 'faq_info_bot',
    name: 'FAQ & Information Bot',
    description: 'Provides instant answers to common questions based on your uploaded documents or website content.',
    icon: Lightbulb,
    category: "Information & Support",
    tags: ["faq", "info", "knowledge base", "chat"],
    defaultValues: {
        agentPurpose: "info",
        agentType: "chat",
        primaryLogic: "rag",
        role: "I am an informational assistant for [Your Client's Business/Topic]. I provide answers to frequently asked questions and explain specific topics based on the knowledge I've been trained on from your documents and website content. My goal is to be a reliable and instant source of information.",
        personality: "Factual, concise, and helpful. I focus on delivering accurate information clearly and directly. I can point to source documents when useful."
    }
  },
  {
    id: 'general_purpose_assistant',
    name: 'General Purpose AI Assistant',
    description: 'A flexible agent that can be customized for various tasks, from creative brainstorming to general assistance.',
    icon: BotIcon,
    category: "Custom & General",
    tags: ["general", "custom", "creative", "chat"],
    defaultValues: {
        agentPurpose: "custom",
        agentType: "chat",
        primaryLogic: "prompt",
        role: "I am a versatile AI assistant for [Your Client's Business/Project]. I can help with tasks like brainstorming ideas, drafting content, answering general questions, or performing custom actions you define. My capabilities are flexible based on your specific instructions and persona requirements.",
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
            AI Agent Templates
          </CardTitle>
          <CardDescription className="text-sm">
            Kickstart your agent creation with these pre-configured templates. Choose a template that best fits your client's needs, then customize it further.
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
                <Link href={`/agents/create?templateId=${template.id}`}>
                  Use This Template <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
