
"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Rocket, Eye, Palette, BarChart3, PlayCircle, Star, Menu, X as CloseIcon, ShieldCheck, Smile, TrendingUp, SearchCode, Edit3, Handshake, Info, Layers, LifeBuoy, Users, Filter, UploadCloud, Share2, DollarSign, Store, Users2, Briefcase, BotIcon, LayoutGrid, Settings, UserCheck, AlertTriangle, BookOpen, MessageSquarePlus, GitFork, Gauge, Languages, CheckCircle, Users as ClientIcon, Lightbulb } from "lucide-react";
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

interface SimpleBenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  animationDelay?: string;
}

const SimpleBenefitCard: React.FC<SimpleBenefitCardProps> = ({ icon, title, description, animationDelay }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      className={cn("scroll-reveal bg-background p-4 sm:p-5 rounded-lg shadow-lg text-left transform hover:scale-105 transition-transform duration-300", animationDelay, isVisible && "visible")}
    >
      <div className="p-2 rounded-lg bg-primary/10 text-primary mb-2 inline-block">
        {icon}
      </div>
      <h3 className="simple-benefit-card-title">{title}</h3>
      <p className="simple-benefit-card-description">{description}</p>
    </div>
  );
};

const heroTypewriterText = "Build AI. Serve Clients. Earn."; // 30 chars

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
      typewriterRef.current.textContent = heroTypewriterText; 
      typewriterRef.current.classList.remove("typewriter-text"); 
      void typewriterRef.current.offsetWidth; 
      typewriterRef.current.classList.add("typewriter-text"); 
    }
  }, []);

  const observerOptions = { threshold: 0.1 };
  const [heroRef, heroVisible] = useIntersectionObserver(observerOptions);
  const [valueRef, valueVisible] = useIntersectionObserver(observerOptions);
  const [toolkitRef, toolkitVisible] = useIntersectionObserver(observerOptions);
  const [howItWorksRef, howItWorksVisible] = useIntersectionObserver(observerOptions);
  const [earlyAccessRef, earlyAccessVisible] = useIntersectionObserver(observerOptions);
  const [finalCtaRef, finalCtaVisible] =  useIntersectionObserver(observerOptions);
  const [videoDemoRef, videoDemoVisible] = useIntersectionObserver(observerOptions);
  const [socialProofRef, socialProofVisible] = useIntersectionObserver(observerOptions);


  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const navLinks = [
    { href: "#value", label: "How It Helps" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "/roadmap", label: "Roadmap" },
  ];

  const socialProofItems = [
    {
      type: "testimonial", image: "https://placehold.co/32x32/6366F1/FFFFFF.png?text=MK", alt: "Maria K.", name: "Maria K.",
      quote: "I'm not techy, but AutoBoss made creating an FAQ bot easy. My bakery client loves it!", delay: "delay-100", aiHint: "woman diverse business"
    },
    {
      type: "metric", metrics: [ { icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6 mb-1 opacity-80"/>, value: "No Code Needed.", label: "AI, Simplified." }, { icon: <ClientIcon className="w-4 h-4 sm:w-5 sm:w-5 mt-2 mb-1 opacity-80"/>, value: "Client Solutions.", label: "Real Business Value." } ],
      delay: "delay-200", aiHint: "dashboard ui modern"
    },
    {
      type: "testimonial", image: "https://placehold.co/32x32/10B981/FFFFFF.png?text=JP", alt: "James P.", name: "James P.",
      quote: "Needed a way to offer AI services. AutoBoss got me started with my first client fast.", delay: "delay-300", aiHint: "consultant portrait"
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
                 Start Building (Free Access) <ArrowRight className="h-4 w-4"/>
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
              Start Building (Free Access)
            </Link>
          </Button>
      </div>

      <main className="flex-1">
        <section ref={heroRef} className={cn("scroll-reveal section-dark w-full min-h-[calc(80vh-3.5rem)] sm:min-h-[calc(80vh-4rem)] flex items-center justify-center text-center py-10 md:py-12 relative overflow-hidden", heroVisible && "visible")}>
          <div className="absolute inset-0 z-0 opacity-[0.02]">
             <video autoPlay loop muted playsInline className="w-full h-full object-cover" poster="https://placehold.co/1920x1080/0A0F14/0A0F14.png" data-ai-hint="dark abstract particles subtle motion professional">
              <source src="https://placehold.co/1920x1080.mp4?text=." type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-transparent to-background/50"></div>
          </div>
          <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-screen-xl">
            <div className="max-w-2xl mx-auto space-y-3 md:space-y-4">
              <h1 className="marketing-h1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-center">
                Create AI for Your Clients. Simply.
              </h1>
              <span ref={typewriterRef} className="block mt-1 sm:mt-2 typewriter-text gradient-text-on-dark min-h-[1.2em] text-2xl sm:text-3xl md:text-4xl">{heroTypewriterText}</span>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto !mb-5 md:!mb-6">
                AutoBoss gives you clear tools to build AI agents for businesses—no coding needed. Ready to start your AI agency?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-1">
                <Button size="lg" asChild className="btn-gradient-primary shadow-lg font-bold text-sm px-6 py-2.5 sm:py-3 hover:opacity-90 transition-all duration-300 hover:scale-105 group btn-interactive w-full sm:w-auto">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    Explore Platform (Free Access)
                    <Rocket className="h-4 w-4 sm:h-5 sm:h-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
                 <Button size="lg" variant="outline" asChild className="btn-outline-themed transition-all duration-300 hover:scale-105 px-6 py-2.5 text-sm border-muted-foreground/40 text-primary hover:text-accent-foreground hover:bg-accent hover:border-accent bg-background/10 backdrop-blur-sm btn-interactive w-full sm:w-auto">
                  <Link href="#how-it-works" className="flex items-center gap-1.5">
                    How It Works <Eye className="h-4 w-4 sm:h-5 sm:h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section ref={valueRef} id="value" className={cn("scroll-reveal section-light-accent w-full py-12 md:py-16 lg:py-20 border-b border-border/50", valueVisible && "visible")}>
            <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
                <h2 className="marketing-h2 text-card-foreground">Starting Your AI Agency: We Can Help.</h2>
                 <p className="section-description !mb-6 md:!mb-8">
                  AutoBoss provides straightforward tools to build valuable AI solutions for businesses.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 max-w-3xl mx-auto">
                  <SimpleBenefitCard icon={<Zap className="w-5 h-5" />} title="No Coding Needed." description="You don't need to be a programmer. AutoBoss handles the technical parts for building AI." animationDelay="delay-100"/>
                  <SimpleBenefitCard icon={<ClientIcon className="w-5 h-5" />} title="Focus on Clients." description="Create AI solutions that businesses find genuinely useful and solve their actual problems." animationDelay="delay-200"/>
                  <SimpleBenefitCard icon={<Rocket className="w-5 h-5" />} title="A Clearer Start." description="We provide a structured and understandable way to begin offering AI services to clients." animationDelay="delay-300"/>
                </div>
            </div>
        </section>

        <section ref={toolkitRef} id="toolkit" className={cn("scroll-reveal section-dark w-full py-12 md:py-16 lg:py-20", toolkitVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="marketing-h2">Inside AutoBoss: Tools for Your Agency.</h2>
            <p className="section-description">
              Key features to help you manage client projects and build effective AI agents.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-4xl mx-auto text-left">
              <SimpleBenefitCard icon={<Briefcase className="w-5 h-5"/>} title="Organized Client Workspaces." description="Keep each client's agents, data, and settings separate and easy to manage." animationDelay="delay-100" />
              <SimpleBenefitCard icon={<BotIcon className="w-5 h-5"/>} title="Flexible AI Agent Creation." description="Build text chatbots or voice agents. Train them with specific knowledge or let them be more general." animationDelay="delay-200" />
              <SimpleBenefitCard icon={<UploadCloud className="w-5 h-5"/>} title="Simple AI Training Process." description="Use your client's documents (PDFs, DOCX, CSVs) or website content to teach the AI." animationDelay="delay-300" />
              <SimpleBenefitCard icon={<Share2 className="w-5 h-5"/>} title="Easy Agent Deployment." description="Get AI agents live for your clients using simple embed codes or direct links." animationDelay="delay-400" />
            </div>
          </div>
        </section>

        <section ref={howItWorksRef} id="how-it-works" className={cn("scroll-reveal section-light-accent w-full py-12 md:py-16 lg:py-20", howItWorksVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="marketing-h2 text-card-foreground">Your Path to Delivering AI Solutions.</h2>
            <p className="section-description">
              A straightforward process to create and provide AI solutions for your clients using AutoBoss.
            </p>
            <div className="relative mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 items-stretch step-card-container">
                {[
                    { number: "1", title: "Set Up Client Workspace", description: "Create a dedicated area in AutoBoss for each new client project. Keeps things organized.", icon: <Users2 className="w-5 h-5 text-electric-teal"/>, animationDelay:"delay-100", hint: "client setup icon" },
                    { number: "2", title: "Design Their AI Agent", description: "Choose chat or voice. Define what the agent needs to do for the client. No coding involved.", icon: <Edit3 className="w-5 h-5 text-neon-lime"/>, animationDelay:"delay-150", hint: "ai agent building icon" },
                    { number: "3", title: "Launch & Support Client", description: "Get the AI agent working. You provide the service and ongoing support for your client.", icon: <CheckCircle className="w-5 h-5 text-primary"/>, animationDelay:"delay-200", hint: "launch success checkmark" },
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
            <h2 className="marketing-h2">See AutoBoss in Action.</h2>
            <p className="section-description mt-1 mb-6">A quick look at how an AI agent is built using the AutoBoss platform.</p>
            <div className="max-w-2xl mx-auto aspect-video bg-muted/20 rounded-lg shadow-xl flex items-center justify-center text-muted-foreground border border-border/50 relative overflow-hidden cursor-pointer group" data-ai-hint="clean video player interface dark theme">
                <Image src="https://placehold.co/1280x720/0A0D13/0A0D13.png" alt="AutoBoss Platform Demo Video Thumbnail" layout="fill" objectFit="cover" className="opacity-20 group-hover:opacity-10 transition-opacity" data-ai-hint="dark theme agency software thumbnail" loading="lazy"/>
                <div className="video-placeholder-text z-10">
                     <PlayCircle size={40} className="sm:size-50 text-primary cursor-pointer group-hover:scale-110 group-hover:text-neon-lime transition-all duration-300"/>
                     <p className="mt-2 text-xs font-semibold">Watch: Building an AI Agent with AutoBoss</p>
                </div>
            </div>
          </div>
        </section>

        <section ref={socialProofRef} id="proof" className={cn("scroll-reveal section-light-accent w-full py-12 md:py-16 lg:py-20", socialProofVisible && "visible")}>
            <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
                <h2 className="marketing-h2 text-card-foreground">From Our Early Community:</h2>
                 <p className="section-description">Users are finding AutoBoss helpful for their AI agency goals.</p>
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

        <section ref={earlyAccessRef} id="early-access" className={cn("scroll-reveal section-dark w-full py-12 md:py-16 lg:py-20", earlyAccessVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="marketing-h2">Our Early Adopter Program.</h2>
            <div className="max-w-xl mx-auto bg-card/90 dark:bg-card/80 border-border/70 p-4 my-4 sm:my-6 text-left rounded-lg">
              <p className="text-sm text-card-foreground/90">
                 AutoBoss is currently available for free through our Early Adopter Program. We're looking for users like you to help us build the best possible platform for AI agencies. Your feedback is incredibly valuable. Future access will involve subscription plans.
                 <Link href="/roadmap" className="font-semibold text-accent hover:underline ml-1">See our roadmap and share your thoughts!</Link>
              </p>
            </div>
            <aside className={cn(
                "max-w-sm mx-auto bg-card p-5 sm:p-6 rounded-lg shadow-xl transform hover:scale-103 transition-transform text-card-foreground delay-150"
            )}>
              <p className="italic text-xs text-muted-foreground leading-relaxed">"We're building AutoBoss to be a genuinely helpful tool. Your success helps us grow too."</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Image loading="lazy" src="https://placehold.co/36x36/1A202C/E2E8F0.png?text=AB&font=nunito" alt="AutoBoss Team" width={32} height={32} className="rounded-full shadow-md" data-ai-hint="modern team logo mark"/>
                <div>
                  <p className="font-semibold text-xs text-card-foreground">The AutoBoss Team</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section ref={finalCtaRef} className={cn("scroll-reveal section-cta-final w-full py-12 md:py-16 lg:py-20", finalCtaVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <div className="mx-auto max-w-md space-y-3 bg-card/80 dark:bg-background/70 backdrop-blur-md p-5 sm:p-6 md:p-8 rounded-xl shadow-2xl">
              <h2 className="marketing-h2 !text-2xl sm:!text-3xl text-gradient-dynamic">
                Ready to Build AI for Businesses?
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm !mb-5">
                Explore AutoBoss today. Create AI agents for clients with our clear tools. Free during our Early Adopter program.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-1">
                <Button size="lg" asChild className="btn-gradient-primary shadow-xl font-bold text-sm px-6 py-2.5 hover:opacity-90 transition-all duration-300 hover:scale-105 group w-full sm:w-auto btn-interactive">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    Get Started (Free Access)
                    <Rocket className="h-4 w-4 sm:h-5 sm:h-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-2">No credit card needed for early access.</p>
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
            <p className="text-[10px] text-muted-foreground">&copy; {new Date().getFullYear()} AutoBoss.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-1 sm:gap-2 mt-1 sm:mt-0">
            <Link href="/roadmap" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Roadmap</Link>
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

    