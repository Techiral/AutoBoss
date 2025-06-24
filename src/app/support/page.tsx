
"use client";

import Link from "next/link"; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, MessageCircleQuestion, AlertTriangle, Mail, Cog, BookOpen, Share2, Bot, Palette, Brain, Mic, Users, Briefcase, DatabaseZap, Edit3, TestTubeDiagonal, Settings2, FilePlus, DollarSign, HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added AlertTitle
import { Logo } from "@/components/logo";


export default function PublicSupportPage() {
  const faqs = [
    {
      question: "I'm not technical at all. Can I really start an AI agency with AutoBoss?",
      answer: "Yes, 100%! AutoBoss is the world's first AI Agency Starter Kit built FOR non-technical founders. We handle the complex tech, so you can focus on helping clients. If you can use simple web tools, you can build and sell AI solutions with AutoBoss.",
      icon: HelpCircle,
    },
    {
      question: "How do I set up a new client in AutoBoss? Is it complicated?",
      answer: "It takes about 30 seconds! From your 'Client Dashboard' (after you sign up for free), click 'Add New Client.' Just type their name. Adding their website or a quick note is optional. Each client gets their own clean workspace for their AI agents.",
      icon: FilePlus,
    },
    {
      question: "Can one client have multiple different AI agents?",
      answer: "Absolutely! That's where you provide massive value. A local restaurant might need an AI Chatbot for website FAQs AND an AI Voice Agent for after-hours reservations. AutoBoss lets you build and manage all of these under a single client.",
      icon: Bot,
    },
    {
      question: "How does the AI learn about MY client's specific business details?",
      answer: "It's like giving the AI a crash course! In the 'Knowledge' section for each agent, you can upload your client's documents (PDFs, Word docs, even CSVs of products or service lists), or simply paste text. You can also add links to their website pages (like 'About Us' or 'Services'). AutoBoss processes this so the AI answers questions based on *their unique business*.",
      icon: DatabaseZap,
    },
     {
      question: "How do I make the AI agent match my client's brand voice and personality?",
      answer: "Easy! In the 'Personality' section for each agent, you describe your client's business and the 'vibe' they want (e.g., friendly & fun, or formal & professional). AutoBoss's AI then suggests a name, a detailed persona, and even a sample greeting. You can tweak these to perfectly match your client's brand. No generic bots here!",
      icon: Palette,
    },
    {
      question: "Okay, I built an AI agent. How do I actually give it to my client (and get paid)?",
      answer: "When your agent is ready, head to its 'Export' tab. For website chatbots, AutoBoss gives you a tiny snippet of code. You or your client just copy-paste it onto their website – it's that simple. For voice agents, we provide the info needed to connect with phone systems. Then, you bill your client for your setup service and any ongoing management/update packages you agree on!",
      icon: Share2,
    },
    {
        question: "'Knowledge-Based' vs. 'Persona-Driven' AI – What's the difference for a beginner?",
        answer: "'Knowledge-Based (RAG)' means the AI primarily uses the specific documents and website info YOU provide for that client. This is perfect for support bots or info agents that need to be factual about *your client's business*. 'Persona-Driven (Prompt)' lets the AI use its general intelligence more, guided by the personality and role you define. This is great for more creative chats or when you don't have a lot of specific client documents to upload.",
        icon: Brain
    },
    {
      question: "Help! My agent isn't answering correctly. What are the first things I should check?",
      answer: "No worries, it happens! Here's a quick checklist:\n1. **Knowledge Check:** Did you upload the *right* info for *that specific client*? Is the information clear and accurate? For 'Knowledge-Based' agents, this is crucial.\n2. **Personality Review:** Is the agent's defined 'Role' and 'Personality' clear and specific enough? This heavily influences how it responds.\n3. **Test with Simple Questions:** In the 'Test Agent' tab, start with very basic questions based on the knowledge you provided. Sometimes rephrasing your question helps the AI understand better.",
      icon: TestTubeDiagonal,
    },
    {
      question: "How do I actually make money offering these AI services to clients?",
      answer: "You find businesses struggling with common problems! Many are swamped with repetitive customer questions, miss leads because they're busy, or can't offer 24/7 support. You use AutoBoss to quickly build an AI agent that solves *their specific problem* (e.g., an AI FAQ bot, an AI lead capture agent for their website, an after-hours voice assistant). You charge them a setup fee for building and training the AI, and then can offer a monthly retainer for ongoing updates, support, and new features. AutoBoss is your 'done-for-you' toolkit to deliver these valuable services. Don't forget to check out our free 'Client Playbook' on the main site for more in-depth strategies!",
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
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/dashboard">Go to Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 sm:py-12 px-4 md:px-6 max-w-3xl">
        <Card className="mb-8 sm:mb-12 shadow-lg border-transparent bg-secondary">
          <CardHeader className="p-6 text-center">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-3">
                <LifeBuoy className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl sm:text-3xl md:text-4xl text-primary">
                AutoBoss Help & FAQ: Your Questions Answered
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
                New to AI or AutoBoss? Find simple answers here to get you started on your AI agency journey, fast.
            </CardDescription>
          </CardHeader>
        </Card>
        
        <Alert className="mb-6 sm:mb-8 bg-secondary">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary text-sm font-semibold">Your Quick-Start Guide!</AlertTitle>
            <AlertDescription className="text-muted-foreground text-xs sm:text-sm">
              AutoBoss makes starting an AI agency simple. These FAQs are designed to get you building for clients ASAP.
            </AlertDescription>
        </Alert>
          
        <section>
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-primary"><MessageCircleQuestion className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((faq, index) => (
                <Card key={index} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <AccordionItem value={`item-${index + 1}`} className="border-b-0">
                    <AccordionTrigger className="p-4 text-left hover:no-underline text-sm sm:text-base font-medium group bg-card hover:bg-muted/50 transition-colors">
                        {faq.icon && <faq.icon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:text-primary transition-colors shrink-0" />}
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

        <Card className="mt-8 sm:mt-12 p-6 text-center bg-secondary border-dashed">
            <h2 className="text-lg sm:text-xl font-semibold mb-2 flex items-center justify-center gap-2 text-primary"><Mail className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Still Stuck? We're Here to Help!</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Your success is our goal. If you have more questions or ideas, please reach out.
            </p>
            <Button variant="outline" className="text-xs sm:text-sm" asChild>
                <Link href="mailto:support@YOUR_AUTOBOSS_DOMAIN.com?subject=AutoBoss%20AI%20Agency%20Help">Email Our Support Team</Link>
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
