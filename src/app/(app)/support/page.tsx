
"use client";

import Link from "next/link"; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, MessageCircleQuestion, AlertTriangle, Mail, Cog, BookOpen, Share2, Bot, Palette, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SupportPage() {
  const faqs = [
    {
      question: "How do I create a new AI chatbot for a client's business?",
      answer: "Go to your 'Agency Hub' (Dashboard) and click 'Build New Client Chatbot'. You'll first define its name (e.g., 'Acme Corp Support'), its role for the business (e.g., 'Handles customer inquiries about widgets'), and desired personality (e.g., 'Friendly and professional'). AutoBoss will then help generate a base personality and greeting for the chatbot.",
      icon: Bot,
    },
    {
      question: "How do I train a chatbot with my client's specific business data?",
      answer: "Once you've created a chatbot, go to its 'Knowledge' section. Here, you can upload documents like FAQs, product catalogs, policy documents (PDFs, TXT files are great). You can also add website URLs (e.g., your client's 'About Us' or 'Services' page). AutoBoss processes this information to make the chatbot an expert on that specific business.",
      icon: Brain,
    },
    {
      question: "What is the 'Design Conversation' (Studio) page for?",
      answer: "The Studio is where you visually map out how your chatbot should interact for specific tasks or scenarios. You can create step-by-step conversation paths, ask questions to gather information, make decisions based on user input, send specific messages, and use AI for smart, context-aware responses. This allows you to build highly customized chatbot experiences for your clients.",
      icon: Cog,
    },
     {
      question: "How can I make the chatbot's personality match my client's brand?",
      answer: "In the 'Personality' section for each chatbot, you can refine the AI-generated name, persona (how it describes itself), and sample greeting. You initially provide a basic description, and the AI helps flesh it out. You can tweak this as much as you need to match the client's brand voice.",
      icon: Palette,
    },
    {
      question: "How do I put the chatbot I built on my client's website?",
      answer: "Navigate to the 'Export' tab for the specific chatbot. You'll find an 'Embed Chatbot on Any Website' section. Copy the script provided there and paste it into the HTML of your client's website (usually just before the closing </body> tag). This will add a floating chat launcher button to their site. It's designed to be super easy!",
      icon: Share2,
    },
    {
        question: "Do I or my clients need to know coding to use AutoBoss chatbots?",
        answer: "No! AutoBoss is designed for users without a technical background. You can build, train, and deploy sophisticated AI chatbots using our visual tools and simple upload interfaces, all without writing any code. Your clients also just need to paste the embed script on their site."
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}>
            <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Help Center & Agency Resources
          </CardTitle>
          <CardDescription className="text-sm">Get help building and selling AI chatbots for businesses with AutoBoss.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6">
          <section>
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2", "text-gradient-dynamic")}><MessageCircleQuestion className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Frequently Asked Questions (For Agencies)</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index + 1}`} key={index}>
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">
                    {faq.icon && <faq.icon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />}
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-xs sm:text-sm pb-3 sm:pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="p-3 sm:p-4 border rounded-lg bg-muted/30">
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2", "text-gradient-dynamic")}><AlertTriangle className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Quick Tips & Troubleshooting</h2>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground">
              <li>If a client's chatbot isn't answering correctly, first check its 'Trained Knowledge'. Does it have the right documents or website content?</li>
              <li>For chatbots with specific tasks, review the 'Conversation Design' in the Studio. Ensure all paths are connected and logic is correct.</li>
              <li>Always use the 'Test Chatbot' tab extensively before giving the embed code to a client.</li>
              <li>If you're training from a URL and it fails, ensure the website is publicly accessible and not too heavily reliant on JavaScript for its main content. Plain text pages work best.</li>
              <li>For file uploads, .txt, .md, and simple .pdf files are generally most reliable for training.</li>
            </ul>
          </section>

          <section className="p-3 sm:p-4 border rounded-lg bg-muted/30">
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2", "text-gradient-dynamic")}><Mail className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Contact Agency Support</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Need more help, have feature requests, or want to discuss partnership opportunities for your agency?
            </p>
            <Button variant="outline" className="mt-2 sm:mt-3 text-xs sm:text-sm" asChild>
                <Link href="mailto:support@autoboss.dev?subject=AutoBoss%20Agency%20Support%20Request">Contact Support</Link>
            </Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
