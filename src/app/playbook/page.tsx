
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Lightbulb, Users, Briefcase, MessageCircle, Presentation, CheckCircle, ArrowRight, Sparkles, Handshake, BookOpen } from "lucide-react";

export default function PlaybookPage() {
  const playbookSections = [
    {
      id: "niche",
      icon: <Users className="w-5 h-5 text-foreground/70" />,
      title: "1. Finding Your First Client: The 'Easy Wins' Method",
      content: (
        <div className="space-y-3 text-sm text-foreground/80">
          <p>No need to go after big companies right away. Your first clients are often businesses you know, or ones that need a quick AI helper. Think:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Local businesses swamped with the same questions over and over (restaurants, salons, repair shops).</li>
            <li>Service pros losing leads when they're off duty (plumbers, consultants, coaches).</li>
            <li>Online stores needing 24/7 basic FAQ help.</li>
          </ul>
          <p className="font-semibold text-foreground">Easy Questions to Find AI Needs (Ask any small business owner):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>"If you had a magic helper, what's the #1 task you'd give it that you do over and over?"</li>
            <li>"About how many customer questions do you answer each day that are pretty much the same?"</li>
            <li>"Ever worry you're missing out on business because you can't reply to every website visitor right away?"</li>
          </ul>
          <Alert variant="default" className="bg-card">
            <Lightbulb className="h-4 w-4 text-foreground/70" />
            <AlertTitle className="text-foreground text-sm font-medium">Your Action Idea: The 30-Minute Client Finder</AlertTitle>
            <AlertDescription className="text-foreground/80 text-xs">
              List 3 local businesses you know. What one simple AI task from AutoBoss (like an FAQ bot) could truly help *them*? You might be surprised by what you find.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "offer",
      icon: <Briefcase className="w-5 h-5 text-foreground/70" />,
      title: "2. Your 'Can't Say No' AI Offer (Foot-in-the-Door)",
      content: (
        <div className="space-y-3 text-sm text-foreground/80">
          <p>Don't sell 'AI'. Sell the *result*. For your first clients, offer a simple, high-value <span className="font-semibold text-foreground">"AI Quick-Win Package."</span></p>
          <p>What it includes (and what it does for them):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li><strong>One Custom AI Chatbot:</strong> ("Answers common questions on their website, 24/7, so they don't have to.")</li>
            <li><strong>AI Training on Their Business Info:</strong> ("We'll teach the AI about *their* specific services, products, and FAQs.")</li>
            <li><strong>Simple Website Setup:</strong> ("Adds to their site with a copy-paste. No tech headaches for them.")</li>
          </ul>
          <p className="font-semibold text-foreground">Pricing That Gets a 'Yes' (for your first 1-3 clients):</p>
          <p>A one-time setup fee (maybe $299 - $599) feels safer to them than a monthly bill at first. Show it as something that saves them X hours or gets Y more leads. Once they see it work, then you can talk about monthly support.</p>
           <Alert variant="default" className="bg-card">
            <Sparkles className="h-4 w-4 text-foreground/70" />
            <AlertTitle className="text-foreground text-sm font-medium">The "Aha!" Moment is Key</AlertTitle>
            <AlertDescription className="text-foreground/80 text-xs">
              You're not just selling tech. You're selling relief from a headache (too many questions, lost leads). Make *that* the focus.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "outreach",
      icon: <MessageCircle className="w-5 h-5 text-foreground/70" />,
      title: "3. Reaching Out: The 'Helpful AI Idea' Message",
      content: (
        <div className="space-y-3 text-sm text-foreground/80">
          <p>Your first message isn't a sales pitch. It's a friendly, "Hey, I thought of something that could help your business."</p>
          <p className="font-semibold text-foreground">Super Simple Email/LinkedIn Template:</p>
          <Card className="p-3 bg-card/50 text-xs">
            <p>Subject: A quick idea for [Their Business Name] + AI</p>
            <br />
            <p>Hi [Business Owner Name],</p>
            <p>I was looking at your website and had a thought. Many businesses like yours are saving hours each week using a simple AI helper for common customer questions. </p>
            <p>I use a tool called AutoBoss that makes this easy to set up, even if you're not a tech whiz. </p>
            <p>Would you be open to a super quick 10-min chat next week? I can show you how it might work for [Their Business Name] – no pressure, just an idea I thought you'd find interesting.</p>
            <br />
            <p>Best,</p>
            <p>[Your Name]</p>
          </Card>
          <Alert variant="default" className="bg-card">
            <Lightbulb className="h-4 w-4 text-foreground/70" />
            <AlertTitle className="text-foreground text-sm font-medium">Your Goal: Spark Curiosity, Not a Sale (Yet!)</AlertTitle>
            <AlertDescription className="text-foreground/80 text-xs">
              Send this (make it personal!) to 3 businesses from your "Easy Wins" list. The aim is just to get them curious enough for a quick chat.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "demo",
      icon: <Presentation className="w-5 h-5 text-foreground/70" />,
      title: "4. The 10-Minute 'Wow' Demo (AutoBoss Makes This Easy)",
      content: (
        <div className="space-y-3 text-sm text-foreground/80">
          <p>This is your secret trick. Before your chat:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li><strong>5 Mins Prep:</strong> Visit their site. Copy a few sentences from their "About Us" or "Services" page.</li>
            <li><strong>2 Mins in AutoBoss:</strong> Make a new agent FOR THEM. In "Knowledge," paste their text. Click "Train."</li>
            <li><strong>3 Mins Test:</strong> Ask their new AI questions like "What do you offer?" or "Tell me about [Their Business Name]."</li>
          </ul>
          <p className="font-semibold text-foreground">During your 10-15 minute chat (The "Is it really this simple?" Moment):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Quickly mention the benefit: "Imagine this on your site, instantly handling visitor questions..."</li>
            <li>Share your screen: Show them the AutoBoss test chat. Let *them* ask *their AI* questions about *their business*.</li>
          </ul>
          <p>Seeing their own business info used by an AI they didn't know existed 10 minutes ago? That's a game-changer.</p>
          <Alert variant="default" className="bg-card">
            <Sparkles className="h-4 w-4 text-foreground/70" />
            <AlertTitle className="text-foreground text-sm font-medium">The "Personalized Proof" Magic</AlertTitle>
            <AlertDescription className="text-foreground/80 text-xs">
              A live demo, even a basic one, using *their* business info, beats any generic presentation. AutoBoss helps you do this fast.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "closing",
      icon: <Handshake className="w-5 h-5 text-foreground/70" />,
      title: "5. From 'Wow' to 'Yes': The Simple Close",
      content: (
        <div className="space-y-3 text-sm text-foreground/80">
          <p>If they're impressed, keep it simple. Make saying "yes" easy for them.</p>
          <p className="font-semibold text-foreground">Your "Let's Do This" Agreement (Simple Email Follow-Up):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li><strong>The Goal:</strong> One AI Chatbot for their website.</li>
            <li><strong>Their Part:</strong> Give you key info (FAQs, product details, etc. - you'll help them with this).</li>
            <li><strong>Your Part:</strong> Build, train, and give them the easy embed code.</li>
            <li><strong>The Investment:</strong> Your one-time setup fee (e.g., "$399 to get this live and saving you time").</li>
          </ul>
          <p className="font-semibold text-foreground">Client Info Checklist (What you need to get started with AutoBoss):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Their website link.</li>
            <li>Any FAQ docs/pages they have.</li>
            <li>List of their main services/products.</li>
            <li>What kind of 'voice' they want for the bot (friendly, formal, etc.).</li>
          </ul>
          <p>With this, you can deliver value quickly. Your first client is closer than you think!</p>
          <Alert variant="default" className="bg-card border-foreground">
            <CheckCircle className="h-4 w-4 text-foreground/70" />
            <AlertTitle className="text-foreground text-sm font-medium">Your AI Agency Journey Starts Now!</AlertTitle>
            <AlertDescription className="text-foreground/80 text-xs">
              Each client builds your confidence and your business. AutoBoss is here to make AI easy and profitable for you.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-7 w-auto" />
          </Link>
          <Button asChild variant="outline" size="sm" className="text-xs">
            <Link href="/dashboard">Go to Your Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 sm:py-12 px-4 md:px-6 max-w-3xl">
        <Card className="mb-8 sm:mb-12 border-border/50">
          <CardHeader className="p-6 text-center">
            <div className="inline-block p-3 bg-foreground/5 rounded-full mb-3">
              <BookOpen className="w-8 h-8 text-foreground" />
            </div>
            <CardTitle className="font-headline text-2xl sm:text-3xl md:text-4xl text-foreground">
              Your Simple Guide to AI Agency Clients
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-foreground/80 mt-2 max-w-xl mx-auto">
              A step-by-step plan to land your first paying AI clients using AutoBoss – even if you're new to AI!
            </CardDescription>
          </CardHeader>
        </Card>

        <Accordion type="single" collapsible defaultValue="niche" className="w-full space-y-4">
          {playbookSections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <AccordionItem value={section.id} className="border-b-0">
                <AccordionTrigger className="p-4 sm:p-5 text-left hover:no-underline text-base sm:text-lg font-semibold group bg-card hover:bg-foreground/5 transition-colors">
                  <div className="flex items-center gap-3">
                    {section.icon}
                    <span className="text-foreground">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 sm:p-5 bg-card border-t border-border">
                  {section.content}
                </AccordionContent>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>

        <Card className="mt-8 sm:mt-12 text-center p-6 bg-card border-border/50 border-dashed">
            <CardTitle className="text-lg sm:text-xl font-semibold mb-2">Ready to Turn This Plan into Profit?</CardTitle>
            <CardDescription className="text-sm text-foreground/80 mb-4">
                Use these ideas with the AutoBoss platform to start building real AI solutions for businesses today.
            </CardDescription>
            <Button asChild className="font-semibold shadow-md hover:opacity-90 transition-opacity text-sm">
                <Link href="/dashboard">Open Your AutoBoss Toolkit <ArrowRight className="ml-2 h-4 w-4"/></Link>
            </Button>
        </Card>
      </main>

      <footer className="py-6 text-center border-t border-border">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-foreground/80">
          <Link href="/" className="flex items-center gap-1.5">
            <Logo className="h-5 w-auto" collapsed={true} />
            <span>&copy; {new Date().getFullYear()} AutoBoss</span>
          </Link>
          <nav className="flex gap-3">
            <Link href="/support" className="hover:text-foreground">Support</Link>
            <Link href="/#early-access" className="hover:text-foreground">Early Adopter Program</Link>
            <Link href="/templates" className="hover:text-foreground">AI Templates</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
