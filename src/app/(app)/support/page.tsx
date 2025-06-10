
"use client";

import Link from "next/link"; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, MessageCircleQuestion, AlertTriangle, Mail, Cog, BookOpen, Share2, Bot, Palette, Brain, Mic, Users, Briefcase, DatabaseZap, Edit3, TestTubeDiagonal, Settings2, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SupportPage() {
  const faqs = [
    {
      question: "How do I add a new client to my workspace?",
      answer: "From your main 'Client Dashboard', click the 'Add New Client' button. You'll be prompted to enter their name, and optionally, their website and a short description. This creates a dedicated workspace for that client where you can build and manage their specific AI agents.",
      icon: FilePlus,
    },
    {
      question: "Can I build different types of AI agents for the same client?",
      answer: "Yes! For each client, you can create multiple agents. For example, a client might need a 'Chat' agent for website support (trained on FAQs) and a 'Voice' agent for automated appointment booking. You can tailor each agent's type (chat/voice/hybrid), logic (RAG/Prompt-driven), and personality to fit its specific purpose for that client.",
      icon: Bot,
    },
    {
      question: "What's the best way to train an agent with client-specific data?",
      answer: "Navigate to the specific agent within a client's workspace and go to its 'Knowledge' section. Here, you can upload documents (PDF, DOCX, TXT, CSV), add website URLs (like client's FAQ page or product pages), or input plain text. For CSVs (like lead lists or product catalogs), AutoBoss converts them into a structured text format to make individual rows accessible to the AI.",
      icon: DatabaseZap,
    },
     {
      question: "How do I customize an agent's personality to match my client's brand?",
      answer: "In the 'Personality' section for each agent, you first define its core role and provide clues about its desired communication style. Our AI then generates a suggested name, a detailed persona (how it describes itself and its speaking style), and a sample greeting. You can then edit these AI suggestions extensively to perfectly align with your client's brand voice, tone, and image.",
      icon: Palette,
    },
    {
      question: "How do I deploy an agent for my client (e.g., on their website)?",
      answer: "Once an agent is configured and tested, go to its 'Export' tab. For chat agents, you'll find a simple JavaScript embed code. Copy this and paste it into the HTML of your client's website (usually before the closing </body> tag). This adds a floating chat launcher. You can also get a direct link to the chat page. For voice agents, this section provides API endpoint details for integration with telephony services like Twilio.",
      icon: Share2,
    },
    {
        question: "What are 'RAG' vs. 'Prompt-Driven' agents?",
        answer: "'RAG' (Retrieval Augmented Generation) agents are best for Q&A and information retrieval. They primarily answer based on the specific knowledge documents you upload. 'Prompt-Driven' agents rely more on their defined persona, role, and general AI capabilities. They are great for more creative, conversational, or general-purpose tasks where specific document knowledge isn't the main focus.",
        icon: Brain
    },
    {
      question: "My client's agent isn't answering questions correctly. What should I check?",
      answer: "1. **Knowledge Base:** Is the agent trained on the correct and most relevant documents/URLs? Is the content clear and accurate? For RAG agents, this is crucial. \n2. **Personality & Role:** Is the agent's role and personality clearly defined? This guides its responses, especially for prompt-driven agents. \n3. **Testing:** Use the 'Test Agent' tab to see how it responds to various inputs. If you have access to agent's internal reasoning (developer view), that can provide clues. \n4. **Clarity of Input:** Ensure test questions are clear. Sometimes rephrasing a question helps.",
      icon: TestTubeDiagonal,
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}>
            <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Help Center & Agency Resources
          </CardTitle>
          <CardDescription className="text-sm">Get help building and selling AI agents for businesses with AutoBoss.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6">
          <section>
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2", "text-gradient-dynamic")}><MessageCircleQuestion className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem value={`item-${index + 1}`} key={index} className="border-border/70">
                  <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base py-3 sm:py-4 group">
                    {faq.icon && <faq.icon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:text-accent transition-colors shrink-0" />}
                    <span className="flex-1">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-xs sm:text-sm pb-3 sm:pb-4 pl-8 sm:pl-10"> {/* Added pl for indentation */}
                    {faq.answer.split('\n').map((paragraph, pIndex) => <p key={pIndex} className={pIndex > 0 ? 'mt-2' : ''}>{paragraph}</p>)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="p-3 sm:p-4 border rounded-lg bg-muted/30">
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2", "text-gradient-dynamic")}><AlertTriangle className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Quick Tips & Troubleshooting</h2>
            <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-muted-foreground">
              <li>For optimal agent performance, ensure uploaded knowledge documents are clean, well-structured, and directly relevant to the agent's purpose for that client.</li>
              <li>When training from a URL, prioritize pages with clear text content (FAQs, About Us, Service Details). Complex, dynamic web apps might not parse well.</li>
              <li>If an agent's responses seem off-brand, revisit its 'Personality' section. Small tweaks to the role or personality clues can make a big difference.</li>
              <li>Always test thoroughly in the 'Test Agent' tab, simulating various user queries your client might expect.</li>
              <li>If using voice agents, ensure the 'Agent Tone' in Personality settings is suitable for spoken conversation (e.g., concise, natural language).</li>
            </ul>
          </section>

          <section className="p-3 sm:p-4 border rounded-lg bg-muted/30">
            <h2 className={cn("text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2", "text-gradient-dynamic")}><Mail className="w-4 h-4 sm:w-5 sm:w-5 text-primary"/>Contact Agency Support</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Need more help, have feature requests, or want to discuss partnership opportunities for your agency?
            </p>
            <Button variant="outline" className="mt-2 sm:mt-3 text-xs sm:text-sm btn-interactive" asChild>
                <Link href="mailto:support@autoboss.dev?subject=AutoBoss%20Agency%20Support%20Request">Contact Support</Link>
            </Button>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
