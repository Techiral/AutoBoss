
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Lightbulb, Users, Briefcase, MessageCircle, PresentationChartLine as Presentation, CheckCircle, ArrowRight, Sparkles, Handshake } from "lucide-react"; // Changed Presentation icon

export default function PlaybookPage() {
  const playbookSections = [
    {
      id: "niche",
      icon: <Users className="w-5 h-5 text-primary" />,
      title: "1. Find Your First Client Niche",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Don't try to sell to everyone at first. Focus! Think about businesses that:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Get many common questions (e.g., local services, e-commerce stores with FAQs).</li>
            <li>Could use help capturing leads after hours (e.g., contractors, consultants).</li>
            <li>You understand or have a connection to. Your local community is often a great place to start.</li>
          </ul>
          <p className="font-semibold">Quick Questions to Uncover Needs (Ask a potential client):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>"What are the top 3-5 questions your customers ask most often?"</li>
            <li>"About how much time do you or your team spend answering these common questions each week?"</li>
            <li>"Do you ever feel you miss potential customer inquiries because you're busy or it's after business hours?"</li>
          </ul>
          <Alert variant="default" className="bg-accent/10 dark:bg-accent/20 border-accent/30">
            <Lightbulb className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent text-sm font-medium">Your Action Idea</AlertTitle>
            <AlertDescription className="text-accent/80 dark:text-accent/90 text-xs">
              Jot down 5 types of local businesses. What's one simple AI task AutoBoss could help them with? (e.g., an FAQ bot for a restaurant, a lead-capture helper for a plumber).
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "offer",
      icon: <Briefcase className="w-5 h-5 text-primary" />,
      title: "2. Craft Your Simple AI Offer",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>For your first clients, keep your offer clear and focused on solving one specific problem. You could call it your <span className="font-semibold text-foreground">"Starter AI Assistant Package."</span></p>
          <p>Here’s what it could include:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Setup of one AI Chatbot for their website.</li>
            <li>Training the AI on their specific business information (you'll guide them on what to provide).</li>
            <li>Simple deployment to their website (AutoBoss provides an easy embed code).</li>
          </ul>
          <p className="font-semibold">A Simple Pricing Idea (for your first few clients):</p>
          <p>Consider a one-time setup fee (e.g., $199 - $499) to get them started. This is often easier for a small business to say "yes" to than a monthly subscription right away. Once they see the value, you can discuss ongoing support or updates for a monthly retainer.</p>
           <Alert variant="default" className="bg-accent/10 dark:bg-accent/20 border-accent/30">
            <Sparkles className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent text-sm font-medium">Focus on Their Benefit</AlertTitle>
            <AlertDescription className="text-accent/80 dark:text-accent/90 text-xs">
              You're not just selling an "AI bot." You're selling them time savings, better customer service, or more leads captured. Always explain it in terms of what *they* gain.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "outreach",
      icon: <MessageCircle className="w-5 h-5 text-primary" />,
      title: "3. Your First Outreach (Keep it Friendly & Brief)",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Your initial message should be short, friendly, and to the point. Focus on one problem you can help them solve.</p>
          <p className="font-semibold">Simple Email/LinkedIn Message Idea:</p>
          <Card className="p-3 bg-muted/50 text-xs">
            <p>Subject: A quick idea for [Their Business Name]</p>
            <br />
            <p>Hi [Business Owner Name],</p>
            <p>I was thinking about [Their Business Name] and had an idea. Could an AI assistant on your website that instantly answers common customer questions 24/7 help save your team time (or capture more leads)?</p>
            <p>I help businesses like yours set these up using a simple platform called AutoBoss. It's surprisingly quick.</p>
            <p>Would you be open to a brief 10-15 minute chat sometime next week to see if this is something that could help you? No pressure at all, just a thought.</p>
            <br />
            <p>Best regards,</p>
            <p>[Your Name]</p>
            {/* <p>[Your (Future) AI Agency Name - optional for now]</p> */}
          </Card>
          <Alert variant="default" className="bg-accent/10 dark:bg-accent/20 border-accent/30">
            <Lightbulb className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent text-sm font-medium">Your Action Idea</AlertTitle>
            <AlertDescription className="text-accent/80 dark:text-accent/90 text-xs">
              Personalize this message and send it to 3 businesses from your list today! The key is to start the conversation.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "demo",
      icon: <Presentation className="w-5 h-5 text-primary" />,
      title: "4. The 'Wow' Demo (Show, Don't Just Tell)",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>This is where AutoBoss really helps you. Before your chat with a potential client:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Visit their website. Copy some text from their "About Us," "Services," or "FAQ" page.</li>
            <li>In AutoBoss, quickly create a new (temporary) agent for them.</li>
            <li>In the "Knowledge" section, paste the text you copied. Let AutoBoss train the agent (it's fast!).</li>
            <li>Test it yourself in AutoBoss: Ask questions like "What services do you offer?" or "What are your business hours?" based on the info you gave it.</li>
          </ul>
          <p className="font-semibold">During your 15-minute chat:</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Briefly explain the benefit (e.g., "Imagine this on your site, instantly answering questions from your visitors...").</li>
            <li>Share your screen and show them the AutoBoss test chat window with the agent you just made FOR THEM. Let them ask it questions about THEIR business.</li>
          </ul>
          <p>This personalized, quick demo is very effective. They see it working with *their* information almost immediately, which builds interest and trust.</p>
          <Alert variant="default" className="bg-accent/10 dark:bg-accent/20 border-accent/30">
            <Sparkles className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent text-sm font-medium">The Power of Personalization</AlertTitle>
            <AlertDescription className="text-accent/80 dark:text-accent/90 text-xs">
              A live, even basic, demo using their own business information is far more convincing than any generic sales pitch.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: "closing",
      icon: <Handshake className="w-5 h-5 text-primary" />, // Changed icon
      title: "5. Next Steps & Agreement (Keep it Simple)",
      content: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>If they're interested after the demo, make it easy for them to say "yes."</p>
          <p className="font-semibold">Key Things to Agree On (can be a simple email summary):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>You'll set up one AI chatbot for their website.</li>
            <li>They'll provide you with the key information for training (FAQs, product details, policy documents, etc.).</li>
            <li>You'll train the AI agent and give them the simple code to add it to their website.</li>
            <li>Confirm your one-time setup fee.</li>
          </ul>
          <p className="font-semibold">Information You'll Need From Your Client (A Quick Checklist):</p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Link to their current website.</li>
            <li>Any existing FAQ documents or pages.</li>
            <li>A list of their main services or products.</li>
            <li>A general idea of the tone they prefer for the bot (e.g., friendly and casual, or more formal and professional).</li>
          </ul>
          <p>Once you have an agreement and their information, you can use AutoBoss to build and deliver their AI solution!</p>
          <Alert variant="default" className="bg-green-500/10 dark:bg-green-500/20 border-green-500/30">
            <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
            <AlertTitle className="text-green-700 dark:text-green-400 text-sm font-medium">You're Doing Great!</AlertTitle>
            <AlertDescription className="text-green-600/80 dark:text-green-300/80 text-xs">
              Landing your first client is a huge step. Each one will build your confidence and experience. AutoBoss is here to support your journey.
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
              <Lightbulb className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className={cn("font-headline text-2xl sm:text-3xl md:text-4xl", "text-gradient-dynamic")}>
              Your AI Agency Playbook
            </CardTitle>
            <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
              Simple, actionable steps to help you find, connect with, and onboard your first paying clients using AutoBoss. Let's build your AI agency!
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
            <CardTitle className="text-lg sm:text-xl font-semibold mb-2">Ready to Start Building?</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mb-4">
                Use these ideas and the AutoBoss platform to create valuable AI solutions for businesses.
            </CardDescription>
            <Button asChild className={cn("btn-gradient-primary font-semibold shadow-md hover:opacity-90 transition-opacity btn-interactive text-sm")}>
                <Link href="/dashboard">Go to Your AutoBoss Dashboard <ArrowRight className="ml-2 h-4 w-4"/></Link>
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
          </nav>
        </div>
      </footer>
    </div>
  );
}
