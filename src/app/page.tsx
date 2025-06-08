
import { Button } from "@/components/ui/button";
import { ArrowRight, Cog, MessageSquare, BookOpen, Share2, Zap, Terminal } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo"; 

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <div className="flex items-center justify-center">
          <Logo collapsed={false} />
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
            Features
          </Link>
          <Link href="#api" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
            API
          </Link>
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
            Login
          </Link>
          <Button asChild>
            <Link href="/dashboard">
              Start Building <ArrowRight className="ml-2 h-4 w-4" />
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
                  <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                    The Complete AI Agent Platform
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    AutoBoss empowers you to build, deploy, and manage intelligent AI agents. Everything you need to build the agents of the FUTURE.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/dashboard">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="#features">
                      Explore Features
                    </Link>
                  </Button>
                </div>
              </div>
              <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="AI Agent Platform Interface"
                data-ai-hint="AI platform dark interface"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-2xl opacity-90"
              />
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Core Capabilities</div>
                <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-5xl">
                  Build Smarter, Faster
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From visual flow design to knowledge integration and seamless deployment, AutoBoss provides a unified toolkit.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:max-w-none mt-12">
              {[
                { title: "Visual Flow Studio", description: "Design complex agent behaviors with an intuitive drag-and-drop interface. No code required to start.", icon: <Cog className="h-8 w-8 text-primary" /> },
                { title: "AI-Powered Configuration", description: "Define agent personalities, roles, and generate initial greetings using advanced AI models.", icon: <Zap className="h-8 w-8 text-primary" /> },
                { title: "Knowledge Integration", description: "Enrich your agents by uploading documents or processing URLs for contextual understanding.", icon: <BookOpen className="h-8 w-8 text-primary" /> },
                { title: "Natural Language Understanding", description: "Leverage Gemini for intent recognition and sophisticated autonomous conversation reasoning.", icon: <MessageSquare className="h-8 w-8 text-primary" /> },
                { title: "Easy Deployment & Export", description: "Get embeddable chat widgets, illustrative API endpoints, and direct chatbot links effortlessly.", icon: <Share2 className="h-8 w-8 text-primary" /> },
                { title: "Developer-Friendly API", description: "Integrate agents into any application with a well-documented and flexible API.", icon: <Terminal className="h-8 w-8 text-primary" /> },
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
        <section id="api" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid items-center gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">Developer First</div>
                <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl/tight">An API for Everything.</h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Integrate AutoBoss agents seamlessly into your existing workflows and applications with our robust and flexible API. Automate, extend, and innovate.
                </p>
                <ul className="grid gap-2 py-4">
                  <li>
                    <Zap className="mr-2 inline-block h-4 w-4 text-primary" />
                    Access agent responses and manage conversations programmatically.
                  </li>
                  <li>
                    <Zap className="mr-2 inline-block h-4 w-4 text-primary" />
                    Trigger flows and interact with agent knowledge via API calls.
                  </li>
                  <li>
                    <Zap className="mr-2 inline-block h-4 w-4 text-primary" />
                    Built for developers who need control and extensibility.
                  </li>
                </ul>
                 <Button size="lg" variant="outline" asChild>
                    <Link href="/docs/api"> {/* Placeholder Link */}
                      View API Documentation
                    </Link>
                  </Button>
              </div>
               <Image
                src="https://placehold.co/600x400.png"
                width="600"
                height="400"
                alt="API Integration Abstract"
                data-ai-hint="API code dark theme"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last shadow-2xl opacity-90"
              />
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
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
