
"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Cog, Rocket, Eye, Palette, BarChart3, PlayCircle, Star, Menu, X as CloseIcon, ShieldCheck, Smile, TrendingUp, SearchCode, Edit3, Handshake, Info, Layers } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Intersection Observer Hook
const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    if (typeof window.IntersectionObserver === "undefined") {
      setIsIntersecting(true); // Fallback
      return;
    }
    observerRef.current = new IntersectionObserver(([entry]) => setIsIntersecting(entry.isIntersecting), options);
    const { current: currentObserver } = observerRef;
    if (node) currentObserver.observe(node);
    return () => { if (node && currentObserver) currentObserver.unobserve(node); };
  }, [node, options]);
  return [setNode, isIntersecting] as const;
};

interface SimpleFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  caseStudy?: { quote: string; metric: string; author: string };
  animationDelay?: string;
}

const SimpleFeatureCard: React.FC<SimpleFeatureCardProps> = ({ icon, title, description, caseStudy, animationDelay }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <article
          ref={ref}
          className={cn("simple-feature-card scroll-reveal", isVisible && "visible", animationDelay)}
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
        </article>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs z-[60] bg-popover text-popover-foreground">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        {caseStudy && <p className="text-xs text-muted-foreground mt-1"><em>"{caseStudy.quote}" - {caseStudy.metric}</em></p>}
      </TooltipContent>
    </Tooltip>
  );
};

const heroPainPoint = "AutoBoss builds AI teammates."; // Single, concise phrase

