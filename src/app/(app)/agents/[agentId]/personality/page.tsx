
"use client";

import { useState, useEffect } from "react";
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
import { useParams } from "next/navigation"; 
import { useAppContext } from "../../../layout"; 
import type { Agent, AgentToneType } from "@/lib/types"; 
import { AgentToneSchema } from "@/lib/types"; 
import { Loader2, Smile, Settings } from "lucide-react"; 
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; 
import { HelpCircle } from "lucide-react";


const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name too long"),
  role: z.string().min(10, "Role description must be at least 10 characters").max(1000, "Role description too long (max 1000 chars)"),
  personality: z.string().min(10, "Personality description must be at least 10 characters").max(1000, "Personality description too long (max 1000 chars)"),
  agentTone: AgentToneSchema.default("neutral"), 
});

type FormData = z.infer<typeof formSchema>;

export default function PersonalityPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null | undefined>(undefined); 
  const [generatedDetails, setGeneratedDetails] = useState<CreateAgentOutput | null>(null);

  const { toast } = useToast();
  const params = useParams();
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const { getAgent, updateAgent, isLoadingAgents } = useAppContext();

  const { control, register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({ 
    resolver: zodResolver(formSchema),
    defaultValues: { 
        name: "",
        role: "",
        personality: "",
        agentTone: "neutral", 
    }
  });

  useEffect(() => {
    if (!isLoadingAgents && agentId) {
      const agent = getAgent(agentId as string);
      setCurrentAgent(agent); 
      if (agent) {
        setValue("name", agent.name);
        setValue("role", agent.role || '');
        setValue("personality", agent.personality || '');
        setValue("agentTone", agent.agentTone || "neutral"); 
        if (agent.generatedName && agent.generatedPersona && agent.generatedGreeting) {
            setGeneratedDetails({
                agentName: agent.generatedName,
                agentPersona: agent.generatedPersona,
                agentGreeting: agent.generatedGreeting,
            });
        }
      }
    } else if (!isLoadingAgents && !agentId) {
       setCurrentAgent(null);
    }
  }, [agentId, getAgent, setValue, isLoadingAgents]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!currentAgent) return;

    setIsLoading(true);
    try {
      const agentDescription = `Name: ${data.name}\nRole: ${data.role}\nPersonality: ${data.personality}\nTone: ${data.agentTone}`;
      const result = await createAgent({ 
        agentDescription, 
        agentType: currentAgent.agentType, 
        direction: currentAgent.direction,
        agentTone: data.agentTone as AgentToneType, 
      });
      setGeneratedDetails(result);
      
      const updatedAgentData: Partial<Agent> = { 
        name: data.name,
        description: `Role: ${data.role}. Personality: ${data.personality}. Tone: ${data.agentTone}`,
        role: data.role,
        personality: data.personality,
        agentTone: data.agentTone as AgentToneType, 
        generatedName: result.agentName,
        generatedPersona: result.agentPersona,
        generatedGreeting: result.agentGreeting,
      };
      updateAgent({ ...currentAgent, ...updatedAgentData });

      toast({
        title: "Personality Updated!",
        description: `Agent "${result.agentName}" personality and tone have been successfully updated.`,
      });
    } catch (error) {
      console.error("Error updating personality:", error);
      toast({
        title: "Error",
        description: "Failed to update personality. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoadingAgents || (currentAgent === undefined && agentId)) { 
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6"><CardTitle className="text-lg sm:text-xl">Loading Agent Personality...</CardTitle></CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] p-4 sm:p-6">
            <Logo className="mb-3 h-8" />
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground mt-2">Fetching personality details...</p>
        </CardContent>
      </Card>
    )
  }
  if (!currentAgent) { 
      return null; 
  }

  return (
    <TooltipProvider>
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}>
            <Settings className="w-6 h-6"/> Edit Agent Personality
        </CardTitle>
        <CardDescription className="text-sm">
          Refine your agent's name, role, personality, tone, and how it introduces itself.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">Agent Name / Concept</Label>
            <Input id="name" placeholder="e.g., Helpful Support Bot" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role" className="flex items-center">
                Role & Objectives
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Describe the agent's main responsibilities and goals. Max 1000 characters.</p></TooltipContent>
                </Tooltip>
            </Label>
            <Textarea id="role" placeholder="Describe the agent's primary function." {...register("role")} rows={5} maxLength={1000} />
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="personality" className="flex items-center">
                Personality & Tone Clues
                <Tooltip>
                    <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                    <TooltipContent><p>Describe the desired personality traits (e.g. empathetic, humorous, direct). Max 1000 characters.</p></TooltipContent>
                </Tooltip>
            </Label>
            <Textarea id="personality" placeholder="Describe the desired personality traits (e.g. empathetic, humorous, direct)." {...register("personality")} rows={5} maxLength={1000}/>
            {errors.personality && <p className="text-xs text-destructive">{errors.personality.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="agentTone" className="flex items-center">
              Conversational Tone
              <Tooltip>
                <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                <TooltipContent><p>Select the overall tone the agent should use in conversations.</p></TooltipContent>
              </Tooltip>
            </Label>
            <Controller
              name="agentTone"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value || "neutral"}>
                  <SelectTrigger id="agentTone">
                    <SelectValue placeholder="Select agent's tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral"><div className="flex items-center gap-2"><Smile className="w-4 h-4 opacity-60"/>Neutral / Default</div></SelectItem>
                    <SelectItem value="friendly"><div className="flex items-center gap-2"><Smile className="w-4 h-4 text-green-500"/>Friendly & Warm</div></SelectItem>
                    <SelectItem value="professional"><div className="flex items-center gap-2"><Smile className="w-4 h-4 text-blue-500"/>Professional & Precise</div></SelectItem>
                    <SelectItem value="witty"><div className="flex items-center gap-2"><Smile className="w-4 h-4 text-purple-500"/>Witty & Playful</div></SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.agentTone && <p className="text-xs text-destructive">{errors.agentTone.message}</p>}
          </div>

           {(generatedDetails || (currentAgent.generatedName && currentAgent.generatedPersona)) && (
            <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                <h3 className={cn("font-headline text-md sm:text-lg", "text-gradient-dynamic")}>Current AI Generated Details</h3>
                <div>
                    <Label className="text-xs font-semibold">Generated Name</Label>
                    <p className="text-sm p-2 bg-muted rounded-md mt-1">{generatedDetails?.agentName || currentAgent.generatedName}</p>
                </div>
                <div>
                    <Label className="text-xs font-semibold">Generated Persona</Label>
                    <p className="text-sm p-2 bg-muted rounded-md whitespace-pre-wrap mt-1">{generatedDetails?.agentPersona || currentAgent.generatedPersona}</p>
                </div>
                <div>
                    <Label className="text-xs font-semibold">Sample Greeting</Label>
                    <p className="text-sm p-2 bg-muted rounded-md mt-1">{generatedDetails?.agentGreeting || currentAgent.generatedGreeting}</p>
                </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="p-4 sm:p-6">
          <Button type="submit" disabled={isLoading} className={cn("w-full sm:w-auto", "btn-gradient-primary")}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? "Updating Personality..." : "Update Personality & Regenerate Details"}
          </Button>
        </CardFooter>
      </form>
    </Card>
    </TooltipProvider>
  );
}
