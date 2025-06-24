
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { createAgent, CreateAgentOutput } from "@/ai/flows/agent-creation";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "../../layout";
import type { Agent, AgentType, AgentLogicType, AgentDirection, AgentPurposeType as FormAgentPurposeType, Client } from "@/lib/types";
import { Loader2, Bot, MessageSquare, Phone, Brain, DatabaseZap, ArrowDownCircle, ArrowUpCircle, HelpCircle, Lightbulb, Users, Briefcase, AlertTriangle, Mic, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { AgentSchema } from "@/lib/types";


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
      primaryLogic: 'rag',
      role: "I am a customer support specialist for [Client Name]. My main tasks are to help customers track their orders, answer questions about products, explain return policies, and resolve any shopping issues they might have. I aim to provide quick and accurate assistance to ensure a smooth and positive customer experience.",
      personality: "Friendly, patient, and highly efficient. I'm knowledgeable about our products and policies, and I communicate clearly and politely. I'm always ready to help with a positive attitude."
    }
  },
  {
    id: 'real_estate_lead_gen',
    defaultValues: {
      agentPurpose: 'sales',
      agentType: 'chat',
      primaryLogic: 'prompt',
      role: "I'm a lead generation assistant for [Client Name]'s Real Estate Agency. I interact with website visitors to understand their property needs (buying, selling, or renting), gather their contact details, and schedule appointments for property viewings or consultations with an agent. My goal is to capture and qualify potential leads effectively.",
      personality: "Professional, engaging, and knowledgeable about the local real estate market. I'm proactive in asking relevant questions and persuasive in guiding users towards the next step. I build trust and rapport with potential clients."
    }
  },
  {
    id: 'dental_appointment_voice',
    defaultValues: {
      agentPurpose: 'custom',
      agentType: 'voice',
      direction: 'inbound',
      primaryLogic: 'prompt',
      role: "I am the automated voice assistant for [Client Name]'s Dental Clinic. I can help you schedule a new dental appointment, reschedule an existing one, or cancel an appointment if needed. I can also provide basic information about our clinic's services, hours, and location.",
      personality: "Clear, calm, and friendly. I speak at a moderate pace and understand various ways users might state their requests. I confirm details carefully to ensure accuracy and provide a pleasant scheduling experience over the phone."
    }
  },
  {
    id: 'faq_info_bot',
    defaultValues: {
        agentPurpose: "info",
        agentType: "chat",
        primaryLogic: "rag",
        role: "I am an informational assistant for [Client Name]. I provide answers to frequently asked questions and explain specific topics based on the knowledge I've been trained on from your documents and website content. My goal is to be a reliable and instant source of information.",
        personality: "Factual, concise, and helpful. I focus on delivering accurate information clearly and directly. I can point to source documents when useful."
    }
  },
  {
    id: 'general_purpose_assistant',
    defaultValues: {
        agentPurpose: "custom",
        agentType: "chat",
        primaryLogic: "prompt",
        role: "I am a versatile AI assistant for [Client Name]. I can help with tasks like brainstorming ideas, drafting content, answering general questions, or performing custom actions you define. My capabilities are flexible based on your specific instructions and persona requirements.",
        personality: "Adaptable based on your needs. You can define whether I should be witty, formal, creative, analytical, or any other style that fits your purpose. Default is neutral and helpful."
    }
  }
];


const agentPurposeTemplates: Record<FormAgentPurposeType, { role: string; personality: string }> = {
  support: {
    role: "A customer support agent for [Client Name]. I help users by answering their questions about products/services, troubleshooting common issues, and providing policy information. My goal is to resolve inquiries efficiently and leave customers satisfied.",
    personality: "Patient, empathetic, clear, and knowledgeable. I strive to be very helpful and understanding.",
  },
  sales: {
    role: "A lead qualification and sales assistant for [Client Name]. I engage potential customers, understand their needs, highlight product/service benefits, answer initial questions, and guide interested leads towards a demo or consultation. My goal is to identify and nurture sales opportunities.",
    personality: "Friendly, persuasive, proactive, and enthusiastic. I am good at explaining value and building rapport.",
  },
  info: {
    role: "An informational bot for [Client Name]. I provide answers to frequently asked questions, explain specific topics, and offer details based on the knowledge I've been trained on. My goal is to be a reliable source of information.",
    personality: "Factual, concise, neutral, and informative. I aim to provide accurate information clearly.",
  },
  custom: {
    role: "Describe the agent's primary function and what it should achieve for [Client Name]. For example, an agent to summarize articles, generate creative content, or act as a personal coach.",
    personality: "Describe the desired personality traits, communication style, and tone (e.g., formal, casual, witty, serious, empathetic, analytical).",
  },
};


