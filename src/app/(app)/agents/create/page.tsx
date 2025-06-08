
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
import { useAuth } from "@/contexts/AuthContext"; // Import useAuth

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  role: z.string().min(10, "Role description must be at least 10 characters"),
  personality: z.string().min(10, "Personality description must be at least 10 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateAgentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedAgentDetails, setGeneratedAgentDetails] = useState<CreateAgentOutput | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { addAgent: addAgentToContext } = useAppContext();
  const { currentUser } = useAuth(); // Get current user

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
      
      // Prepare data for Firestore, AppContext will handle `id`, `createdAt`, `userId`
      const agentDataForContext: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'flow' | 'userId'> = {
        name: data.name, 
        description: `Role: ${data.role}. Personality: ${data.personality}.`, 
        role: data.role,
        personality: data.personality,
        generatedName: aiResult.agentName,
        generatedPersona: aiResult.agentPersona,
        generatedGreeting: aiResult.agentGreeting,
      };
      
      const newAgent = await addAgentToContext(agentDataForContext); // AppContext now adds userId

      if (newAgent) {
        toast({
          title: "Agent Configured!",
          description: `Agent "${aiResult.agentName}" saved. Redirecting to Studio...`,
        });
        router.push(`/agents/${newAgent.id}/studio`);
      } else {
        // Error already toasted by AppContext if addAgentToContext returns null
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
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Configure New AI Agent</CardTitle>
          <CardDescription>
            Define the core characteristics of your new agent. The AI will help refine its persona.
            <br />
            <span className="text-xs text-muted-foreground">Agent data will be stored in Firestore, associated with your account.</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name / Concept</Label>
              <Input id="name" placeholder="e.g., Helpful Support Bot, Sassy Tour Guide" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role & Objectives</Label>
              <Textarea id="role" placeholder="Describe the agent's primary function and goals. e.g., 'To answer customer questions about our products and help them troubleshoot common issues.'" {...register("role")} />
              {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="personality">Personality & Tone</Label>
              <Textarea id="personality" placeholder="Describe the desired personality. e.g., 'Friendly, patient, and slightly humorous. Avoids technical jargon.'" {...register("personality")} />
              {errors.personality && <p className="text-sm text-destructive">{errors.personality.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Configuring Agent..." : "Configure Agent & Generate Details"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {generatedAgentDetails && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-headline">AI Generated Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Generated Name</Label>
              <p className="text-sm p-2 bg-muted rounded-md">{generatedAgentDetails.agentName}</p>
            </div>
            <div>
              <Label>Generated Persona</Label>
              <p className="text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">{generatedAgentDetails.agentPersona}</p>
            </div>
            <div>
              <Label>Sample Greeting</Label>
              <p className="text-sm p-2 bg-muted rounded-md">{generatedAgentDetails.agentGreeting}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
