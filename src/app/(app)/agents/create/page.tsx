
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
import { generateAgentImage } from "@/ai/flows/image-generation-flow";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "../../layout";
import type { Agent, AgentType, AgentLogicType, AgentDirection, AgentPurposeType, Client, JobId } from "@/lib/types";
import { Loader2, Bot, MessageSquare, Phone, Brain, DatabaseZap, ArrowDownCircle, ArrowUpCircle, HelpCircle, Lightbulb, Users, Briefcase, AlertTriangle, Mic, ExternalLink, Settings2, Handshake, PhoneCall, PhoneForwarded } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { AgentSchema } from "@/lib/types";


const agentJobs = [
  { id: 'website_support', label: 'Answer questions on my website', description: "Learns from your data to provide 24/7 support.", details: { agentType: 'chat', primaryLogic: 'rag', direction: 'inbound', agentPurpose: 'support' }, icon: MessageSquare },
  { id: 'website_lead_gen', label: 'Capture leads from my website', description: "Engages visitors to qualify them and collect contact info.", details: { agentType: 'chat', primaryLogic: 'prompt', direction: 'inbound', agentPurpose: 'sales' }, icon: Handshake },
  { id: 'inbound_call_answering', label: 'Answer incoming phone calls', description: "Acts as a receptionist to provide information or route calls.", details: { agentType: 'voice', primaryLogic: 'rag', direction: 'inbound', agentPurpose: 'info' }, icon: PhoneCall },
  { id: 'outbound_sales_calls', label: 'Make outbound sales/follow-up calls', description: "Initiates calls to prospects to pitch or follow up.", details: { agentType: 'voice', primaryLogic: 'prompt', direction: 'outbound', agentPurpose: 'sales' }, icon: PhoneForwarded },
  { id: 'custom', label: 'Build a custom agent (Advanced)', description: "Manually configure all technical agent settings.", details: { agentType: 'chat', primaryLogic: 'prompt', direction: 'inbound', agentPurpose: 'custom' }, icon: Settings2 },
] as const;

