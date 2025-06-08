
"use client"; // Required for useEffect, useState for animations

import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Share2, Cog, Rocket, Eye, Palette, BarChart3, ShieldCheck, PlayCircle, MessageCircle, UserCheck, Star, RefreshCcw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

// Simple Intersection Observer hook for scroll animations
const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [node, setNode] = useState<HTMLElement | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setEntry(entry);
        entry.target.classList.add('visible');
      }
    }, options);

    const { current: currentObserver } = observer;
    if (node) currentObserver.observe(node);

    return () => currentObserver.disconnect();
  }, [node, options]);

  return [setNode, entry] as const;
};


// Component for Feature/Benefit Cards with hover tilt effect
const TiltCard = ({ icon, title, description, dataAiHint }: { icon: React.ReactNode, title: string, description: string, dataAiHint?: string }) => {
  const [setNode] = useIntersectionObserver({ threshold: 0.1 });
  return (
    <div 
      ref={setNode}
      className="scroll-reveal group flex flex-col items-center text-center gap-4 p-6 md:p-8 rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-xl hover:shadow-primary/30 transition-all duration-300 transform hover:-translate-y-2 hover:border-primary/50 perspective-1000"
      style={{ transformStyle: 'preserve-3d' }} // Needed for 3D tilt
    >
      <div 
        className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-3 group-hover:scale-110 transition-transform duration-300"
        style={{ transform: 'translateZ(20px)' }} // slight 3d pop
      >
        {icon}
      </div>
      <h3 
        className="font-headline text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-electric-teal"
        style={{ transform: 'translateZ(10px)' }}
      >
        {title}
      </h3>
      <p className="text-sm md:text-base text-muted-foreground flex-grow">{description}</p>
       {/* Conceptual: Image placeholder if needed, for now icon is primary */}
      {dataAiHint && <div className="w-full h-32 mt-4 rounded-md bg-muted/50 flex items-center justify-center text-xs text-muted-foreground" data-ai-hint={dataAiHint}>Visual Hint: {dataAiHint}</div>}
    </div>
  );
};

const painPoints = [
  "Tired of clunky chatbots?",
  "Support costs spiraling?",
  "Losing leads overnight?",
  "Manual tasks bogging you down?",
  "Ready for intelligent automation?",
];

