
"use client";

import type { Metadata } from 'next';
import Link from "next/link"; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, MessageCircleQuestion, AlertTriangle, Mail, Cog, BookOpen, Share2, Bot, Palette, Brain, Mic, Users, Briefcase, DatabaseZap, Edit3, TestTubeDiagonal, Settings2, FilePlus, DollarSign, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";

// export const metadata: Metadata = { // Cannot use metadata in client component
//   title: "Support & FAQ | AutoBoss AI Agency Platform",
//   description: "Get help and find answers to common questions about using AutoBoss to build and manage AI agents for your clients. Learn how to start your AI agency.",
// };

export default function PublicSupportPage() {
  const faqs = [
    {
      question: "I'm new to AI. Is AutoBoss really for me?",
      answer: "Absolutely! AutoBoss is designed specifically for people who want to start an AI agency WITHOUT needing to code or be a tech expert. We focus on simplicity and getting you results (i.e., helping you build AI agents your clients will pay for). If you can use basic web apps, you can use AutoBoss.",
      icon: HelpCircle,
    },
    {
      question: "How do I add a new client to my workspace?",
      answer: "It's super easy! From your main 'Client Dashboard' (once you log in), click the 'Add New Client' button. Just enter their name. Optionally, you can add their website and a short note for yourself. This creates a neat, organized space for each client where you'll build their AI agents.",
      icon: FilePlus,
    },
    {
      question: "Can I build different types of AI agents for the same client?",
      answer: "Yes, and that's the power of it! A single client might want a chatbot for their website (to answer FAQs) AND a voice agent to handle after-hours calls. With AutoBoss, you can create and manage multiple, different AI agents all under one client in your workspace.",
      icon: Bot,
    },
    {
      question: "How do I train an agent to know about MY client's business?",
      answer: "Simple! Go to the 'Knowledge' section for the agent you're building for that client. You can upload their existing documents (like FAQs, product lists, service descriptions - think PDFs, Word docs, even CSVs of products/leads), or just paste in text. You can also add website links (like their 'About Us' or 'Services' page). AutoBoss helps the AI learn this info to answer questions accurately about *that specific client*.",
      icon: DatabaseZap,
    },
     {
      question: "How do I make the AI agent sound like my client's brand?",
      answer: "In the 'Personality' section for each agent, you tell AutoBoss about your client's business and the kind of 'vibe' they want (e.g., friendly, professional, funny). Our AI then suggests a name, a personality description, and even a greeting. You can then easily tweak these to make it perfect for your client's brand. It's like giving the AI a quick brand guide!",
      icon: Palette,
    },
    {
      question: "How do I give the AI agent to my client (and get paid)?",
      answer: "Once you're happy with an agent, go to its 'Export' tab. For website chatbots, AutoBoss gives you a tiny piece of code. You (or your client) just copy and paste this into their website. For voice agents, it gives you info to link up with phone systems. You then bill your client for your setup service and any ongoing management you agree on!",
      icon: Share2,
    },
    {
        question: "What's 'Knowledge-Based' vs. 'Persona-Driven' AI in simple terms?",
        answer: "'Knowledge-Based (RAG)' means the AI mostly answers using the specific documents and website info YOU give it for that client. Best for support or info bots that need to be factual about the client's business. 'Persona-Driven (Prompt)' means the AI relies more on the personality and role you define for it, using its general smarts. Good for more creative chats or when you don't have a lot of specific client documents.",
        icon: Brain
    },
    {
      question: "My agent isn't answering right. What's the first thing to check?",
      answer: "1. **Check its 'Knowledge':** Did you upload the right info for THAT client? Is the info clear? For 'Knowledge-Based' agents, this is key. \n2. **Check 'Personality':** Is its job and how it should act clearly written? This guides how it talks. \n3. **Test with Simple Questions:** In the 'Test Agent' tab, ask easy questions first, then get more specific. Sometimes just rephrasing your question helps the AI understand better!",
      icon: TestTubeDiagonal,
    },
    {
      question: "How do I actually make money with this?",
      answer: "You find businesses that need help! Many small businesses are overwhelmed with customer questions, or miss leads because they're busy. You use AutoBoss to quickly build an AI agent that solves THEIR problem (e.g., an AI FAQ bot, an AI lead collector). You charge them a setup fee and/or a monthly fee to keep the agent running and updated. AutoBoss is your tool to deliver that service. Check out our 'Client Playbook' for more ideas!",
      icon: DollarSign,
    }
  ];

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

      <main className="container mx-auto py-8 sm:py-12 px-4 md:px-6 max-w-3xl">
        <Card className="mb-8 sm:mb-12 shadow-lg border-transparent bg-gradient-to-br from-card via-card to-muted/30">
          <CardHeader className="p-6 text-center">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-3">
                <LifeBuoy className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className={cn("font-headline text-2xl sm:text-3xl md:text-4xl", "text-gradient-dynamic")}>
                AutoBoss Help Center & FAQ
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
                Your quick guide to building a thriving AI agency with AutoBoss. Find answers to common questions here.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Alert className="mb-6 sm:mb-8 bg-accent/10 dark:bg-accent/20 border-accent/30">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent/90 text-xs sm:text-sm">
              <strong>New to AI Agencies? You're in the right place!</strong> AutoBoss is built for simplicity. These FAQs will get you started fast.
            </AlertDescription>
        </Alert>
          
        <section>
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2", "text-gradient-dynamic")}><MessageCircleQuestion className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((faq, index) => (
                <Card key={index} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <AccordionItem value={`item-${index + 1}`} className="border-b-0">
                    <AccordionTrigger className="p-4 text-left hover:no-underline text-sm sm:text-base font-medium group bg-card hover:bg-muted/50 transition-colors">
                        {faq.icon && <faq.icon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:text-accent transition-colors shrink-0" />}
                        <span className="flex-1">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed text-xs sm:text-sm p-4 pt-0 bg-card border-t border-border/50">
                        <div className="pl-6 sm:pl-7">
                            {faq.answer.split('\n').map((paragraph, pIndex) => <p key={pIndex} className={pIndex > 0 ? 'mt-2' : ''}>{paragraph}</p>)}
                        </div>
                    </AccordionContent>
                    </AccordionItem>
                </Card>
              ))}
            </Accordion>
        </section>

        <Card className="mt-8 sm:mt-12 p-6 text-center bg-muted/30 border-dashed">
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 flex items-center justify-center gap-2", "text-gradient-dynamic")}><Mail className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Need More Help?</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              We're excited to see you succeed! If you're stuck or have ideas, reach out.
            </p>
            <Button variant="outline" className="text-xs sm:text-sm btn-interactive" asChild>
                <Link href="mailto:support@autoboss.dev?subject=AutoBoss%20AI%20Agency%20Help">Email Our Support Team</Link>
            </Button>
        </Card>
      </main>

      <footer className="public-page-footer">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <Link href="/" className="flex items-center gap-1.5">
            <Logo className="h-5 w-auto" collapsed={true} />
            <span>&copy; {new Date().getFullYear()} AutoBoss</span>
          </Link>
          <nav className="flex gap-3">
            <Link href="/playbook" className="hover:text-primary">Client Playbook</Link>
            <Link href="/templates" className="hover:text-primary">AI Templates</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

    