const formSchema = AgentSchema.pick({
    name: true,
    role: true,
    personality: true,
}).extend({
  jobId: z.custom<JobId>(),
  selectedClientId: z.string().optional(),
  // These are set by the job, but need to be in the form state
  agentType: z.custom<AgentType>(),
  primaryLogic: z.custom<AgentLogicType>(),
  direction: z.custom<AgentDirection>(),
  agentPurpose: z.custom<AgentPurposeType>(),
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
  
  const queryClientId = searchParams.get('clientId');
  
  const [activeClient, setActiveClient] = useState<Client | null | undefined>(undefined);
  const [requiresClientSelection, setRequiresClientSelection] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { control, register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", 
      jobId: "website_support",
      agentType: "chat",
      primaryLogic: "rag",
      direction: "inbound",
      agentPurpose: "support",
      role: "I am a customer support specialist for [Client Name]. My main tasks are to help customers track their orders, answer questions about products, explain return policies, and resolve any shopping issues they might have. I aim to provide quick and accurate assistance to ensure a smooth and positive customer experience.",
      personality: "Friendly, patient, and highly efficient. I'm knowledgeable about our products and policies, and I communicate clearly and politely. I'm always ready to help with a positive attitude.",
      selectedClientId: queryClientId || undefined,
    }
  });

  const selectedJobId = watch("jobId");
  const formSelectedClientId = watch("selectedClientId");
  
  // Set client from query params
  useEffect(() => {
    if (!isLoadingClients) {
      if (queryClientId) {
        const client = getClientById(queryClientId);
        setActiveClient(client);
        setRequiresClientSelection(false);
        setValue("selectedClientId", queryClientId); 
      } else {
        setRequiresClientSelection(true);
        setActiveClient(undefined); 
        if (clients.length === 1) { 
            setValue("selectedClientId", clients[0].id);
            setActiveClient(clients[0]);
            setRequiresClientSelection(false);
        }
      }
    }
  }, [queryClientId, isLoadingClients, getClientById, clients, setValue]);

  // Update active client when form value changes
  useEffect(() => {
    if (formSelectedClientId && !isLoadingClients) {
      const client = getClientById(formSelectedClientId);
      setActiveClient(client);
    } else if (!formSelectedClientId && requiresClientSelection) {
      setActiveClient(undefined); 
    }
  }, [formSelectedClientId, isLoadingClients, getClientById, requiresClientSelection]);
  
  // Pre-fill form if a template is selected from the gallery
  useEffect(() => {
    const templateId = searchParams.get('templateId') as JobId | null;
    if (templateId) {
      const job = agentJobs.find(j => j.id === templateId);
      if (job) {
        setValue('jobId', job.id);
        const { agentType, primaryLogic, direction, agentPurpose } = job.details;
        setValue('agentType', agentType);
        setValue('primaryLogic', primaryLogic);
        setValue('direction', direction);
        setValue('agentPurpose', agentPurpose);
        setShowAdvanced(job.id === 'custom');
      }
    }
  }, [searchParams, setValue]);


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
    let finalClientName: string | undefined;

    if (!finalClientId) {
        toast({ title: "Client Not Selected", description: "Please select a client for this agent.", variant: "destructive" });
        return;
    }
    
    const client = getClientById(finalClientId);
    if (!client) {
        toast({ title: "Client Not Found", description: "Selected client could not be found.", variant: "destructive" });
        return;
    }
    finalClientName = client.name;

    setIsLoading(true);
    setGeneratedAgentDetails(null);
    try {
      const logicTypeUserFriendly = getLogicTypeLabel(data.primaryLogic);
      const agentDescription = `This agent's job is to: ${agentJobs.find(j => j.id === data.jobId)?.label}. It is for client: ${finalClientName}. Type: ${data.agentType}. Primary Logic: ${logicTypeUserFriendly}.\nIntended Role: ${data.role}\nPersonality: ${data.personality}`;
      
      const aiResult = await createAgent({ agentDescription, agentType: data.agentType, direction: data.direction });
      setGeneratedAgentDetails(aiResult);

      let agentImageUrl: string | null = null;
      try {
        const imagePrompt = `Minimalist, modern, and professional logo for an AI agent named "${aiResult.agentName}". The agent's persona is: "${aiResult.agentPersona}". Style should be clean, vector art, suitable for a social media profile picture.`;
        agentImageUrl = await generateAgentImage(imagePrompt);
      } catch (e: any) {
        console.warn("Image generation failed during agent creation:", e.message);
        toast({ title: "Image Generation Skipped", description: `Could not generate an image for the agent, but the agent was created successfully. You can generate one later. Reason: ${e.message}`, variant: "default"});
      }

      const agentDataForContext: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'userId' | 'clientId' | 'clientName'> = {
        jobId: data.jobId,
        agentType: data.agentType,
        direction: data.direction,
        primaryLogic: data.primaryLogic,
        agentPurpose: data.agentPurpose,
        name: data.name, 
        description: `Job: ${agentJobs.find(j => j.id === data.jobId)?.label || 'Custom'}. Type: ${data.agentType}.`,
        role: data.role,
        personality: data.personality,
        generatedName: aiResult.agentName,
        generatedPersona: aiResult.agentPersona,
        generatedGreeting: aiResult.agentGreeting,
        agentImageUrl: agentImageUrl,
      };

      const newAgent = await addAgentToContext(agentDataForContext, finalClientId, finalClientName);

      if (newAgent) {
        toast({
          title: "Agent Base Created!",
          description: `Agent "${aiResult.agentName}" for client "${finalClientName}" is ready. Next, customize its personality and add knowledge. Redirecting...`,
        });

        // Redirect to knowledge page if it's a knowledge-based job
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
  
  if (isLoadingClients && queryClientId) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6"><CardTitle>Loading Client Information...</CardTitle></CardHeader>
        <CardContent className="p-4 sm:p-6"><Loader2 className="animate-spin" /></CardContent>
      </Card>
    );
  }

  const pageTitle = activeClient 
    ? `New AI Employee for ${activeClient.name}`
    : "New AI Employee";

  const clientForRoleText = activeClient?.name || "[Your Client]";


  return (
    <TooltipProvider>
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-headline text-2xl sm:text-3xl flex items-center gap-2">
             <Bot className="w-6 h-6 sm:w-7 sm:w-7"/>{pageTitle}
          </CardTitle>
          <CardDescription className="text-sm">
            Start by choosing the main job this AI will do for your client. We'll handle the technical details.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">

            {requiresClientSelection && !isLoadingClients && (
                <div className="space-y-1.5 p-3 rounded-md border border-destructive/50 bg-destructive/10">
                    <Label htmlFor="selectedClientId" className="flex items-center text-foreground font-semibold">
                        <AlertTriangle className="w-4 h-4 mr-2 text-destructive"/> First, Select a Client
                    </Label>
                    {clients.length === 0 ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>No Clients Found</AlertTitle>
                            <AlertDescription>
                                You need to create a client before building an agent. 
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
               <Label htmlFor="jobId" className="flex items-center">
                What job will this AI do for {clientForRoleText}?
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>This sets the AI's core function. We'll pre-configure the best settings for this job.</p></TooltipContent>
                </Tooltip>
              </Label>
              <Controller
                name="jobId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                        field.onChange(value);
                        const job = agentJobs.find(j => j.id === value);
                        if (job) {
                            const { agentType, primaryLogic, direction, agentPurpose } = job.details;
                            setValue('agentType', agentType);
                            setValue('primaryLogic', primaryLogic);
                            setValue('direction', direction);
                            setValue('agentPurpose', agentPurpose);
                            setShowAdvanced(job.id === 'custom');
                        }
                    }}
                    value={field.value}
                  >
                    <SelectTrigger id="jobId" className="h-auto">
                      <SelectValue placeholder="Select a job..." />
                    </SelectTrigger>
                    <SelectContent>
                      {agentJobs.map(job => (
                          <SelectItem key={job.id} value={job.id}>
                              <div className="flex items-start gap-2 py-1">
                                <job.icon className="w-4 h-4 mt-0.5 text-foreground/70"/>
                                <div>
                                    <p className="font-medium">{job.label}</p>
                                    <p className="text-xs text-muted-foreground">{job.description}</p>
                                </div>
                              </div>
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.jobId && <p className="text-xs text-destructive">{errors.jobId.message}</p>}
            </div>

            {showAdvanced && (
                <div className="space-y-4 p-3 border rounded-md bg-secondary/50">
                    <h3 className="font-semibold text-sm">Advanced Configuration</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="agentType">Agent Type</Label>
                        <Controller name="agentType" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="agentType"><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="chat">Chat</SelectItem><SelectItem value="voice">Voice</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent>
                            </Select>
                        )} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="direction">Direction</Label>
                        <Controller name="direction" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="direction"><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="inbound">Inbound</SelectItem><SelectItem value="outbound">Outbound</SelectItem></SelectContent>
                            </Select>
                        )} />
                      </div>
                    </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="primaryLogic">Primary Logic</Label>
                        <Controller name="primaryLogic" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="primaryLogic"><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="rag">Knowledge-Based</SelectItem><SelectItem value="prompt">Persona-Driven</SelectItem></SelectContent>
                            </Select>
                        )} />
                      </div>
                </div>
            )}


            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center">Internal Name or Concept
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Your private name for this project, e.g., "Support Bot for Website" or "Fall Campaign Lead Gen".</p></TooltipContent>
                </Tooltip>
              </Label>
              <Input id="name" placeholder="e.g., 'Website Support Bot', 'Fall Campaign Lead Gen'" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role" className="flex items-center">What is this AI's specific responsibility?
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Describe its main tasks for {clientForRoleText}. Be specific. E.g., "Answer questions about shipping and returns based on the FAQ document."</p></TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                id="role"
                placeholder="E.g., Answer questions about shipping and returns based on the FAQ document..."
                {...register("role")}
                rows={4}
                maxLength={1000}
              />
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="personality" className="flex items-center">How should this AI sound and behave?
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Describe its personality. E.g., "Friendly, patient, and professional. Uses simple language."</p></TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                id="personality"
                placeholder="E.g., Friendly, patient, and professional. Uses simple language..."
                {...register("personality")}
                rows={4}
                maxLength={1000}
               />
              {errors.personality && <p className="text-xs text-destructive">{errors.personality.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button 
              type="submit" 
              disabled={isLoading || (requiresClientSelection && !formSelectedClientId && clients.length > 0) || (requiresClientSelection && clients.length === 0)} 
              className="w-full"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Building AI Employee..." : `Build this AI for ${activeClient?.name || "[Client]"}`}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
    </TooltipProvider>
  );
}
