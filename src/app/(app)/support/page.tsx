
"use client";

import Link from "next/link"; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, MessageCircleQuestion, AlertTriangle, Mail, Cog, BookOpen, Share2, Bot, Palette, Brain, Mic, Users, Briefcase, DatabaseZap, Edit3, TestTubeDiagonal, Settings2, FilePlus, DollarSign, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Using shadcn Alert

export default function SupportPage() {
  const faqs = [
    {
      question: "I'm new to AI. Is AutoBoss really for me?",
      answer: "Absolutely! AutoBoss is designed specifically for people who want to start an AI agency WITHOUT needing to code or be a tech expert. We focus on simplicity and getting you results (i.e., helping you build AI agents your clients will pay for). If you can use basic web apps, you can use AutoBoss.",
      icon: HelpCircle,
    },
    {
      question: "How do I add a new client to my workspace?",
      answer: "It's super easy! From your main 'Client Dashboard', click the 'Add New Client' button. Just enter their name. Optionally, you can add their website and a short note for yourself. This creates a neat, organized space for each client where you'll build their AI agents.",
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
        question: "What's 'RAG' vs. 'Prompt-Driven' in simple terms?",
        answer: "'Learns from Your Data (RAG)' means the AI mostly answers using the specific documents and website info YOU give it for that client. Best for support or info bots that need to be factual about the client's business. 'Persona-Driven (Prompt)' means the AI relies more on the personality and role you define for it, using its general smarts. Good for more creative chats or when you don't have a lot of specific client documents.",
        icon: Brain
    },
    {
      question: "My agent isn't answering right. What's the first thing to check?",
      answer: "1. **Check its 'Knowledge':** Did you upload the right info for THAT client? Is the info clear? For 'Learns from Data' agents, this is key. \n2. **Check 'Personality':** Is its job and how it should act clearly written? This guides how it talks. \n3. **Test with Simple Questions:** In the 'Test Agent' tab, ask easy questions first, then get more specific. Sometimes just rephrasing your question helps the AI understand better!",
      icon: TestTubeDiagonal,
    },
    {
      question: "How do I actually make money with this?",
      answer: "You find businesses that need help! Many small businesses are overwhelmed with customer questions, or miss leads because they're busy. You use AutoBoss to quickly build an AI agent that solves THEIR problem (e.g., an AI FAQ bot, an AI lead collector). You charge them a setup fee and/or a monthly fee to keep the agent running and updated. AutoBoss is your tool to deliver that service.",
      icon: DollarSign,
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}>
            <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Your AutoBoss Success Center
          </CardTitle>
          <CardDescription className="text-sm">Your quick guide to building a thriving AI agency with AutoBoss. We're here to help you win!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6">
          <Alert className="bg-accent/10 dark:bg-accent/20 border-accent/30">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <AlertDescription className="text-accent/90 text-xs sm:text-sm">
              <strong>New to AI Agencies? You're in the right place!</strong> AutoBoss is built for simplicity. These FAQs will get you started fast.
            </AlertDescription>
          </Alert>
          
          <section>
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2", "text-gradient-dynamic")}><MessageCircleQuestion className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Quick Answers for AI Agency Builders</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index + 1}`} key={index} className="border-border/70">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4 group">
                    {faq.icon && <faq.icon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:text-accent transition-colors shrink-0" />}
                    <span className="flex-1">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-xs sm:text-sm pb-3 sm:pb-4 pl-8 sm:pl-10">
                    {faq.answer.split('\n').map((paragraph, pIndex) => <p key={pIndex} className={pIndex > 0 ? 'mt-2' : ''}>{paragraph}</p>)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="p-3 sm:p-4 border rounded-lg bg-muted/30">
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2", "text-gradient-dynamic")}><Cog className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Pro Tips for Success</h2>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground">
              <li><strong>Start Simple with Your First Client:</strong> Offer a basic FAQ bot or a lead capture agent. Get a win, then expand!</li>
              <li><strong>Use Client's Own Words:</strong> When training an agent, use text directly from their website or brochures. This makes the AI sound authentic.</li>
              <li><strong>Test, Test, Test:</strong> Before showing an agent to a client, test it yourself by asking all sorts of questions you think THEIR customers would ask.</li>
              <li><strong>Clearly Explain Value to Clients:</strong> Don't just sell "AI." Sell "24/7 customer answers," "never miss a lead," or "save X hours per week for your team."</li>
            </ul>
          </section>

          <section className="p-3 sm:p-4 border rounded-lg bg-muted/30">
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2", "text-gradient-dynamic")}><Mail className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Need More Help?</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              We're excited to see you succeed! If you're stuck or have ideas, reach out.
            </p>
            <Button variant="outline" className="mt-2 sm:mt-3 text-xs sm:text-sm btn-interactive" asChild>
                <Link href="mailto:support@autoboss.dev?subject=AutoBoss%20AI%20Agency%20Help">Email Our Support Team</Link>
            </Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
