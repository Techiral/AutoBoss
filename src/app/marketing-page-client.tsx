
"use client"; 

import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Cog, Rocket, Eye, Palette, BarChart3, PlayCircle, MessageCircle, Star, Menu, X as CloseIcon, ShieldCheck, Smile, TrendingUp, SearchCode, Edit3, Handshake, Info, Layers } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

// Intersection Observer Hook
const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (typeof window.IntersectionObserver === "undefined") {
      setIsIntersecting(true); 
      return;
    }

    observerRef.current = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    const { current: currentObserver } = observerRef;

    if (node) {
      currentObserver.observe(node);
    }

    return () => {
      if (node && currentObserver) {
        currentObserver.unobserve(node);
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
  animationDelay?: string; 
}

const SimpleFeatureCard: React.FC<SimpleFeatureCardProps> = ({ icon, title, description, caseStudy, animationDelay }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  return (
    <article
      ref={ref}
      className={cn(
        "simple-feature-card scroll-reveal", 
        isVisible && "visible",
        animationDelay
      )}
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
      {/* Removed data-ai-hint div from here to prevent blank blocks */}
    </article>
  );
};

const painPoints = [
  "Tired of clunky chatbots? AutoBoss builds AI teammates.",
  "Overwhelmed by repetitive tasks? Let AutoBoss automate it.",
  "Losing leads after hours? Your AutoBoss agent never sleeps.",
  "Manual workflows slowing growth? Unleash true AI efficiency.",
  "Dream of AI that thinks & acts? AutoBoss delivers results."
];

export default function MarketingPageClient() {
  const [currentPainPointIndex, setCurrentPainPointIndex] = useState(0);
  const typewriterRef = useRef<HTMLSpanElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => setIsHeaderScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    }, 4500); 
    return () => clearInterval(intervalId);
  }, []);
  
  const sectionObserverOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };

  const [heroRef, heroVisible] = useIntersectionObserver(sectionObserverOptions);
  const [superpowersRef, superpowersVisible] = useIntersectionObserver(sectionObserverOptions);
  const [howItWorksRef, howItWorksVisible] = useIntersectionObserver(sectionObserverOptions);
  const [socialProofRef, socialProofVisible] = useIntersectionObserver(sectionObserverOptions);
  const [humanizeRef, humanizeVisible] = useIntersectionObserver(sectionObserverOptions);
  const [finalCtaRef, finalCtaVisible] = useIntersectionObserver(sectionObserverOptions);
  const [videoDemoRef, videoDemoVisible] = useIntersectionObserver(sectionObserverOptions);


  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground">
      <header className={cn("w-full px-4 lg:px-6 h-20 flex items-center sticky-header z-50", isHeaderScrolled && "sticky-header-scrolled")}>
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center justify-center" aria-label="AutoBoss Homepage">
            <Logo className="text-foreground hover:opacity-80 transition-opacity"/>
          </Link>
          <nav className="hidden md:flex gap-3 sm:gap-4 items-center">
            <Link href="#superpowers" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Superpowers</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" prefetch={false}>How It Works</Link>
            <Link href="#social-proof" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Proof</Link>
            <Button variant="outline" size="sm" asChild className="border-primary/50 text-primary hover:border-primary hover:bg-primary/10 transition-colors btn-interactive">
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild className="font-semibold bg-gradient-to-r from-electric-teal to-neon-lime text-background shadow-md hover:opacity-90 transition-opacity btn-interactive">
              <Link href="/dashboard">Try AutoBoss Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </nav>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu" onClick={toggleMobileMenu} className="btn-interactive">
               {isMobileMenuOpen ? <CloseIcon className="h-6 w-6 text-foreground"/> : <Menu className="h-6 w-6 text-foreground"/>}
            </Button>
          </div>
        </div>
      </header>
      
      <div 
        id="mobile-menu" 
        className={cn(
          "md:hidden fixed top-20 right-0 h-[calc(100vh-5rem)] w-64 bg-card shadow-xl z-40 p-6 space-y-4 transform transition-all duration-300 ease-in-out", 
          isMobileMenuOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
          <Link href="#superpowers" className="block py-2 text-card-foreground hover:text-primary" onClick={toggleMobileMenu}>Superpowers</Link>
          <Link href="#how-it-works" className="block py-2 text-card-foreground hover:text-primary" onClick={toggleMobileMenu}>How It Works</Link>
          <Link href="#social-proof" className="block py-2 text-card-foreground hover:text-primary" onClick={toggleMobileMenu}>Proof</Link>
          <Link href="/login" className="block py-2 text-card-foreground hover:text-primary" onClick={toggleMobileMenu}>Login</Link>
          <Button asChild className="w-full font-semibold bg-gradient-to-r from-electric-teal to-neon-lime text-background shadow-md hover:opacity-90 transition-opacity btn-interactive">
            <Link href="/dashboard" onClick={toggleMobileMenu}>Try AutoBoss Free</Link>
          </Button>
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section ref={heroRef} className={cn("scroll-reveal section-dark w-full min-h-[calc(100vh-5rem)] flex items-center justify-center text-center py-20 md:py-24 relative overflow-hidden", heroVisible && "visible")}>
          <div className="absolute inset-0 z-0 opacity-10"> {/* Reduced opacity for subtler background */}
            <video autoPlay loop muted playsInline className="w-full h-full object-cover" poster="https://placehold.co/1920x1080/0D1117/0D1117.png" data-ai-hint="abstract ai motion dark futuristic particles subtle">
              <source src="https://placehold.co/1920x1080.mp4?text=." type="video/mp4" /> 
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-transparent to-background/50"></div> {/* Softer gradient */}
          </div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="mx-auto max-w-3xl space-y-5 md:space-y-6"> {/* Reduced spacing slightly */}
              <h1 className="font-headline leading-tight"> {/* Added leading-tight for H1 */}
                <span ref={typewriterRef} className="typewriter-text block gradient-text-on-dark min-h-[50px] sm:min-h-[70px] md:min-h-[100px] lg:min-h-[120px]">
                  {painPoints[currentPainPointIndex]}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
                AutoBoss builds AI agents that don't just chat—they <strong className="text-foreground font-semibold">think, decide, and execute</strong> complex tasks. Supercharge your business instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4"> {/* Reduced top padding */}
                <Button size="lg" asChild className="shadow-lg bg-gradient-to-r from-electric-teal to-neon-lime text-background font-bold text-base md:text-lg px-8 py-5 hover:opacity-90 transition-all duration-300 hover:scale-105 group pulse-cta-btn btn-interactive"> {/* Adjusted padding */}
                  <Link href="/dashboard">
                    Launch Your First Agent Free
                    <Rocket className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="transition-all duration-300 hover:scale-105 hover:border-accent hover:text-accent px-8 py-5 text-base md:text-lg border-muted-foreground/50 text-foreground bg-background/30 backdrop-blur-sm btn-interactive"> {/* Adjusted padding */}
                  <Link href="#video-demo-placeholder"> 
                    Watch 60s Demo <PlayCircle className="ml-2 h-5 w-5"/>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="section-light-accent w-full py-8 md:py-10 border-b border-border"> {/* Reduced padding */}
            <div className="container px-4 md:px-6 text-center">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-primary mb-4">Powering AI Breakthroughs for Visionary Teams</h2> {/* Smaller heading */}
                <div className="marquee w-full max-w-5xl mx-auto">
                  <div className="marquee-content flex items-center gap-10 md:gap-14"> {/* Adjusted gap */}
                    {[...Array(2)].flatMap((_, repeatIndex) => [ 
                        { name: "InnovateLLC", hint: "modern tech logo clean" },
                        { name: "AIPoweredCo", hint: "ai solutions logo professional" },
                        { name: "GlobalSupport", hint: "global enterprise logo simple" },
                        { name: "NextGenFlow", hint: "future tech logo abstract" },
                        { name: "DataDrivenInc", hint: "data analytics logo sharp" },
                    ].map((logo, index) => (
                      <div key={`${repeatIndex}-${index}`} className="flex-shrink-0 h-7 md:h-9 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 transform hover:scale-110"> {/* Adjusted size & opacity */}
                         <Image loading="lazy" src={`https://placehold.co/140x35/transparent/888888.png?text=${logo.name.replace(/\s/g,'+')}&font=nunito`} alt={`${logo.name} Logo`} width={140} height={35} className="object-contain h-full" data-ai-hint={logo.hint} />
                      </div>
                    )))}
                  </div>
                </div>
            </div>
        </section>

        <section ref={superpowersRef} id="superpowers" className={cn("scroll-reveal section-dark w-full py-12 md:py-20 lg:py-24", superpowersVisible && "visible")}> {/* Adjusted padding */}
          <div className="container px-4 md:px-6 text-center">
            <h2 className="font-headline mb-3 text-foreground"> {/* Reduced margin */}
              This Isn't Just Automation. This is <span className="gradient-text-on-dark">Your AI Workforce.</span>
            </h2>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto mb-10 md:mb-12"> {/* Adjusted margin */}
              AutoBoss agents are more than tools—they're teammates. Here's how they deliver game-changing results:
            </p>
            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto text-left"> {/* Reduced gap */}
              <SimpleFeatureCard 
                icon={<Edit3 className="h-7 w-7" />} // Slightly smaller icon
                title="Visual Flow Studio: Build Genius, No Code." 
                description="Drag, drop, done. Design complex AI logic visually. If you can map it, AutoBoss can build it."
                caseStudy={{ quote: "Our non-tech team built a lead qualifier in an afternoon. Revolutionary!", metric: "5x Faster Deployment", author: "Marketing @ DataDrivenInc" }}
                animationDelay="delay-150" // Adjusted delay
              />
              <SimpleFeatureCard 
                icon={<Palette className="h-7 w-7" />} 
                title="AI Persona Engine: Your Brand, Embodied." 
                description="Define a role, get a personality. Agents that perfectly match your brand values and tone, instantly."
                caseStudy={{ quote: "The AI-generated persona was spot-on. Feels like one of us.", metric: "99% Brand Consistency", author: "CEO @ NextGenFlow" }}
                animationDelay="delay-250" // Adjusted delay
              />
              <SimpleFeatureCard 
                icon={<Brain className="h-7 w-7" />} 
                title="Dynamic Knowledge Core: Always Learning." 
                description="Feed it docs, sites, FAQs. Your agent becomes an expert, adapting and growing with your business."
                caseStudy={{ quote: "Our agent is now our single source of truth for product info.", metric: "Instant & Accurate Answers", author: "Product @ AIPoweredCo" }}
                animationDelay="delay-350" // Adjusted delay
              />
              <SimpleFeatureCard 
                icon={<Zap className="h-7 w-7" />} 
                title="Autonomous Action Engine: Beyond Chat." 
                description="Agents don't just talk—they *do*. Decide, execute tasks, update CRMs, integrate seamlessly across your stack."
                caseStudy={{ quote: "Automating invoice processing saved 20 hrs/week. AutoBoss just handles it.", metric: "Full Task Automation", author: "Ops @ InnovateLLC" }}
                animationDelay="delay-450" // Adjusted delay
              />
            </div>
          </div>
        </section>

        <section ref={howItWorksRef} id="how-it-works" className={cn("scroll-reveal section-light-accent w-full py-12 md:py-20 lg:py-24", howItWorksVisible && "visible")}> {/* Adjusted padding */}
          <div className="container px-4 md:px-6 text-center">
            <h2 className="font-headline mb-3 text-card-foreground"> {/* Reduced margin */}
              Launch Your AI Teammate in <span className="gradient-text-on-light">3 Simple Steps</span>
            </h2>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto mb-10 md:mb-12"> {/* Adjusted margin */}
              From idea to impact, faster than you ever imagined. No complex coding required.
            </p>
            <div className="relative mx-auto max-w-5xl grid md:grid-cols-3 gap-6 md:gap-8 items-start"> {/* Adjusted gap */}
                <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-primary/20 -translate-y-1/2 z-0"></div> {/* Subtler line */}
                {[
                    { number: "1", title: "Define & Design", description: "Visually craft your agent's brain and personality in our intuitive Flow Studio.", icon: <Palette className="w-8 h-8 text-electric-teal"/>, dataAiHint:"ui design flowchart simple", animationDelay:"delay-150" },
                    { number: "2", title: "Enrich & Empower", description: "Upload docs or URLs. Train it on your specific data to build its unique knowledge core.", icon: <Brain className="w-8 h-8 text-neon-lime"/>, dataAiHint: "data upload knowledge clean", animationDelay:"delay-250" },
                    { number: "3", title: "Deploy & Dominate", description: "Integrate via widget, API, or direct link. Unleash its power across all your channels.", icon: <Rocket className="w-8 h-8 text-primary"/>, dataAiHint: "rocket launch tech minimal", animationDelay:"delay-350" },
                ].map((step, index) => {
                  const [stepRef, stepIsVisible] = useIntersectionObserver({ threshold: 0.3 });
                  return (
                    <article key={step.title} ref={stepRef} className={cn("scroll-reveal relative flex flex-col items-center gap-2 p-6 rounded-lg bg-background shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-foreground z-10", step.animationDelay, stepIsVisible && "visible")}>
                        <div className="absolute -top-4 bg-gradient-to-br from-electric-teal to-neon-lime text-background text-md font-bold w-10 h-10 rounded-full flex items-center justify-center border-2 border-card shadow-md">{step.number}</div>
                        <div className="mt-8 mb-1">{step.icon}</div> {/* Adjusted spacing */}
                        <h3 className="font-headline text-lg font-semibold text-center">{step.title}</h3>
                        <p className="text-xs text-muted-foreground text-center">{step.description}</p>
                        {/* Placeholder for interactive demo or visual - made smaller */}
                        <div className="w-full h-20 mt-3 rounded-md" data-ai-hint={step.dataAiHint}></div>
                    </article>
                  );
                })}
            </div>
            <div ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal mt-12 md:mt-16 max-w-3xl mx-auto", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-450")}> {/* Adjusted margin */}
                <h3 className="font-headline text-xl font-semibold mb-3 text-card-foreground">Experience the Studio Magic (Conceptual)</h3>
                <div className="aspect-video bg-background/50 rounded-lg shadow-inner flex flex-col items-center justify-center text-muted-foreground p-4 border border-dashed border-border" data-ai-hint="interactive ui demo minimal clean">
                    <Cog className="w-10 h-10 opacity-30 mb-2"/>
                    <p className="text-xs">Drag & drop to build a simple agent flow right here.</p>
                    <p className="text-[10px] mt-1">(Interactive demo placeholder)</p>
                     <Button variant="outline" size="sm" className="mt-3 border-primary/50 text-primary hover:text-primary hover:bg-primary/10 btn-interactive text-xs">Explore Studio Features</Button>
                </div>
            </div>
          </div>
        </section>

        <section ref={videoDemoRef} id="video-demo-placeholder" className={cn("scroll-reveal section-dark w-full py-12 md:py-20 text-center", videoDemoVisible && "visible")}> {/* Adjusted padding */}
            <div className="container px-4 md:px-6">
                <h2 className="font-headline text-foreground">
                    See AutoBoss in Action: <span className="gradient-text-on-dark">60 Seconds to "Wow!"</span>
                </h2>
                <p className="text-muted-foreground md:text-lg max-w-xl mx-auto mt-3 mb-6">Watch how easy it is to build and deploy an intelligent AI teammate.</p> {/* Adjusted spacing */}
                <div className="max-w-3xl mx-auto aspect-video bg-muted/30 rounded-lg shadow-xl flex items-center justify-center text-muted-foreground border border-border relative overflow-hidden cursor-pointer group" data-ai-hint="video player modern dark sleek elegant">
                    <Image src="https://placehold.co/1280x720/10151C/10151C.png" alt="AutoBoss Demo Video Thumbnail" layout="fill" objectFit="cover" className="opacity-40 group-hover:opacity-20 transition-opacity" data-ai-hint="dark tech abstract thumbnail" loading="lazy"/>
                    <div className="video-placeholder-text z-10">
                         <PlayCircle size={70} className="text-primary cursor-pointer group-hover:scale-110 group-hover:text-neon-lime transition-all duration-300"/>
                         <p className="mt-2 text-sm font-semibold">Watch Quick Demo (1:03)</p>
                    </div>
                </div>
            </div>
        </section>

        <section ref={socialProofRef} id="social-proof" className={cn("scroll-reveal section-light-accent w-full py-12 md:py-20 lg:py-24", socialProofVisible && "visible")}> {/* Adjusted padding */}
            <div className="container px-4 md:px-6 text-center">
                <h2 className="font-headline mb-4 text-card-foreground">
                    Don't Just Take Our Word For It.
                </h2>
                 <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto mb-10 md:mb-12">Join thousands of innovators transforming their businesses.</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto text-left"> {/* Reduced gap */}
                    <article ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal bg-background p-6 rounded-lg shadow-lg transform hover:scale-103 transition-transform duration-300 text-foreground", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-150")}>
                        <div className="flex items-center mb-2">
                            <Image loading="lazy" src="https://placehold.co/40x40/E2E8F0/1A202C.png?text=AR" alt="Alex R." width={40} height={40} className="rounded-full mr-3" data-ai-hint="professional person portrait"/>
                            <div>
                                <h4 className="font-semibold text-foreground text-sm">Alex R.</h4>
                                <p className="text-xs text-muted-foreground">Support Lead @ GlobalSupport</p>
                            </div>
                        </div>
                        <div className="mb-1 flex">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-neon-lime fill-neon-lime mr-0.5"/>)}
                        </div>
                        <p className="text-xs italic text-muted-foreground">"AutoBoss revolutionized our support, handling 80% of inquiries autonomously. A true game-changer for our team's efficiency and customer satisfaction."</p>
                    </article>
                    <article ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal bg-gradient-to-br from-electric-teal to-neon-lime p-6 rounded-lg shadow-lg text-background flex flex-col items-center justify-center text-center", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-250")}>
                        <TrendingUp className="w-10 h-10 mb-2 opacity-80"/>
                        <p className="font-headline text-4xl md:text-5xl font-bold">97%</p>
                        <p className="text-md font-medium">Task Automation Success</p>
                        <Layers className="w-8 h-8 mt-4 mb-1 opacity-80"/>
                        <p className="font-headline text-3xl md:text-4xl font-bold">1M+</p>
                        <p className="text-sm">Agents Deployed Monthly</p>
                    </article>
                     <article ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal bg-background p-6 rounded-lg shadow-lg transform hover:scale-103 transition-transform duration-300 text-foreground", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-350")}>
                        <div className="flex items-center mb-2">
                             <Image loading="lazy" src="https://placehold.co/40x40/E2E8F0/1A202C.png?text=PS" alt="Priya S." width={40} height={40} className="rounded-full mr-3" data-ai-hint="founder startup person portrait"/>
                            <div>
                                <h4 className="font-semibold text-foreground text-sm">Priya S.</h4>
                                <p className="text-xs text-muted-foreground">Founder @ InnovateLLC</p>
                            </div>
                        </div>
                         <div className="mb-1 flex">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-neon-lime fill-neon-lime mr-0.5"/>)}
                        </div>
                        <p className="text-xs italic text-muted-foreground">"The visual flow builder is incredibly intuitive. We launched our first AI agent in under an hour, not days! Support for complex logic is surprisingly robust."</p>
                    </article>
                </div>
            </div>
        </section>

        <section ref={humanizeRef} className={cn("scroll-reveal section-dark w-full py-12 md:py-20 lg:py-24", humanizeVisible && "visible")}> {/* Adjusted padding */}
          <div className="container px-4 md:px-6 text-center">
            <h2 className="font-headline text-foreground">
              Built by Humans, for <span className="gradient-text-on-dark">Your Breakthroughs</span>.
            </h2>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto mt-3 mb-10"> {/* Adjusted spacing */}
              We're a passionate team dedicated to making sophisticated AI accessible to everyone. AutoBoss is more than software; it's your partner in innovation.
            </p>
            <div className="max-w-xl mx-auto bg-card p-6 rounded-lg shadow-xl transform hover:scale-103 transition-transform text-card-foreground"> {/* Reduced max-width */}
              <p className="italic text-sm text-muted-foreground">"I started AutoBoss from my dorm room, frustrated by clunky automation tools. My vision: a platform so intuitive, anyone could build truly intelligent AI agents that *actually work*. We're just getting started."</p> {/* Shorter quote */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <Image loading="lazy" src="https://placehold.co/60x60/1A202C/E2E8F0.png?text=AC" alt="Alex Chen, Founder (Placeholder)" width={60} height={60} className="rounded-full shadow-md" data-ai-hint="founder portrait friendly modern person" />
                <div>
                  <p className="font-semibold text-md text-card-foreground">Alex Chen (Placeholder)</p>
                  <p className="text-xs text-primary">Founder & CEO, AutoBoss</p>
                </div>
              </div>
            </div>
            <aside ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal mt-10", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-250")}> {/* Adjusted margin */}
                <h3 className="font-headline text-lg text-muted-foreground mb-3">Meet Some of the Team</h3>
                <div className="flex flex-wrap justify-center gap-4 md:gap-5">
                    <div className="flex flex-col items-center text-center w-20" data-ai-hint="team member developer person">
                        <Image loading="lazy" src="https://placehold.co/70x70/2D3748/E2E8F0.png?text=Dev" alt="Team Member 1 Placeholder" width={70} height={70} className="rounded-full opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 transform hover:scale-110"/>
                        <p className="text-xs mt-1 text-foreground font-medium">Jamie K.</p><p className="text-[10px] text-muted-foreground">Lead AI Engineer</p>
                    </div>
                     <div className="flex flex-col items-center text-center w-20" data-ai-hint="team member designer person">
                        <Image loading="lazy" src="https://placehold.co/70x70/2D3748/E2E8F0.png?text=UX" alt="Team Member 2 Placeholder" width={70} height={70} className="rounded-full opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 transform hover:scale-110"/>
                        <p className="text-xs mt-1 text-foreground font-medium">Lena R.</p><p className="text-[10px] text-muted-foreground">UX Architect</p>
                    </div>
                     <div className="flex flex-col items-center text-center w-20" data-ai-hint="team member ai specialist person">
                        <Image loading="lazy" src="https://placehold.co/70x70/2D3748/E2E8F0.png?text=AI" alt="Team Member 3 Placeholder" width={70} height={70} className="rounded-full opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 transform hover:scale-110"/>
                        <p className="text-xs mt-1 text-foreground font-medium">Mike B.</p><p className="text-[10px] text-muted-foreground">GenAI Specialist</p>
                    </div>
                </div>
            </aside>
          </div>
        </section>

        <section ref={finalCtaRef} className={cn("scroll-reveal section-cta-final w-full py-16 md:py-24 lg:py-28", finalCtaVisible && "visible")}> {/* Adjusted padding */}
          <div className="container px-4 md:px-6 text-center">
            <div className="mx-auto max-w-xl space-y-5 bg-card/80 dark:bg-background/60 backdrop-blur-md p-8 md:p-10 rounded-xl shadow-2xl"> {/* Reduced max-width & padding */}
              <h2 className="font-headline gradient-text-on-dark">
                Ready to Build the Unthinkable?
              </h2>
              <p className="text-muted-foreground md:text-lg">
                Your journey to effortless, intelligent automation starts now. AutoBoss is free to try. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4"> {/* Reduced gap & padding */}
                <Button size="lg" asChild className="shadow-xl bg-gradient-to-r from-electric-teal to-neon-lime text-background font-bold text-md px-8 py-5 hover:opacity-90 transition-all duration-300 hover:scale-105 group w-full sm:w-auto pulse-cta-btn btn-interactive"> {/* Adjusted padding & text size */}
                  <Link href="/dashboard">
                    Start Building Free
                    <Rocket className="ml-2 h-4 w-4 group-hover:animate-bounce" /> {/* Smaller icon */}
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="transition-all duration-300 hover:scale-105 hover:border-accent hover:text-accent px-8 py-5 text-md text-foreground border-muted-foreground/50 bg-background/30 dark:bg-card/30 backdrop-blur-sm w-full sm:w-auto btn-interactive"> {/* Adjusted padding & text size */}
                  <Link href="mailto:demo@autoboss.dev?subject=AutoBoss%20Demo%20Request"> 
                    Request a Demo <Eye className="ml-2 h-4 w-4"/> {/* Smaller icon */}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 border-t border-border/30 bg-background text-center"> {/* Reduced padding, subtler border */}
        <div className="container px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-3"> {/* Added gap */}
          <div className="flex items-center gap-2">
             <Link href="/" aria-label="AutoBoss Homepage" className="flex items-center justify-center">
                <Logo className="text-foreground hover:opacity-80 transition-opacity"/>
            </Link>
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} AutoBoss. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-3 sm:gap-4 mt-3 sm:mt-0"> {/* Reduced gap */}
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Terms</Link>
            <Link href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Privacy</Link>
            <Link href="mailto:support@autoboss.dev" className="text-xs text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Support</Link>
            {/* Placeholder for chat widget - functionality not implemented here */}
            {/* <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary p-0 h-auto btn-interactive" onClick={() => alert("AutoBoss AI: How can I assist you today? (Placeholder for actual chat widget)")}>
                <MessageCircle className="mr-1 h-3 w-3"/> Chat with Us (Demo)
            </Button> */}
          </nav>
        </div>
      </footer>
    </div>
  );
}

