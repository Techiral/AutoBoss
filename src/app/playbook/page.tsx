
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Lightbulb, Users, Briefcase, MessageCircle, Presentation, CheckCircle, ArrowRight, Sparkles, Handshake, BookOpen } from "lucide-react"; // Added BookOpen

export default function PlaybookPage() {
  const playbookSections = [
    {
      id: "niche",
      icon: <Users className="w-5 h-5 text-primary" />,
      title: "1. Your First Client? The 'Hidden Market' Strategy",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Forget chasing massive corporations. Your first win often lies with businesses you already know, or who desperately need a simple AI fix. Think:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Local businesses drowning in repetitive questions (restaurants, salons, repair shops).</li>
            <li>Service providers missing leads after hours (plumbers, consultants, coaches).</li>
            <li>Online stores needing 24/7 basic FAQ support.</li>
          </ul>
          <p className="font-semibold">Quick Questions to Uncover AI Opportunities (Ask any small business owner):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>"If you had a magic assistant, what's the #1 repetitive task you'd give it?"</li>
            <li>"How many customer questions do you answer daily that are basically the same?"</li>
            <li>"Ever worry you're losing business because you can't respond instantly to every website visitor?"</li>
          </ul>
          <Alert variant="default" className="bg-accent/10 dark:bg-accent/20 border-accent/30">
            <Lightbulb className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent text-sm font-medium">Your Action Idea: The 30-Minute Client Finder</AlertTitle>
            <AlertDescription className="text-accent/80 dark:text-accent/90 text-xs">
              List 3 local businesses you know. What one simple AI task from AutoBoss (like an FAQ bot) could genuinely help *them*? The answer might surprise you.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "offer",
      icon: <Briefcase className="w-5 h-5 text-primary" />,
      title: "2. Your Irresistible 'Foot-in-the-Door' AI Offer",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Don't sell 'AI'. Sell the *result*. For your first clients, offer a simple, high-value <span className="font-semibold text-foreground">"AI Quick-Win Package."</span></p>
          <p>What it includes (and what it does for them):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li><strong>One Custom AI Chatbot:</strong> ("Handles common questions on their website, 24/7, so they don't have to.")</li>
            <li><strong>AI Training on Their Business Info:</strong> ("We'll teach the AI about *their* specific services, products, and FAQs.")</li>
            <li><strong>Simple Website Integration:</strong> ("Adds to their site with a copy-paste. No tech headaches for them.")</li>
          </ul>
          <p className="font-semibold">Pricing That Gets a 'Yes' (for your first 1-3 clients):</p>
          <p>A one-time setup fee (e.g., $299 - $599) is less scary than a monthly cost. Frame it as an investment that saves them X hours or captures Y more leads. Once they see it work, then talk monthly support.</p>
           <Alert variant="default" className="bg-accent/10 dark:bg-accent/20 border-accent/30">
            <Sparkles className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent text-sm font-medium">The "Aha!" Moment is Key</AlertTitle>
            <AlertDescription className="text-accent/80 dark:text-accent/90 text-xs">
              You're not just selling tech. You're selling relief from a pain point (too many questions, lost leads). Make *that* the focus.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "outreach",
      icon: <MessageCircle className="w-5 h-5 text-primary" />,
      title: "3. First Contact: The 'No-Pressure AI Idea' Message",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Your first message isn't a sales pitch. It's a friendly, "Hey, I had an idea that might help *you*."</p>
          <p className="font-semibold">Ultra-Simple Email/LinkedIn Template:</p>
          <Card className="p-3 bg-muted/50 text-xs">
            <p>Subject: A quick thought for [Their Business Name] + AI</p>
            <br />
            <p>Hi [Business Owner Name],</p>
            <p>I was on your website and a thought struck me. Many businesses like yours are saving hours each week by using a simple AI assistant to handle common customer questions automatically. </p>
            <p>I use a tool called AutoBoss that makes setting this up surprisingly straightforward, even for non-techy folks. </p>
            <p>Would you be open to a super quick 10-min virtual coffee next week? I can show you how it might work for [Their Business Name] – no strings attached, just an idea I thought you'd find interesting.</p>
            <br />
            <p>Best,</p>
            <p>[Your Name]</p>
          </Card>
          <Alert variant="default" className="bg-accent/10 dark:bg-accent/20 border-accent/30">
            <Lightbulb className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent text-sm font-medium">Your Goal: Curiosity, Not a Sale (Yet!)</AlertTitle>
            <AlertDescription className="text-accent/80 dark:text-accent/90 text-xs">
              Send this (personalized!) to 3 businesses from your "Hidden Market" list. The aim is just to get them curious enough for a quick chat.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "demo",
      icon: <Presentation className="w-5 h-5 text-primary" />,
      title: "4. The 10-Minute 'Wow' Demo (AutoBoss Makes This Easy)",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>This is your secret weapon. Before your chat:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li><strong>5 Mins Prep:</strong> Visit their site. Grab a few sentences from their "About Us" or "Services" page.</li>
            <li><strong>2 Mins in AutoBoss:</strong> Create a new agent FOR THEM. In "Knowledge," paste their text. Click "Train."</li>
            <li><strong>3 Mins Test:</strong> Ask their new AI questions like "What services do you offer?" or "Tell me about [Their Business Name]."</li>
          </ul>
          <p className="font-semibold">During your 10-15 minute chat (The "Can This Really Be So Simple?" Moment):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Quickly state the benefit: "Imagine this on your site, instantly handling visitor questions..."</li>
            <li>Share your screen: Show them the AutoBoss test chat. Let *them* ask *their AI* questions about *their business*.</li>
          </ul>
          <p>Seeing their own information used by an AI they didn't know existed 10 minutes ago? That's powerful.</p>
          <Alert variant="default" className="bg-accent/10 dark:bg-accent/20 border-accent/30">
            <Sparkles className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent text-sm font-medium">The "Personalized Proof" Principle</AlertTitle>
            <AlertDescription className="text-accent/80 dark:text-accent/90 text-xs">
              A live demo, however basic, using *their* business info, beats a thousand generic presentations. AutoBoss enables this rapid personalization.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "closing",
      icon: <Handshake className="w-5 h-5 text-primary" />,
      title: "5. From 'Wow' to 'Yes': The Simple Close",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>If they're impressed, don't overcomplicate it. Make saying "yes" the easiest thing they do all day.</p>
          <p className="font-semibold">Your "Let's Do This" Agreement (Simple Email Follow-Up):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li><strong>The Goal:</strong> One AI Chatbot for their website.</li>
            <li><strong>Their Part:</strong> Provide key info (FAQs, product details, etc. - you'll guide them).</li>
            <li><strong>Your Part:</strong> Build, train, and give them the easy embed code.</li>
            <li><strong>The Investment:</strong> Your one-time setup fee (e.g., "$399 to get this live and saving you time").</li>
          </ul>
          <p className="font-semibold">Client Info Checklist (What you need to get started with AutoBoss):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Their website link.</li>
            <li>Any existing FAQ docs/pages.</li>
            <li>Main services/products list.</li>
            <li>Preferred bot tone (friendly, formal, etc.).</li>
          </ul>
          <p>With this, AutoBoss empowers you to deliver quickly. Your first client is closer than you think!</p>
          <Alert variant="default" className="bg-green-500/10 dark:bg-green-500/20 border-green-500/30">
            <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
            <AlertTitle className="text-green-700 dark:text-green-400 text-sm font-medium">Your AI Agency Journey Begins!</AlertTitle>
            <AlertDescription className="text-green-600/80 dark:text-green-300/80 text-xs">
              Each client builds your confidence and portfolio. AutoBoss is your partner in making AI accessible and profitable for you.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-7 w-auto" />
          </Link>
          <Button asChild variant="outline" size="sm" className="btn-outline-themed transition-colors btn-interactive text-xs">
            <Link href="/dashboard">Go to Your Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 sm:py-12 px-4 md:px-6 max-w-3xl">
        <Card className="mb-8 sm:mb-12 shadow-lg border-transparent bg-gradient-to-br from-card via-card to-muted/30">
          <CardHeader className="p-6 text-center">
            <div className="inline-block p-3 bg-primary/10 rounded-full mb-3">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className={cn("font-headline text-2xl sm:text-3xl md:text-4xl", "text-gradient-dynamic")}>
              The Non-Technical Founder's AI Agency Playbook
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
              Your step-by-step guide to landing your first paying AI clients using AutoBoss – even if you're new to AI!
            </CardDescription>
          </CardHeader>
        </Card>

        <Accordion type="single" collapsible defaultValue="niche" className="w-full space-y-4">
          {playbookSections.map((section) => (
            <Card key={section.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <AccordionItem value={section.id} className="border-b-0">
                <AccordionTrigger className="p-4 sm:p-5 text-left hover:no-underline text-base sm:text-lg font-semibold group bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {section.icon}
                    <span>{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 sm:p-5 bg-card border-t border-border/50">
                  {section.content}
                </AccordionContent>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>

        <Card className="mt-8 sm:mt-12 text-center p-6 bg-muted/30 border-dashed">
            <CardTitle className="text-lg sm:text-xl font-semibold mb-2">Ready to Turn This Playbook into Profit?</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mb-4">
                Combine these strategies with the AutoBoss platform to start building valuable AI solutions for businesses today.
            </CardDescription>
            <Button asChild className={cn("btn-gradient-primary font-semibold shadow-md hover:opacity-90 transition-opacity btn-interactive text-sm")}>
                <Link href="/dashboard">Access Your AutoBoss Toolkit <ArrowRight className="ml-2 h-4 w-4"/></Link>
            </Button>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-border/60">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <Link href="/" className="flex items-center gap-1.5">
            <Logo className="h-5 w-auto" collapsed={true} />
            <span>&copy; {new Date().getFullYear()} AutoBoss</span>
          </Link>
          <nav className="flex gap-3">
            <Link href="/support" className="hover:text-primary">Support</Link>
            <Link href="/#early-access" className="hover:text-primary">Early Adopter Program</Link>
            <Link href="/templates" className="hover:text-primary">AI Templates</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

