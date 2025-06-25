
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart, HomeIcon as RealEstateIcon, CalendarCheck, BotIcon, Lightbulb, Users, Briefcase, LayoutGrid, Users2, Info, MessageSquare, Phone, Brain, DatabaseZap, Handshake, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentPurposeType, AgentType, AgentDirection, AgentLogicType, JobId } from "@/lib/types"; 
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge"; 

export interface AgentTemplate {
  id: JobId; // Use JobId for consistency
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
    id: 'website_support',
    name: '24/7 Website Support Agent',
    description: 'Instantly answer store questions, track orders, and handle return queries. A tireless helper for your client’s customers.',
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


export default function PublicTemplatesPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-7 w-auto" />
          </Link>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/dashboard">Go to Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 sm:py-12 px-4 md:px-6">
        <Card className="mb-8 sm:mb-12 border-border/50">
          <CardHeader className="p-6 text-center">
            <div className="inline-block p-3 bg-foreground/5 rounded-full mb-3">
              <LayoutGrid className="w-8 h-8 text-foreground" />
            </div>
            <CardTitle className="font-headline text-2xl sm:text-3xl md:text-4xl text-foreground">
              Kickstart Your Client Projects: AI Job Templates
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-foreground/80 mt-2 max-w-xl mx-auto">
              Why start from scratch? Use these pre-configured AI jobs to deliver value to your clients faster. Select, customize, and deploy!
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {agentTemplates.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-foreground/10 rounded-md">
                      <template.icon className="w-5 h-5 sm:w-6 sm:w-6 text-foreground" />
                  </div>
                  <div>
                      <CardTitle className="font-headline text-base sm:text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">{template.category}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow p-4 sm:p-5 pt-0">
                <p className="text-xs sm:text-sm text-foreground/80 line-clamp-3 mb-2">{template.description}</p>
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
                  <Link href={`/agents/create?templateId=${template.id}`}>
                    Select This Job <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
         <Alert className="mt-6 sm:mt-8 bg-card border-border">
            <Info className="h-4 w-4" />
            <AlertTitle className="text-foreground font-semibold">How to Use a Job Template:</AlertTitle>
            <AlertDescription className="text-foreground/80 text-xs sm:text-sm">
              <ol className="list-decimal list-inside pl-3 mt-1">
                  <li>Click "Select This Job".</li>
                  <li>In your Dashboard, you'll be prompted to choose a client for this AI employee.</li>
                  <li>The agent creation form will auto-fill with the template's settings. Customize as needed and launch!</li>
              </ol>
            </AlertDescription>
        </Alert>
      </main>

      <footer className="py-6 text-center border-t border-border">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-foreground/80">
          <Link href="/" className="flex items-center gap-1.5">
            <Logo className="h-5 w-auto" collapsed={true} />
            <span>&copy; {new Date().getFullYear()} AutoBoss</span>
          </Link>
          <nav className="flex gap-3">
            <Link href="/playbook" className="hover:text-foreground">Client Playbook</Link>
            <Link href="/support" className="hover:text-foreground">Help Center</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