export default function MarketingPage() {
  const [currentPainPointIndex, setCurrentPainPointIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentPainPointIndex((prevIndex) => (prevIndex + 1) % painPoints.length);
    }, 4000); // Change text every 4 seconds (3.5s typing + 0.5s pause)
    return () => clearInterval(intervalId);
  }, []);
  
  // Scroll animation for sections
  const useSectionObserver = (threshold = 0.1) => {
    const [setNode] = useIntersectionObserver({ threshold });
    return setNode;
  };
  
  const heroRef = useSectionObserver();
  const featuresRef = useSectionObserver();
  const howItWorksRef = useSectionObserver();
  const socialProofRef = useSectionObserver();
  const humanizeRef = useSectionObserver();
  const finalCtaRef = useSectionObserver();


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground text-center selection:bg-accent selection:text-accent-foreground">
      {/* Sticky Header */}
      <header className="w-full px-4 lg:px-6 h-20 flex items-center border-b border-border/50 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity" aria-label="AutoBoss Homepage">
            <Logo /> {/* Logo is now purely presentational */}
          </Link>
          <nav className="hidden md:flex gap-4 sm:gap-6 items-center">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
              Superpowers
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
              How It Works
            </Link>
             <Link href="#social-proof" className="text-sm font-medium hover:text-primary transition-colors" prefetch={false}>
              Loved By
            </Link>
            <Button variant="outline" size="sm" asChild className="border-primary/50 hover:border-primary hover:text-primary">
                <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild className="shadow-md bg-gradient-to-r from-electric-teal to-neon-lime text-background font-semibold hover:opacity-90 transition-opacity">
              <Link href="/dashboard">
                Build Your Agent <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
           <div className="md:hidden"> {/* Basic Mobile Menu Trigger Placeholder */}
            <Button variant="ghost" size="icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section ref={heroRef} className="scroll-reveal section-dark w-full py-24 md:py-32 lg:py-40 xl:py-48 relative overflow-hidden">
           {/* Placeholder for video/WebGL background */}
          <div className="absolute inset-0 z-0 opacity-20">
             {/* Replace with actual video or WebGL canvas */}
            <video autoPlay loop muted playsInline className="w-full h-full object-cover">
              <source src="https://placehold.co/1920x1080.mp4?text=Abstract+AI+Motion" type="video/mp4" data-ai-hint="abstract ai motion dark" />
            </video>
          </div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="mx-auto max-w-3xl space-y-6 md:space-y-8">
              <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="block mb-2 md:mb-4 text-muted-foreground/80 text-3xl sm:text-4xl md:text-5xl">Stop Building Chatbots.</span>
                <span key={currentPainPointIndex} className="typewriter-text block bg-clip-text text-transparent bg-gradient-to-r from-electric-teal via-neon-lime to-primary min-h-[60px] sm:min-h-[80px] md:min-h-[100px]">
                  {painPoints[currentPainPointIndex]}
                </span>
                <span className="block mt-2 md:mt-4 text-3xl sm:text-4xl md:text-5xl">Start Building AutoBoss Agents.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
                The future of automation isn't just conversation. It's action. Create AI agents that truly understand, decide, and *do*.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" asChild className="shadow-lg bg-gradient-to-r from-electric-teal to-neon-lime text-background font-bold text-base md:text-lg px-8 py-6 hover:opacity-90 transition-all duration-300 hover:scale-105 group">
                  <Link href="/dashboard">
                    Launch Your First Agent (Free)
                    <Rocket className="ml-2 h-5 w-5 group-hover:animate-ping" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="transition-all duration-300 hover:scale-105 hover:border-accent hover:text-accent px-8 py-6 text-base md:text-lg border-muted-foreground/50">
                  <Link href="#features">
                    See the Magic <Eye className="ml-2 h-5 w-5"/>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* "Wow Factors" / Key Benefits Section */}
        <section ref={featuresRef} id="features" className="section-light-accent w-full py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl space-y-4 mb-12 md:mb-16">
              <div className="inline-block rounded-lg bg-gradient-to-r from-electric-teal to-neon-lime px-4 py-2 text-sm text-background font-semibold shadow-md">
                AutoBoss Superpowers
              </div>
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                More Than Automation. It’s Transformation.
              </h2>
              <p className="text-muted-foreground md:text-lg">
                Equip your business with AI that doesn't just talk, it *achieves*.
              </p>
            </div>
            <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <TiltCard icon={<Cog className="h-10 w-10 text-electric-teal" />} title="Intuitive Flow Studio" description="Drag, drop, done. Design complex agent logic visually. Zero code, infinite power." dataAiHint="flowchart dark tech" />
              <TiltCard icon={<Palette className="h-10 w-10 text-neon-lime" />} title="Instant Persona AI" description="Define a role, get a personality. Your agent, your brand, in seconds." dataAiHint="ai character dark minimal" />
              <TiltCard icon={<Brain className="h-10 w-10 text-primary" />} title="Dynamic Knowledge Core" description="Feed it docs, URLs, FAQs. Watch it learn, adapt, and answer anything." dataAiHint="digital brain dark network" />
              <TiltCard icon={<Zap className="h-10 w-10 text-electric-teal" />} title="Autonomous Action Engine" description="Agents that don't just chat—they execute tasks, make decisions, and drive results." dataAiHint="ai speed dark tech" />
              <TiltCard icon={<Share2 className="h-10 w-10 text-neon-lime" />} title="Deploy Anywhere, Effortlessly" description="Embed widgets, use APIs, or share direct links. Go live in minutes, not months." dataAiHint="connections dark global" />
              <TiltCard icon={<RefreshCcw className="h-10 w-10 text-primary" />} title="Continuous Self-Improvement" description="Your agents learn from interactions, getting smarter and more efficient over time. (Conceptual)" dataAiHint="ai learning dark loop" />
            </div>
          </div>
        </section>

        {/* How It Works (Simplified) */}
        <section ref={howItWorksRef} id="how-it-works" className="section-dark w-full py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl space-y-4 mb-12 md:mb-16">
                <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                    Launch in <span className="bg-clip-text text-transparent bg-gradient-to-r from-electric-teal to-neon-lime">3 Simple Steps</span>
                </h2>
                <p className="text-muted-foreground md:text-lg">From idea to intelligent agent, faster than ever.</p>
            </div>
            <div className="relative mx-auto max-w-5xl grid md:grid-cols-3 gap-10 items-start">
                {[
                    { number: "1", title: "Define & Design", description: "Visually craft your agent's brain and personality in our intuitive Studio.", icon: <Palette className="w-10 h-10 text-electric-teal"/>, dataAiHint: "ui design dark modern" },
                    { number: "2", title: "Enrich & Empower", description: "Upload docs or URLs to build a smart knowledge core. Train it on your data.", icon: <Brain className="w-10 h-10 text-neon-lime"/>, dataAiHint: "data upload dark tech" },
                    { number: "3", title: "Deploy & Dominate", description: "Integrate via widget, API, or direct link. Watch it transform your business.", icon: <Rocket className="w-10 h-10 text-primary"/>, dataAiHint: "rocket launch dark tech" },
                ].map((step, index) => (
                <div key={step.title} ref={useSectionObserver(0.2)} className="scroll-reveal relative flex flex-col items-center gap-3 p-6 rounded-lg bg-card/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-br from-electric-teal to-neon-lime text-background text-lg font-bold w-12 h-12 rounded-full flex items-center justify-center border-4 border-background shadow-lg">{step.number}</div>
                    <div className="mt-10 mb-2">{step.icon}</div>
                    <h3 className="font-headline text-xl font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                ))}
            </div>
          </div>
        </section>

        {/* Social Proof (Conceptual but improved structure) */}
        <section ref={socialProofRef} id="social-proof" className="section-light-accent w-full py-16 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
                    Join the <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-electric-teal">Automation Revolution</span>
                </h2>
                <p className="mt-4 text-muted-foreground mx-auto max-w-xl md:text-lg mb-12">
                    Businesses worldwide are choosing AutoBoss to build AI agents that deliver real results.
                </p>
                {/* Logos Marquee */}
                <div className="marquee w-full max-w-4xl mx-auto mb-12">
                  <div className="marquee-content flex items-center gap-12 md:gap-16">
                    {[...Array(2)].flatMap((_, repeatIndex) => [ // Repeat logos for smooth loop
                        { name: "Innovatech", hint: "modern tech logo dark" },
                        { name: "SolutionsAI", hint: "ai startup logo dark" },
                        { name: "GlobalSupport", hint: "global company logo dark" },
                        { name: "NextGen Leads", hint: "sales tech logo dark" },
                        { name: "DataDriven Inc.", hint: "data analytics logo dark" },
                    ].map((logo, index) => (
                      <div key={`${repeatIndex}-${index}`} className="flex-shrink-0 h-10 md:h-12 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                         <Image src={`https://placehold.co/150x50/333333/888888.png?text=${logo.name.replace(/\s/g,'+')}`} alt={`${logo.name} Logo`} width={150} height={50} className="object-contain h-full" data-ai-hint={logo.hint} />
                      </div>
                    )))}
                  </div>
                </div>

                {/* Testimonials & Stats */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <div ref={useSectionObserver(0.2)} className="scroll-reveal bg-card p-6 rounded-lg shadow-lg">
                        <Star className="w-6 h-6 text-neon-lime mb-2"/>
                        <p className="italic text-muted-foreground">"AutoBoss cut our support response time by 70%! Our customers are happier, and our team can focus on complex issues."</p>
                        <p className="font-semibold mt-3">- Sarah L., Head of Support, Innovatech</p>
                    </div>
                    <div ref={useSectionObserver(0.25)} className="scroll-reveal bg-card p-6 rounded-lg shadow-lg md:col-span-1">
                        <BarChart3 className="w-6 h-6 text-electric-teal mb-2"/>
                        <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-electric-teal to-neon-lime">1M+</p>
                        <p className="text-muted-foreground">Automated Tasks Monthly</p>
                        <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-electric-teal mt-4">97%</p>
                        <p className="text-muted-foreground">Issue Resolution Rate</p>
                    </div>
                     <div ref={useSectionObserver(0.3)} className="scroll-reveal bg-card p-6 rounded-lg shadow-lg">
                        <UserCheck className="w-6 h-6 text-primary mb-2"/>
                        <p className="italic text-muted-foreground">"The visual flow builder is a game-changer. We designed and launched our lead qualification agent in just two days."</p>
                        <p className="font-semibold mt-3">- Mark B., CEO, NextGen Leads</p>
                    </div>
                </div>
                 {/* Placeholder for Video Testimonials */}
                <div ref={useSectionObserver(0.1)} className="scroll-reveal mt-12 text-center">
                    <h3 className="font-headline text-2xl font-semibold mb-4">See What Our Users Say</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                        {[1,2,3].map(i => (
                            <div key={i} className="aspect-video bg-muted rounded-lg shadow-md flex items-center justify-center text-muted-foreground">
                                <PlayCircle size={48} className="opacity-50"/>
                                <p className="absolute bottom-2 text-xs">Video Testimonial {i} (Placeholder)</p>
                                {/* <iframe data-ai-hint="user testimonial video dark" width="100%" height="100%" src="https://www.youtube.com/embed/placeholder_video_id" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-lg"></iframe> */}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

         {/* Humanize the Brand (Conceptual) */}
        <section ref={humanizeRef} id="about-us" className="section-dark w-full py-16 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl space-y-4 mb-12 md:mb-16">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                Built by Humans, for <span className="bg-clip-text text-transparent bg-gradient-to-r from-electric-teal to-neon-lime">Breakthroughs</span>.
              </h2>
              <p className="text-muted-foreground md:text-lg">
                We're passionate about making sophisticated AI accessible to everyone. AutoBoss is more than software; it's a partner in your innovation journey.
              </p>
            </div>
            {/* Placeholder for team/founder story */}
            <div className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm p-6 md:p-8 rounded-lg shadow-xl">
              <p className="italic text-muted-foreground">"I started AutoBoss because I saw businesses struggling with clunky, ineffective automation. My goal was simple: create a platform so intuitive and powerful that anyone could build truly intelligent AI agents. We're just getting started."</p>
              <div className="flex items-center gap-4 mt-4">
                <Image src="https://placehold.co/80x80/4A5568/A0AEC0.png?text=CEO" alt="Founder/CEO" width={60} height={60} className="rounded-full" data-ai-hint="ceo portrait dark" />
                <div>
                  <p className="font-semibold">Alex Chen (Placeholder Name)</p>
                  <p className="text-sm text-primary">Founder & CEO, AutoBoss</p>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Final CTA Section */}
        <section ref={finalCtaRef} className="section-light-accent w-full py-20 md:py-28 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-2xl space-y-6">
              <h2 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-br from-primary via-electric-teal to-neon-lime">
                Ready to Build the Unthinkable?
              </h2>
              <p className="text-muted-foreground md:text-lg">
                Your journey to effortless, intelligent automation starts now. AutoBoss is free to try. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button size="lg" asChild className="shadow-xl bg-gradient-to-r from-electric-teal to-neon-lime text-background font-bold text-lg px-10 py-7 hover:opacity-90 transition-all duration-300 hover:scale-105 group w-full sm:w-auto">
                  <Link href="/dashboard">
                    Create Your Agent Now
                    <Rocket className="ml-3 h-5 w-5 group-hover:animate-spin" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="transition-all duration-300 hover:scale-105 hover:border-accent hover:text-accent px-10 py-7 text-lg border-muted-foreground/50 w-full sm:w-auto">
                  <Link href="mailto:demo@autoboss.dev?subject=AutoBoss Demo Request"> {/* Placeholder mailto */}
                    Request a Demo <PlayCircle className="ml-3 h-5 w-5"/>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-border/50 bg-background">
        <div className="container px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} AutoBoss. All rights reserved.</p>
          </div>
          <nav className="flex gap-4 sm:gap-6 mt-4 sm:mt-0">
            <Link href="#" className="text-xs hover:text-primary transition-colors" prefetch={false}>
              Terms
            </Link>
            <Link href="#" className="text-xs hover:text-primary transition-colors" prefetch={false}>
              Privacy
            </Link>
            <Link href="mailto:support@autoboss.dev" className="text-xs hover:text-primary transition-colors" prefetch={false}>
              Support
            </Link>
             {/* Placeholder for Chat Widget Trigger */}
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary p-0 h-auto" onClick={() => alert("Chat Widget Placeholder: Clicked!")}>
                <MessageCircle className="mr-1 h-3 w-3"/> Chat with Us
            </Button>
          </nav>
        </div>
      </footer>
      
      {/* Script for scroll animations - basic implementation */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const scrollElements = document.querySelectorAll(".scroll-reveal");
            const elementInView = (el, dividend = 1) => {
              const elementTop = el.getBoundingClientRect().top;
              return (
                elementTop <= (window.innerHeight || document.documentElement.clientHeight) / dividend
              );
            };
            const displayScrollElement = (element) => {
              element.classList.add("visible");
            };
            const hideScrollElement = (element) => {
              element.classList.remove("visible");
            };
            const handleScrollAnimation = () => {
              scrollElements.forEach((el) => {
                if (elementInView(el, 1.05)) { // Adjust dividend for when animation triggers
                  displayScrollElement(el);
                } else {
                  // Optionally hide if you want elements to fade out when scrolled out of view
                  // hideScrollElement(el); 
                }
              })
            }
            window.addEventListener("scroll", () => { 
              handleScrollAnimation();
            });
            // Initial check
            handleScrollAnimation();
          `,
        }}
      />
    </div>
  );
}

