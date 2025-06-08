
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, MessageCircleQuestion, AlertTriangle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button"; // Added Button import

export default function SupportPage() {
  const faqs = [
    {
      question: "How do I create a new AI agent?",
      answer: "Navigate to the 'Dashboard' and click the 'Create New Agent' button. Fill in the initial details like name, role, and personality. The system will then guide you to the Agent Studio to further configure its flow and knowledge.",
    },
    {
      question: "Where is my agent data stored?",
      answer: "Agent configurations (personality, knowledge items, flows) are stored in Firebase Firestore. This allows your data to be persistent and accessible.",
    },
    {
      question: "How does the Knowledge Base work?",
      answer: "You can add knowledge to your agent by uploading documents (like TXT, PDF, MD) or processing URLs. The system extracts text content, generates a summary and keywords using AI, and makes this information available to your agent for answering questions or informing its responses, primarily through the 'Autonomous Reasoning' mode or 'callLLM' nodes with 'Use Knowledge' enabled.",
    },
    {
      question: "What is the difference between 'Flow' and 'Autonomous' mode in the chat?",
      answer: "'Flow' mode prioritizes executing the visual flow you designed in the Studio. The agent will follow the defined steps. 'Autonomous' mode lets the agent use its general AI capabilities (powered by Gemini) and knowledge base to respond more freely to your inputs without strictly following a predefined flow.",
    },
    {
        question: "Can I export my agent to use elsewhere?",
        answer: "Yes, the 'Export' tab for each agent provides a direct chatbot link (opens a public chat page), an illustrative API endpoint, and an iframe embed code for the chat widget."
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <LifeBuoy className="w-6 h-6" /> Support & Help Center
          </CardTitle>
          <CardDescription>Find answers to common questions and get help with AutoBoss.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><MessageCircleQuestion className="w-5 h-5 text-primary"/>Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index + 1}`} key={index}>
                  <AccordionTrigger className="text-left hover:no-underline">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="p-4 border rounded-lg bg-muted/30">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-primary"/>Basic Troubleshooting</h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>If you encounter unexpected behavior, try refreshing the page.</li>
              <li>Ensure your internet connection is stable, especially when interacting with AI features.</li>
              <li>If you suspect data issues, you can clear all agent data from the 'Settings' page (this will remove all your agents from Firestore).</li>
              <li>Make sure your web browser is up to date for the best compatibility.</li>
            </ul>
          </section>

          <section className="p-4 border rounded-lg bg-muted/30">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2"><Mail className="w-5 h-5 text-primary"/>Contact Us</h2>
            <p className="text-sm text-muted-foreground">
              For further assistance or to report a bug, please reach out to our support team (placeholder for contact method).
              In a real application, this would link to a support portal, email address, or contact form.
            </p>
            <Button variant="outline" className="mt-3" disabled>Contact Support (Coming Soon)</Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