const formSchema = z.object({
  agentPurpose: z.enum(["support", "sales", "info", "custom"], { required_error: "Please select the agent's primary purpose."}),
  agentType: z.enum(["chat", "voice", "hybrid"], { required_error: "Please select an agent type."}),
  direction: z.enum(["inbound", "outbound"], { required_error: "Please select agent direction."}),
  primaryLogic: z.enum(["prompt", "rag"], { required_error: "Please select how the agent works."}),
  name: z.string().min(3, "Agent concept/name must be at least 3 characters").max(100, "Name too long"),
  role: z.string().min(10, "Role description must be at least 10 characters").max(1000, "Role description too long (max 1000 chars)"),
  personality: z.string().min(10, "Personality description must be at least 10 characters").max(1000, "Personality description too long (max 1000 chars)"),
  selectedClientId: z.string().optional(), 
});

type FormData = z.infer<typeof formSchema>;

export default function CreateAgentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAgentDetails, setGeneratedAgentDetails] = useState<CreateAgentOutput | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clients, addAgent: addAgentToContext, getClientById, isLoadingClients } = useAppContext();
  const { currentUser } = useAuth();
  const [selectedDirection, setSelectedDirection] = useState<AgentDirection>("inbound");
  
  const queryClientId = searchParams.get('clientId');
  const queryClientName = searchParams.get('clientName');
  const templateId = searchParams.get('templateId');

  const [activeClient, setActiveClient] = useState<Client | null | undefined>(undefined);
  const [requiresClientSelection, setRequiresClientSelection] = useState(false);

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
      selectedClientId: queryClientId || undefined,
    }
  });

  const currentPrimaryLogic = watch("primaryLogic");
  const currentAgentType = watch("agentType");
  const currentAgentPurpose = watch("agentPurpose");
  const formSelectedClientId = watch("selectedClientId");

  useEffect(() => {
    const effectiveClientName = activeClient?.name || "[Client Name]";
    if (selectedTemplate) {
      setValue("role", selectedTemplate.defaultValues.role.replace("[Client Name]", effectiveClientName));
      setValue("personality", selectedTemplate.defaultValues.personality.replace("[Client Name]", effectiveClientName));
    } else {
      setValue("role", agentPurposeTemplates[currentAgentPurpose].role.replace("[Client Name]", effectiveClientName));
      setValue("personality", agentPurposeTemplates[currentAgentPurpose].personality.replace("[Client Name]", effectiveClientName));
    }
  }, [selectedTemplate, currentAgentPurpose, activeClient, setValue]);

  useEffect(() => {
    if (!isLoadingClients) {
      if (queryClientId) {
        const client = getClientById(queryClientId);
        setActiveClient(client);
        setRequiresClientSelection(false);
        setValue("selectedClientId", queryClientId); 
      } else if (templateId) { 
        setRequiresClientSelection(true);
        setActiveClient(undefined); 
        if (clients.length === 1) { 
            setValue("selectedClientId", clients[0].id);
            setActiveClient(clients[0]);
            setRequiresClientSelection(false);
        }
      } else {
        
        setRequiresClientSelection(false); 
        setActiveClient(null); 
      }
    }
  }, [queryClientId, templateId, isLoadingClients, getClientById, clients, setValue]);

  
  useEffect(() => {
    if (formSelectedClientId && !isLoadingClients) {
      const client = getClientById(formSelectedClientId);
      setActiveClient(client);
      
    } else if (!formSelectedClientId && requiresClientSelection) {
      setActiveClient(undefined); 
    }
  }, [formSelectedClientId, isLoadingClients, getClientById, requiresClientSelection]);


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

    const finalClientId = queryClientId || data.selectedClientId;
    let finalClientName = queryClientName;

    if (!finalClientId) {
        toast({ title: "Client Not Selected", description: "Please select a client for this agent.", variant: "destructive" });
        return;
    }
    
    if (!finalClientName && finalClientId) {
        const client = getClientById(finalClientId);
        if (!client) {
            toast({ title: "Client Not Found", description: "Selected client could not be found.", variant: "destructive" });
            return;
        }
        finalClientName = client.name;
    }
    
    if (!finalClientName) { 
        toast({ title: "Client Information Error", description: "Could not determine client name.", variant: "destructive" });
        return;
    }


    setIsLoading(true);
    setGeneratedAgentDetails(null);
    try {
      const logicTypeUserFriendly = getLogicTypeLabel(data.primaryLogic as AgentLogicType);
      const agentDescription = `This agent is for client: ${finalClientName}. Primary Purpose: ${data.agentPurpose}. Type: ${data.agentType}. Direction: ${data.direction}. Primary Logic: ${logicTypeUserFriendly}.\nAgent Concept Name: ${data.name}\nIntended Role for the Business: ${data.role}\nDesired Personality & Tone: ${data.personality}`;
      
      const aiResult = await createAgent({ agentDescription, agentType: data.agentType, direction: data.direction as AgentDirection });
      setGeneratedAgentDetails(aiResult);

      const agentDataForContext: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'userId' | 'clientId' | 'clientName'> = {
        agentType: data.agentType as AgentType,
        direction: data.direction as AgentDirection,
        primaryLogic: data.primaryLogic as AgentLogicType,
        name: data.name, 
        description: `Purpose: ${data.agentPurpose}. Type: ${data.agentType}. Logic: ${logicTypeUserFriendly}. Role: ${data.role}. Personality: ${data.personality}.`,
        role: data.role,
        personality: data.personality,
        agentPurpose: data.agentPurpose as FormAgentPurposeType,
        generatedName: aiResult.agentName,
        generatedPersona: aiResult.agentPersona,
        generatedGreeting: aiResult.agentGreeting,
      };

      const newAgent = await addAgentToContext(agentDataForContext, finalClientId, finalClientName);

      if (newAgent) {
        toast({
          title: "Agent Base Created!",
          description: `Agent "${aiResult.agentName}" for client "${finalClientName}" is ready. Next, customize its personality and add knowledge. Redirecting...`,
        });

        if (data.primaryLogic === 'rag' && activeClient?.website) {
            router.push(`/agents/${newAgent.id}/knowledge?initialUrl=${encodeURIComponent(activeClient.website)}`);
        } else if (data.primaryLogic === 'rag') {
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
  
  if (isLoadingClients && (queryClientId || templateId)) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6"><CardTitle>Loading Client Information...</CardTitle></CardHeader>
        <CardContent className="p-4 sm:p-6"><Loader2 className="animate-spin" /></CardContent>
      </Card>
    );
  }

  const pageTitle = activeClient 
    ? `Define New Agent for ${activeClient.name}`
    : (queryClientName ? `Define New Agent for ${queryClientName}` : "Define New Agent");

  const clientForRoleText = activeClient?.name || queryClientName || "[Client Name]";


  return (
    <TooltipProvider>
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-headline text-purple text-xl sm:text-2xl flex items-center gap-2">
             <Bot className="w-6 h-6 sm:w-7 sm:h-7"/>{pageTitle}
          </CardTitle>
          <CardDescription className="text-sm">
            {selectedTemplate ? `Starting with the "${selectedTemplate.id.replace(/_/g, ' ')}" template. ` : ""}
            Tell us about the agent you want to build. This information will help our AI craft a baseline personality and greeting.
            {!selectedTemplate && <Link href="/app/templates-gallery" className="underline hover:text-cyan">Browse templates</Link>}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">

            {requiresClientSelection && !isLoadingClients && (
                <div className="space-y-1.5 p-3 rounded-md border border-warning bg-warning/10">
                    <Label htmlFor="selectedClientId" className="flex items-center text-warning-foreground font-semibold">
                        <AlertTriangle className="w-4 h-4 mr-2"/> Select Client for this Template
                    </Label>
                    {clients.length === 0 ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>No Clients Found</AlertTitle>
                            <AlertDescription>
                                You need to create a client before using a template. 
                                <Link href="/dashboard" className="underline ml-1">Go to Dashboard to add a client.</Link>
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Controller
                            name="selectedClientId"
                            control={control}
                            rules={{ required: "Please select a client." }}
                            render={({ field }) => (
                                <Select
                                    onValueChange={(value) => {
                                        field.onChange(value);
                                        const client = getClientById(value);
                                        setActiveClient(client);
                                    }}
                                    value={field.value}
                                >
                                <SelectTrigger id="selectedClientId">
                                    <SelectValue placeholder="Choose a client..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map(client => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                    </SelectItem>
                                    ))}
                                </SelectContent>
                                </Select>
                            )}
                        />
                    )}
                    {errors.selectedClientId && <p className="text-xs text-destructive">{errors.selectedClientId.message}</p>}
                </div>
            )}


            <div className="space-y-1.5">
              <Label htmlFor="agentPurpose" className="flex items-center">
                What's this agent's primary purpose for {clientForRoleText}?
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
                        const effectiveClientName = activeClient?.name || queryClientName || "[Client Name]";
                        if (!selectedTemplate) { 
                            setValue("role", agentPurposeTemplates[value as FormAgentPurposeType].role.replace("[Client Name]", effectiveClientName));
                            setValue("personality", agentPurposeTemplates[value as FormAgentPurposeType].personality.replace("[Client Name]", effectiveClientName));
                        }
                    }}
                    value={field.value}
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
              </div>
            </div>
            {(currentAgentType === 'voice' || currentAgentType === 'hybrid') && (
                <Alert variant="default" className="p-3 text-xs bg-cyan/10 dark:bg-cyan/20 border-cyan/30">
                    <Mic className="h-4 w-4 text-cyan"/>
                    <AlertTitle className="text-cyan text-xs sm:text-sm font-medium">Voice Agent Tip</AlertTitle>
                    <AlertDescription className="text-cyan/80 dark:text-cyan/90 text-[11px] sm:text-xs">
                        For voice agents to use your own Twilio account for calls, ensure your Twilio credentials are set up in <Link href="/settings" className="underline hover:text-cyan-foreground">User Profile Settings <ExternalLink className="inline w-2.5 h-2.5 ml-0.5"/></Link>.
                    </AlertDescription>
                </Alert>
            )}
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
                        ? "Agent answers based on Personality and Role. Good for general chat or when no specific documents are provided. It can still use knowledge if you upload it."
                        : "Agent answers using Business Data you upload. Best for customer support or info bots that need to be factual about the client's business."
                    }
                </p>
              </div>


            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center">Agent Concept/Name for {clientForRoleText}
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>A specific name or concept for this agent, e.g., "Support Bot for Product X" or "Lead Gen for Fall Campaign". The AI will also suggest a user-facing name.</p></TooltipContent>
                </Tooltip>
              </Label>
              <Input id="name" placeholder="e.g., 'Support Bot for Product X', 'Lead Gen for Fall Campaign'" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role" className="flex items-center">What is this Agent's job for {clientForRoleText}?
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Describe the agent's main responsibilities and goals. The pre-filled text is based on the 'Purpose' you selected and customized for {clientForRoleText}. Max 1000 characters.</p></TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                id="role"
                placeholder={agentPurposeTemplates[currentAgentPurpose]?.role.replace("[Client Name]", clientForRoleText) || "Describe the agent's primary function..."}
                {...register("role")}
                rows={5}
                maxLength={1000}
              />
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="personality" className="flex items-center">How should this Agent sound and behave for {clientForRoleText}?
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Define the agent's communication style and tone. The pre-filled text is based on the 'Purpose' you selected and customized for {clientForRoleText}. Max 1000 characters.</p></TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                id="personality"
                placeholder={agentPurposeTemplates[currentAgentPurpose]?.personality.replace("[Client Name]", clientForRoleText) || "Describe the desired personality..."}
                {...register("personality")}
                rows={5}
                maxLength={1000}
               />
              {errors.personality && <p className="text-xs text-destructive">{errors.personality.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button 
              type="submit" 
              disabled={isLoading || (requiresClientSelection && !formSelectedClientId && clients.length > 0) || (requiresClientSelection && clients.length === 0)} 
              className="w-full btn-gradient-primary"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Creating Agent..." : `Create Agent for ${activeClient?.name || queryClientName || "Selected Client"}`}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {generatedAgentDetails && (
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-headline text-purple text-lg sm:text-xl">AI Generated Details (Suggestions)</CardTitle>
            <CardDescription className="text-xs italic">You can refine these details in the 'Personality' section for this agent after creation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div>
              <Label className="text-xs font-semibold">Suggested Agent Name (User-Facing)</Label>
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
