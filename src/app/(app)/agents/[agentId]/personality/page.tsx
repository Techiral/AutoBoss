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
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "../../../layout"; // Adjust path as necessary
import type { Agent } from "@/lib/types";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  role: z.string().min(10, "Role description must be at least 10 characters"),
  personality: z.string().min(10, "Personality description must be at least 10 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function PersonalityPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [generatedDetails, setGeneratedDetails] = useState<CreateAgentOutput | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const { getAgent, updateAgent } = useAppContext();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (agentId) {
      const agent = getAgent(agentId as string);
      if (agent) {
        setCurrentAgent(agent);
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
      } else {
        // router.push("/dashboard"); // Agent not found
      }
    }
  }, [agentId, getAgent, setValue, router]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!currentAgent) return;

    setIsLoading(true);
    setGeneratedDetails(null);
    try {
      const agentDescription = `Name: ${data.name}\nRole: ${data.role}\nPersonality: ${data.personality}`;
      const result = await createAgent({ agentDescription });
      setGeneratedDetails(result);
      
      const updatedAgentData: Agent = {
        ...currentAgent,
        name: data.name,
        description: `Role: ${data.role}. Personality: ${data.personality}.`, // Update description based on new inputs
        role: data.role,
        personality: data.personality,
        generatedName: result.agentName,
        generatedPersona: result.agentPersona,
        generatedGreeting: result.agentGreeting,
      };
      updateAgent(updatedAgentData);

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
  
  if (!currentAgent && agentId) { // Still loading or agent not found after initial check
    return (
      <Card>
        <CardHeader><CardTitle>Loading Agent Personality...</CardTitle></CardHeader>
        <CardContent><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /></CardContent>
      </Card>
    )
  }
  if (!currentAgent) { // Agent genuinely not found
     return (
      <Card>
        <CardHeader><CardTitle>Agent Not Found</CardTitle></CardHeader>
        <CardContent><p>The requested agent could not be found.</p></CardContent>
      </Card>
     )
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Edit Agent Personality</CardTitle>
        <CardDescription>
          Refine your agent's name, role, personality, and how it introduces itself.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name / Concept</Label>
            <Input id="name" placeholder="e.g., Helpful Support Bot" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role & Objectives</Label>
            <Textarea id="role" placeholder="Describe the agent's primary function." {...register("role")} />
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality">Personality & Tone</Label>
            <Textarea id="personality" placeholder="Describe the desired personality." {...register("personality")} />
            {errors.personality && <p className="text-sm text-destructive">{errors.personality.message}</p>}
          </div>
           {generatedDetails && (
            <div className="space-y-4 pt-4 border-t">
                <h3 className="font-headline text-lg">Current AI Generated Details</h3>
                <div>
                    <Label>Generated Name</Label>
                    <p className="text-sm p-2 bg-muted rounded-md">{generatedDetails.agentName}</p>
                </div>
                <div>
                    <Label>Generated Persona</Label>
                    <p className="text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">{generatedDetails.agentPersona}</p>
                </div>
                <div>
                    <Label>Sample Greeting</Label>
                    <p className="text-sm p-2 bg-muted rounded-md">{generatedDetails.agentGreeting}</p>
                </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isLoading ? "Updating Personality..." : "Update Personality"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
