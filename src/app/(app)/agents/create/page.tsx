
"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";
import { useAppContext } from "../../layout"; 
import type { Agent, AgentType, AgentLogicType, AgentDirection } from "@/lib/types"; 
import { Loader2, Bot, MessageSquare, Phone, Brain, DatabaseZap, ArrowDownCircle, ArrowUpCircle } from "lucide-react"; 
import { useAuth } from "@/contexts/AuthContext"; 
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const formSchema = z.object({
  agentType: z.enum(["chat", "voice", "hybrid"], { required_error: "Please select an agent type."}),
  direction: z.enum(["inbound", "outbound"], { required_error: "Please select agent direction."}),
  primaryLogic: z.enum(["prompt", "rag"], { required_error: "Please select the agent's primary brain logic."}),
  name: z.string().min(3, "Chatbot name must be at least 3 characters").max(100, "Name too long"),
  role: z.string().min(10, "Role description must be at least 10 characters").max(500, "Role too long"),
  personality: z.string().min(10, "Personality description must be at least 10 characters").max(500, "Personality too long"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateAgentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAgentDetails, setGeneratedAgentDetails] = useState<CreateAgentOutput | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { addAgent: addAgentToContext } = useAppContext();
  const { currentUser } = useAuth(); 

  const { control, register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agentType: "chat",
      direction: "inbound",
      primaryLogic: "rag", 
    }
  });
  
  const getLogicTypeLabel = (logicType?: AgentLogicType): string => {
    if (!logicType) return "Not Set";
    switch (logicType) {
        case 'prompt': return "Direct AI Prompt";
        case 'rag': return "Knowledge Q&A (RAG)";
        default: return "Custom"; // Should not be reached with current enum
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please log in to create a chatbot.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setIsLoading(true);
    setGeneratedAgentDetails(null);
    try {
      const logicTypeLabel = getLogicTypeLabel(data.primaryLogic as AgentLogicType);
      const agentDescription = `Type: ${data.agentType}. Direction: ${data.direction}. Primary Logic: ${logicTypeLabel}.\nBusiness Purpose: ${data.name}\nIntended Role for the Business: ${data.role}\nDesired Personality & Tone: ${data.personality}`;
      const aiResult = await createAgent({ agentDescription, agentType: data.agentType, direction: data.direction as AgentDirection });
      setGeneratedAgentDetails(aiResult);
      
      const agentDataForContext: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'userId'> = {
        agentType: data.agentType as AgentType,
        direction: data.direction as AgentDirection,
        primaryLogic: data.primaryLogic as AgentLogicType, 
        name: data.name, 
        description: `Type: ${data.agentType}. Direction: ${data.direction}. Logic: ${logicTypeLabel}. Role: ${data.role}. Personality: ${data.personality}.`, 
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
          description: `Agent "${aiResult.agentName}" (Type: ${data.agentType}, Direction: ${data.direction}, Logic: ${logicTypeLabel}) is ready. Next, customize its personality and add knowledge. Redirecting...`,
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
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}> <Bot className="w-6 h-6 sm:w-7 sm:h-7"/>Step 1: Define Your New Business Agent</CardTitle>
          <CardDescription className="text-sm">
            Tell us about the agent you want to build. Define its type, direction, core logic, purpose, role, and personality.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="agentType">Agent Type</Label>
                <Controller
                  name="agentType"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Label htmlFor="direction">Agent Direction</Label>
                <Controller
                  name="direction"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="direction">
                        <SelectValue placeholder="Select direction" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbound"><div className="flex items-center gap-2"><ArrowDownCircle className="w-4 h-4"/>Inbound (Handles incoming)</div></SelectItem>
                        <SelectItem value="outbound"><div className="flex items-center gap-2"><ArrowUpCircle className="w-4 h-4"/>Outbound (Initiates contact)</div></SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.direction && <p className="text-xs text-destructive">{errors.direction.message}</p>}
              </div>
            </div>
             <div className="space-y-1.5">
                <Label htmlFor="primaryLogic">Agent's Brain</Label>
                <Controller
                  name="primaryLogic"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="primaryLogic">
                        <SelectValue placeholder="Select brain logic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prompt"><div className="flex items-center gap-2"><Brain className="w-4 h-4"/>Direct AI Prompt (Persona-driven)</div></SelectItem>
                        <SelectItem value="rag"><div className="flex items-center gap-2"><DatabaseZap className="w-4 h-4"/>Knowledge Q&A (Uses uploaded data)</div></SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.primaryLogic && <p className="text-xs text-destructive">{errors.primaryLogic.message}</p>}
                 <p className="text-xs text-muted-foreground mt-1">
                    'Direct AI Prompt' relies on the agent's persona for responses. 'Knowledge Q&A' primarily uses uploaded documents to answer questions.
                </p>
              </div>


            <div className="space-y-1.5">
              <Label htmlFor="name">Agent Name / Business Purpose</Label>
              <Input id="name" placeholder="e.g., 'Acme Support Bot', 'Dental Clinic Voice Receptionist'" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role & Objectives for the Business</Label>
              <Textarea id="role" placeholder="e.g., 'Answer customer questions about products via chat', 'Handle inbound calls, take messages, and book appointments for the dental clinic'" {...register("role")} rows={3} />
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="personality">Desired Personality & Tone</Label>
              <Textarea id="personality" placeholder="e.g., 'Friendly and helpful for website chat', 'Professional and efficient for phone interactions'" {...register("personality")} rows={3} />
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
            <p className="text-xs text-muted-foreground italic">You can further refine these details in the 'Personality' section for this agent.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    