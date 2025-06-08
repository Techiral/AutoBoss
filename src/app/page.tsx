
"use client"; 

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Cog, Rocket, Eye, Palette, BarChart3, PlayCircle, MessageCircle, Star, Settings, Users, Layers, Menu, X as CloseIcon, ShieldCheck, Smile, TrendingUp, SearchCode, Edit3, Handshake } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
// Removed: import { useAppContext } from "../(app)/layout"; // Marketing page cannot access this context directly

// Intersection Observer Hook
const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node) {
      observerRef.current = new IntersectionObserver(([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      }, options);
      observerRef.current.observe(node);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [node, options]);

  return [setNode, isIntersecting] as const;
};


// Simple Feature Card
interface SimpleFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  caseStudy?: { quote: string; metric: string; author: string };
  dataAiHint?: string;
}

const SimpleFeatureCard: React.FC<SimpleFeatureCardProps> = ({ icon, title, description, caseStudy, dataAiHint }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={cn("simple-feature-card scroll-reveal", isVisible && "visible")}
    >
      <div className="simple-feature-card-icon">{icon}</div>
      <h3 className="simple-feature-card-title">{title}</h3>
      <p className="simple-feature-card-description">{description}</p>
      {caseStudy && (
        <div className="simple-feature-card-case-study">
          <blockquote className="simple-feature-card-quote">"{caseStudy.quote}"</blockquote>
          <p className="simple-feature-card-metric">{caseStudy.metric} <span className="text-muted-foreground font-normal">- {caseStudy.author}</span></p>
        </div>
      )}
      {dataAiHint && <div className="w-full h-24 mt-3 rounded-md" data-ai-hint={dataAiHint}></div>}
    </div>
  );
};

const painPoints = [
  "Tired of clunky chatbots?",
  "Support costs out of control?",
  "Losing leads while you sleep?",
  "Manual workflows slowing you down?",
  "Dreaming of true AI teammates?"
];

