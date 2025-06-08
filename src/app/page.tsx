
import { Button } from "@/components/ui/button";
import { ArrowRight, Cog, MessageSquare, BookOpen, Share2, Zap, Terminal, Palette, DatabaseZap, Rocket, Users, Lightbulb } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo"; 

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-center">
          <Logo collapsed={false} />
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
            How It Works
          </Link>
          <Link href="#api" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
            Integrate
          </Link>
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
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
        <section className="w-full py-20 md:py-28 lg:py-36 xl:py-48 bg-gradient-to-b from-background to-card">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_650px]">
              <div className="flex flex-col justify-center space-y-6">
                <div className="space-y-3">
                  <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                    Build, Deploy, & Master Intelligent AI Agents with AutoBoss
                  </h1>
                  <p className="max-w-[650px] text-muted-foreground md:text-xl lg:text-lg xl:text-xl">
                    Your all-in-one platform for creating sophisticated conversational AI. From visual flow building to seamless deployment, empower your business with next-generation automation.
                  </p>
                </div>
                <div className="flex flex-col gap-3 min-[400px]:flex-row">
                  <Button size="lg" asChild className="shadow-lg hover:shadow-primary/50 transition-shadow">
                    <Link href="/dashboard">
                      Start Building For Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#features">
                      Explore Capabilities
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/700x500.png"
                width="700"
                height="500"
                alt="AutoBoss AI Agent Platform Interface"
                data-ai-hint="futuristic AI interface dark"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last shadow-2xl opacity-90 transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </section>
        
        <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-card">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground font-semibold">Core Capabilities</div>
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Powerful Features, Simple Control
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                AutoBoss provides a unified toolkit with everything you need to design, enrich, and deploy intelligent AI agents that truly understand and interact.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-8 sm:grid-cols-2 md:gap-10 lg:grid-cols-3 lg:max-w-none">
              {[
                { title: "Visual Flow Studio", description: "Design complex agent behaviors and conversation paths with an intuitive drag-and-drop interface. No code required to start, fully extensible when needed.", icon: <Cog className="h-10 w-10 text-primary" /> },
                { title: "AI-Powered Configuration", description: "Define agent personalities, roles, and generate compelling initial greetings using advanced AI models to match your brand's voice.", icon: <Zap className="h-10 w-10 text-primary" /> },
                { title: "Dynamic Knowledge Base", description: "Enrich your agents by uploading documents or processing URLs. Enable contextual understanding and RAG-like capabilities.", icon: <BookOpen className="h-10 w-10 text-primary" /> },
                { title: "Advanced NLU", description: "Leverage Google Gemini for robust intent recognition, entity extraction, and sophisticated autonomous conversation reasoning.", icon: <MessageSquare className="h-10 w-10 text-primary" /> },
                { title: "Effortless Deployment", description: "Get embeddable chat widgets, illustrative API endpoints, and direct chatbot links for seamless integration across platforms.", icon: <Share2 className="h-10 w-10 text-primary" /> },
                { title: "Developer-First API", description: "Integrate AutoBoss agents into any application with a well-documented, flexible, and powerful API for custom solutions.", icon: <Terminal className="h-10 w-10 text-primary" /> },
              ].map(feature => (
                <div key={feature.title} className="flex flex-col gap-3 p-6 rounded-lg border bg-background shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="mb-2">{feature.icon}</div>
                  <h3 className="font-headline text-xl font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground flex-grow">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="w-full py-16 md:py-24 lg:py-32 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground font-semibold">Simple Steps</div>
              <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Launch Your AI Agent in Minutes
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                AutoBoss streamlines the entire agent creation lifecycle, from initial concept to live deployment.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-1 md:grid-cols-3 md:gap-10">
              {[
                { title: "1. Design & Define", description: "Use the Visual Studio to map out conversation flows. Define your agent's unique personality, role, and objectives with AI assistance.", icon: <Palette className="h-10 w-10 text-accent" /> },
                { title: "2. Enrich & Empower", description: "Upload documents or link URLs to build a dynamic knowledge base. Configure AI settings to fine-tune responses and reasoning.", icon: <DatabaseZap className="h-10 w-10 text-accent" /> },
                { title: "3. Deploy & Integrate", description: "Instantly get embeddable widgets and API access. Launch your agent on your website, app, or internal tools with ease.", icon: <Rocket className="h-10 w-10 text-accent" /> },
              ].map(step => (
                 <div key={step.title} className="flex flex-col items-center text-center gap-3 p-6 rounded-lg border bg-card shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-3 rounded-full bg-accent/10 mb-3">{step.icon}</div>
                  <h3 className="font-headline text-xl font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="api" className="w-full py-16 md:py-24 lg:py-32 bg-card">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground font-semibold">Developer Ready</div>
                <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl/tight">Seamless Integration, Limitless Potential.</h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our robust API allows you to connect AutoBoss agents to any system, automate complex workflows, and build custom AI-powered applications.
                </p>
                <ul className="grid gap-3 py-4">
                  <li className="flex items-start">
                    <Zap className="mr-3 mt-1 h-5 w-5 text-primary shrink-0" />
                    <span>Programmatically manage conversations and trigger agent flows.</span>
                  </li>
                  <li className="flex items-start">
                    <Lightbulb className="mr-3 mt-1 h-5 w-5 text-primary shrink-0" />
                    <span>Access knowledge base insights and agent reasoning via API calls.</span>
                  </li>
                  <li className="flex items-start">
                    <Users className="mr-3 mt-1 h-5 w-5 text-primary shrink-0" />
                    <span>Built for developers who demand control, flexibility, and scalability.</span>
                  </li>
                </ul>
                 <Button size="lg" variant="outline" asChild>
                    <Link href="/agents/some-agent-id/export"> {/* Updated to a more plausible example link */}
                      Explore API Details
                    </Link>
                  </Button>
              </div>
               <Image
                src="https://placehold.co/700x500.png"
                width="700"
                height="500"
                alt="Abstract API Integration Connections"
                data-ai-hint="glowing network connections dark"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last shadow-2xl opacity-90 transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </section>

        <section className="w-full py-16 md:py-24 lg:py-32 bg-background">
          <div className="container text-center px-4 md:px-6">
            <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">
              Ready to Automate Smarter?
            </h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto mb-8">
              Join hundreds of developers and businesses building the next generation of AI assistants with AutoBoss.
            </p>
            <Button size="lg" asChild className="shadow-lg hover:shadow-primary/50 transition-shadow text-lg px-8 py-6">
              <Link href="/dashboard">
                Start Your Free Trial Now
                <ArrowRight className="ml-3 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-card">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} AutoBoss AI. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:text-primary transition-colors" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:text-primary transition-colors" prefetch={false}>
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

    