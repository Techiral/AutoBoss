
"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Rocket, Eye, Palette, BarChart3, PlayCircle, Star, Menu, X as CloseIcon, ShieldCheck, Smile, TrendingUp, SearchCode, Edit3, Handshake, Info, Layers, LifeBuoy, Users, Filter, UploadCloud, Share2, DollarSign, Store, Users2, Briefcase, BotIcon, LayoutGrid, Settings, UserCheck, AlertTriangle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver || !node) {
      if (node) setIsIntersecting(true); 
      return;
    }
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsIntersecting(true);
    }, options);
    const currentObserver = observerRef.current;
    currentObserver.observe(node);
    return () => { if (node) currentObserver.unobserve(node); };
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
          className={cn("simple-feature-card scroll-reveal", animationDelay, isVisible && "visible")}
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

const heroPainPoint = "AI for Clients."; // Simplified and professional

export default function MarketingPageClient() {
  const typewriterRef = useRef<HTMLSpanElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [earlyAccessSpotsLeft] = useState(73); // Placeholder for dynamic counter, more believable number

  useEffect(() => {
    const handleScroll = () => setIsHeaderScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typewriterRef.current) {
      typewriterRef.current.textContent = heroPainPoint;
      typewriterRef.current.classList.remove("typewriter-text");
      void typewriterRef.current.offsetWidth; 
      typewriterRef.current.classList.add("typewriter-text");
    }
  }, []); 

  const observerOptions = { threshold: 0.1 };
  const [heroRef, heroVisible] = useIntersectionObserver(observerOptions);
  const [whyPathRef, whyPathVisible] = useIntersectionObserver(observerOptions);
  const [toolkitRef, toolkitVisible] = useIntersectionObserver(observerOptions);
  const [howItWorksRef, howItWorksVisible] = useIntersectionObserver(observerOptions);
  const [promiseRef, promiseVisible] = useIntersectionObserver(observerOptions);
  const [finalCtaRef, finalCtaVisible] =  useIntersectionObserver(observerOptions);
  const [videoDemoRef, videoDemoVisible] = useIntersectionObserver(observerOptions);
  const [socialProofRef, socialProofVisible] = useIntersectionObserver(observerOptions);


  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const navLinks = [
    { href: "#why-autoboss", label: "Why AutoBoss?" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#early-access", label: "Free Early Access" },
  ];

    const socialProofItems = [
    {
      type: "testimonial",
      image: "https://placehold.co/32x32/6366F1/FFFFFF.png?text=SK&font=nunito", alt: "Sarah K.", name: "Sarah K.", role: "Aspiring Agency Owner",
      quote: "I was intimidated by 'AI,' but AutoBoss made it click. I'm now building real solutions for small businesses, and it feels amazing to offer something so valuable.",
      delay: "delay-100",
      aiHint: "happy entrepreneur woman modern"
    },
    {
      type: "metric",
      metrics: [ { icon: <SearchCode className="w-5 h-5 sm:w-6 sm:h-6 mb-1 opacity-80"/>, value: "Zero", label: "Code Required" }, { icon: <Layers className="w-4 h-4 sm:w-5 sm:w-5 mt-2 mb-1 opacity-80"/>, value: "Client", label: "Workspaces" } ],
      delay: "delay-200",
      aiHint: "simple interface client management"
    },
    {
      type: "testimonial",
      image: "https://placehold.co/32x32/10B981/FFFFFF.png?text=DL&font=nunito", alt: "David L.", name: "David L.", role: "Freelancer Adding AI Services",
      quote: "AutoBoss is the perfect tool to expand my offerings. Building custom AI agents for my existing clients has been surprisingly straightforward and profitable.",
      delay: "delay-300",
      aiHint: "professional freelancer man smiling"
    }
  ];


  return (
    <TooltipProvider>
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <header className={cn("w-full px-4 lg:px-6 h-14 sm:h-16 flex items-center sticky-header z-50", isHeaderScrolled && "sticky-header-scrolled")}>
        <div className="container mx-auto flex items-center justify-between max-w-screen-xl">
          <Link href="/" className="flex items-center justify-center" aria-label="AutoBoss Homepage">
            <Logo className="text-foreground hover:opacity-80 transition-opacity h-7 sm:h-8 w-auto" />
          </Link>
          <nav className="hidden md:flex gap-1 sm:gap-2 items-center">
            {navLinks.map(link => (
               <Link key={link.href} href={link.href} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1" prefetch={false}>{link.label}</Link>
            ))}
            <Button variant="outline" size="sm" asChild className="btn-outline-themed transition-colors btn-interactive text-xs ml-2">
              <Link href="/login" className="flex items-center gap-1">Login</Link>
            </Button>
            <Button size="sm" asChild className="btn-gradient-primary font-semibold shadow-md hover:opacity-90 transition-opacity btn-interactive text-xs">
              <Link href="/dashboard" className="flex items-center gap-1">
                 Join Early Access <ArrowRight className="h-4 w-4"/>
              </Link>
            </Button>
          </nav>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu" onClick={toggleMobileMenu} className="btn-interactive h-8 w-8 sm:h-9 sm:w-9">
               {isMobileMenuOpen ? <CloseIcon className="h-5 w-5 text-foreground"/> : <Menu className="h-5 w-5 text-foreground"/>}
            </Button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={cn(
          "md:hidden fixed top-14 sm:top-16 right-0 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] w-60 bg-card shadow-xl z-40 p-5 space-y-2 transform transition-all duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="block py-1.5 text-sm text-card-foreground hover:text-primary" onClick={toggleMobileMenu}>{link.label}</Link>
          ))}
          <Link href="/login" className="block py-1.5 text-sm text-card-foreground hover:text-primary" onClick={toggleMobileMenu}>Login</Link>
          <Button asChild className="w-full btn-gradient-primary font-semibold shadow-md hover:opacity-90 transition-opacity btn-interactive text-sm mt-2">
            <Link href="/dashboard" onClick={toggleMobileMenu} className="flex items-center justify-center gap-1">
              Join Early Access
            </Link>
          </Button>
      </div>

      <main className="flex-1">
        <section ref={heroRef} className={cn("scroll-reveal section-dark w-full min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center text-center py-10 md:py-12 relative overflow-hidden", heroVisible && "visible")}>
          <div className="absolute inset-0 z-0 opacity-[0.02]">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover" poster="https://placehold.co/1920x1080/0A0F14/0A0F14.png" data-ai-hint="dark abstract particles subtle motion professional">
              <source src="https://placehold.co/1920x1080.mp4?text=." type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-transparent to-background/50"></div>
          </div>
          <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-screen-xl">
            <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
              <h1 className="marketing-h1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-center">
                Launch Your AI Agency.
                <span className="block mt-1 sm:mt-2">AutoBoss Makes it Simple.</span>
                <span ref={typewriterRef} className="block mt-1 sm:mt-2 typewriter-text gradient-text-on-dark min-h-[1.2em] text-2xl sm:text-3xl md:text-4xl"></span>
              </h1>
              <Alert variant="default" className="max-w-lg mx-auto bg-accent/10 dark:bg-accent/20 border-accent/30 text-accent p-3 my-3 sm:my-4">
                  <Star className="h-4 w-4 text-accent" />
                  <AlertTitle className="font-semibold text-sm sm:text-base">Early Adopter Program: FREE Full Access!</AlertTitle>
                  <AlertDescription className="text-xs">
                      Join our founding users and get the complete AutoBoss platform free. Help shape the tool, build your AI agency, and deliver value to clients with no software costs. (Limited Spots: {earlyAccessSpotsLeft} remaining)
                  </AlertDescription>
              </Alert>
              <p className="section-description text-sm sm:text-base max-w-lg mx-auto !mb-5 md:!mb-6">
                Intrigued by "AI Automation Agencies" but unsure where to start? AutoBoss is your straightforward path. Create & sell AI agents to businesses—<strong className="text-foreground">no coding, no complex setups</strong>. Just tangible solutions and the potential for real income.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-1">
                <Button size="lg" asChild className="btn-gradient-primary shadow-lg font-bold text-sm px-6 py-2.5 sm:py-3 hover:opacity-90 transition-all duration-300 hover:scale-105 group btn-interactive w-full sm:w-auto">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    Join Free Early Access (Spots Filling!)
                    <Rocket className="h-4 w-4 sm:h-5 sm:h-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
                 <Button size="lg" variant="outline" asChild className="btn-outline-themed transition-all duration-300 hover:scale-105 px-6 py-2.5 text-sm border-muted-foreground/40 text-primary hover:text-accent-foreground hover:bg-accent hover:border-accent bg-background/10 backdrop-blur-sm btn-interactive w-full sm:w-auto">
                  <Link href="#how-it-works" className="flex items-center gap-1.5">
                    See How It Works <Eye className="h-4 w-4 sm:h-5 sm:h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section ref={whyPathRef} id="why-autoboss" className={cn("scroll-reveal section-light-accent w-full py-12 md:py-16 lg:py-20 border-b border-border/50", whyPathVisible && "visible")}>
            <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
                <h2 className="marketing-h2 text-card-foreground">Your Accessible Path to Offering AI Solutions.</h2>
                 <p className="section-description !mb-6 md:!mb-8">
                  AutoBoss removes the usual tech hurdles, making AI agency services achievable for anyone ready to help businesses.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 max-w-4xl mx-auto">
                  {[
                    { icon: <UserCheck className="w-5 h-5" />, title: "No-Code Simplicity", description: "Build sophisticated AI agents without writing a single line of code. If you can navigate a web app, you can use AutoBoss.", hint: "easy user interface for AI", delay: "delay-100" },
                    { icon: <Handshake className="w-5 h-5" />, title: "Client-Focused Solutions", description: "Create AI agents that solve real problems for businesses: customer support, lead generation, information access, and more.", hint: "client meeting handshake deal", delay: "delay-200" },
                    { icon: <DollarSign className="w-5 h-5" />, title: "Build Your Business", description: "AutoBoss is your toolkit. You define your services, set your prices, and build your agency. We provide the platform.", hint: "business growth graph chart", delay: "delay-300" },
                  ].map((item, index) => {
                    const [cardRef, cardIsVisible] = useIntersectionObserver({ threshold: 0.2 });
                    return (
                      <div ref={cardRef} key={index} className={cn("scroll-reveal bg-background p-4 sm:p-5 rounded-lg shadow-lg text-left transform hover:scale-105 transition-transform duration-300", item.delay, cardIsVisible && "visible")}>
                        <div className="p-2 rounded-lg bg-primary/10 text-primary mb-2 inline-block" data-ai-hint={item.hint}>
                          {item.icon}
                        </div>
                        <h3 className="font-headline text-md sm:text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    );
                  })}
                </div>
            </div>
        </section>

        <section ref={toolkitRef} id="features" className={cn("scroll-reveal section-dark w-full py-12 md:py-16 lg:py-20", toolkitVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="marketing-h2">Your AI Agency Toolkit - Designed for Clarity</h2>
            <p className="section-description">
              AutoBoss provides everything you need to build and manage AI agents for your clients, presented simply.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 max-w-3xl mx-auto text-left">
              <SimpleFeatureCard
                icon={<Briefcase className="w-5 h-5"/>}
                title="Client Workspaces"
                description="Organize all your projects seamlessly. Each client gets a dedicated workspace for their agents and settings."
                caseStudy={{ quote: "Managing multiple clients is now so much clearer.", metric: "Effortless Organization", author: "Agency Owner" }}
                animationDelay="delay-100"
              />
              <SimpleFeatureCard
                icon={<BotIcon className="w-5 h-5"/>}
                title="Versatile Agent Builder"
                description="Create diverse AI agents: text-based chatbots, voice-enabled assistants, or agents that learn from client-specific data."
                caseStudy={{ quote: "I can build exactly what my client needs.", metric: "Flexible Creation", author: "AutoBoss User" }}
                animationDelay="delay-200"
              />
              <SimpleFeatureCard
                icon={<UploadCloud className="w-5 h-5"/>}
                title="Client-Specific Training"
                description="Easily train agents on your client's documents, website content, or CSV data to ensure accurate, relevant responses."
                caseStudy={{ quote: "The agent truly understood my client's business.", metric: "Targeted Knowledge", author: "Consultant" }}
                animationDelay="delay-300"
              />
              <SimpleFeatureCard
                icon={<Palette className="w-5 h-5"/>}
                title="AI-Assisted Branding"
                description="Our AI helps you craft agent names and personas that align perfectly with your client's brand identity."
                caseStudy={{ quote: "My client was impressed by the on-brand agent.", metric: "Professional Polish", author: "Marketing Specialist" }}
                animationDelay="delay-400"
              />
            </div>
          </div>
        </section>

        <section ref={howItWorksRef} id="how-it-works" className={cn("scroll-reveal section-light-accent w-full py-12 md:py-16 lg:py-20", howItWorksVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="marketing-h2 text-card-foreground">From Idea to Client Agent: A Clear Path</h2>
            <p className="section-description">
              AutoBoss streamlines the process of delivering AI solutions for businesses.
            </p>
            <div className="relative mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 items-stretch step-card-container">
                {[
                    { number: "1", title: "Set Up Your Client", description: "Create a workspace for your client in AutoBoss. Add their basic details to keep things organized.", icon: <Users2 className="w-5 h-5 text-electric-teal"/>, animationDelay:"delay-100", hint: "client management dashboard simple" },
                    { number: "2", title: "Build Their AI Agent", description: "Use our no-code builder. Define the agent's purpose (support, sales, info) and how it should interact (chat/voice).", icon: <Edit3 className="w-5 h-5 text-neon-lime"/>, animationDelay:"delay-150", hint: "agent creation interface easy" },
                    { number: "3", title: "Train & Deploy", description: "Upload client-specific information. Test the agent. Then, deploy it for your client with a simple embed code or link.", icon: <Share2 className="w-5 h-5 text-primary"/>, animationDelay:"delay-200", hint: "deploy website code simple" },
                ].map((step, index, arr) => {
                  const [stepRef, stepIsVisible] = useIntersectionObserver({ threshold: 0.3 });
                  return (
                    <div key={step.title} ref={stepRef} className={cn("relative scroll-reveal", step.animationDelay, (index === 0 || index === 1) ? "md:dashed-connector md:right" : "", stepIsVisible && "visible")}>
                      <article className={cn("relative flex flex-col items-center gap-2 p-4 sm:p-5 rounded-lg bg-background shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-foreground z-10 h-full")}>
                          <div className="absolute -top-3 bg-gradient-to-br from-electric-teal to-neon-lime text-background text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-card shadow-md">{step.number}</div>
                          <div className="mt-5 mb-1" data-ai-hint={step.hint}>{step.icon}</div>
                          <h3 className="font-headline text-md sm:text-lg font-semibold text-center">{step.title}</h3>
                          <p className="text-xs text-muted-foreground text-center leading-relaxed">{step.description}</p>
                      </article>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
        
        <section ref={videoDemoRef} id="video-demo-placeholder" className={cn("scroll-reveal section-dark w-full py-12 md:py-16 lg:py-20 text-center", videoDemoVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 max-w-screen-xl">
            <h2 className="marketing-h2">See AutoBoss in Action: Quick Demo</h2>
            <p className="section-description mt-1 mb-6">Watch how easily you can set up a client and build their first AI agent using AutoBoss.</p>
            <div className="max-w-2xl mx-auto aspect-video bg-muted/20 rounded-lg shadow-xl flex items-center justify-center text-muted-foreground border border-border/50 relative overflow-hidden cursor-pointer group" data-ai-hint="clean video player interface dark theme">
                <Image src="https://placehold.co/1280x720/0A0D13/0A0D13.png" alt="AutoBoss Platform Demo Video Thumbnail" layout="fill" objectFit="cover" className="opacity-20 group-hover:opacity-10 transition-opacity" data-ai-hint="dark theme agency software thumbnail" loading="lazy"/>
                <div className="video-placeholder-text z-10">
                     <PlayCircle size={40} className="sm:size-50 text-primary cursor-pointer group-hover:scale-110 group-hover:text-neon-lime transition-all duration-300"/>
                     <p className="mt-2 text-xs font-semibold">Watch: Create a Client Agent in Minutes (No Code)</p>
                </div>
            </div>
          </div>
        </section>

        <section ref={socialProofRef} id="proof" className={cn("scroll-reveal section-light-accent w-full py-12 md:py-16 lg:py-20", socialProofVisible && "visible")}>
            <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
                <h2 className="marketing-h2 text-card-foreground">Trusted by Aspiring AI Agency Builders</h2>
                 <p className="section-description">Hear from early users who are already leveraging AutoBoss.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto text-left">
                    {socialProofItems.map((item, index) => {
                      const [cardRef, cardIsVisible] = useIntersectionObserver({ threshold: 0.2 });
                      return (
                       <article ref={cardRef} key={index} className={cn("scroll-reveal transform hover:scale-103 transition-transform duration-300",
                         item.delay, cardIsVisible && "visible",
                         item.type === 'testimonial' ? "bg-background p-4 sm:p-5 rounded-lg shadow-lg text-foreground" :
                         "bg-gradient-to-br from-electric-teal to-neon-lime p-4 sm:p-5 rounded-lg shadow-lg text-background flex flex-col items-center justify-center text-center")}
                         data-ai-hint={item.aiHint || (item.type === 'testimonial' ? 'user review card design' : 'feature metrics card design')}
                         >
                        {item.type === 'testimonial' ? (
                            <>
                                <div className="flex items-center mb-2">
                                    <Image loading="lazy" src={item.image!} alt={item.alt!} width={28} height={28} className="rounded-full mr-2" data-ai-hint="professional user avatar neutral"/>
                                    <div>
                                        <h4 className="font-semibold text-foreground text-xs">{item.name}</h4>
                                        <p className="text-xs text-muted-foreground">{item.role}</p>
                                    </div>
                                </div>
                                <div className="mb-2 flex">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-neon-lime fill-neon-lime mr-0.5"/>)}
                                </div>
                                <p className="text-xs italic text-muted-foreground leading-relaxed">{item.quote}</p>
                            </>
                        ) : (
                           item.metrics?.map((metric, mIndex) => (
                               <React.Fragment key={mIndex}>
                                   {metric.icon}
                                   <p className={cn("font-headline font-bold", mIndex === 0 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl")}>{metric.value}</p>
                                   <p className={cn("text-xs font-medium", mIndex === 0 ? "mb-2" : "")}>{metric.label}</p>
                               </React.Fragment>
                           ))
                        )}
                    </article>
                    );
                    })}
                </div>
            </div>
        </section>

        <section ref={promiseRef} id="early-access" className={cn("scroll-reveal section-dark w-full py-12 md:py-16 lg:py-20", promiseVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="marketing-h2">The AutoBoss Early Adopter Program</h2>
            <Alert variant="default" className="max-w-xl mx-auto bg-card/90 dark:bg-card/80 border-border/70 p-4 my-4 sm:my-6 text-left">
                  <Star className="h-5 w-5 text-accent" />
                  <AlertTitle className="font-semibold text-base sm:text-lg text-accent">Join Free & Shape the Future!</AlertTitle>
                  <AlertDescription className="text-xs text-card-foreground/90">
                     We're offering <strong className="text-foreground">complimentary full platform access</strong> to our first {earlyAccessSpotsLeft} early adopters.
                     This is an opportunity to build your AI agency with zero software costs and provide feedback that directly influences AutoBoss development.
                     This program helps us grow a strong community. Once these spots are filled, AutoBoss will transition to a subscription model.
                     <strong className="text-foreground"> Secure your free access while it lasts!</strong>
                  </AlertDescription>
              </Alert>
            <aside className={cn(
                "max-w-lg mx-auto bg-card p-5 sm:p-6 rounded-lg shadow-xl transform hover:scale-103 transition-transform text-card-foreground delay-150"
            )}>
              <p className="italic text-sm text-muted-foreground leading-relaxed">"Our goal is to make AI agency services accessible to everyone. AutoBoss provides the simplest, most direct path to building and selling AI solutions, regardless of your technical background. Join us, and let's build this together."</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Image loading="lazy" src="https://placehold.co/36x36/1A202C/E2E8F0.png?text=AB&font=nunito" alt="AutoBoss Team" width={32} height={32} className="rounded-full shadow-md" data-ai-hint="modern team logo mark"/>
                <div>
                  <p className="font-semibold text-xs text-card-foreground">The AutoBoss Team</p>
                  <p className="text-xs text-primary">Your Partner in AI Success</p>
                </div>
              </div>
            </aside>
          </div>
        </section>
        
        <section ref={finalCtaRef} className={cn("scroll-reveal section-cta-final w-full py-12 md:py-16 lg:py-20", finalCtaVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <div className="mx-auto max-w-md space-y-3 bg-card/80 dark:bg-background/70 backdrop-blur-md p-5 sm:p-6 md:p-8 rounded-xl shadow-2xl">
              <h2 className="marketing-h2 !text-2xl sm:!text-3xl text-gradient-dynamic">
                Ready to Build Your AI Agency?
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm !mb-5">
                This is your opportunity. AutoBoss simplifies creating AI solutions for clients. 
                <strong className="text-foreground"> Join our Free Early Adopter Program – spots are limited.</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-1">
                <Button size="lg" asChild className="btn-gradient-primary shadow-xl font-bold text-sm px-6 py-2.5 hover:opacity-90 transition-all duration-300 hover:scale-105 group w-full sm:w-auto btn-interactive">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    Claim Your Free Early Access Now! ({earlyAccessSpotsLeft} Spots Left)
                    <Rocket className="h-4 w-4 sm:h-5 sm:h-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-2">No credit card required for the Early Adopter Program.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-3 border-t border-border/30 bg-background text-center">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-1 max-w-screen-xl">
          <div className="flex items-center gap-2">
             <Link href="/" aria-label="AutoBoss Homepage" className="flex items-center justify-center">
                <Logo className="text-foreground hover:opacity-80 transition-opacity h-4 sm:h-5 w-auto" collapsed={false}/>
            </Link>
            <p className="text-[10px] text-muted-foreground">&copy; {new Date().getFullYear()} AutoBoss. AI Agency Platform.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-1 sm:gap-2 mt-1 sm:mt-0">
            <Link href="#" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Terms</Link>
            <Link href="#" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Privacy</Link>
            <Link href="/support" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Support</Link>
          </nav>
        </div>
      </footer>
    </div>
    </TooltipProvider>
  );
}