export default function MarketingPage() {
  const [currentPainPointIndex, setCurrentPainPointIndex] = useState(0);
  const typewriterRef = useRef<HTMLSpanElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  // const { theme } = useAppContext(); // Cannot use here as page.tsx is not under (app) layout

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentPainPointIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % painPoints.length;
        if (typewriterRef.current) {
          typewriterRef.current.classList.remove("typewriter-text");
          typewriterRef.current.classList.add("typewriter-text-restart");
          void typewriterRef.current.offsetWidth; 
          typewriterRef.current.classList.add("typewriter-text");
        }
        return nextIndex;
      });
    }, 4000); 
    return () => clearInterval(intervalId);
  }, []);
  
  useEffect(() => {
    const handleScroll = () => setIsHeaderScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sectionObserverOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
  const [heroRef, heroVisible] = useIntersectionObserver(sectionObserverOptions);
  const [socialProofRef, socialProofVisible] = useIntersectionObserver(sectionObserverOptions);
  const [superpowersRef, superpowersVisible] = useIntersectionObserver(sectionObserverOptions);
  const [howItWorksRef, howItWorksVisible] = useIntersectionObserver(sectionObserverOptions);
  const [humanizeRef, humanizeVisible] = useIntersectionObserver(sectionObserverOptions);
  const [finalCtaRef, finalCtaVisible] = useIntersectionObserver(sectionObserverOptions);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <header className={cn("w-full px-4 lg:px-6 h-20 flex items-center sticky-header", isHeaderScrolled && "sticky-header-scrolled")}>
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center justify-center" aria-label="AutoBoss Homepage">
            <Logo className="text-foreground hover:opacity-80 transition-opacity"/>
          </Link>
          <nav className="hidden md:flex gap-3 sm:gap-4 items-center">
            <Link href="#superpowers" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" prefetch={false}>How It Works</Link>
            <Link href="#social-proof" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Testimonials</Link>
            <Button variant="outline" size="sm" asChild className="border-primary/50 text-primary hover:border-primary hover:bg-primary/10 transition-colors">
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild className="font-semibold bg-gradient-to-r from-electric-teal to-neon-lime text-background shadow-md hover:opacity-90 transition-opacity">
              <Link href="/dashboard">Try It Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </nav>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
               {isMobileMenuOpen ? <CloseIcon className="h-6 w-6 text-foreground"/> : <Menu className="h-6 w-6 text-foreground"/>}
            </Button>
          </div>
        </div>
      </header>
      
      <div id="mobile-menu" className={cn("md:hidden fixed top-20 right-0 h-[calc(100vh-5rem)] w-64 bg-card shadow-xl z-40 p-6 space-y-4 transform transition-transform duration-300 ease-in-out", isMobileMenuOpen ? "translate-x-0" : "translate-x-full")}>
          <Link href="#superpowers" className="block py-2 text-foreground hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
          <Link href="#how-it-works" className="block py-2 text-foreground hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>How It Works</Link>
          <Link href="#social-proof" className="block py-2 text-foreground hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Testimonials</Link>
          <Link href="/login" className="block py-2 text-foreground hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
          <Button asChild className="w-full font-semibold bg-gradient-to-r from-electric-teal to-neon-lime text-background shadow-md hover:opacity-90 transition-opacity">
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Try It Free</Link>
          </Button>
      </div>

      <main className="flex-1">
        <section ref={heroRef} className={cn("scroll-reveal section-dark w-full min-h-[calc(100vh-5rem)] flex items-center justify-center text-center py-20 md:py-28 relative overflow-hidden", heroVisible && "visible")}>
          <div className="absolute inset-0 z-0">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-10" poster="https://placehold.co/1920x1080/1A202C/1A202C.png" data-ai-hint="abstract ai motion dark futuristic">
              <source src="https://placehold.co/1920x1080.mp4?text=." type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/80"></div>
          </div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="mx-auto max-w-3xl space-y-6 md:space-y-8">
              <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
                <span ref={typewriterRef} className="typewriter-text block gradient-text-on-dark min-h-[60px] sm:min-h-[80px] md:min-h-[100px] lg:min-h-[120px]">
                  {painPoints[currentPainPointIndex]}
                </span>
                <span className="block mt-2 md:mt-4 text-3xl sm:text-4xl md:text-5xl text-foreground/90">Meet Your Full-Blown AI Teammate.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
                AutoBoss equips you with AI agents that don't just chat—they understand, decide, and *execute*. Transform your business operations from the ground up.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button size="lg" asChild className="shadow-lg bg-gradient-to-r from-electric-teal to-neon-lime text-background font-bold text-base md:text-lg px-8 py-6 hover:opacity-90 transition-all duration-300 hover:scale-105 group pulse-cta-btn">
                  <Link href="/dashboard">
                    Try AutoBoss Free
                    <Rocket className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="transition-all duration-300 hover:scale-105 hover:border-accent hover:text-accent px-8 py-6 text-base md:text-lg border-muted-foreground/50 text-foreground bg-background/50 backdrop-blur-sm">
                  <Link href="#video-demo-placeholder"> 
                    Watch 60s Demo <PlayCircle className="ml-2 h-5 w-5"/>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section ref={socialProofRef} id="social-proof" className={cn("scroll-reveal section-light-accent w-full py-16 md:py-20", socialProofVisible && "visible")}>
            <div className="container px-4 md:px-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-6">Trusted by Visionaries & Industry Leaders</p>
                <div className="marquee w-full max-w-5xl mx-auto mb-10">
                  <div className="marquee-content flex items-center gap-12 md:gap-16">
                    {[...Array(2)].flatMap((_, repeatIndex) => [ 
                        { name: "InnovateLLC", hint: "modern tech logo clean" },
                        { name: "AIPoweredCo", hint: "ai solutions logo professional" },
                        { name: "GlobalSupport", hint: "global enterprise logo simple" },
                        { name: "NextGenFlow", hint: "future tech logo abstract" },
                        { name: "DataDrivenInc", hint: "data analytics logo sharp" },
                    ].map((logo, index) => (
                      <div key={`${repeatIndex}-${index}`} className="flex-shrink-0 h-8 md:h-10 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 transform hover:scale-110">
                         {/* Using a fixed dark-theme appropriate color for placeholder image */}
                         <Image src={`https://placehold.co/150x40/1A202C/E2E8F0.png?text=${logo.name.replace(/\s/g,'+')}&font=nunito`} alt={`${logo.name} Logo`} width={150} height={40} className="object-contain h-full" data-ai-hint={logo.hint} />
                      </div>
                    )))}
                  </div>
                </div>
                 <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
                    <div className="bg-background p-6 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300 text-foreground">
                        <Star className="w-5 h-5 text-neon-lime mb-2"/>
                        <p className="text-sm italic text-muted-foreground">"AutoBoss has revolutionized our customer support, handling 80% of inquiries autonomously. A true game-changer."</p>
                        <p className="text-xs font-semibold mt-3 text-foreground/80">- Alex R, Support Lead @ GlobalSupport</p>
                    </div>
                     <div className="bg-background p-6 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300 flex flex-col justify-center items-center text-center text-foreground">
                        <BarChart3 className="w-8 h-8 text-electric-teal mb-2"/>
                        <p className="text-3xl md:text-4xl font-bold gradient-text-on-light">97%</p>
                        <p className="text-sm text-muted-foreground">Task Automation Success</p>
                        <p className="text-3xl md:text-4xl font-bold gradient-text-on-light mt-3">1M+</p>
                        <p className="text-sm text-muted-foreground">Agents Deployed Monthly</p>
                    </div>
                    <div className="bg-background p-6 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300 text-foreground">
                        <Star className="w-5 h-5 text-primary mb-2"/>
                        <p className="text-sm italic text-muted-foreground">"The visual flow builder is incredibly intuitive. We launched our first AI agent in under an hour, not days!"</p>
                        <p className="text-xs font-semibold mt-3 text-foreground/80">- Priya S, Founder @ InnovateLLC</p>
                    </div>
                </div>
            </div>
        </section>

        <section ref={superpowersRef} id="superpowers" className={cn("scroll-reveal section-dark w-full py-16 md:py-24 lg:py-32", superpowersVisible && "visible")}>
          <div className="container px-4 md:px-6 text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-foreground">
              Beyond Chatbots: Your AI Workforce Awaits
            </h2>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto mb-12 md:mb-16">
              AutoBoss isn't just about conversations; it's about results. Discover agents that think, act, and integrate.
            </p>
            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
              <SimpleFeatureCard 
                icon={<Edit3 className="h-8 w-8" />} 
                title="Visual Flow Studio: Zero Code, Infinite Power" 
                description="Drag, drop, and connect. Design sophisticated AI logic visually. No coding degree required to build genius agents."
                caseStudy={{ quote: "Our non-technical team built a lead qualifying agent in an afternoon. Amazing!", metric: "5x Faster Deployment", author: "Marketing @ DataDrivenInc" }}
                dataAiHint="flowchart dark tech node interface" 
              />
              <SimpleFeatureCard 
                icon={<Palette className="h-8 w-8" />} 
                title="AI Persona Engine: Your Brand, Amplified" 
                description="Define a role, get a personality. AutoBoss crafts agents that speak your language and embody your brand values instantly."
                caseStudy={{ quote: "The AI-generated persona was spot-on. Our agent feels like a true extension of our team.", metric: "99% Brand Alignment", author: "CEO @ NextGenFlow" }}
                dataAiHint="ai character mask creative dark"
              />
              <SimpleFeatureCard 
                icon={<Brain className="h-8 w-8" />} 
                title="Dynamic Knowledge Core: Always Learning" 
                description="Feed it documents, websites, FAQs. Your agent continuously learns and adapts, becoming an expert in your domain."
                caseStudy={{ quote: "Our agent's knowledge base is now our single source of truth for product info.", metric: "Instant & Accurate Answers", author: "Product @ AIPoweredCo" }}
                dataAiHint="digital brain network connections dark"
              />
              <SimpleFeatureCard 
                icon={<Zap className="h-8 w-8" />} 
                title="Autonomous Action Engine: Beyond Chat" 
                description="Agents that don't just converse—they make decisions, execute tasks, update CRMs, and integrate with your existing tools."
                caseStudy={{ quote: "Automating invoice processing saved us 20 hours a week. AutoBoss just *does* it.", metric: "Full Task Automation", author: "Operations @ InnovateLLC" }}
                dataAiHint="ai speed power abstract dark"
              />
            </div>
          </div>
        </section>

        <section ref={howItWorksRef} id="how-it-works" className={cn("scroll-reveal section-light-accent w-full py-16 md:py-24 lg:py-32", howItWorksVisible && "visible")}>
          <div className="container px-4 md:px-6 text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-card-foreground">
              Launch Your AI Agent in <span className="gradient-text-on-light">3 Simple Steps</span>
            </h2>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto mb-12 md:mb-16">From concept to a fully operational AI teammate, faster than you thought possible.</p>
            <div className="relative mx-auto max-w-5xl grid md:grid-cols-3 gap-10 items-start">
                <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-primary/30 -translate-y-1/2" style={{ zIndex: 0 }}></div>
                {[
                    { number: "1", title: "Define & Design", description: "Visually craft your agent's brain and personality. No code, just intuition.", icon: <Palette className="w-10 h-10 text-electric-teal"/>, dataAiHint:"ui design flowchart simple" },
                    { number: "2", title: "Enrich & Empower", description: "Upload docs or URLs to build a smart knowledge core. Train it on your specific data.", icon: <Brain className="w-10 h-10 text-neon-lime"/>, dataAiHint: "data upload knowledge clean" },
                    { number: "3", title: "Deploy & Dominate", description: "Integrate via widget, API, or direct link. Unleash its power across your business.", icon: <Rocket className="w-10 h-10 text-primary"/>, dataAiHint: "rocket launch tech minimal" },
                ].map((step) => {
                  const [stepRef, stepIsVisible] = useIntersectionObserver({ threshold: 0.3 });
                  return (
                    <div key={step.title} ref={stepRef} className={cn("scroll-reveal relative flex flex-col items-center gap-3 p-6 rounded-lg bg-background shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 text-foreground", stepIsVisible && "visible")}>
                        <div className="absolute -top-5 bg-gradient-to-br from-electric-teal to-neon-lime text-background text-lg font-bold w-12 h-12 rounded-full flex items-center justify-center border-4 border-card shadow-lg">{step.number}</div>
                        <div className="mt-10 mb-2">{step.icon}</div>
                        <h3 className="font-headline text-xl font-semibold">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                         <div className="w-full h-20 mt-2 rounded-md" data-ai-hint={step.dataAiHint}></div>
                    </div>
                  );
                })}
            </div>
            <div className="mt-16 md:mt-24 max-w-3xl mx-auto">
                <h3 className="font-headline text-2xl font-semibold mb-4 text-card-foreground">Experience the Studio Magic</h3>
                <div className="aspect-video bg-background/50 rounded-lg shadow-inner flex flex-col items-center justify-center text-muted-foreground p-6 border border-dashed border-border" data-ai-hint="interactive ui demo minimal clean">
                    <Settings className="w-12 h-12 opacity-30 mb-3"/>
                    <p className="text-sm">Imagine dragging & dropping nodes here to build a simple agent flow.</p>
                    <p className="text-xs mt-1">(Interactive demo coming soon!)</p>
                     <Button variant="outline" className="mt-4 border-primary/50 text-primary hover:text-primary hover:bg-primary/10">Explore Studio Features</Button>
                </div>
            </div>
          </div>
        </section>

        <section id="video-demo-placeholder" className="section-dark w-full py-16 md:py-24 text-center">
            <div className="container px-4 md:px-6">
                <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6 text-foreground">
                    See AutoBoss in Action: <span className="gradient-text-on-dark">60 Seconds to Wow!</span>
                </h2>
                <div className="max-w-3xl mx-auto aspect-video bg-muted/50 rounded-lg shadow-xl flex items-center justify-center text-muted-foreground border border-border relative" data-ai-hint="video player modern dark sleek">
                    <div className="video-placeholder-text">
                         <PlayCircle size={64} className="opacity-50 text-primary cursor-pointer hover:opacity-80 transition-opacity"/>
                         <p className="mt-2 text-sm">Video Demo Placeholder</p>
                    </div>
                </div>
            </div>
        </section>

        <section ref={humanizeRef} className={cn("scroll-reveal section-light-accent w-full py-16 md:py-24 lg:py-32", humanizeVisible && "visible")}>
          <div className="container px-4 md:px-6 text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 text-card-foreground">
              Built by Humans, for <span className="gradient-text-on-light">Your Breakthroughs</span>.
            </h2>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto mb-12">
              We're a passionate team dedicated to making sophisticated AI accessible. AutoBoss is more than software; it's your partner in innovation.
            </p>
            <div className="max-w-2xl mx-auto bg-background p-6 md:p-8 rounded-lg shadow-xl transform hover:scale-103 transition-transform text-foreground">
              <p className="italic text-muted-foreground">"I started AutoBoss from my dorm room, frustrated by clunky automation. My vision: a platform so intuitive, anyone could build truly intelligent AI agents. We're just getting started on this journey with you."</p>
              <div className="flex items-center justify-center gap-4 mt-6">
                <Image src="https://placehold.co/80x80/1A202C/E2E8F0.png?text=AC" alt="Alex Chen, Founder" width={70} height={70} className="rounded-full shadow-md" data-ai-hint="founder portrait friendly modern person" />
                <div>
                  <p className="font-semibold text-lg text-foreground">Alex Chen (Placeholder)</p>
                  <p className="text-sm text-primary">Founder & CEO, AutoBoss</p>
                </div>
              </div>
            </div>
            <div className="mt-12">
                <p className="text-sm text-muted-foreground">(Placeholder: A fun 'Meet the Team' section with casual photos could go here!)</p>
                <div className="flex justify-center gap-4 mt-4 ">
                    <Image src="https://placehold.co/100x100/1A202C/E2E8F0.png?text=Dev" alt="Team Member 1" width={80} height={80} className="rounded-full opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all" data-ai-hint="team member developer person"/>
                    <Image src="https://placehold.co/100x100/1A202C/E2E8F0.png?text=UX" alt="Team Member 2" width={80} height={80} className="rounded-full opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all" data-ai-hint="team member designer person"/>
                    <Image src="https://placehold.co/100x100/1A202C/E2E8F0.png?text=AI" alt="Team Member 3" width={80} height={80} className="rounded-full opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all" data-ai-hint="team member ai specialist person"/>
                </div>
            </div>
          </div>
        </section>

        <section ref={finalCtaRef} className={cn("scroll-reveal section-dark w-full py-20 md:py-28 lg:py-32", finalCtaVisible && "visible")}>
          <div className="container px-4 md:px-6 text-center">
            <div className="mx-auto max-w-2xl space-y-6">
              <h2 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl gradient-text-on-dark">
                Ready to Build the Unthinkable?
              </h2>
              <p className="text-muted-foreground md:text-lg">
                Your journey to effortless, intelligent automation starts now. AutoBoss is free to try. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                <Button size="lg" asChild className="shadow-xl bg-gradient-to-r from-electric-teal to-neon-lime text-background font-bold text-lg px-10 py-7 hover:opacity-90 transition-all duration-300 hover:scale-105 group w-full sm:w-auto pulse-cta-btn">
                  <Link href="/dashboard">
                    Create Your Agent Now
                    <Rocket className="ml-3 h-5 w-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="transition-all duration-300 hover:scale-105 hover:border-accent hover:text-accent px-10 py-7 text-lg text-foreground border-muted-foreground/50 bg-card/10 backdrop-blur-sm w-full sm:w-auto">
                  <Link href="mailto:demo@autoboss.dev?subject=AutoBoss Demo Request"> 
                    Request a Demo <Eye className="ml-3 h-5 w-5"/>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-8 border-t border-border/50 bg-background text-center">
        <div className="container px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
             <Link href="/" aria-label="AutoBoss Homepage" className="flex items-center justify-center">
                <Logo className="text-foreground hover:opacity-80 transition-opacity"/>
            </Link>
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} AutoBoss. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 sm:mt-0">
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Terms</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Privacy</Link>
            <Link href="mailto:support@autoboss.dev" className="text-xs text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Support</Link>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary p-0 h-auto" onClick={() => alert("AutoBoss Chat: How can I help you prototype today? (Placeholder for actual chat widget)")}>
                <MessageCircle className="mr-1 h-3 w-3"/> Chat with Us
            </Button>
          </nav>
        </div>
      </footer>
    </div>
  );
}
