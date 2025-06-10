
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createAgent, CreateAgentOutput } from "@/ai/flows/agent-creation";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "../../layout"; 
import type { Agent, AgentType, AgentLogicType, AgentDirection, AgentPurposeType as FormAgentPurposeType } from "@/lib/types"; 
import { Loader2, Bot, MessageSquare, Phone, Brain, DatabaseZap, ArrowDownCircle, ArrowUpCircle, HelpCircle, Lightbulb, Users, Briefcase, ShoppingCart, HomeIcon as RealEstateIcon, CalendarCheck } from "lucide-react"; 
import { useAuth } from "@/contexts/AuthContext"; 
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";


interface PredefinedAgentTemplate {
  id: string;
  defaultValues: {
    agentPurpose: FormAgentPurposeType;
    agentType?: AgentType;
    direction?: AgentDirection;
    primaryLogic?: AgentLogicType;
    role: string;
    personality: string;
  };
}

const agentTemplates: PredefinedAgentTemplate[] = [
  {
    id: 'ecommerce_support',
    defaultValues: {
      agentPurpose: 'support',
      agentType: 'chat',
      role: "I am a customer support specialist for [Your Client's E-commerce Store]. My main tasks are to help customers track their orders, answer questions about products, explain return policies, and resolve any shopping issues they might have. I aim to provide quick and accurate assistance to ensure a smooth and positive customer experience.",
      personality: "Friendly, patient, and highly efficient. I'm knowledgeable about our products and policies, and I communicate clearly and politely. I'm always ready to help with a positive attitude."
    }
  },
  {
    id: 'real_estate_lead_gen',
    defaultValues: {
      agentPurpose: 'sales',
      agentType: 'chat',
      role: "I'm a lead generation assistant for [Your Client's Real Estate Agency]. I interact with website visitors to understand their property needs (buying, selling, or renting), gather their contact details, and schedule appointments for property viewings or consultations with an agent. My goal is to capture and qualify potential leads effectively.",
      personality: "Professional, engaging, and knowledgeable about the local real estate market. I'm proactive in asking relevant questions and persuasive in guiding users towards the next step. I build trust and rapport with potential clients."
    }
  },
  {
    id: 'dental_appointment_voice',
    defaultValues: {
      agentPurpose: 'custom',
      agentType: 'voice',
      direction: 'inbound',
      role: "I am the automated voice assistant for [Your Client's Dental Clinic]. I can help you schedule a new dental appointment, reschedule an existing one, or cancel an appointment if needed. I can also provide basic information about our clinic's services, hours, and location.",
      personality: "Clear, calm, and friendly. I speak at a moderate pace and understand various ways users might state their requests. I confirm details carefully to ensure accuracy and provide a pleasant scheduling experience over the phone."
    }
  },
  {
    id: 'faq_info_bot',
    defaultValues: {
        agentPurpose: "info",
        agentType: "chat",
        primaryLogic: "rag",
        role: "I am an informational assistant for [Your Client's Business/Topic]. I provide answers to frequently asked questions and explain specific topics based on the knowledge I've been trained on from your documents and website content. My goal is to be a reliable and instant source of information.",
        personality: "Factual, concise, and helpful. I focus on delivering accurate information clearly and directly. I can point to source documents when useful."
    }
  },
  {
    id: 'general_purpose_assistant',
    defaultValues: {
        agentPurpose: "custom",
        agentType: "chat",
        primaryLogic: "prompt",
        role: "I am a versatile AI assistant for [Your Client's Business/Project]. I can help with tasks like brainstorming ideas, drafting content, answering general questions, or performing custom actions you define. My capabilities are flexible based on your specific instructions and persona requirements.",
        personality: "Adaptable based on your needs. You can define whether I should be witty, formal, creative, analytical, or any other style that fits your purpose. Default is neutral and helpful."
    }
  }
];


const agentPurposeTemplates: Record<FormAgentPurposeType, { role: string; personality: string }> = {
  support: {
    role: "A customer support agent for [Your Client's Business Name]. I help users by answering their questions about products/services, troubleshooting common issues, and providing policy information. My goal is to resolve inquiries efficiently and leave customers satisfied.",
    personality: "Patient, empathetic, clear, and knowledgeable. I strive to be very helpful and understanding.",
  },
  sales: {
    role: "A lead qualification and sales assistant for [Your Client's Business Name]. I engage potential customers, understand their needs, highlight product/service benefits, answer initial questions, and guide interested leads towards a demo or consultation. My goal is to identify and nurture sales opportunities.",
    personality: "Friendly, persuasive, proactive, and enthusiastic. I am good at explaining value and building rapport.",
  },
  info: {
    role: "An informational bot for [Your Client's Business or Topic]. I provide answers to frequently asked questions, explain specific topics, and offer details based on the knowledge I've been trained on. My goal is to be a reliable source of information.",
    personality: "Factual, concise, neutral, and informative. I aim to provide accurate information clearly.",
  },
  custom: {
    role: "Describe the agent's primary function and what it should achieve for the business. For example, an agent to summarize articles, generate creative content, or act as a personal coach.",
    personality: "Describe the desired personality traits, communication style, and tone (e.g., formal, casual, witty, serious, empathetic, analytical).",
  },
};


