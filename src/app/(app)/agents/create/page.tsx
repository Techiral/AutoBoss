
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
import { Loader2, Bot } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; 
import { cn } from "@/lib/utils";

const formSchema = z.object({
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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please log in to create a chatbot.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setIsLoading(true);
    setGeneratedAgentDetails(null);
    try {
      const agentDescription = `Chatbot Name/Purpose for Business: ${data.name}\nIntended Role for the Business: ${data.role}\nDesired Personality & Tone: ${data.personality}`;
      const aiResult = await createAgent({ agentDescription });
      setGeneratedAgentDetails(aiResult);
      
      const agentDataForContext: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'flow' | 'userId'> = {
        name: data.name, 
        description: `Role: ${data.role}. Personality: ${data.personality}. Ideal for business websites.`, 
        role: data.role,
        personality: data.personality,
        generatedName: aiResult.agentName,
        generatedPersona: aiResult.agentPersona,
        generatedGreeting: aiResult.agentGreeting,
      };
      
      const newAgent = await addAgentToContext(agentDataForContext);

      if (newAgent) {
        toast({
          title: "Chatbot Base Created!",
          description: `Chatbot "${aiResult.agentName}" is ready. Next, train it with specific business data for your client. Redirecting...`,
        });
        router.push(`/agents/${newAgent.id}/knowledge`); 
      }
    } catch (error: any) {
      console.error("Error creating chatbot:", error);
      const errorMessage = error.message || "Failed to create chatbot. Please try again.";
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
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}> <Bot className="w-6 h-6 sm:w-7 sm:h-7"/>Step 1: Define Your New Business Chatbot</CardTitle>
          <CardDescription className="text-sm">
            Tell us about the chatbot you want to build for a business. AutoBoss will help generate its core personality and a friendly greeting. 
            You'll train it with specific business data in the next step to make it an expert for your client.
            <br />
            <span className="text-xs text-muted-foreground">Chatbot data is stored securely, associated with your account.</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-1.5">
              <Label htmlFor="name">Chatbot Name / Business Purpose</Label>
              <Input id="name" placeholder="e.g., 'Acme Corp Support Bot', 'Website Lead Qualifier for 'Dental Clinic X'" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Role & Objectives for the Business</Label>
              <Textarea id="role" placeholder="e.g., 'Answer customer questions about Acme Corp's products', 'Collect contact info from potential patients and explain services'" {...register("role")} rows={3} />
              {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="personality">Desired Personality & Tone</Label>
              <Textarea id="personality" placeholder="e.g., 'Friendly and helpful for a local bakery', 'Professional and concise for a law firm'" {...register("personality")} rows={3} />
              {errors.personality && <p className="text-xs text-destructive">{errors.personality.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="p-4 sm:p-6">
            <Button type="submit" disabled={isLoading} className={cn("w-full", "btn-gradient-primary")}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? "Creating Chatbot..." : "Create Chatbot & Generate Details"}
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
              <Label className="text-xs font-semibold">Suggested Chatbot Name</Label>
              <p className="text-sm p-2 bg-muted rounded-md mt-1">{generatedAgentDetails.agentName}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold">Suggested Persona (How it talks)</Label>
              <p className="text-sm p-2 bg-muted rounded-md whitespace-pre-wrap mt-1">{generatedAgentDetails.agentPersona}</p>
            </div>
            <div>
              <Label className="text-xs font-semibold">Sample Greeting (How it starts a chat)</Label>
              <p className="text-sm p-2 bg-muted rounded-md mt-1">{generatedAgentDetails.agentGreeting}</p>
            </div>
            <p className="text-xs text-muted-foreground italic">You can further refine these details in the 'Personality' section for this chatbot.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
