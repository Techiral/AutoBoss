
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, MessageCircleQuestion, AlertTriangle, Mail, HelpCircle, Bot, DatabaseZap, Palette, Share2, TestTubeDiagonal, DollarSign, FilePlus, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AppSupportPage() {
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
        question: "What's 'Knowledge-Based' vs. 'Persona-Driven' AI in simple terms?",
        answer: "'Knowledge-Based (RAG)' means the AI mostly answers using the specific documents and website info YOU give it for that client. Best for support or info bots that need to be factual about the client's business. 'Persona-Driven (Prompt)' means the AI relies more on the personality and role you define for it, using its general smarts. Good for more creative chats or when you don't have a lot of specific client documents.",
        icon: Brain,
    },
    {
      question: "My agent isn't answering right. What's the first thing to check?",
      answer: "1. **Check its 'Knowledge':** Did you upload the right info for THAT client? Is the info clear? For 'Knowledge-Based' agents, this is key. \n2. **Check 'Personality':** Is its job and how it should act clearly written? This guides how it talks. \n3. **Test with Simple Questions:** In the 'Test Agent' tab, ask easy questions first, then get more specific. Sometimes just rephrasing your question helps the AI understand better!",
      icon: TestTubeDiagonal,
    },
    {
      question: "How do I actually make money with this?",
      answer: "You find businesses that need help! Many small businesses are overwhelmed with customer questions, or miss leads because they're busy. You use AutoBoss to quickly build an AI agent that solves THEIR problem (e.g., an AI FAQ bot, an AI lead collector). You charge them a setup fee and/or a monthly fee to keep the agent running and updated. AutoBoss is your tool to deliver that service. Check out our public 'Client Playbook' for more ideas!",
      icon: DollarSign,
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <LifeBuoy className="w-7 h-7 sm:w-8 sm:w-8 text-primary" />
            <div>
                <CardTitle className={cn("font-headline text-xl sm:text-2xl", "text-gradient-dynamic")}>
                    Help Center & FAQ
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                    Find answers to common questions about using AutoBoss.
                </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Alert className="bg-accent/10 dark:bg-accent/20 border-accent/30">
          <Lightbulb className="h-4 w-4 text-accent" />
          <AlertDescription className="text-accent/90 text-xs sm:text-sm">
            <strong>Welcome to the Help Center!</strong> If you can't find your answer here, use the "Send Feedback" link in the sidebar.
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

      <Card className="mt-8 sm:mt-12 p-4 sm:p-6 text-center bg-muted/30 border-dashed">
          <h2 className={cn("text-base sm:text-lg font-semibold mb-2 flex items-center justify-center gap-2", "text-gradient-dynamic")}><Mail className="w-4 h-4 text-primary"/>Still Need Help?</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-3">
            If your question isn't answered above, please reach out to our support team.
          </p>
          <Button variant="outline" className="text-xs sm:text-sm btn-interactive" asChild>
              <Link href="mailto:support@YOUR_AUTOBOSS_DOMAIN.com?subject=AutoBoss%20App%20Support">Email Support</Link>
          </Button>
      </Card>
    </div>
  );
}
