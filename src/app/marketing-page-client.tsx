
"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Rocket, Eye, Palette, BarChart3, PlayCircle, Star, Menu, X as CloseIcon, ShieldCheck, Smile, TrendingUp, SearchCode, Edit3, Handshake, Info, Layers, LifeBuoy, Users, Filter, UploadCloud, Share2, DollarSign, Store, Users2, Briefcase, BotIcon, LayoutGrid, Settings, UserCheck, AlertTriangle, BookOpen, MessageSquarePlus, GitFork, Gauge, Languages, CheckCircle, Lightbulb, Book, PackageSearch, MessageSquare, PhoneCall } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { BoltBadge } from '@/components/bolt-badge';

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
      <h3 className="font-headline text-base sm:text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default function MarketingPageClient() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsHeaderScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    { href: "/showcase", label: "Agent Showcase" },
    { href: "/playbook", label: "Client Playbook" },
    { href: "/templates", label: "AI Jobs" },
    { href: "/support", label: "Help Center" },
  ];

  const socialProofItems = [
    {
      type: "testimonial", image: "https://placehold.co/32x32.png", alt: "Maria K.", name: "Maria K., Bakery Client's Friend",
      quote: "Helped a friend set up an FAQ bot for her bakery using AutoBoss. Much easier than I thought, and she's thrilled! Finally, something that makes AI simple for everyday businesses.", delay: "delay-100", aiHint: "woman diverse business"
    },
    {
      type: "metric", metrics: [ { icon: <Zap className="w-5 h-5 sm:w-6 sm:w-6 mb-1 opacity-80"/>, value: "AI, Made Easy.", label: "No Coding. Ever." }, { icon: <ClientIcon className="w-4 h-4 sm:w-5 sm:w-5 mt-2 mb-1 opacity-80"/>, value: "Client-Focused.", label: "Real Business Solutions." } ],
      delay: "delay-200", aiHint: "dashboard ui modern"
    },
    {
      type: "testimonial", image: "https://placehold.co/32x32.png", alt: "James P.", name: "James P., New AI Agency Owner",
      quote: "Wanted to offer AI services but was overwhelmed. AutoBoss's 'World's First Starter Kit' claim is legit – it gave me a clear path to my first paying client.", delay: "delay-300", aiHint: "consultant portrait"
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
            <Button variant="outline" size="sm" asChild className="transition-colors text-xs ml-2">
              <Link href="/login" className="flex items-center gap-1">Login</Link>
            </Button>
            <Button size="sm" asChild className="font-semibold shadow-md hover:opacity-90 transition-opacity text-xs">
              <Link href="/dashboard" className="flex items-center gap-1">
                 Start Building (Free Access) <ArrowRight className="h-4 w-4"/>
              </Link>
            </Button>
          </nav>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu" onClick={toggleMobileMenu} className="h-8 w-8 sm:h-9 sm:w-9">
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
          <Button asChild className="w-full font-semibold shadow-md hover:opacity-90 transition-opacity text-sm mt-2">
            <Link href="/dashboard" onClick={toggleMobileMenu} className="flex items-center justify-center gap-1">
              Start Building (Free Access)
            </Link>
          </Button>
      </div>

      <main className="flex-1">
        <section ref={heroRef} className={cn("scroll-reveal w-full min-h-[calc(80vh-3.5rem)] sm:min-h-[calc(70vh-4rem)] flex items-center justify-center text-center py-10 md:py-12 relative overflow-hidden", heroVisible && "visible")}>
          <div className="absolute inset-0 z-0 opacity-[0.02]">
             <video autoPlay loop muted playsInline className="w-full h-full object-cover" poster="https://placehold.co/1920x1080.png" data-ai-hint="dark abstract particles subtle motion professional">
              <source src="https://placehold.co/1920x1080.mp4?text=." type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-transparent to-background/50"></div>
          </div>
          <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-screen-xl">
            <div className="max-w-2xl mx-auto space-y-3 md:space-y-4">
              <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-center font-bold tracking-tight text-primary">
                Start Your AI Agency: Easy, No-Code, No PhD Needed!
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-md mx-auto !mb-5 md:!mb-6 pt-1 sm:pt-2">
                AI tools feel too techy? AutoBoss is the <span className="font-bold text-foreground">World's First AI Agency Starter Kit</span> made for *you* – the new agency owner, even if 'API' is just letters to you. Find the easy way to build & sell AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-1">
                <Button size="lg" asChild className="shadow-lg font-bold text-sm px-6 py-2.5 sm:py-3 hover:opacity-90 transition-all duration-300 hover:scale-105 group w-full sm:w-auto">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    Start Your AI Agency Journey (Free Access)
                    <Rocket className="h-4 w-4 sm:h-5 sm:h-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
                 <Button size="lg" variant="outline" asChild className="transition-all duration-300 hover:scale-105 px-6 py-2.5 text-sm hover:text-accent-foreground hover:bg-accent/20 hover:border-accent bg-background/10 backdrop-blur-sm w-full sm:w-auto">
                  <Link href="#how-it-works" className="flex items-center gap-1.5">
                    How It Works <Eye className="h-4 w-4 sm:h-5 sm:h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section ref={valueRef} id="value" className={cn("scroll-reveal bg-secondary w-full py-12 md:py-16 lg:py-20 border-b border-border/50", valueVisible && "visible")}>
            <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
                <h2 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-primary">Why New AI Agency Owners Pick AutoBoss:</h2>
                 <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto my-3 md:my-4 !mb-6 md:!mb-8">
                  Tech got you stuck? AutoBoss helps you give clients real AI solutions they'll gladly pay for.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5 max-w-3xl mx-auto">
                  <SimpleBenefitCard icon={<Zap className="w-5 h-5" />} title="No Coding. Really." description="You don't need to be a programmer. AutoBoss handles the tricky AI tech, so you can focus on your clients." animationDelay="delay-100"/>
                  <SimpleBenefitCard icon={<ClientIcon className="w-5 h-5" />} title="Client-Focused Results" description="Create AI tools that genuinely help businesses save time, find more leads, or give better service. That's what they value." animationDelay="delay-200"/>
                  <SimpleBenefitCard icon={<Rocket className="w-5 h-5" />} title="Your AI Agency, Fast-Tracked." description="We give you a clear, simple path to start offering AI services, without the usual headaches and long learning curves." animationDelay="delay-300"/>
                </div>
            </div>
        </section>

        <section ref={toolkitRef} id="toolkit" className={cn("scroll-reveal bg-background w-full py-12 md:py-16 lg:py-20", toolkitVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-primary">Everything You Need to Get the Job Done:</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto my-3 md:my-4">
              Your toolkit for managing client projects and building effective AI employees that solve real business problems.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-4xl mx-auto text-left">
              <SimpleBenefitCard icon={<Briefcase className="w-5 h-5"/>} title="Client Workspaces" description="Keep each client's AI employees, training info, and settings neatly organized in their own private space." animationDelay="delay-100" />
              <SimpleBenefitCard icon={<BotIcon className="w-5 h-5"/>} title="Hire Your AI Employee" description="Build AI for specific jobs: website chat, answering phone calls, or a mix of both – all in one place." animationDelay="delay-200" />
              <SimpleBenefitCard icon={<UploadCloud className="w-5 h-5"/>} title="Simple 'On-the-Job' Training" description="Use your client's own documents (like FAQs or service lists) or website content to teach the AI about their business." animationDelay="delay-300" />
              <SimpleBenefitCard icon={<Share2 className="w-5 h-5"/>} title="Easy Deployment" description="Get AI employees working for your clients fast using simple embed codes or direct links. No tech mess." animationDelay="delay-400" />
            </div>
          </div>
        </section>

        <section ref={howItWorksRef} id="how-it-works" className={cn("scroll-reveal bg-secondary w-full py-12 md:py-16 lg:py-20", howItWorksRef && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-primary">The 3-Step Plan to Your First AI Client:</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto my-3 md:my-4">
              Your simple path from zero to giving clients valuable AI tools with AutoBoss.
            </p>
            <div className="relative mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 items-stretch">
                {[
                    { number: "1", title: "Add a Client Project", description: "Create a space in AutoBoss for your client. Get their basic business info and what job they need done.", icon: <Users2 className="w-5 h-5 text-primary"/>, animationDelay:"delay-100", hint: "client setup icon" },
                    { number: "2", title: "Hire & Train Their AI", description: "Choose a job for the AI (like 'Answer Website Questions'), give it a personality, and feed it specific client info.", icon: <Edit3 className="w-5 h-5 text-primary"/>, animationDelay:"delay-150", hint: "ai agent building icon" },
                    { number: "3", title: "Deploy & Get Paid!", description: "Put the AI employee to work for your client. Offer support, show them the results, and grow your agency.", icon: <CheckCircle className="w-5 h-5 text-primary"/>, animationDelay:"delay-200", hint: "launch success checkmark" },
                ].map((step, index, arr) => {
                  const [stepRef, stepIsVisible] = useIntersectionObserver({ threshold: 0.3 });
                  return (
                    <div key={step.title} ref={stepRef} className={cn("relative scroll-reveal", step.animationDelay, stepIsVisible && "visible")}>
                      <article className="relative flex flex-col items-center gap-2 p-4 sm:p-5 rounded-lg bg-background shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-foreground z-10 h-full">
                          <div className="absolute -top-3 bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-card shadow-md">{step.number}</div>
                          <div className="mt-5 mb-1" data-ai-hint={step.hint}>{step.icon}</div>
                          <h3 className="font-headline text-md sm:text-lg font-semibold text-center">{step.title}</h3>
                          <p className="text-xs text-muted-foreground text-center leading-relaxed">{step.description}</p>
                      </article>
                    </div>
                  );
                })}
            </div>
            <Button variant="link" asChild className="mt-6 md:mt-8 text-sm hover:text-primary">
                <Link href="/playbook">Read the Full Client Getting Playbook <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        <section ref={videoDemoRef} id="video-demo-placeholder" className={cn("scroll-reveal bg-background w-full py-12 md:py-16 lg:py-20 text-center", videoDemoVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 max-w-screen-xl">
            <h2 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-primary">See How Easy It Is (Quick Video)</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto my-3 md:my-4">Watch how fast you can hire and train an AI employee for a client using AutoBoss. No tech skills? No problem!</p>
            <div className="max-w-2xl mx-auto aspect-video bg-muted/20 rounded-lg shadow-xl flex items-center justify-center text-muted-foreground border border-border/50 relative overflow-hidden cursor-pointer group" data-ai-hint="clean video player interface dark theme">
                <Image src="https://placehold.co/1280x720.png" alt="AutoBoss Platform Demo Video Thumbnail" layout="fill" objectFit="cover" className="opacity-20 group-hover:opacity-10 transition-opacity" data-ai-hint="dark theme agency software thumbnail" loading="lazy"/>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-foreground/80 bg-black/50 p-4 z-10">
                     <PlayCircle size={40} className="sm:size-50 text-primary cursor-pointer group-hover:scale-110 group-hover:text-primary-dark transition-all duration-300"/>
                     <p className="mt-2 text-xs font-semibold">Watch: Your First AI Employee in Under 5 Mins (Demo Coming Soon)</p>
                </div>
            </div>
          </div>
        </section>

        <section ref={socialProofRef} id="proof" className={cn("scroll-reveal bg-secondary w-full py-12 md:py-16 lg:py-20", socialProofVisible && "visible")}>
            <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
                <h2 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-primary">People Are Already Building With AutoBoss:</h2>
                 <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto my-3 md:my-4">Proof that even folks new to tech are launching their AI agency services.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto text-left">
                    {socialProofItems.map((item, index) => {
                      const [cardRef, cardIsVisible] = useIntersectionObserver({ threshold: 0.2 });
                      return (
                       <article ref={cardRef} key={index} className={cn("scroll-reveal transform hover:scale-103 transition-transform duration-300",
                         item.delay, cardIsVisible && "visible",
                         item.type === 'testimonial' ? "bg-background border border-border p-4 sm:p-5 rounded-lg shadow-lg" :
                         "bg-card p-4 sm:p-5 rounded-lg shadow-lg text-secondary-foreground flex flex-col items-center justify-center text-center")}
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
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-primary fill-primary mr-0.5"/>)}
                                </div>
                                <p className="text-xs italic text-muted-foreground leading-relaxed">{item.quote}</p>
                            </>
                        ) : (
                           item.metrics?.map((metric, mIndex) => (
                               <React.Fragment key={mIndex}>
                                   {React.cloneElement(metric.icon, {className: "text-primary " + metric.icon.props.className})}
                                   <p className={cn("font-headline font-bold", mIndex === 0 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl")}>{metric.value}</p>
                                   <p className={cn("text-xs font-medium text-muted-foreground", mIndex === 0 ? "mb-2" : "")}>{metric.label}</p>
                               </React.Fragment>
                           ))
                        )}
                    </article>
                    );
                    })}
                </div>
            </div>
        </section>

        <section ref={earlyAccessRef} id="early-access" className={cn("scroll-reveal bg-background w-full py-12 md:py-16 lg:py-20", earlyAccessRef && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-primary">Be a Founding Member: Free Early Access (For Now!)</h2>
            <div className="max-w-xl mx-auto bg-secondary p-4 my-4 sm:my-6 text-left rounded-lg">
              <p className="text-sm text-muted-foreground">
                 AutoBoss is currently free to use. We're looking for founding users to help make it the best AI agency kit out there. Your feedback is gold as we build this together. Future access will be paid. <span className="font-semibold text-foreground">This is your chance to get in early and build your agency with zero platform costs.</span>
              </p>
            </div>
            <aside className={cn(
                "max-w-sm mx-auto bg-card p-5 sm:p-6 rounded-lg shadow-xl transform hover:scale-103 transition-transform text-card-foreground delay-150"
            )}>
              <p className="italic text-xs text-muted-foreground leading-relaxed">"We're building AutoBoss to help entrepreneurs like you succeed. Your win is our win."</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Image loading="lazy" src="https://placehold.co/36x36.png" alt="AutoBoss Team" width={32} height={32} className="rounded-full shadow-md" data-ai-hint="modern team logo mark"/>
                <div>
                  <p className="font-semibold text-xs text-card-foreground">The AutoBoss Team</p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section ref={finalCtaRef} className={cn("scroll-reveal bg-secondary w-full py-12 md:py-16 lg:py-20", finalCtaRef && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <div className="mx-auto max-w-md space-y-3 bg-card p-5 sm:p-6 md:p-8 rounded-xl shadow-2xl">
              <h2 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-primary">
                Ready to Start Your No-Code AI Agency?
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm !mb-5">
                AI is how clients will get things done. AutoBoss is your way to offer it, even if you're just starting out.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-1">
                <Button size="lg" asChild className="shadow-xl font-bold text-sm px-6 py-2.5 hover:opacity-90 transition-all duration-300 hover:scale-105 group w-full sm:w-auto">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    Claim Your Free AutoBoss Account Now
                    <Rocket className="h-4 w-4 sm:h-5 sm:h-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-2">No credit card needed for early access. Start building today!</p>
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
            <Link href="/showcase" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Agent Showcase</Link>
            <Link href="/playbook" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Client Playbook</Link>
            <Link href="/templates" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>AI Jobs</Link>
            <Link href="/support" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Help Center</Link>
            <Link href="#" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Terms</Link> {/* Placeholder */}
            <Link href="#" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Privacy</Link> {/* Placeholder */}
          </nav>
        </div>
      </footer>
      <BoltBadge />
    </div>
    </TooltipProvider>
  );
}
