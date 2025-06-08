
"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Cog, Rocket, Eye, Palette, BarChart3, PlayCircle, MessageCircle, Star, Menu, X as CloseIcon, ShieldCheck, Smile, TrendingUp, SearchCode, Edit3, Handshake, Info, Layers } from "lucide-react";
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
      setIsIntersecting(true); // Fallback for environments without IntersectionObserver
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

const painPoints = [
  "Tired of clunky chatbots? AutoBoss builds AI teammates.",
  "Repetitive tasks burning hours? Let AutoBoss automate.",
  "Losing leads after dark? Your AutoBoss agent never sleeps.",
  "Manual workflows stalling growth? Unleash AI efficiency.",
  "Dream of AI that thinks & acts? AutoBoss delivers now."
];

export default function MarketingPageClient() {
  const [currentPainPointIndex, setCurrentPainPointIndex] = useState(0);
  const typewriterRef = useRef<HTMLSpanElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsHeaderScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const typeInterval = 4000; // Interval for changing text
    const animationDuration = 3500; // Corresponds to CSS typing animation

    const intervalId = setInterval(() => {
        setCurrentPainPointIndex((prevIndex) => (prevIndex + 1) % painPoints.length);
        if (typewriterRef.current) {
            typewriterRef.current.classList.remove("typewriter-text", "typewriter-text-active");
            typewriterRef.current.style.width = '0'; // Reset width for animation restart
            void typewriterRef.current.offsetWidth; // Trigger reflow
            typewriterRef.current.classList.add("typewriter-text");
            // No need to add typewriter-text-active here, CSS animation takes care of width
        }
    }, typeInterval + 500); // Add buffer for animation to finish + blink
    return () => clearInterval(intervalId);
  }, []);


  const sectionObserverOptions = { threshold: 0.1, rootMargin: "0px 0px -30px 0px" };
  const [heroRef, heroVisible] = useIntersectionObserver(sectionObserverOptions);
  const [superpowersRef, superpowersVisible] = useIntersectionObserver(sectionObserverOptions);
  const [howItWorksRef, howItWorksVisible] = useIntersectionObserver(sectionObserverOptions);
  const [socialProofRef, socialProofVisible] = useIntersectionObserver(sectionObserverOptions);
  const [humanizeRef, humanizeVisible] = useIntersectionObserver(sectionObserverOptions);
  const [finalCtaRef, finalCtaVisible] = useIntersectionObserver(sectionObserverOptions);
  const [videoDemoRef, videoDemoVisible] = useIntersectionObserver(sectionObserverOptions);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <TooltipProvider>
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <header className={cn("w-full px-4 lg:px-6 h-16 flex items-center sticky-header z-50", isHeaderScrolled && "sticky-header-scrolled")}>
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center justify-center" aria-label="AutoBoss Homepage">
            <Logo className="text-foreground hover:opacity-80 transition-opacity"/>
          </Link>
          <nav className="hidden md:flex gap-2 sm:gap-3 items-center">
            <Link href="#superpowers" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1" prefetch={false}>Superpowers</Link>
            <Link href="#how-it-works" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1" prefetch={false}>How It Works</Link>
            <Link href="#social-proof" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-2 py-1" prefetch={false}>Proof</Link>
            <Button variant="outline" size="sm" asChild className="border-primary/50 text-primary hover:border-primary hover:bg-primary/10 transition-colors btn-interactive text-xs">
              <Link href="/login" className="flex items-center gap-1">Login</Link>
            </Button>
            <Button size="sm" asChild className="font-semibold bg-gradient-to-r from-electric-teal to-neon-lime text-background shadow-md hover:opacity-90 transition-opacity btn-interactive text-xs">
              <Link href="/dashboard" className="flex items-center gap-1">
                Try AutoBoss Free <ArrowRight />
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
          "md:hidden fixed top-16 right-0 h-[calc(100vh-4rem)] w-60 bg-card shadow-xl z-40 p-5 space-y-3 transform transition-all duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
          <Link href="#superpowers" className="block py-1.5 text-sm text-card-foreground hover:text-primary" onClick={toggleMobileMenu}>Superpowers</Link>
          <Link href="#how-it-works" className="block py-1.5 text-sm text-card-foreground hover:text-primary" onClick={toggleMobileMenu}>How It Works</Link>
          <Link href="#social-proof" className="block py-1.5 text-sm text-card-foreground hover:text-primary" onClick={toggleMobileMenu}>Proof</Link>
          <Link href="/login" className="block py-1.5 text-sm text-card-foreground hover:text-primary" onClick={toggleMobileMenu}>Login</Link>
          <Button asChild className="w-full font-semibold bg-gradient-to-r from-electric-teal to-neon-lime text-background shadow-md hover:opacity-90 transition-opacity btn-interactive text-sm">
            <Link href="/dashboard" onClick={toggleMobileMenu}>
              Try AutoBoss Free
            </Link>
          </Button>
      </div>

      <main className="flex-1">
        <section ref={heroRef} className={cn("scroll-reveal section-dark w-full min-h-[calc(100vh-4rem)] flex items-center justify-center text-center py-16 md:py-20 relative overflow-hidden", heroVisible && "visible")}>
          <div className="absolute inset-0 z-0 opacity-[0.07]">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover" poster="https://placehold.co/1920x1080/0A0F14/0A0F14.png" data-ai-hint="dark abstract particles subtle motion">
              <source src="https://placehold.co/1920x1080.mp4?text=." type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/60"></div>
          </div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="mx-auto max-w-2xl space-y-4 md:space-y-5">
              <h1 className="font-headline leading-tight text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[3.8rem]"> {/* Adjusted H1 Size */}
                <span ref={typewriterRef} className="typewriter-text block gradient-text-on-dark min-h-[45px] sm:min-h-[60px] md:min-h-[80px] lg:min-h-[90px]">
                  {painPoints[currentPainPointIndex]}
                </span>
              </h1>
              <p className="text-md md:text-lg text-muted-foreground max-w-lg mx-auto">
                AutoBoss builds AI agents that <strong className="text-foreground font-medium">think, decide, & execute</strong>. Instantly upgrade your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-3">
                <Button size="lg" asChild className="shadow-lg bg-gradient-to-r from-electric-teal to-neon-lime text-background font-bold text-sm md:text-base px-6 py-3 hover:opacity-90 transition-all duration-300 hover:scale-105 group pulse-cta-btn btn-interactive">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    Launch Agent Free
                    <Rocket className="h-4 w-4 group-hover:animate-bounce" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="btn-outline-themed transition-all duration-300 hover:scale-105 px-6 py-3 text-sm md:text-base border-muted-foreground/40 text-foreground bg-background/20 backdrop-blur-sm btn-interactive">
                  <Link href="#video-demo-placeholder" className="flex items-center gap-1.5">
                    Watch 60s Demo <PlayCircle className="h-4 w-4"/>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="section-light-accent w-full py-6 md:py-8 border-b border-border">
            <div className="container px-4 md:px-6 text-center">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Powering AI Breakthroughs</h2>
                <div className="marquee w-full max-w-4xl mx-auto">
                  <div className="marquee-content flex items-center gap-8 md:gap-12">
                    {[...Array(2)].flatMap((_, repeatIndex) => [
                        { name: "InnovateLLC", hint: "modern tech logo clean" },
                        { name: "AIPoweredCo", hint: "ai solutions logo professional" },
                        { name: "GlobalSupport", hint: "global enterprise logo simple" },
                        { name: "NextGenFlow", hint: "future tech logo abstract" },
                        { name: "DataDrivenInc", hint: "data analytics logo sharp" },
                    ].map((logo, index) => (
                      <div key={`${repeatIndex}-${index}`} className="flex-shrink-0 h-6 md:h-7 grayscale opacity-50 hover:grayscale-0 hover:opacity-90 transition-all duration-300 transform hover:scale-110">
                         <Image loading="lazy" src={`https://placehold.co/140x35/transparent/333333.png?text=${logo.name.replace(/\s/g,'+')}&font=nunito`} alt={`${logo.name} Logo`} width={140} height={35} className="object-contain h-full" data-ai-hint={logo.hint} />
                      </div>
                    )))}
                  </div>
                </div>
            </div>
        </section>

        <section ref={superpowersRef} id="superpowers" className={cn("scroll-reveal section-dark w-full py-10 md:py-16 lg:py-20", superpowersVisible && "visible")}>
          <div className="container px-4 md:px-6 text-center">
            <h2 className="font-headline text-3xl sm:text-4xl mb-2 text-foreground">
              Your AI Workforce: <span className="gradient-text-on-dark">Beyond Automation.</span>
            </h2>
            <p className="text-muted-foreground md:text-base max-w-xl mx-auto mb-8 md:mb-10">
              AutoBoss agents are teammates, not just tools. Here's how they deliver:
            </p>
            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl mx-auto text-left">
              <SimpleFeatureCard
                icon={<Edit3 className="h-6 w-6" />}
                title="Visual Flow Studio"
                description="Design complex AI logic visually. Drag, drop, done. If you can map it, AutoBoss builds it."
                caseStudy={{ quote: "Our non-techs built a lead qualifier in an afternoon!", metric: "5x Faster Deployment", author: "Marketing @ DataCo" }}
                animationDelay="delay-150"
              />
              <SimpleFeatureCard
                icon={<Palette className="h-6 w-6" />}
                title="AI Persona Engine"
                description="Define a role, get a personality. Agents that match your brand values and tone, instantly."
                caseStudy={{ quote: "The AI persona was spot-on. Feels like one of us.", metric: "99% Brand Voice", author: "CEO @ NextFlow" }}
                animationDelay="delay-250"
              />
              <SimpleFeatureCard
                icon={<Brain className="h-6 w-6" />}
                title="Dynamic Knowledge Core"
                description="Feed it docs, sites, FAQs. Your agent becomes an expert, adapting with your business."
                caseStudy={{ quote: "Our agent is now our product info source of truth.", metric: "Instant Answers", author: "Support @ AIPowered" }}
                animationDelay="delay-350"
              />
              <SimpleFeatureCard
                icon={<Zap className="h-6 w-6" />}
                title="Autonomous Action Engine"
                description="Agents don't just talk—they *do*. Decide, execute tasks, update CRMs, integrate seamlessly."
                caseStudy={{ quote: "Automating invoices saved 20 hrs/week.", metric: "Full Task Automation", author: "Ops @ Innovate" }}
                animationDelay="delay-450"
              />
            </div>
          </div>
        </section>

        <section ref={howItWorksRef} id="how-it-works" className={cn("scroll-reveal section-light-accent w-full py-10 md:py-16 lg:py-20", howItWorksVisible && "visible")}>
          <div className="container px-4 md:px-6 text-center">
            <h2 className="font-headline text-3xl sm:text-4xl mb-2 text-card-foreground">
              Launch in <span className="gradient-text-on-light">3 Simple Steps</span>
            </h2>
            <p className="text-muted-foreground md:text-base max-w-xl mx-auto mb-8 md:mb-10">
              From idea to impact, faster than you imagined. No complex coding.
            </p>
            <div className="relative mx-auto max-w-4xl grid md:grid-cols-3 gap-5 md:gap-6 items-start">
                <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-primary/10 -translate-y-1/2 z-0"></div>
                {[
                    { number: "1", title: "Define & Design", description: "Visually craft your agent's brain and personality in our intuitive Flow Studio.", icon: <Palette className="w-7 h-7 text-electric-teal"/>, animationDelay:"delay-150" },
                    { number: "2", title: "Enrich & Empower", description: "Upload docs or URLs. Train it on your specific data to build its unique knowledge core.", icon: <Brain className="w-7 h-7 text-neon-lime"/>, animationDelay:"delay-250" },
                    { number: "3", title: "Deploy & Dominate", description: "Integrate via widget, API, or direct link. Unleash its power across all your channels.", icon: <Rocket className="w-7 h-7 text-primary"/>, animationDelay:"delay-350" },
                ].map((step, index) => {
                  const [stepRef, stepIsVisible] = useIntersectionObserver({ threshold: 0.3 });
                  return (
                    <article key={step.title} ref={stepRef} className={cn("scroll-reveal relative flex flex-col items-center gap-1.5 p-5 rounded-lg bg-background shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-foreground z-10", step.animationDelay, stepIsVisible && "visible")}>
                        <div className="absolute -top-3.5 bg-gradient-to-br from-electric-teal to-neon-lime text-background text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-card shadow-md">{step.number}</div>
                        <div className="mt-6 mb-1">{step.icon}</div>
                        <h3 className="font-headline text-md font-semibold text-center">{step.title}</h3>
                        <p className="text-xs text-muted-foreground text-center">{step.description}</p>
                    </article>
                  );
                })}
            </div>
            <div ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal mt-10 md:mt-12 max-w-2xl mx-auto", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-450")}>
                <h3 className="font-headline text-lg font-semibold mb-2 text-card-foreground">Conceptual Studio Demo</h3>
                <div className="aspect-video bg-background/50 rounded-lg shadow-inner flex flex-col items-center justify-center text-muted-foreground p-3 border border-dashed border-border" data-ai-hint="interactive ui demo minimal clean">
                    <Cog className="w-8 h-8 opacity-30 mb-1"/>
                    <p className="text-xs">Drag & drop to build an agent flow.</p>
                    <p className="text-[10px] mt-0.5">(Interactive demo placeholder)</p>
                     <Button variant="outline" size="sm" className="mt-2 border-primary/50 text-primary hover:text-primary hover:bg-primary/10 btn-interactive text-xs">Explore Studio Features</Button>
                </div>
            </div>
          </div>
        </section>

        <section ref={videoDemoRef} id="video-demo-placeholder" className={cn("scroll-reveal section-dark w-full py-10 md:py-16 text-center", videoDemoVisible && "visible")}>
            <div className="container px-4 md:px-6">
                <h2 className="font-headline text-3xl sm:text-4xl text-foreground">
                    See AutoBoss in Action: <span className="gradient-text-on-dark">60s to "Wow!"</span>
                </h2>
                <p className="text-muted-foreground md:text-base max-w-lg mx-auto mt-2 mb-5">Watch how easy it is to build and deploy an intelligent AI teammate.</p>
                <div className="max-w-2xl mx-auto aspect-video bg-muted/20 rounded-lg shadow-xl flex items-center justify-center text-muted-foreground border border-border relative overflow-hidden cursor-pointer group" data-ai-hint="video player modern dark sleek elegant">
                    <Image src="https://placehold.co/1280x720/0A0D13/0A0D13.png" alt="AutoBoss Demo Video Thumbnail" layout="fill" objectFit="cover" className="opacity-30 group-hover:opacity-10 transition-opacity" data-ai-hint="dark tech abstract thumbnail" loading="lazy"/>
                    <div className="video-placeholder-text z-10">
                         <PlayCircle size={60} className="text-primary cursor-pointer group-hover:scale-110 group-hover:text-neon-lime transition-all duration-300"/>
                         <p className="mt-1.5 text-xs font-semibold">Watch Quick Demo (1:03)</p>
                    </div>
                </div>
            </div>
        </section>

        <section ref={socialProofRef} id="social-proof" className={cn("scroll-reveal section-light-accent w-full py-10 md:py-16 lg:py-20", socialProofVisible && "visible")}>
            <div className="container px-4 md:px-6 text-center">
                <h2 className="font-headline text-3xl sm:text-4xl mb-3 text-card-foreground">
                    Don't Just Take Our Word.
                </h2>
                 <p className="text-muted-foreground md:text-base max-w-xl mx-auto mb-8 md:mb-10">Join innovators transforming their businesses with AutoBoss.</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto text-left">
                    <article ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal bg-background p-5 rounded-lg shadow-lg transform hover:scale-103 transition-transform duration-300 text-foreground", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-150")}>
                        <div className="flex items-center mb-1.5">
                            <Image loading="lazy" src="https://placehold.co/36x36/E2E8F0/1A202C.png?text=AR" alt="Alex R." width={36} height={36} className="rounded-full mr-2.5" data-ai-hint="professional person portrait"/>
                            <div>
                                <h4 className="font-semibold text-foreground text-xs">Alex R.</h4>
                                <p className="text-[10px] text-muted-foreground">Support Lead @ GlobalSupport</p>
                            </div>
                        </div>
                        <div className="mb-1 flex">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-neon-lime fill-neon-lime mr-0.5"/>)}
                        </div>
                        <p className="text-xs italic text-muted-foreground">"AutoBoss revolutionized our support, handling 80% of inquiries. A true game-changer for efficiency and customer satisfaction."</p>
                    </article>
                    <article ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal bg-gradient-to-br from-electric-teal to-neon-lime p-5 rounded-lg shadow-lg text-background flex flex-col items-center justify-center text-center", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-250")}>
                        <TrendingUp className="w-8 h-8 mb-1 opacity-80"/>
                        <p className="font-headline text-3xl md:text-4xl font-bold">97%</p>
                        <p className="text-sm font-medium">Task Automation</p>
                        <Layers className="w-7 h-7 mt-3 mb-0.5 opacity-80"/>
                        <p className="font-headline text-2xl md:text-3xl font-bold">1M+</p>
                        <p className="text-xs">Agents Deployed</p>
                    </article>
                     <article ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal bg-background p-5 rounded-lg shadow-lg transform hover:scale-103 transition-transform duration-300 text-foreground", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-350")}>
                        <div className="flex items-center mb-1.5">
                             <Image loading="lazy" src="https://placehold.co/36x36/E2E8F0/1A202C.png?text=PS" alt="Priya S." width={36} height={36} className="rounded-full mr-2.5" data-ai-hint="founder startup person portrait"/>
                            <div>
                                <h4 className="font-semibold text-foreground text-xs">Priya S.</h4>
                                <p className="text-[10px] text-muted-foreground">Founder @ InnovateLLC</p>
                            </div>
                        </div>
                         <div className="mb-1 flex">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-neon-lime fill-neon-lime mr-0.5"/>)}
                        </div>
                        <p className="text-xs italic text-muted-foreground">"The visual flow builder is incredibly intuitive. We launched our first AI agent in under an hour, not days! Highly recommend."</p>
                    </article>
                </div>
            </div>
        </section>

        <section ref={humanizeRef} className={cn("scroll-reveal section-dark w-full py-10 md:py-16 lg:py-20", humanizeVisible && "visible")}>
          <div className="container px-4 md:px-6 text-center">
            <h2 className="font-headline text-3xl sm:text-4xl text-foreground">
              Built by Humans, for <span className="gradient-text-on-dark">Your Breakthroughs.</span>
            </h2>
            <p className="text-muted-foreground md:text-base max-w-xl mx-auto mt-2 mb-8">
              We're dedicated to making sophisticated AI accessible. AutoBoss is your partner in innovation.
            </p>
            <div className="max-w-lg mx-auto bg-card p-5 rounded-lg shadow-xl transform hover:scale-103 transition-transform text-card-foreground">
              <p className="italic text-xs text-muted-foreground">"I started AutoBoss from my dorm, frustrated by clunky automation. My vision: a platform so intuitive, anyone can build truly intelligent AI agents that *actually work*. We're just getting started."</p>
              <div className="flex items-center justify-center gap-2.5 mt-3">
                <Image loading="lazy" src="https://placehold.co/50x50/1A202C/E2E8F0.png?text=AC" alt="Alex Chen, Founder (Placeholder)" width={50} height={50} className="rounded-full shadow-md" data-ai-hint="founder portrait friendly modern person" />
                <div>
                  <p className="font-semibold text-sm text-card-foreground">Alex Chen (Placeholder)</p>
                  <p className="text-xs text-primary">Founder & CEO, AutoBoss</p>
                </div>
              </div>
            </div>
            <aside ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal mt-8", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-250")}>
                <h3 className="font-headline text-md text-muted-foreground mb-2">Meet Some of the Team</h3>
                <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                    {[
                        {name: "Jamie K.", role: "Lead AI Engineer", hint: "team member developer person", initials: "JK"},
                        {name: "Lena R.", role: "UX Architect", hint: "team member designer person", initials: "LR"},
                        {name: "Mike B.", role: "GenAI Specialist", hint: "team member ai specialist person", initials: "MB"},
                    ].map(member => (
                    <div key={member.name} className="flex flex-col items-center text-center w-20" data-ai-hint={member.hint}>
                        <Image loading="lazy" src={`https://placehold.co/60x60/2D3748/E2E8F0.png?text=${member.initials}`} alt={`${member.name} Placeholder`} width={60} height={60} className="rounded-full opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 transform hover:scale-110"/>
                        <p className="text-xs mt-1 text-foreground font-medium">{member.name}</p><p className="text-[10px] text-muted-foreground">{member.role}</p>
                    </div>
                    ))}
                </div>
            </aside>
          </div>
        </section>

        <section ref={finalCtaRef} className={cn("scroll-reveal section-cta-final w-full py-12 md:py-20", finalCtaVisible && "visible")}>
          <div className="container px-4 md:px-6 text-center">
            <div className="mx-auto max-w-lg space-y-4 bg-card/80 dark:bg-background/60 backdrop-blur-md p-6 md:p-8 rounded-xl shadow-2xl">
              <h2 className="font-headline text-3xl sm:text-4xl gradient-text-on-dark">
                Ready to Build the Future?
              </h2>
              <p className="text-muted-foreground md:text-base">
                Your journey to effortless, intelligent automation starts now. AutoBoss is free to try. No credit card needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-3">
                <Button size="lg" asChild className="shadow-xl bg-gradient-to-r from-electric-teal to-neon-lime text-background font-bold text-sm px-6 py-3 hover:opacity-90 transition-all duration-300 hover:scale-105 group w-full sm:w-auto pulse-cta-btn btn-interactive">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    Start Building Free
                    <Rocket className="h-4 w-4 group-hover:animate-bounce" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="btn-outline-themed transition-all duration-300 hover:scale-105 px-6 py-3 text-sm text-foreground border-muted-foreground/40 bg-background/20 dark:bg-card/20 backdrop-blur-sm w-full sm:w-auto btn-interactive">
                  <Link href="mailto:demo@autoboss.dev?subject=AutoBoss%20Demo%20Request" className="flex items-center gap-1.5">
                    Request a Demo <Eye className="h-4 w-4"/>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-5 border-t border-border/30 bg-background text-center">
        <div className="container px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5">
             <Link href="/" aria-label="AutoBoss Homepage" className="flex items-center justify-center">
                <Logo className="text-foreground hover:opacity-80 transition-opacity h-7 w-auto" collapsed={false}/> {/* Ensure logo scales */}
            </Link>
            <p className="text-[10px] text-muted-foreground">&copy; {new Date().getFullYear()} AutoBoss. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mt-2 sm:mt-0">
            <Link href="#" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Terms</Link>
            <Link href="#" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Privacy</Link>
            <Link href="mailto:support@autoboss.dev" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Support</Link>
          </nav>
        </div>
      </footer>
      {/* Placeholder for a sticky CTA or Chat Widget - requires JS for stickiness and interaction */}
      {/* <div className="fixed bottom-5 right-5 z-50"> <Button className="pulse-cta-btn">Sticky CTA</Button> </div> */}
    </div>
    </TooltipProvider>
  );
}

