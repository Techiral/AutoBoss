
"use client"; 

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Cog, Rocket, Eye, Palette, BarChart3, PlayCircle, MessageCircle, Star, Settings, Users, Layers, Menu, X as CloseIcon, ShieldCheck, Smile, TrendingUp, SearchCode, Edit3, Handshake, Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
// Removed: import { useAppContext } from "../(app)/layout";

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
      // Fallback for environments where IntersectionObserver is not available (e.g., some test runners)
      // or for very old browsers. For modern browsers, this is unlikely to be hit.
      setIsIntersecting(true); // Assume visible if observer is not supported
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
  dataAiHint?: string;
  animationDelay?: string; 
}

const SimpleFeatureCard: React.FC<SimpleFeatureCardProps> = ({ icon, title, description, caseStudy, dataAiHint, animationDelay }) => {
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
      {dataAiHint && <div className="w-full h-32 mt-4 rounded-md" data-ai-hint={dataAiHint}></div>}
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
  // Removed: const { theme } = useAppContext();
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
          <Link href="#superpowers" className="block py-2 text-foreground hover:text-primary" onClick={toggleMobileMenu}>Superpowers</Link>
          <Link href="#how-it-works" className="block py-2 text-foreground hover:text-primary" onClick={toggleMobileMenu}>How It Works</Link>
          <Link href="#social-proof" className="block py-2 text-foreground hover:text-primary" onClick={toggleMobileMenu}>Proof</Link>
          <Link href="/login" className="block py-2 text-foreground hover:text-primary" onClick={toggleMobileMenu}>Login</Link>
          <Button asChild className="w-full font-semibold bg-gradient-to-r from-electric-teal to-neon-lime text-background shadow-md hover:opacity-90 transition-opacity btn-interactive">
            <Link href="/dashboard" onClick={toggleMobileMenu}>Try AutoBoss Free</Link>
          </Button>
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section ref={heroRef} className={cn("scroll-reveal section-dark w-full min-h-[calc(100vh-5rem)] flex items-center justify-center text-center py-20 md:py-28 relative overflow-hidden", heroVisible && "visible")}>
          <div className="absolute inset-0 z-0 opacity-20">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover" poster="https://placehold.co/1920x1080/0D1117/0D1117.png" data-ai-hint="abstract ai motion dark futuristic particles">
              <source src="https://placehold.co/1920x1080.mp4?text=." type="video/mp4" /> 
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/70"></div>
          </div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="mx-auto max-w-3xl space-y-6 md:space-y-8">
              <h1 className="font-headline">
                <span ref={typewriterRef} className="typewriter-text block gradient-text-on-dark min-h-[60px] sm:min-h-[80px] md:min-h-[120px] lg:min-h-[140px]">
                  {painPoints[currentPainPointIndex]}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
                AutoBoss builds AI agents that don't just chat—they <strong className="text-foreground">think, decide, and execute</strong> complex tasks. Supercharge your business instantly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button size="lg" asChild className="shadow-lg bg-gradient-to-r from-electric-teal to-neon-lime text-background font-bold text-base md:text-lg px-8 py-6 hover:opacity-90 transition-all duration-300 hover:scale-105 group pulse-cta-btn btn-interactive">
                  <Link href="/dashboard">
                    Launch Your First Agent Free
                    <Rocket className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="transition-all duration-300 hover:scale-105 hover:border-accent hover:text-accent px-8 py-6 text-base md:text-lg border-muted-foreground/50 text-foreground bg-background/50 backdrop-blur-sm btn-interactive">
                  <Link href="#video-demo-placeholder"> 
                    Watch 60s Demo <PlayCircle className="ml-2 h-5 w-5"/>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="section-light-accent w-full py-10 md:py-12 border-b border-border">
            <div className="container px-4 md:px-6 text-center">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-primary mb-6">Powering AI Breakthroughs for Visionary Teams</h2>
                <div className="marquee w-full max-w-5xl mx-auto">
                  <div className="marquee-content flex items-center gap-12 md:gap-16">
                    {[...Array(2)].flatMap((_, repeatIndex) => [ 
                        { name: "InnovateLLC", hint: "modern tech logo clean" },
                        { name: "AIPoweredCo", hint: "ai solutions logo professional" },
                        { name: "GlobalSupport", hint: "global enterprise logo simple" },
                        { name: "NextGenFlow", hint: "future tech logo abstract" },
                        { name: "DataDrivenInc", hint: "data analytics logo sharp" },
                    ].map((logo, index) => (
                      <div key={`${repeatIndex}-${index}`} className="flex-shrink-0 h-8 md:h-10 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 transform hover:scale-110">
                         {/* Using static colors suitable for dark theme, as 'theme' variable is not available here */}
                         <Image loading="lazy" src={`https://placehold.co/150x40/1A202C/E2E8F0.png?text=${logo.name.replace(/\s/g,'+')}&font=nunito`} alt={`${logo.name} Logo`} width={150} height={40} className="object-contain h-full" data-ai-hint={logo.hint} />
                      </div>
                    )))}
                  </div>
                </div>
            </div>
        </section>

        <section ref={superpowersRef} id="superpowers" className={cn("scroll-reveal section-dark w-full py-16 md:py-24 lg:py-32", superpowersVisible && "visible")}>
          <div className="container px-4 md:px-6 text-center">
            <h2 className="font-headline mb-4 text-foreground">
              This Isn't Just Automation. This is <span className="gradient-text-on-dark">Your AI Workforce.</span>
            </h2>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto mb-12 md:mb-16">
              AutoBoss agents are more than tools—they're teammates. Here's how they deliver game-changing results:
            </p>
            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
              <SimpleFeatureCard 
                icon={<Edit3 className="h-8 w-8" />} 
                title="Visual Flow Studio: Build Genius, No Code." 
                description="Drag, drop, done. Design complex AI logic visually. If you can map it, AutoBoss can build it."
                caseStudy={{ quote: "Our non-tech team built a lead qualifier in an afternoon. Revolutionary!", metric: "5x Faster Deployment", author: "Marketing @ DataDrivenInc" }}
                dataAiHint="flowchart dark tech node interface"
                animationDelay="delay-100"
              />
              <SimpleFeatureCard 
                icon={<Palette className="h-8 w-8" />} 
                title="AI Persona Engine: Your Brand, Embodied." 
                description="Define a role, get a personality. Agents that perfectly match your brand values and tone, instantly."
                caseStudy={{ quote: "The AI-generated persona was spot-on. Feels like one of us.", metric: "99% Brand Consistency", author: "CEO @ NextGenFlow" }}
                dataAiHint="ai character mask creative dark"
                animationDelay="delay-200"
              />
              <SimpleFeatureCard 
                icon={<Brain className="h-8 w-8" />} 
                title="Dynamic Knowledge Core: Always Learning." 
                description="Feed it docs, sites, FAQs. Your agent becomes an expert, adapting and growing with your business."
                caseStudy={{ quote: "Our agent is now our single source of truth for product info.", metric: "Instant & Accurate Answers", author: "Product @ AIPoweredCo" }}
                dataAiHint="digital brain network connections dark"
                animationDelay="delay-300"
              />
              <SimpleFeatureCard 
                icon={<Zap className="h-8 w-8" />} 
                title="Autonomous Action Engine: Beyond Chat." 
                description="Agents don't just talk—they *do*. Decide, execute tasks, update CRMs, integrate seamlessly across your stack."
                caseStudy={{ quote: "Automating invoice processing saved 20 hrs/week. AutoBoss just handles it.", metric: "Full Task Automation", author: "Ops @ InnovateLLC" }}
                dataAiHint="ai speed power abstract dark"
                animationDelay="delay-400"
              />
            </div>
          </div>
        </section>

        <section ref={howItWorksRef} id="how-it-works" className={cn("scroll-reveal section-light-accent w-full py-16 md:py-24 lg:py-32", howItWorksVisible && "visible")}>
          <div className="container px-4 md:px-6 text-center">
            <h2 className="font-headline mb-4 text-card-foreground">
              Launch Your AI Teammate in <span className="gradient-text-on-light">3 Simple Steps</span>
            </h2>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto mb-12 md:mb-16">From idea to impact, faster than you ever imagined. No complex coding required.</p>
            <div className="relative mx-auto max-w-5xl grid md:grid-cols-3 gap-10 items-start">
                <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-primary/30 -translate-y-1/2 z-0"></div>
                {[
                    { number: "1", title: "Define & Design", description: "Visually craft your agent's brain and personality in our intuitive Flow Studio. No code, pure intuition.", icon: <Palette className="w-10 h-10 text-electric-teal"/>, dataAiHint:"ui design flowchart simple", animationDelay:"delay-100" },
                    { number: "2", title: "Enrich & Empower", description: "Upload docs or URLs. Train it on your specific data to build its unique knowledge core.", icon: <Brain className="w-10 h-10 text-neon-lime"/>, dataAiHint: "data upload knowledge clean", animationDelay:"delay-200" },
                    { number: "3", title: "Deploy & Dominate", description: "Integrate via widget, API, or direct link. Unleash its power across all your channels.", icon: <Rocket className="w-10 h-10 text-primary"/>, dataAiHint: "rocket launch tech minimal", animationDelay:"delay-300" },
                ].map((step) => {
                  const [stepRef, stepIsVisible] = useIntersectionObserver({ threshold: 0.3 });
                  return (
                    <article key={step.title} ref={stepRef} className={cn("scroll-reveal relative flex flex-col items-center gap-3 p-6 rounded-lg bg-background shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-foreground z-10", step.animationDelay, stepIsVisible && "visible")}>
                        <div className="absolute -top-5 bg-gradient-to-br from-electric-teal to-neon-lime text-background text-lg font-bold w-12 h-12 rounded-full flex items-center justify-center border-4 border-card shadow-lg">{step.number}</div>
                        <div className="mt-10 mb-2">{step.icon}</div>
                        <h3 className="font-headline text-xl font-semibold">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        <div className="w-full h-24 mt-2 rounded-md" data-ai-hint={step.dataAiHint}></div>
                    </article>
                  );
                })}
            </div>
            <div ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal mt-16 md:mt-24 max-w-3xl mx-auto", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-400")}>
                <h3 className="font-headline text-2xl font-semibold mb-4 text-card-foreground">Experience the Studio Magic (Conceptual)</h3>
                <div className="aspect-video bg-background/50 rounded-lg shadow-inner flex flex-col items-center justify-center text-muted-foreground p-6 border border-dashed border-border" data-ai-hint="interactive ui demo minimal clean">
                    <Cog className="w-12 h-12 opacity-30 mb-3"/>
                    <p className="text-sm">Drag & drop to build a simple agent flow right here.</p>
                    <p className="text-xs mt-1">(Interactive demo placeholder)</p>
                     <Button variant="outline" className="mt-4 border-primary/50 text-primary hover:text-primary hover:bg-primary/10 btn-interactive">Explore Studio Features</Button>
                </div>
            </div>
          </div>
        </section>

        <section ref={videoDemoRef} id="video-demo-placeholder" className={cn("scroll-reveal section-dark w-full py-16 md:py-24 text-center", videoDemoVisible && "visible")}>
            <div className="container px-4 md:px-6">
                <h2 className="font-headline text-foreground">
                    See AutoBoss in Action: <span className="gradient-text-on-dark">60 Seconds to "Wow!"</span>
                </h2>
                <p className="text-muted-foreground md:text-lg max-w-xl mx-auto mt-4 mb-8">Watch how easy it is to build and deploy an intelligent AI teammate.</p>
                <div className="max-w-3xl mx-auto aspect-video bg-muted/50 rounded-lg shadow-xl flex items-center justify-center text-muted-foreground border border-border relative overflow-hidden cursor-pointer group" data-ai-hint="video player modern dark sleek elegant">
                    <Image src="https://placehold.co/1280x720/10151C/10151C.png" alt="AutoBoss Demo Video Thumbnail" layout="fill" objectFit="cover" className="opacity-50 group-hover:opacity-30 transition-opacity" data-ai-hint="dark tech abstract thumbnail" loading="lazy"/>
                    <div className="video-placeholder-text z-10">
                         <PlayCircle size={80} className="text-primary cursor-pointer group-hover:scale-110 group-hover:text-neon-lime transition-all duration-300"/>
                         <p className="mt-3 text-base font-semibold">Watch Quick Demo (1:03)</p>
                    </div>
                </div>
            </div>
        </section>

        <section ref={socialProofRef} id="social-proof" className={cn("scroll-reveal section-light-accent w-full py-16 md:py-24 lg:py-32", socialProofVisible && "visible")}>
            <div className="container px-4 md:px-6 text-center">
                <h2 className="font-headline mb-12 text-card-foreground">
                    Don't Just Take Our Word For It. <span className="block text-lg text-muted-foreground mt-2">Join thousands of innovators transforming their businesses.</span>
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto text-left">
                    <article ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal bg-background p-6 rounded-lg shadow-lg transform hover:scale-103 transition-transform duration-300 text-foreground", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-100")}>
                        <div className="flex items-center mb-3">
                            <Image loading="lazy" src="https://placehold.co/50x50/E2E8F0/1A202C.png?text=AR" alt="Alex R." width={50} height={50} className="rounded-full mr-3" data-ai-hint="professional person portrait"/>
                            <div>
                                <h4 className="font-semibold text-foreground">Alex R.</h4>
                                <p className="text-xs text-muted-foreground">Support Lead @ GlobalSupport</p>
                            </div>
                        </div>
                        <div className="mb-2 flex">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-neon-lime fill-neon-lime mr-1"/>)}
                        </div>
                        <p className="text-sm italic text-muted-foreground">"AutoBoss revolutionized our support, handling 80% of inquiries autonomously. A true game-changer for our team's efficiency and customer satisfaction."</p>
                    </article>
                    <article ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal bg-gradient-to-br from-electric-teal to-neon-lime p-6 rounded-lg shadow-lg text-background flex flex-col items-center justify-center text-center", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-200")}>
                        <TrendingUp className="w-12 h-12 mb-3 opacity-80"/>
                        <p className="font-headline text-5xl md:text-6xl font-bold">97%</p>
                        <p className="text-lg font-medium">Task Automation Success</p>
                        <Layers className="w-10 h-10 mt-6 mb-2 opacity-80"/>
                        <p className="font-headline text-4xl md:text-5xl font-bold">1M+</p>
                        <p className="text-md">Agents Deployed Monthly</p>
                    </article>
                     <article ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal bg-background p-6 rounded-lg shadow-lg transform hover:scale-103 transition-transform duration-300 text-foreground", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-300")}>
                        <div className="flex items-center mb-3">
                             <Image loading="lazy" src="https://placehold.co/50x50/E2E8F0/1A202C.png?text=PS" alt="Priya S." width={50} height={50} className="rounded-full mr-3" data-ai-hint="founder startup person portrait"/>
                            <div>
                                <h4 className="font-semibold text-foreground">Priya S.</h4>
                                <p className="text-xs text-muted-foreground">Founder @ InnovateLLC</p>
                            </div>
                        </div>
                         <div className="mb-2 flex">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-neon-lime fill-neon-lime mr-1"/>)}
                        </div>
                        <p className="text-sm italic text-muted-foreground">"The visual flow builder is incredibly intuitive. We launched our first AI agent in under an hour, not days! Support for complex logic is surprisingly robust."</p>
                    </article>
                </div>
            </div>
        </section>

        <section ref={humanizeRef} className={cn("scroll-reveal section-dark w-full py-16 md:py-24 lg:py-32", humanizeVisible && "visible")}>
          <div className="container px-4 md:px-6 text-center">
            <h2 className="font-headline text-foreground">
              Built by Humans, for <span className="gradient-text-on-dark">Your Breakthroughs</span>.
            </h2>
            <p className="text-muted-foreground md:text-lg max-w-2xl mx-auto mt-4 mb-12">
              We're a passionate team dedicated to making sophisticated AI accessible to everyone. AutoBoss is more than software; it's your partner in innovation.
            </p>
            <div className="max-w-2xl mx-auto bg-card p-6 md:p-8 rounded-lg shadow-xl transform hover:scale-103 transition-transform text-card-foreground">
              <p className="italic text-muted-foreground">"I started AutoBoss from my dorm room, frustrated by clunky automation tools that promised much but delivered little. My vision: a platform so intuitive, anyone could build truly intelligent AI agents that *actually work*. We're just getting started on this journey with you."</p>
              <div className="flex items-center justify-center gap-4 mt-6">
                <Image loading="lazy" src="https://placehold.co/80x80/1A202C/E2E8F0.png?text=AC" alt="Alex Chen, Founder (Placeholder)" width={70} height={70} className="rounded-full shadow-md" data-ai-hint="founder portrait friendly modern person" />
                <div>
                  <p className="font-semibold text-lg text-card-foreground">Alex Chen (Placeholder)</p>
                  <p className="text-sm text-primary">Founder & CEO, AutoBoss</p>
                </div>
              </div>
            </div>
            <aside ref={useIntersectionObserver(sectionObserverOptions)[0]} className={cn("scroll-reveal mt-12", useIntersectionObserver(sectionObserverOptions)[1] && "visible", "delay-200")}>
                <h3 className="font-headline text-xl text-muted-foreground mb-4">Meet Some of the Team</h3>
                <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                    <div className="flex flex-col items-center text-center w-24" data-ai-hint="team member developer person">
                        <Image loading="lazy" src="https://placehold.co/100x100/2D3748/E2E8F0.png?text=Dev" alt="Team Member 1 Placeholder" width={80} height={80} className="rounded-full opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 transform hover:scale-110"/>
                        <p className="text-xs mt-2 text-foreground font-medium">Jamie K.</p><p className="text-xs text-muted-foreground">Lead AI Engineer</p>
                    </div>
                     <div className="flex flex-col items-center text-center w-24" data-ai-hint="team member designer person">
                        <Image loading="lazy" src="https://placehold.co/100x100/2D3748/E2E8F0.png?text=UX" alt="Team Member 2 Placeholder" width={80} height={80} className="rounded-full opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 transform hover:scale-110"/>
                        <p className="text-xs mt-2 text-foreground font-medium">Lena R.</p><p className="text-xs text-muted-foreground">UX Architect</p>
                    </div>
                     <div className="flex flex-col items-center text-center w-24" data-ai-hint="team member ai specialist person">
                        <Image loading="lazy" src="https://placehold.co/100x100/2D3748/E2E8F0.png?text=AI" alt="Team Member 3 Placeholder" width={80} height={80} className="rounded-full opacity-70 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 transform hover:scale-110"/>
                        <p className="text-xs mt-2 text-foreground font-medium">Mike B.</p><p className="text-xs text-muted-foreground">GenAI Specialist</p>
                    </div>
                </div>
            </aside>
          </div>
        </section>

        <section ref={finalCtaRef} className={cn("scroll-reveal section-cta-final w-full py-20 md:py-28 lg:py-32", finalCtaVisible && "visible")}>
          <div className="container px-4 md:px-6 text-center">
            <div className="mx-auto max-w-2xl space-y-6 bg-card/80 dark:bg-background/50 backdrop-blur-md p-8 md:p-12 rounded-xl shadow-2xl">
              <h2 className="font-headline gradient-text-on-dark">
                Ready to Build the Unthinkable?
              </h2>
              <p className="text-muted-foreground md:text-lg">
                Your journey to effortless, intelligent automation starts now. AutoBoss is free to try. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                <Button size="lg" asChild className="shadow-xl bg-gradient-to-r from-electric-teal to-neon-lime text-background font-bold text-lg px-10 py-7 hover:opacity-90 transition-all duration-300 hover:scale-105 group w-full sm:w-auto pulse-cta-btn btn-interactive">
                  <Link href="/dashboard">
                    Start Building Free
                    <Rocket className="ml-3 h-5 w-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="transition-all duration-300 hover:scale-105 hover:border-accent hover:text-accent px-10 py-7 text-lg text-foreground border-muted-foreground/50 bg-background/30 dark:bg-card/30 backdrop-blur-sm w-full sm:w-auto btn-interactive">
                  <Link href="mailto:demo@autoboss.dev?subject=AutoBoss%20Demo%20Request"> 
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
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary p-0 h-auto btn-interactive" onClick={() => alert("AutoBoss AI: How can I assist you today? (Placeholder for actual chat widget)")}>
                <MessageCircle className="mr-1 h-3 w-3"/> Chat with Us (Demo)
            </Button>
          </nav>
        </div>
      </footer>
    </div>
  );
}

