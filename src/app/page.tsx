
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Share2, Cog, Rocket, Eye, Palette, BarChart3, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo"; 

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header: Assumed to be part of a layout, or can be added here if needed */}
      <header className="w-full px-4 lg:px-6 h-20 flex items-center border-b sticky top-0 z-50 bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center justify-center" aria-label="AutoBoss Homepage">
            <Logo collapsed={false} />
          </Link>
          <nav className="flex gap-4 sm:gap-6 items-center">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
              Features
            </Link>
            <Link href="#contact" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
              Contact
            </Link>
            <Button variant="outline" size="sm" asChild>
                <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild className="shadow-md hover:shadow-primary/40 transition-shadow">
              <Link href="/dashboard">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-40 xl:py-48 text-center">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl space-y-6">
              <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-teal-400">
                AutoBoss: AI Agents, Reimagined.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Build, deploy, and orchestrate intelligent AI assistants that automate workflows, elevate customer experiences, and accelerate your business growth. Effortlessly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105">
                  <Link href="/dashboard">
                    Start Building Free
                    <Rocket className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="transition-all duration-300 hover:scale-105 hover:border-accent hover:text-accent">
                  <Link href="#features">
                    Explore Features
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Wow Factors / Key Benefits Section */}
        <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-card text-center">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl space-y-4 mb-12">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground font-semibold">
                The AutoBoss Advantage
              </div>
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Unlock Next-Level Automation
              </h2>
              <p className="text-muted-foreground md:text-lg">
                Go beyond basic chatbots. Create sophisticated AI agents that truly understand, reason, and act.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { title: "Visual Flow Mastery", description: "Design complex AI logic with an intuitive drag & drop studio. No code barriers.", icon: <Cog className="h-10 w-10 text-primary group-hover:text-accent transition-colors" />, dataAiHint: "abstract flow dark" },
                { title: "Instant Persona AI", description: "Craft unique, engaging agent personalities and greetings with a single click.", icon: <Palette className="h-10 w-10 text-primary group-hover:text-accent transition-colors" />, dataAiHint: "ai character dark" },
                { title: "Dynamic Knowledge Brain", description: "Turn documents & websites into a smart, searchable knowledge base for your agents.", icon: <Brain className="h-10 w-10 text-primary group-hover:text-accent transition-colors" />, dataAiHint: "digital brain dark" },
                { title: "Autonomous Reasoning", description: "Agents that think, adapt, and solve problems independently using advanced NLU.", icon: <Zap className="h-10 w-10 text-primary group-hover:text-accent transition-colors" />, dataAiHint: "ai decision dark" },
                { title: "Effortless Deployment", description: "Embed widgets, use APIs, or share direct links. Integrate anywhere, instantly.", icon: <Share2 className="h-10 w-10 text-primary group-hover:text-accent transition-colors" />, dataAiHint: "network connections dark" },
                { title: "Developer Centric", description: "Powerful APIs and flexible tools for custom integrations and advanced use-cases.", icon: <BarChart3 className="h-10 w-10 text-primary group-hover:text-accent transition-colors" />, dataAiHint: "code interface dark" },
              ].map(feature => (
                <div key={feature.title} className="group flex flex-col items-center gap-4 p-6 rounded-xl border bg-background shadow-lg hover:shadow-xl hover:border-primary/70 transition-all duration-300 transform hover:-translate-y-2">
                  <div className="p-3 rounded-full bg-primary/10 mb-2 group-hover:bg-accent/10 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="font-headline text-xl font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground flex-grow">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works (Simplified) */}
        <section id="how-it-works" className="w-full py-16 md:py-24 lg:py-32 text-center">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl space-y-4 mb-12">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground font-semibold">
                    Simple & Powerful
                </div>
                <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                    Go Live in 3 Simple Steps
                </h2>
            </div>
            <div className="relative mx-auto max-w-5xl grid md:grid-cols-3 gap-10 items-start">
                {/* Connecting lines (conceptual, using borders for simplicity) */}
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2">
                    <div className="h-full w-1/3 float-left border-t-2 border-dashed border-primary/50"></div>
                    <div className="h-full w-1/3 float-left"></div> {/* Gap */}
                    <div className="h-full w-1/3 float-left border-t-2 border-dashed border-primary/50"></div>
                </div>

                {[
                    { number: "01", title: "Define", description: "Visually design flows & craft agent personality.", icon: <Palette className="w-8 h-8 text-accent"/>, dataAiHint: "ui design dark" },
                    { number: "02", title: "Enrich", description: "Upload docs or URLs to build a smart knowledge core.", icon: <Brain className="w-8 h-8 text-accent"/>, dataAiHint: "data processing dark" },
                    { number: "03", title: "Deploy", description: "Integrate via widget, API, or direct link.", icon: <Rocket className="w-8 h-8 text-accent"/>, dataAiHint: "launch sequence dark" },
                ].map((step, index) => (
                <div key={step.title} className="relative flex flex-col items-center gap-3 p-6 rounded-lg bg-card shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:scale-105">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold w-10 h-10 rounded-full flex items-center justify-center border-4 border-background">{step.number}</div>
                    <div className="mt-8 mb-2">{step.icon}</div>
                    <h3 className="font-headline text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                ))}
            </div>
          </div>
        </section>
        
        {/* Social Proof (Conceptual) */}
        <section className="w-full py-16 md:py-24 lg:py-32 bg-card text-center">
            <div className="container px-4 md:px-6">
                <h2 className="font-headline text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl text-muted-foreground/80">
                    Trusted by Innovators & Builders Like You
                </h2>
                <p className="mt-4 text-muted-foreground mx-auto max-w-xl">
                    Join a growing community leveraging AutoBoss to create exceptional AI-powered experiences.
                    (Actual logos or testimonials would go here)
                </p>
                <div className="mt-8 flex justify-center items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-300">
                    <Zap className="w-12 h-12 text-muted-foreground" />
                    <Eye className="w-12 h-12 text-muted-foreground" />
                    <ShieldCheck className="w-12 h-12 text-muted-foreground" />
                    <BarChart3 className="w-12 h-12 text-muted-foreground" />
                </div>
            </div>
        </section>

        {/* Final CTA Section */}
        <section id="contact" className="w-full py-20 md:py-28 lg:py-32 text-center bg-gradient-to-t from-background to-card">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-2xl space-y-6">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Ready to Revolutionize Your Interactions?
              </h2>
              <p className="text-muted-foreground md:text-lg">
                Experience the future of automation. Start building your first intelligent agent with AutoBoss today—it's free to get started.
              </p>
              <Button size="lg" asChild className="shadow-xl hover:shadow-primary/60 transition-all duration-300 hover:scale-105 text-lg px-10 py-7">
                <Link href="/dashboard">
                  Create Your Free Agent Now
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-8 border-t bg-background text-center">
        <div className="container px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} AutoBoss AI. All rights reserved.</p>
          <nav className="flex gap-4 sm:gap-6 mt-4 sm:mt-0">
            <Link href="#" className="text-xs hover:text-primary transition-colors" prefetch={false}>
              Terms
            </Link>
            <Link href="#" className="text-xs hover:text-primary transition-colors" prefetch={false}>
              Privacy
            </Link>
            <Link href="mailto:support@autoboss.dev" className="text-xs hover:text-primary transition-colors" prefetch={false}>
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

    