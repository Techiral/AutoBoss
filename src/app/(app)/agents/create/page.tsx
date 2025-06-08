
"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";
import { useAppContext } from "../../layout"; 
import type { Agent } from "@/lib/types"; 
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; 

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name too long"),
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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please log in to create an agent.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setIsLoading(true);
    setGeneratedAgentDetails(null);
    try {
      const agentDescription = `Name: ${data.name}\nRole: ${data.role}\nPersonality: ${data.personality}`;
      const aiResult = await createAgent({ agentDescription });
      setGeneratedAgentDetails(aiResult);
      
      const agentDataForContext: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'flow' | 'userId'> = {
        name: data.name, 
        description: `Role: ${data.role}. Personality: ${data.personality}.`, 
        role: data.role,
        personality: data.personality,
        generatedName: aiResult.agentName,
        generatedPersona: aiResult.agentPersona,
        generatedGreeting: aiResult.agentGreeting,
      };
      
      const newAgent = await addAgentToContext(agentDataForContext);

      if (newAgent) {
        toast({
          title: "Agent Configured!",
          description: `Agent "${aiResult.agentName}" saved. Redirecting to Studio...`,
        });
        router.push(`/agents/${newAgent.id}/studio`);
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
          <CardTitle className="font-headline text-xl sm:text-2xl">Configure New AI Agent</CardTitle>
          <CardDescription className="text-sm">
            Define the core characteristics of your new agent. The AI will help refine its persona.
            <br />
            <span className="text-xs text-muted-foreground">Agent data will be stored in Firestore, associated with your account.</span>
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
              <Textarea id="role" placeholder="Describe the agent's primary function and goals..." {...register("role")} rows={3} />
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="personality">Personality & Tone</Label>
              <Textarea id="personality" placeholder="Describe the desired personality..." {...register("personality")} rows={3} />
              {errors.personality && <p className="text-xs text-destructive">{errors.personality.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Configuring Agent..." : "Configure Agent & Generate Details"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {generatedAgentDetails && (
        <Card className="mt-6 sm:mt-8">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-headline text-lg sm:text-xl">AI Generated Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            <div>
              <Label className="text-xs font-semibold">Generated Name</Label>
              <p className="text-sm p-2 bg-muted rounded-md mt-1">{generatedAgentDetails.agentName}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold">Generated Persona</Label>
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
  );
}

    