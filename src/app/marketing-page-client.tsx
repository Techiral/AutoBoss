
"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Brain, Cog, Rocket, Eye, Palette, BarChart3, PlayCircle, Star, Menu, X as CloseIcon, ShieldCheck, Smile, TrendingUp, SearchCode, Edit3, Handshake, Info, Layers, LifeBuoy, Users, Filter, UploadCloud, Share2, DollarSign, Store, Users2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const useIntersectionObserver = (options?: IntersectionObserverInit) => {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.IntersectionObserver || !node) {
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

const heroPainPoint = "AI Teammates."; 

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
      void typewriterRef.current.offsetWidth; 
      typewriterRef.current.classList.add("typewriter-text");
    }
  }, []); 

  const observerOptions = { threshold: 0.1 };
  const [heroRef, heroVisible] = useIntersectionObserver(observerOptions);
  const [solveProblemsRef, solveProblemsVisible] = useIntersectionObserver(observerOptions);
  const [superpowersRef, superpowersVisible] = useIntersectionObserver(observerOptions);
  const [howItWorksRef, howItWorksVisible] = useIntersectionObserver(observerOptions);
  const [videoDemoRef, videoDemoVisible] = useIntersectionObserver(observerOptions);
  const [socialProofRef, socialProofVisible] = useIntersectionObserver(observerOptions);
  const [humanizeRef, humanizeVisible] = useIntersectionObserver(observerOptions);
  const [founderQuoteAsideRef, founderQuoteAsideIsVisible] = useIntersectionObserver(observerOptions);
  const [finalCtaRef, finalCtaVisible] =  useIntersectionObserver(observerOptions);
  const [studioDemoPlaceholderRef, studioDemoPlaceholderIsVisible] = useIntersectionObserver(observerOptions);


  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const navLinks = [
    { href: "#features", label: "Why AutoBoss?" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#proof", label: "Client Success Stories" },
  ];

  const socialProofItems = [
    {
      type: "testimonial",
      image: "https://placehold.co/32x32/1A202C/E2E8F0.png?text=JR&font=nunito", alt: "Jessica R.", name: "Jessica R.", role: "Marketing Agency Owner",
      quote: "AutoBoss empowered my agency to offer custom AI chatbots. My clients are thrilled, and my revenue is up!",
      delay: "delay-100",
    },
    {
      type: "metric",
      metrics: [ { icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mb-1 opacity-80"/>, value: "300%", label: "Client Engagement Boost" }, { icon: <DollarSign className="w-4 h-4 sm:w-5 sm:w-5 mt-2 mb-1 opacity-80"/>, value: "+25%", label: "Agency Revenue Growth" } ],
      delay: "delay-200",
    },
    {
      type: "testimonial",
      image: "https://placehold.co/32x32/1A202C/E2E8F0.png?text=MS&font=nunito", alt: "Mike S.", name: "Mike S.", role: "E-commerce Store Owner",
      quote: "Building a support bot trained on my product docs was incredibly easy with AutoBoss. Sales are up, support tickets down!",
      delay: "delay-300",
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
                 Start Selling Bots <ArrowRight className="h-4 w-4"/>
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
              Start Selling Bots
            </Link>
          </Button>
      </div>

      <main className="flex-1">
        <section ref={heroRef} className={cn("scroll-reveal section-dark w-full min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] flex items-center justify-center text-center py-10 md:py-12 relative overflow-hidden", heroVisible && "visible")}>
          <div className="absolute inset-0 z-0 opacity-[0.02]">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover" poster="https://placehold.co/1920x1080/0A0F14/0A0F14.png" data-ai-hint="dark abstract particles subtle motion">
              <source src="https://placehold.co/1920x1080.mp4?text=." type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-transparent to-background/50"></div>
          </div>
          <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-screen-xl">
            <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
              <h1 className="marketing-h1 text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-center">
                Build & Sell Custom AI Chatbots for Any Business.
                <span className="block mt-1 sm:mt-2 text-gradient-dynamic">
                  No Code Needed.
                </span>
              </h1>
              <p className="section-description text-sm sm:text-base max-w-lg mx-auto !mb-5 md:!mb-6">
                AutoBoss empowers your agency (or your new startup!) to deliver powerful, custom-trained AI chatbots that businesses love. Effortlessly create and sell your AI solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-1">
                <Button size="lg" asChild className="btn-gradient-primary shadow-lg font-bold text-sm px-6 py-2.5 sm:py-3 hover:opacity-90 transition-all duration-300 hover:scale-105 group btn-interactive w-full sm:w-auto">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    Start Your AI Agency Free
                    <Rocket className="h-4 w-4 sm:h-5 sm:h-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="btn-outline-themed transition-all duration-300 hover:scale-105 px-6 py-2.5 text-sm border-muted-foreground/40 text-primary hover:text-accent-foreground hover:bg-accent hover:border-accent bg-background/10 backdrop-blur-sm btn-interactive w-full sm:w-auto">
                  <Link href="#video-demo-placeholder" className="flex items-center gap-1.5">
                    Watch Quick Demo <PlayCircle className="h-4 w-4 sm:h-5 sm:h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section ref={solveProblemsRef} id="solve-problems" className={cn("scroll-reveal section-light-accent w-full py-12 md:py-16 lg:py-20 border-b border-border/50", solveProblemsVisible && "visible")}>
            <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
                <h2 className="marketing-h2 text-card-foreground">Deliver High-Value AI Solutions to Businesses</h2>
                 <p className="section-description !mb-6 md:!mb-8">
                  Create AI chatbots that solve real business problems for your clients—from 24/7 customer support to automated lead generation and sales.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 max-w-4xl mx-auto">
                  {[
                    { icon: <LifeBuoy className="w-5 h-5" />, title: "24/7 Smart Support Bots", description: "Train AI on client FAQs & docs to provide instant, accurate customer support, reducing their workload.", hint: "customer service chatbot", delay: "delay-100" },
                    { icon: <Users2 className="w-5 h-5" />, title: "Automated Lead Gen Agents", description: "Build chatbots that capture leads on websites, qualify them based on client criteria, and even book demos.", hint: "sales funnel graph", delay: "delay-200" },
                    { icon: <Store className="w-5 h-5" />, title: "E-commerce Sales Assistants", description: "Create AI assistants that guide online shoppers, answer product questions, and help complete purchases.", hint: "shopping cart illustration", delay: "delay-300" },
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

        <section ref={superpowersRef} id="features" className={cn("scroll-reveal section-dark w-full py-12 md:py-16 lg:py-20", superpowersVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="marketing-h2">Why AutoBoss is Your Agency's AI Powerhouse</h2>
            <p className="section-description">
              We provide the simple tools you need to build and scale your AI chatbot business, no coding required.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 max-w-3xl mx-auto text-left">
              <SimpleFeatureCard
                icon={<Edit3 className="w-5 h-5"/>}
                title="Intuitive Visual Builder"
                description="Design sophisticated chatbot conversations with a simple drag-and-drop interface. Zero coding headaches for you or your clients."
                caseStudy={{ quote: "Our non-technical team built a client bot in hours, not weeks!", metric: "Zero Code Promise", author: "Agency Partner" }}
                animationDelay="delay-100"
              />
              <SimpleFeatureCard
                icon={<UploadCloud className="w-5 h-5"/>}
                title="Custom Training, Simplified"
                description="Easily upload your client's documents or add their website URLs to train chatbots on their specific business knowledge. True AI customization."
                caseStudy={{ quote: "Training our bot on client FAQs was a breeze. It became an expert fast.", metric: "Minutes to Train", author: "Support Specialist using AutoBoss" }}
                animationDelay="delay-200"
              />
              <SimpleFeatureCard
                icon={<Palette className="w-5 h-5"/>}
                title="AI-Assisted Persona Crafting"
                description="Define the chatbot's role for a business, and our AI helps generate a fitting name, personality, and welcome message. Tailor it to any brand."
                caseStudy={{ quote: "The AI-suggested persona was perfect for our client's luxury brand.", metric: "Instant Personality Fit", author: "Brand Consultant using AutoBoss" }}
                animationDelay="delay-300"
              />
              <SimpleFeatureCard
                icon={<Share2 className="w-5 h-5"/>}
                title="Effortless Client Deployment"
                description="Get direct links or simple embed codes to deploy chatbots on any client website quickly and easily. Hassle-free handoff."
                caseStudy={{ quote: "Embedding the chatbot on our client's WordPress site took 5 minutes.", metric: "One-Copy-Paste Deploy", author: "Freelance Web Developer" }}
                animationDelay="delay-400"
              />
            </div>
          </div>
        </section>

        <section ref={howItWorksRef} id="how-it-works" className={cn("scroll-reveal section-light-accent w-full py-12 md:py-16 lg:py-20", howItWorksVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="marketing-h2 text-card-foreground">Launch Your AI Chatbot Service: As Easy As 1-2-3</h2>
            <p className="section-description">
              Build, train, and sell powerful AI chatbots for businesses—faster than ever.
            </p>
            <div className="relative mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-start step-card-container">
                {[
                    { number: "1", title: "Define & Design", description: "Create a new chatbot, give it a purpose for the business, and use our visual studio to map out how it should talk and achieve its goals.", icon: <Palette className="w-5 h-5 text-electric-teal"/>, animationDelay:"delay-100" },
                    { number: "2", title: "Train with Business Data", description: "Make it smart! Upload client documents, website content, or FAQs to make the chatbot an expert on their specific business.", icon: <Brain className="w-5 h-5 text-neon-lime"/>, animationDelay:"delay-200" },
                    { number: "3", title: "Deploy & Delight Clients", description: "Easily embed the finished chatbot on your client's website or share a direct link. Start generating value and revenue!", icon: <Rocket className="w-5 h-5 text-primary"/>, animationDelay:"delay-300" },
                ].map((step, index) => {
                  const [stepRef, stepIsVisible] = useIntersectionObserver({ threshold: 0.3 });
                  return (
                    <div key={step.title} ref={stepRef} className={cn("relative scroll-reveal", step.animationDelay, index < 2 ? "md:dashed-connector md:right" : "", stepIsVisible && "visible")}>
                      <article className={cn("relative flex flex-col items-center gap-2 p-4 sm:p-5 rounded-lg bg-background shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-foreground z-10 h-full")}>
                          <div className="absolute -top-3 bg-gradient-to-br from-electric-teal to-neon-lime text-background text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-card shadow-md">{step.number}</div>
                          <div className="mt-5 mb-1">{step.icon}</div>
                          <h3 className="font-headline text-md sm:text-lg font-semibold text-center">{step.title}</h3>
                          <p className="text-xs text-muted-foreground text-center leading-relaxed">{step.description}</p>
                      </article>
                    </div>
                  );
                })}
            </div>
            <div ref={studioDemoPlaceholderRef} className={cn("scroll-reveal mt-8 md:mt-10 max-w-2xl mx-auto delay-400", studioDemoPlaceholderIsVisible && "visible")}>
                 <div className="aspect-video bg-muted/30 rounded-lg shadow-inner flex flex-col items-center justify-center text-muted-foreground p-4 border border-dashed border-border/50" data-ai-hint="chatbot conversation builder ui clean minimal">
                    <Cog className="w-6 h-6 sm:w-8 sm:h-8 opacity-60 mb-2"/>
                    <p className="text-xs sm:text-sm">Simplified Visual Conversation Studio</p>
                </div>
            </div>
          </div>
        </section>

        <section ref={videoDemoRef} id="video-demo-placeholder" className={cn("scroll-reveal section-dark w-full py-12 md:py-16 lg:py-20 text-center", videoDemoVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 max-w-screen-xl">
            <h2 className="marketing-h2">See How Easy It Is to Build for a Client</h2>
            <p className="section-description mt-1 mb-6">Watch how quickly you can build a custom business chatbot for a client, no coding needed.</p>
            <div className="max-w-2xl mx-auto aspect-video bg-muted/20 rounded-lg shadow-xl flex items-center justify-center text-muted-foreground border border-border/50 relative overflow-hidden cursor-pointer group" data-ai-hint="video player modern dark sleek elegant">
                <Image src="https://placehold.co/1280x720/0A0D13/0A0D13.png" alt="AutoBoss Demo Video Thumbnail" layout="fill" objectFit="cover" className="opacity-20 group-hover:opacity-10 transition-opacity" data-ai-hint="dark tech abstract thumbnail" loading="lazy"/>
                <div className="video-placeholder-text z-10">
                     <PlayCircle size={40} className="sm:size-50 text-primary cursor-pointer group-hover:scale-110 group-hover:text-neon-lime transition-all duration-300"/>
                     <p className="mt-2 text-xs font-semibold">Watch: Build a Client Bot in 60s (No Code!)</p>
                </div>
            </div>
          </div>
        </section>

        <section ref={socialProofRef} id="proof" className={cn("scroll-reveal section-light-accent w-full py-12 md:py-16 lg:py-20", socialProofVisible && "visible")}>
            <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
                <h2 className="marketing-h2 text-card-foreground">Trusted by Agencies & Growing Businesses</h2>
                 <p className="section-description">See how AutoBoss is helping users like you build profitable AI chatbot services.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-5xl mx-auto text-left">
                    {socialProofItems.map((item, index) => {
                      const [cardRef, cardIsVisible] = useIntersectionObserver({ threshold: 0.2 });
                      return (
                       <article ref={cardRef} key={index} className={cn("scroll-reveal transform hover:scale-103 transition-transform duration-300",
                         item.delay, cardIsVisible && "visible",
                         item.type === 'testimonial' ? "bg-background p-4 sm:p-5 rounded-lg shadow-lg text-foreground" :
                         "bg-gradient-to-br from-electric-teal to-neon-lime p-4 sm:p-5 rounded-lg shadow-lg text-background flex flex-col items-center justify-center text-center")}>
                        {item.type === 'testimonial' ? (
                            <>
                                <div className="flex items-center mb-2">
                                    <Image loading="lazy" src={item.image!} alt={item.alt!} width={28} height={28} className="rounded-full mr-2" data-ai-hint="professional person portrait"/>
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

        <section ref={humanizeRef} className={cn("scroll-reveal section-dark w-full py-12 md:py-16 lg:py-20", humanizeVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <h2 className="marketing-h2">Your Success is Our Mission</h2>
            <p className="section-description">
              We're committed to empowering entrepreneurs like you to harness the power of AI and build thriving chatbot businesses.
            </p>
            <aside ref={founderQuoteAsideRef} className={cn(
                "scroll-reveal max-w-lg mx-auto bg-card p-5 sm:p-6 rounded-lg shadow-xl transform hover:scale-103 transition-transform text-card-foreground delay-150",
                founderQuoteAsideIsVisible && "visible"
            )}>
              <p className="italic text-sm text-muted-foreground leading-relaxed">"I believe anyone should be able to build powerful AI solutions for businesses. AutoBoss is designed to make that a reality, helping you create valuable chatbots for your clients, without writing a single line of code."</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Image loading="lazy" src="https://placehold.co/36x36/1A202C/E2E8F0.png?text=AC&font=nunito" alt="Alex Chen, Founder (Placeholder)" width={32} height={32} className="rounded-full shadow-md" data-ai-hint="founder portrait friendly modern person" />
                <div>
                  <p className="font-semibold text-xs text-card-foreground">Alex Chen (Placeholder)</p>
                  <p className="text-xs text-primary">Founder & CEO, AutoBoss</p>
                </div>
              </div>
            </aside>
          </div>
        </section>
        
        <section ref={finalCtaRef} className={cn("scroll-reveal section-cta-final w-full py-12 md:py-16 lg:py-20", finalCtaVisible && "visible")}>
          <div className="container mx-auto px-4 md:px-6 text-center max-w-screen-xl">
            <div className="mx-auto max-w-md space-y-3 bg-card/80 dark:bg-background/70 backdrop-blur-md p-5 sm:p-6 md:p-8 rounded-xl shadow-2xl">
              <h2 className="marketing-h2 !text-2xl sm:!text-3xl text-gradient-dynamic">
                Ready to Launch Your AI Chatbot Agency?
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm !mb-5">
                Start building custom AI chatbots for businesses with AutoBoss today. Free to get started, no credit card needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-1">
                <Button size="lg" asChild className="btn-gradient-primary shadow-xl font-bold text-sm px-6 py-2.5 hover:opacity-90 transition-all duration-300 hover:scale-105 group w-full sm:w-auto btn-interactive">
                  <Link href="/dashboard" className="flex items-center gap-1.5">
                    Start Building for Clients Free
                    <Rocket className="h-4 w-4 sm:h-5 sm:h-5 group-hover:animate-bounce" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="btn-outline-themed transition-all duration-300 hover:scale-105 px-6 py-2.5 text-sm text-primary hover:text-accent-foreground hover:bg-accent hover:border-accent border-muted-foreground/50 bg-background/20 dark:bg-card/20 backdrop-blur-sm w-full sm:w-auto btn-interactive">
                  <Link href="mailto:sales@autoboss.dev?subject=AutoBoss%20Agency%20Partnership%20Inquiry" className="flex items-center gap-1.5">
                    Agency Partnership Info <Eye className="h-4 w-4 sm:h-5 sm:h-5"/>
                  </Link>
                </Button>
              </div>
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
            <p className="text-[10px] text-muted-foreground">&copy; {new Date().getFullYear()} AutoBoss. AI Chatbot Agency Platform.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-1 sm:gap-2 mt-1 sm:mt-0">
            <Link href="#" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Terms</Link>
            <Link href="#" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Privacy</Link>
            <Link href="mailto:support@autoboss.dev" className="text-[10px] text-muted-foreground hover:text-primary transition-colors" prefetch={false}>Support</Link>
          </nav>
        </div>
      </footer>
    </div>
    </TooltipProvider>
  );
}
