
"use client";

import Link from "next/link"; // Added missing import
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, MessageCircleQuestion, AlertTriangle, Mail, Cog, BookOpen, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SupportPage() {
  const faqs = [
    {
      question: "How do I create a new AI chatbot for a business?",
      answer: "Navigate to the 'Dashboard' and click 'Create New Chatbot'. You'll define its name (e.g., 'Acme Corp Support'), its role for the business (e.g., 'Handles customer inquiries'), and desired personality. AutoBoss will then guide you to train it and design its conversation.",
    },
    {
      question: "How do I 'train' my chatbot with custom business data?",
      answer: "Go to the 'Knowledge' section for your chatbot. You can upload documents (like PDFs, TXT files of FAQs, product specifications) or provide website URLs (e.g., the business's 'About Us' or 'Services' page). AutoBoss will process this content to make your chatbot an expert on that specific business.",
    },
    {
      question: "What is the 'Design Conversation' (Studio) page for?",
      answer: "The Studio is where you visually map out how your chatbot should interact. You can create step-by-step conversation paths, ask questions, make decisions based on user input, send specific messages, and use AI for smart responses. This allows for highly customized chatbot behavior.",
    },
    {
      question: "How can I give the chatbot I built to my client or put it on their website?",
      answer: "The 'Export' tab for each chatbot provides an 'Embeddable Chat Launcher' script. Simply copy this script and paste it into the HTML of your client's website. This will add a chat widget to their site. You can also share a direct link to the chatbot.",
    },
    {
        question: "Do I need to know coding to use AutoBoss?",
        answer: "No! AutoBoss is designed for non-technical users. You can build, train, and deploy sophisticated AI chatbots using our visual tools without writing any code."
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}>
            <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Support & Help Center
          </CardTitle>
          <CardDescription className="text-sm">Get help building and selling AI chatbots with AutoBoss.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6">
          <section>
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2", "text-gradient-dynamic")}><MessageCircleQuestion className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index + 1}`} key={index}>
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-xs sm:text-sm pb-3 sm:pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="p-3 sm:p-4 border rounded-lg bg-muted/30">
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2", "text-gradient-dynamic")}><AlertTriangle className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Basic Troubleshooting</h2>
            <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground">
              <li>If your chatbot isn't responding as expected, double-check its 'Conversation Design' in the Studio for any broken paths.</li>
              <li>Ensure the chatbot has been trained with relevant information in the 'Knowledge' section.</li>
              <li>Always test your chatbot thoroughly in the 'Test Chatbot' tab before deploying it for a client.</li>
              <li>If you encounter errors, try refreshing the page or logging out and back in.</li>
            </ul>
          </section>

          <section className="p-3 sm:p-4 border rounded-lg bg-muted/30">
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2", "text-gradient-dynamic")}><Mail className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Contact Support</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Need more help or want to discuss partnership opportunities for your agency?
            </p>
            <Button variant="outline" className="mt-2 sm:mt-3 text-xs sm:text-sm" asChild>
                <Link href="mailto:support@autoboss.dev?subject=AutoBoss%20Support%20Request">Contact Support</Link>
            </Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
