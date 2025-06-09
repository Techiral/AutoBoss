
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
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
import type { Agent } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name too long"),
  role: z.string().min(10, "Role description must be at least 10 characters").max(500, "Role too long"),
  personality: z.string().min(10, "Personality description must be at least 10 characters").max(500, "Personality too long"),
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

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({ 
    resolver: zodResolver(formSchema),
    defaultValues: { 
        name: "",
        role: "",
        personality: "",
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
      const agentDescription = `Name: ${data.name}\nRole: ${data.role}\nPersonality: ${data.personality}`;
      const result = await createAgent({ agentDescription });
      setGeneratedDetails(result);
      
      const updatedAgentData: Partial<Agent> = { 
        name: data.name,
        description: `Role: ${data.role}. Personality: ${data.personality}.`,
        role: data.role,
        personality: data.personality,
        generatedName: result.agentName,
        generatedPersona: result.agentPersona,
        generatedGreeting: result.agentGreeting,
      };
      updateAgent({ ...currentAgent, ...updatedAgentData });

      toast({
        title: "Personality Updated!",
        description: `Agent "${result.agentName}" personality has been successfully updated.`,
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
  if (!currentAgent) { // Agent not found or no agentId
      return null; 
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className={cn("font-headline text-xl sm:text-2xl", "text-gradient-dynamic")}>Edit Agent Personality</CardTitle>
        <CardDescription className="text-sm">
          Refine your agent's name, role, personality, and how it introduces itself.
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
            <Label htmlFor="role">Role & Objectives</Label>
            <Textarea id="role" placeholder="Describe the agent's primary function." {...register("role")} rows={3} />
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="personality">Personality & Tone</Label>
            <Textarea id="personality" placeholder="Describe the desired personality." {...register("personality")} rows={3} />
            {errors.personality && <p className="text-xs text-destructive">{errors.personality.message}</p>}
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
  );
}