const formSchema = z.object({
  agentPurpose: z.enum(["support", "sales", "info", "custom"], { required_error: "Please select the agent's primary purpose."}),
  agentType: z.enum(["chat", "voice", "hybrid"], { required_error: "Please select an agent type."}),
  direction: z.enum(["inbound", "outbound"], { required_error: "Please select agent direction."}),
  primaryLogic: z.enum(["prompt", "rag"], { required_error: "Please select how the agent works."}),
  name: z.string().min(3, "Client/Business name must be at least 3 characters").max(100, "Name too long"),
  role: z.string().min(10, "Role description must be at least 10 characters").max(1000, "Role too long (max 1000 chars)"),
  personality: z.string().min(10, "Personality description must be at least 10 characters").max(1000, "Personality too long (max 1000 chars)"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateAgentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAgentDetails, setGeneratedAgentDetails] = useState<CreateAgentOutput | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addAgent: addAgentToContext } = useAppContext();
  const { currentUser } = useAuth(); 
  const [selectedDirection, setSelectedDirection] = useState<AgentDirection>("inbound");

  const templateId = searchParams.get('templateId');
  const selectedTemplate = useMemo(() => agentTemplates.find(t => t.id === templateId), [templateId]);

  const { control, register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agentPurpose: selectedTemplate?.defaultValues.agentPurpose || "support",
      agentType: selectedTemplate?.defaultValues.agentType || "chat",
      direction: selectedTemplate?.defaultValues.direction || "inbound",
      primaryLogic: selectedTemplate?.defaultValues.primaryLogic || "rag", 
      name: "",
      role: selectedTemplate?.defaultValues.role || agentPurposeTemplates.support.role,
      personality: selectedTemplate?.defaultValues.personality || agentPurposeTemplates.support.personality,
    }
  });
  
  const currentPrimaryLogic = watch("primaryLogic");
  const currentAgentType = watch("agentType");
  const currentAgentPurpose = watch("agentPurpose");

  useEffect(() => {
    const template = agentTemplates.find(t => t.id === templateId);
    if (template) {
      reset({
        agentPurpose: template.defaultValues.agentPurpose,
        agentType: template.defaultValues.agentType || "chat",
        direction: template.defaultValues.direction || "inbound",
        primaryLogic: template.defaultValues.primaryLogic || "rag",
        name: "", // Keep name empty for user input
        role: template.defaultValues.role,
        personality: template.defaultValues.personality,
      });
      setSelectedDirection(template.defaultValues.direction || "inbound");
    } else if (!templateId) { // Only apply purpose-based defaults if no specific templateId
        setValue("role", agentPurposeTemplates[currentAgentPurpose].role);
        setValue("personality", agentPurposeTemplates[currentAgentPurpose].personality);
    }
  }, [templateId, currentAgentPurpose, setValue, reset]);


  const getLogicTypeLabel = (logicType?: AgentLogicType): string => {
    if (!logicType) return "Not Set";
    switch (logicType) {
        case 'prompt': return "Persona-Driven (Creative & General Chat)";
        case 'rag': return "Learns from Your Data (Support & Info)";
        default: return "Custom";
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please log in to create an agent.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setIsLoading(true);
    setGeneratedAgentDetails(null);
    try {
      const logicTypeUserFriendly = getLogicTypeLabel(data.primaryLogic as AgentLogicType);
      const agentDescription = `Primary Purpose: ${data.agentPurpose}. Type: ${data.agentType}. Direction: ${data.direction}. Primary Logic: ${logicTypeUserFriendly}.\nClient/Business Name: ${data.name}\nIntended Role for the Business: ${data.role}\nDesired Personality & Tone: ${data.personality}`;
      const aiResult = await createAgent({ agentDescription, agentType: data.agentType, direction: data.direction as AgentDirection });
      setGeneratedAgentDetails(aiResult);
      
      const agentDataForContext: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'userId'> = {
        agentType: data.agentType as AgentType,
        direction: data.direction as AgentDirection,
        primaryLogic: data.primaryLogic as AgentLogicType, 
        name: data.name, 
        description: `Purpose: ${data.agentPurpose}. Type: ${data.agentType}. Logic: ${logicTypeUserFriendly}. Role: ${data.role}. Personality: ${data.personality}.`, 
        role: data.role,
        personality: data.personality,
        generatedName: aiResult.agentName,
        generatedPersona: aiResult.agentPersona,
        generatedGreeting: aiResult.agentGreeting,
      };
      
      const newAgent = await addAgentToContext(agentDataForContext);

      if (newAgent) {
        toast({
          title: "Agent Base Created!",
          description: `Agent "${aiResult.agentName}" (Purpose: ${data.agentPurpose}, Type: ${data.agentType}) is ready. Next, customize its personality and add knowledge. Redirecting...`,
        });
        
        if (data.primaryLogic === 'rag') {
            router.push(`/agents/${newAgent.id}/knowledge`);
        } else { 
            router.push(`/agents/${newAgent.id}/personality`);
        }
      }
    } catch (error: any) {
      console.error("Error creating agent:", error);
      const errorMessage = error.message || "Failed to create agent. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <TooltipProvider>
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}> <Bot className="w-6 h-6 sm:w-7 sm:w-7"/>Step 1: Define Your New Business Agent</CardTitle>
          <CardDescription className="text-sm">
            {selectedTemplate ? `Starting with the "${selectedTemplate.id.replace(/_/g, ' ')}" template. ` : ""}
            Tell us about the agent you want to build. This information will help our AI craft a baseline personality and greeting for you to refine later. Not sure where to start? <Link href="/templates" className="underline hover:text-primary">Browse templates</Link>.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            
            <div className="space-y-1.5">
              <Label htmlFor="agentPurpose" className="flex items-center">
                What's this agent's primary purpose?
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Select the main goal for this agent. This helps pre-fill some settings.</p></TooltipContent>
                </Tooltip>
              </Label>
              <Controller
                name="agentPurpose"
                control={control}
                render={({ field }) => (
                  <Select 
                     onValueChange={(value) => {
                        field.onChange(value);
                        // If not coming from a specific templateId, update role/personality based on purpose
                        if (!templateId) {
                            setValue("role", agentPurposeTemplates[value as FormAgentPurposeType].role);
                            setValue("personality", agentPurposeTemplates[value as FormAgentPurposeType].personality);
                        }
                    }} 
                    value={field.value} // Use value instead of defaultValue here for controlled component
                  >
                    <SelectTrigger id="agentPurpose">
                      <SelectValue placeholder="Select agent's main goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support"><div className="flex items-center gap-2"><Users className="w-4 h-4"/>Customer Support</div></SelectItem>
                      <SelectItem value="sales"><div className="flex items-center gap-2"><Briefcase className="w-4 h-4"/>Lead Qualification & Sales</div></SelectItem>
                      <SelectItem value="info"><div className="flex items-center gap-2"><Lightbulb className="w-4 h-4"/>Information & FAQ Bot</div></SelectItem>
                      <SelectItem value="custom"><div className="flex items-center gap-2"><Bot className="w-4 h-4"/>General Assistant / Custom</div></SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.agentPurpose && <p className="text-xs text-destructive">{errors.agentPurpose.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="agentType" className="flex items-center">Agent Type
                  <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Choose how this agent will primarily interact: text chat, voice calls, or both.</p></TooltipContent>
                  </Tooltip>
                </Label>
                <Controller
                  name="agentType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="agentType">
                        <SelectValue placeholder="Select agent type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chat"><div className="flex items-center gap-2"><MessageSquare className="w-4 h-4"/>Chatbot (Text-based)</div></SelectItem>
                        <SelectItem value="voice"><div className="flex items-center gap-2"><Phone className="w-4 h-4"/>Voice Agent (Phone Calls)</div></SelectItem>
                        <SelectItem value="hybrid"><div className="flex items-center gap-2"><Bot className="w-4 h-4"/>Hybrid (Chat & Voice)</div></SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.agentType && <p className="text-xs text-destructive">{errors.agentType.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="direction" className="flex items-center">Agent Direction
                 <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Will this agent mostly handle incoming user contacts, or initiate outbound communication?</p></TooltipContent>
                  </Tooltip>
                </Label>
                <Controller
                  name="direction"
                  control={control}
                  render={({ field }) => (
                    <Select 
                        onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedDirection(value as AgentDirection);
                        }} 
                        value={field.value}
                    >
                      <SelectTrigger id="direction">
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbound"><div className="flex items-center gap-2"><ArrowDownCircle className="w-4 h-4"/>Handles Incoming</div></SelectItem>
                        <SelectItem value="outbound"><div className="flex items-center gap-2"><ArrowUpCircle className="w-4 h-4"/>Initiates Contact</div></SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.direction && <p className="text-xs text-destructive">{errors.direction.message}</p>}
                {selectedDirection === 'outbound' && (
                   <p className="text-xs text-muted-foreground mt-1">
                    Primarily hints at AI persona for greetings. Actual outbound actions (SMS, email, calls) require separate setup using this app's <Link href="#" onClick={(e) => {e.preventDefault(); toast({title:"Outbound API Info", description:"APIs are available at /api/outbound/send-sms, /api/outbound/send-email, /api/outbound/make-call. These are typically triggered by an external system or a future campaign builder feature."})}} className="underline hover:text-primary">outbound APIs</Link>.
                  </p>
                )}
                 {selectedDirection === 'inbound' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Agent will respond to incoming chats or calls.
                  </p>
                )}
              </div>
            </div>
             <div className="space-y-1.5">
                <Label htmlFor="primaryLogic" className="flex items-center">How this Agent Works
                 <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Choose the agent's core reasoning method. 'Learns from Data' is best for Q&A on specific business info. 'Persona-Driven' is for more general or creative chat.</p></TooltipContent>
                  </Tooltip>
                </Label>
                <Controller
                  name="primaryLogic"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="primaryLogic">
                        <SelectValue placeholder="Select brain logic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rag"><div className="flex items-center gap-2"><DatabaseZap className="w-4 h-4"/>Learns from Your Data (Support & Info)</div></SelectItem>
                        <SelectItem value="prompt"><div className="flex items-center gap-2"><Brain className="w-4 h-4"/>Persona-Driven (Creative & General Chat)</div></SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.primaryLogic && <p className="text-xs text-destructive">{errors.primaryLogic.message}</p>}
                 <p className="text-xs text-muted-foreground mt-1">
                    {currentPrimaryLogic === 'prompt'
                        ? "The agent answers based on the Personality and Role you define. Good for general conversation, brainstorming, or when you don't have specific documents for it to learn from."
                        : "The agent primarily answers questions using Business Data you upload (FAQs, product docs). Best for customer support or providing specific information."
                    }
                </p>
              </div>


            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center">What business or client is this agent for?
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Enter the name of the client's business or a descriptive name for the agent itself, e.g., "Acme Corp Support" or "Dental Clinic Voice Receptionist".</p></TooltipContent>
                </Tooltip>
              </Label>
              <Input id="name" placeholder="e.g., 'Acme Support Bot', 'Dental Clinic Voice Receptionist'" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role" className="flex items-center">What is this Agent's job? What should it achieve?
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Describe the agent's main responsibilities and goals. Example for sales: 'Qualify leads for solar panel installations and book appointments.' For support: 'Answer questions about our software and troubleshoot basic issues.' The pre-filled text is based on the 'Purpose' you selected.</p></TooltipContent>
                </Tooltip>
              </Label>
              <Textarea 
                id="role" 
                placeholder={agentPurposeTemplates[currentAgentPurpose]?.role || "Describe the agent's primary function..."}
                {...register("role")} 
                rows={4} 
              />
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="personality" className="flex items-center">How should this Agent sound and behave?
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Define the agent's communication style, tone, and key personality traits. E.g., 'Friendly, professional, and slightly witty' or 'Empathetic, patient, and very clear.' The pre-filled text is based on the 'Purpose' you selected.</p></TooltipContent>
                </Tooltip>
              </Label>
              <Textarea 
                id="personality" 
                placeholder={agentPurposeTemplates[currentAgentPurpose]?.personality || "Describe the desired personality..."}
                {...register("personality")} 
                rows={4} 
               />
              {errors.personality && <p className="text-xs text-destructive">{errors.personality.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button type="submit" disabled={isLoading} className={cn("w-full", "btn-gradient-primary")}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Creating Agent..." : "Create Agent & Generate Details"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {generatedAgentDetails && (
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className={cn("font-headline text-lg sm:text-xl", "text-gradient-dynamic")}>AI Generated Details (Suggestions)</CardTitle>
            <CardDescription className="text-xs italic">You can refine these details in the 'Personality' section for this agent after creation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div>
              <Label className="text-xs font-semibold">Suggested Agent Name</Label>
              <p className="text-sm p-2 bg-muted rounded-md mt-1">{generatedAgentDetails.agentName}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold">Suggested Persona (How it acts/talks)</Label>
              <p className="text-sm p-2 bg-muted rounded-md whitespace-pre-wrap mt-1">{generatedAgentDetails.agentPersona}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold">Sample Greeting</Label>
              <p className="text-sm p-2 bg-muted rounded-md mt-1">{generatedAgentDetails.agentGreeting}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
}