export default function MarketingPageClient() {
  const typewriterRef = useRef<HTMLSpanElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsHeaderScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typewriterRef.current) {
      typewriterRef.current.textContent = heroPainPoint;
      typewriterRef.current.classList.remove("typewriter-text");
      void typewriterRef.current.offsetWidth; // Trigger reflow
      typewriterRef.current.classList.add("typewriter-text");
    }
  }, []); // Run once on mount


  const sectionObserverOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
  const [heroRef, heroVisible] = useIntersectionObserver(sectionObserverOptions);
  const [poweringAIRef, poweringAIVisible] = useIntersectionObserver(sectionObserverOptions);
  const [superpowersRef, superpowersVisible] = useIntersectionObserver(sectionObserverOptions);
  const [howItWorksRef, howItWorksVisible] = useIntersectionObserver(sectionObserverOptions);
  const [videoDemoRef, videoDemoVisible] = useIntersectionObserver(sectionObserverOptions);
  const [socialProofRef, socialProofVisible] = useIntersectionObserver(sectionObserverOptions);
  const [humanizeRef, humanizeVisible] = useIntersectionObserver(sectionObserverOptions);
  const [finalCtaRef, finalCtaVisible] = useIntersectionObserver(sectionObserverOptions);


  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#proof", label: "Proof" },
  ];

  return (
    <TooltipProvider>
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <header className={cn("w-full px-4 lg:px-6 h-16 flex items-center sticky-header z-50", isHeaderScrolled && "sticky-header-scrolled")}>
        <div className="container mx-auto flex items-center justify-between max-w-screen-xl">
          <Link href="/" className="flex items-center justify-center" aria-label="AutoBoss Homepage">
            <Logo className="text-foreground hover:opacity-80 transition-opacity h-7 w-auto" />
          </Link>
          <nav className="hidden md:flex gap-1 sm:gap-2 items-center">
            {navLinks.map(link => (
               <Link key={link.href} href={link.href} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1" prefetch={false}>{link.label}</Link>
            ))}
            <Button variant="outline" size="sm" asChild className="btn-outline-themed transition-colors btn-interactive text-xs ml-2">
              <Link href="/login" className="flex items-center gap-1">Login</Link>
            </Button>
            <Button size="sm" asChild className="font-semibold bg-gradient-to-r from-electric-teal to-neon-lime text-background shadow-md hover:opacity-90 transition-opacity btn-interactive text-xs pulse-cta-btn">
              <Link href="/dashboard" className="flex items-center gap-1">
                Try AutoBoss Free <ArrowRight className="h-3.5 w-3.5"/>
              </Link>
            </Button>
          </nav>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu" onClick={toggleMobileMenu} className="btn-interactive">
               {isMobileMenuOpen ? <CloseIcon className="h-5 w-5 text-foreground"/> : <Menu className="h-5 w-5 text-foreground"/>}
            </Button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={cn(
          "md:hidden fixed top-16 right-0 h-[calc(100vh-4rem)] w-60 bg-card shadow-xl z-40 p-5 space-y-2 transform transition-all duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="block py-1.5 text-sm text-card-foreground hover:text-primary" onClick={toggleMobileMenu}>{link.label}</Link>
          ))}
          <Link href="/login" className="block py-1.5 text-sm text-card-foreground hover:text-primary" onClick={toggleMobileMenu}>Login</Link>
          <Button asChild className="w-full font-semibold bg-gradient-to-r from-electric-teal to-neon-lime text-background shadow-md hover:opacity-90 transition-opacity btn-interactive text-sm mt-2 pulse-cta-btn">
            <Link href="/dashboard" onClick={toggleMobileMenu}>
              Try AutoBoss Free
            </Link>
          </Button>
      </div>

      <main className="flex-1">
        <section ref={heroRef} className={cn("scroll-reveal section-dark w-full min-h-[calc(100vh-4rem)] flex items-center justify-center text-center py-12 md:py-16 relative overflow-hidden", heroVisible && "visible")}>
          <div className="absolute inset-0 z-0 opacity-[0.02]">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover" poster="https://placehold.co/1920x1080/0A0F14/0A0F14.png" data-ai-hint="dark abstract particles subtle motion">
              <source src="https://placehold.co/1920x1080.mp4?text=." type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-transparent to-background/50"></div>
          </div>
          <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-screen-xl">
            <div className="max-w-2xl mx-auto space-y-4 md:space-y-5">
              <h1 className="marketing-h1">
                <span ref={typewriterRef} className="block gradient-text-on-dark min-h-[45px] sm:min-h-[60px] md:min-h-[70px] lg:min-h-[80px]">
                  {/* Content set by useEffect */}
                </span>
              </h1>
              <p className="section-description text-sm md:text-base max-w-md mx-auto !mb-6">
                Instantly upgrade your business with AI agents that think, decide, & execute complex workflows.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                <Button size="lg" asChild className="button-active-feedback shadow-lg bg-gradient-to-r from-electric-teal to-neon-lime text-background font-bold text-sm px-6 py-3 hover:opacity-90 transition-all duration-300 hover:scale-105 group pulse-cta-btn btn-interactive">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    Launch Agent Free
                    <Rocket className="h-4 w-4 group-hover:animate-bounce" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="button-active-feedback btn-outline-themed transition-all duration-300 hover:scale-105 px-6 py-3 text-sm border-muted-foreground/40 text-primary hover:text-accent-foreground hover:bg-accent hover:border-accent bg-background/10 backdrop-blur-sm btn-interactive">
                  <Link href="#video-demo-placeholder" className="flex items-center gap-1.5">
                    Watch 60s Demo <PlayCircle className="h-4 w-4"/>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section ref={poweringAIRef} id="powering-ai" className={cn("scroll-reveal section-light-accent w-full py-10 md:py-12 border-b border-border/50", poweringAIVisible && "visible")}>
            <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
                <h2 className="marketing-h2 text-sm font-semibold uppercase tracking-wider text-primary !mb-4">Powering AI Breakthroughs</h2>
                <div className="marquee w-full max-w-4xl mx-auto">
                  <div className="marquee-content flex items-center gap-8 md:gap-12">
                    {[...Array(2)].flatMap((_, repeatIndex) => [
                        { name: "InnovateLLC", hint: "modern tech logo clean" },
                        { name: "AIPoweredCo", hint: "ai solutions logo professional" },
                        { name: "GlobalSupport", hint: "global enterprise logo simple" },
                        { name: "NextGenFlow", hint: "future tech logo abstract" },
                        { name: "DataDrivenInc", hint: "data analytics logo sharp" },
                    ].map((logo, index) => (
                      <div key={`${repeatIndex}-${index}`} className="flex-shrink-0 h-5 md:h-6 grayscale opacity-50 hover:grayscale-0 hover:opacity-80 transition-all duration-300 transform hover:scale-110">
                         <Image loading="lazy" src={`https://placehold.co/140x30/transparent/333333.png?text=${logo.name.replace(/\s/g,'+')}&font=nunito`} alt={`${logo.name} Logo`} width={120} height={25} className="object-contain h-full" data-ai-hint={logo.hint} />
                      </div>
                    )))}
                  </div>
                </div>
            </div>
        </section>

        <section ref={superpowersRef} id="features" className={cn("scroll-reveal section-dark w-full py-16 lg:py-20", superpowersVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="marketing-h2">Your AI Workforce</h2>
            <p className="section-description">
              AutoBoss agents are teammates, not just tools. Here's how they deliver results:
            </p>
            <div className="grid md:grid-cols-2 gap-5 lg:gap-6 max-w-3xl mx-auto text-left">
              <SimpleFeatureCard
                icon={<Edit3 className="h-5 w-5" />}
                title="Visual Flow Studio"
                description="Design complex AI logic visually. Drag, drop, done."
                caseStudy={{ quote: "Deployed a lead qualifier in an afternoon!", metric: "5x Faster", author: "Marketing @ DataCo" }}
                animationDelay="delay-100"
              />
              <SimpleFeatureCard
                icon={<Palette className="h-5 w-5" />}
                title="AI Persona Engine"
                description="Define a role, get a personality. Agents that match your brand."
                caseStudy={{ quote: "The AI persona was spot-on. Feels like one of us.", metric: "99% Brand Voice", author: "CEO @ NextFlow" }}
                animationDelay="delay-200"
              />
              <SimpleFeatureCard
                icon={<Brain className="h-5 w-5" />}
                title="Dynamic Knowledge Core"
                description="Feed it docs & sites. Your agent becomes an expert, instantly."
                caseStudy={{ quote: "Our agent is our product info source of truth.", metric: "Instant Answers", author: "Support @ AIPowered" }}
                animationDelay="delay-300"
              />
              <SimpleFeatureCard
                icon={<Zap className="h-5 w-5" />}
                title="Autonomous Action Engine"
                description="Agents don't just talk—they *do*. Execute tasks seamlessly."
                caseStudy={{ quote: "Automating invoices saved 20 hrs/week.", metric: "Full Task Automation", author: "Ops @ Innovate" }}
                animationDelay="delay-400"
              />
            </div>
          </div>
        </section>

        <section ref={howItWorksRef} id="how-it-works" className={cn("scroll-reveal section-light-accent w-full py-16 lg:py-20", howItWorksVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="marketing-h2 text-card-foreground">Launch in 3 Simple Steps</h2>
            <p className="section-description">
              From idea to impact, faster than you imagined. No complex coding required.
            </p>
            <div className="relative mx-auto max-w-4xl grid md:grid-cols-3 gap-5 lg:gap-6 items-start">
                <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-primary/10 -translate-y-1/2 z-0"></div>
                {[
                    { number: "1", title: "Design Visually", description: "Craft your agent's brain in our intuitive Flow Studio.", icon: <Palette className="w-6 h-6 text-electric-teal"/>, animationDelay:"delay-100" },
                    { number: "2", title: "Enrich Knowledge", description: "Upload docs or URLs. Train it on your specific data.", icon: <Brain className="w-6 h-6 text-neon-lime"/>, animationDelay:"delay-200" },
                    { number: "3", title: "Deploy & Dominate", description: "Integrate via widget, API, or direct link.", icon: <Rocket className="w-6 h-6 text-primary"/>, animationDelay:"delay-300" },
                ].map((step, index) => {
                  const [stepRef, stepIsVisible] = useIntersectionObserver({ threshold: 0.3 });
                  return (
                    <article key={step.title} ref={stepRef} className={cn("scroll-reveal relative flex flex-col items-center gap-2 p-5 rounded-lg bg-background shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-foreground z-10", step.animationDelay, stepIsVisible && "visible")}>
                        <div className="absolute -top-3.5 bg-gradient-to-br from-electric-teal to-neon-lime text-background text-sm font-bold w-7 h-7 rounded-full flex items-center justify-center border-2 border-card shadow-md">{step.number}</div>
                        <div className="mt-5 mb-1">{step.icon}</div>
                        <h3 className="font-headline text-lg font-semibold text-center">{step.title}</h3>
                        <p className="text-sm text-muted-foreground text-center leading-relaxed">{step.description}</p>
                    </article>
                  );
                })}
            </div>
            <div ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal mt-10 md:mt-12 max-w-2xl mx-auto", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-400")}>
                <div className="aspect-video bg-background/50 rounded-lg shadow-inner flex flex-col items-center justify-center text-muted-foreground p-4 border border-dashed border-border/50" data-ai-hint="interactive ui demo minimal clean">
                    <Cog className="w-8 h-8 opacity-40 mb-2"/>
                    <p className="text-sm">Interactive Studio Demo (Illustrative)</p>
                </div>
            </div>
          </div>
        </section>

        <section ref={videoDemoRef} id="video-demo-placeholder" className={cn("scroll-reveal section-dark w-full py-16 lg:py-20 text-center", videoDemoVisible && "visible")}>
            <div className="container mx-auto px-4 md:px-6 max-w-screen-xl">
                <h2 className="marketing-h2">See AutoBoss in Action</h2>
                <p className="section-description mt-1 mb-6">Watch how easy it is to build an intelligent AI teammate.</p>
                <div className="max-w-2xl mx-auto aspect-video bg-muted/20 rounded-lg shadow-xl flex items-center justify-center text-muted-foreground border border-border/50 relative overflow-hidden cursor-pointer group" data-ai-hint="video player modern dark sleek elegant">
                    <Image src="https://placehold.co/1280x720/0A0D13/0A0D13.png" alt="AutoBoss Demo Video Thumbnail" layout="fill" objectFit="cover" className="opacity-20 group-hover:opacity-10 transition-opacity" data-ai-hint="dark tech abstract thumbnail" loading="lazy"/>
                    <div className="video-placeholder-text z-10">
                         <PlayCircle size={60} className="text-primary cursor-pointer group-hover:scale-110 group-hover:text-neon-lime transition-all duration-300"/>
                         <p className="mt-2 text-sm font-semibold">Watch Quick Demo (1:03)</p>
                    </div>
                </div>
            </div>
        </section>

        <section ref={socialProofRef} id="proof" className={cn("scroll-reveal section-light-accent w-full py-16 lg:py-20", socialProofVisible && "visible")}>
            <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
                <h2 className="marketing-h2 text-card-foreground">Real Results, Real Trust</h2>
                 <p className="section-description">Join innovators transforming their businesses with AutoBoss.</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto text-left">
                    <article ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal bg-background p-5 rounded-lg shadow-lg transform hover:scale-103 transition-transform duration-300 text-foreground", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-100")}>
                        <div className="flex items-center mb-2">
                            <Image loading="lazy" src="https://placehold.co/36x36/E2E8F0/1A202C.png?text=AR" alt="Alex R." width={32} height={32} className="rounded-full mr-2.5" data-ai-hint="professional person portrait"/>
                            <div>
                                <h4 className="font-semibold text-foreground text-sm">Alex R.</h4>
                                <p className="text-xs text-muted-foreground">Support Lead</p>
                            </div>
                        </div>
                         <div className="mb-2 flex">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-neon-lime fill-neon-lime mr-0.5"/>)}
                        </div>
                        <p className="text-sm italic text-muted-foreground leading-relaxed">"AutoBoss revolutionized our support, handling 80% of inquiries. A true game-changer."</p>
                    </article>
                    <article ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal bg-gradient-to-br from-electric-teal to-neon-lime p-5 rounded-lg shadow-lg text-background flex flex-col items-center justify-center text-center", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-200")}>
                        <TrendingUp className="w-7 h-7 mb-1 opacity-80"/>
                        <p className="font-headline text-3xl font-bold">97%</p>
                        <p className="text-sm font-medium">Task Automation</p>
                        <Layers className="w-6 h-6 mt-3 mb-1 opacity-80"/>
                        <p className="font-headline text-2xl font-bold">1M+</p>
                        <p className="text-xs">Agents Deployed</p>
                    </article>
                     <article ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal bg-background p-5 rounded-lg shadow-lg transform hover:scale-103 transition-transform duration-300 text-foreground", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-300")}>
                        <div className="flex items-center mb-2">
                             <Image loading="lazy" src="https://placehold.co/36x36/E2E8F0/1A202C.png?text=PS" alt="Priya S." width={32} height={32} className="rounded-full mr-2.5" data-ai-hint="founder startup person portrait"/>
                            <div>
                                <h4 className="font-semibold text-foreground text-sm">Priya S.</h4>
                                <p className="text-xs text-muted-foreground">Founder @ InnovateLLC</p>
                            </div>
                        </div>
                         <div className="mb-2 flex">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-neon-lime fill-neon-lime mr-0.5"/>)}
                        </div>
                        <p className="text-sm italic text-muted-foreground leading-relaxed">"The visual flow builder is incredibly intuitive. Launched our first AI agent in under an hour!"</p>
                    </article>
                </div>
            </div>
        </section>

        <section ref={humanizeRef} className={cn("scroll-reveal section-dark w-full py-16 lg:py-20", humanizeVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="marketing-h2">Built for Breakthroughs</h2>
            <p className="section-description">
              We're dedicated to making sophisticated AI accessible. AutoBoss is your partner in innovation.
            </p>
            <aside ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal max-w-lg mx-auto bg-card p-6 rounded-lg shadow-xl transform hover:scale-103 transition-transform text-card-foreground", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-150")}>
              <p className="italic text-sm text-muted-foreground leading-relaxed">"I started AutoBoss frustrated by clunky automation. My vision: a platform so intuitive, anyone can build truly intelligent AI agents that *actually work*."</p>
              <div className="flex items-center justify-center gap-2.5 mt-3">
                <Image loading="lazy" src="https://placehold.co/40x40/1A202C/E2E8F0.png?text=AC" alt="Alex Chen, Founder (Placeholder)" width={40} height={40} className="rounded-full shadow-md" data-ai-hint="founder portrait friendly modern person" />
                <div>
                  <p className="font-semibold text-sm text-card-foreground">Alex Chen (Placeholder)</p>
                  <p className="text-xs text-primary">Founder & CEO, AutoBoss</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Placeholder for sticky mid-page CTA: JS would be needed for robust show/hide logic based on scroll position */}
        {/* <div className="fixed bottom-10 right-10 z-50 hidden md:block"> <Button>Sticky CTA</Button> </div> */}

        <section ref={finalCtaRef} className={cn("scroll-reveal section-cta-final w-full py-16 lg:py-20", finalCtaVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <div className="mx-auto max-w-lg space-y-4 bg-card/80 dark:bg-background/70 backdrop-blur-md p-6 md:p-10 rounded-xl shadow-2xl">
              <h2 className="marketing-h2 !text-3xl sm:!text-4xl gradient-text-on-dark">
                Start Your AI Journey
              </h2>
              <p className="text-muted-foreground text-sm md:text-base !mb-6">
                AutoBoss is free to try. No credit card needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                <Button size="lg" asChild className="button-active-feedback shadow-xl bg-gradient-to-r from-electric-teal to-neon-lime text-background font-bold text-base px-6 py-3 hover:opacity-90 transition-all duration-300 hover:scale-105 group w-full sm:w-auto pulse-cta-btn btn-interactive">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    Start Building Free
                    <Rocket className="h-5 w-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="button-active-feedback btn-outline-themed transition-all duration-300 hover:scale-105 px-6 py-3 text-base text-primary hover:text-accent-foreground hover:bg-accent hover:border-accent border-muted-foreground/50 bg-background/20 dark:bg-card/20 backdrop-blur-sm w-full sm:w-auto btn-interactive">
                  <Link href="mailto:demo@autoboss.dev?subject=AutoBoss%20Demo%20Request" className="flex items-center gap-1.5">
                    Request a Demo <Eye className="h-5 w-5"/>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-4 border-t border-border/30 bg-background text-center">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-screen-xl">
          <div className="flex items-center gap-2">
             <Link href="/" aria-label="AutoBoss Homepage" className="flex items-center justify-center">
                <Logo className="text-foreground hover:opacity-80 transition-opacity h-6 w-auto" collapsed={false}/>
            </Link>
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} AutoBoss. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-1 sm:mt-0">
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Terms</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Privacy</Link>
            <Link href="mailto:support@autoboss.dev" className="text-xs text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Support</Link>
          </nav>
        </div>
      </footer>
    </div>
    </TooltipProvider>
  );
}


    