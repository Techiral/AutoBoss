
import { Button } from "@/components/ui/button";
import { ArrowRight, BotMessageSquare, Cog, MessageSquare, BookOpen, Share2, Bot } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <BotMessageSquare className="h-6 w-6 text-primary" />
          <span className="ml-2 font-headline text-xl font-semibold">AgentVerse</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
            Pricing
          </Link>
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
            Login
          </Link>
          <Button asChild>
            <Link href="/dashboard">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Build, Deploy, and Manage AI Agents Effortlessly
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    AgentVerse provides a comprehensive platform to create intelligent conversational AI agents for any purpose.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/dashboard">
                      Start Building Your Agent
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#features">
                      Learn More
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="Hero AI"
                data-ai-hint="abstract technology"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-2xl"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Key Features</div>
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need for Advanced AI Agents
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From visual flow design to knowledge base integration, AgentVerse empowers you with cutting-edge tools.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              {[
                { title: "Agent Configuration", description: "Define roles, personality, and knowledge for your AI agents using generative AI.", icon: <Bot className="h-8 w-8 text-primary" /> },
                { title: "Visual Agent Studio", description: "Design conversation flows, manage knowledge, and test agents in a web-based UI.", icon: <Cog className="h-8 w-8 text-primary" /> },
                { title: "NLU & Orchestration", description: "Leverage Gemini for intent recognition and autonomous conversation reasoning.", icon: <MessageSquare className="h-8 w-8 text-primary" /> },
                { title: "Knowledge Management", description: "Upload documents and extract relevant information using AI-powered vector search.", icon: <BookOpen className="h-8 w-8 text-primary" /> },
                { title: "Easy Export", description: "Get embeddable chat widgets, API endpoints, and chatbot links with a few clicks.", icon: <Share2 className="h-8 w-8 text-primary" /> },
                { title: "Seamless Integration", description: "Connect your AI agents with external systems via secure webhooks.", icon: <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M18 8L22 12L18 16"/><path d="M2 12H22"/><path d="M6 8L2 12L6 16"/></svg> },
              ].map(feature => (
                <div key={feature.title} className="grid gap-1 p-6 rounded-lg border bg-background shadow-md hover:shadow-xl transition-shadow">
                  <div className="mb-2">{feature.icon}</div>
                  <h3 className="font-headline text-xl font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Simple, Transparent Pricing
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Choose the plan that's right for you. Get started for free.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              {/* Placeholder for pricing tiers */}
              <div className="p-6 rounded-lg border bg-card shadow-md">
                <h3 className="font-headline text-2xl font-bold mb-2">Free Tier</h3>
                <p className="text-muted-foreground mb-4">Perfect for getting started and personal projects.</p>
                <Button size="lg" className="w-full" asChild>
                  <Link href="/dashboard">
                    Start Free
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} AgentVerse. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:text-primary transition-colors" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:text-primary transition-colors" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
