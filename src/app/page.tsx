
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
import { useRouter } from "next/navigation";
import { Loader2, Bot, MessageSquare, Phone, Brain, DatabaseZap, ArrowDownCircle, ArrowUpCircle, HelpCircle, Lightbulb, Users, Briefcase, AlertTriangle, Mic, ExternalLink, Settings2, Handshake, PhoneCall, PhoneForwarded, Sparkles, Upload, Link as LinkIcon, TextQuote, FileWarning } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { AgentSchema, AgentType, AgentDirection, AgentToneSchema } from "@/lib/types";
import { Logo } from "@/components/logo";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


const builderFormSchema = z.object({
  name: z.string().min(3, "An agent name or concept is required.").max(100),
  task: z.string().min(10, "Please describe the agent's task in at least 10 characters.").max(1000),
  agentType: z.custom<AgentType>().default("chat"),
  direction: z.custom<AgentDirection>().default("inbound"),
  agentTone: AgentToneSchema.default("neutral"),
  knowledgeUrl: z.string().url().optional().or(z.literal("")),
  knowledgeText: z.string().optional(),
});

type BuilderFormData = z.infer<typeof builderFormSchema>;

export default function AgentBuilderHomepage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useAuth();

  const { control, register, handleSubmit, formState: { errors }, watch } = useForm<BuilderFormData>({
    resolver: zodResolver(builderFormSchema),
    defaultValues: {
      name: "",
      task: "",
      agentType: "chat",
      direction: "inbound",
      agentTone: "neutral",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const onSubmit: SubmitHandler<BuilderFormData> = async (data) => {
    if (!currentUser) {
      toast({
        title: "Please Sign In",
        description: "You need to be logged in to build an agent. Your configuration will be saved.",
        action: <Button onClick={() => router.push('/login')}>Login</Button>
      });
      // Here you would ideally save the form state to local storage
      // and retrieve it after login. For now, we just prompt.
      return;
    }

    setIsLoading(true);
    toast({ title: "Building Agent...", description: "Please wait while we set up your new AI agent." });
    
    // In a real implementation, you would now pass this data
    // to a comprehensive agent creation flow.
    // For now, we simulate the process and then redirect.
    console.log("Form Data Submitted:", {
        ...data,
        fileName: selectedFile?.name,
    });

    // Simulate creation delay
    setTimeout(() => {
        setIsLoading(false);
        // This would be the new agent's ID from the creation flow
        const newAgentId = "new-agent-placeholder-id"; 
        toast({ title: "Agent Created!", description: "Redirecting you to your new agent's dashboard." });
        router.push(`/agents/${newAgentId}/personality`);
    }, 3000);
  };

  return (
    <TooltipProvider>
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
            <Logo className="h-10 mx-auto mb-4" />
            <h1 className="font-headline text-3xl sm:text-4xl font-bold text-primary">Build Your AI Agent</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Describe your agent's task, give it knowledge, and bring it to life in minutes.
            </p>
        </div>

        <Card className="shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="p-4 sm:p-6 space-y-6">
              
              <div className="space-y-2">
                <Label htmlFor="name" className="text-lg font-semibold flex items-center"><Sparkles className="w-5 h-5 mr-2 text-primary" /> What is your agent's name or concept?</Label>
                <Input id="name" placeholder="e.g., 'Website Support Bot', 'Lead Qualifier for Real Estate'" {...register("name")} className="text-base" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="task" className="text-lg font-semibold">And what is its primary task?</Label>
                <Textarea
                  id="task"
                  placeholder="e.g., 'Answer questions about our products and services based on the provided documents. If it can't answer, it should ask the user for their email to have a human follow up.'"
                  {...register("task")}
                  rows={4}
                  className="text-base"
                />
                {errors.task && <p className="text-xs text-destructive">{errors.task.message}</p>}
              </div>
              
              <div className="space-y-4">
                  <Label className="text-lg font-semibold flex items-center"><Brain className="w-5 h-5 mr-2 text-primary" /> Give your agent knowledge</Label>
                  <div className="grid gap-4">
                     {/* File Upload */}
                     <div className="space-y-1.5">
                        <Label htmlFor="document" className="text-sm font-medium flex items-center gap-2"><Upload className="w-4 h-4" />Upload a file</Label>
                        <Input id="document" type="file" onChange={handleFileChange} accept=".txt,.pdf,.md,.docx,.json,.csv,.html,.htm" disabled={isLoading}/>
                        {selectedFile && <p className="text-xs text-muted-foreground">Selected: {selectedFile.name}</p>}
                    </div>
                    {/* URL */}
                    <div className="space-y-1.5">
                        <Label htmlFor="knowledgeUrl" className="text-sm font-medium flex items-center gap-2"><LinkIcon className="w-4 h-4" />Add a website URL</Label>
                        <Input id="knowledgeUrl" placeholder="https://example.com/about-us" {...register("knowledgeUrl")} disabled={isLoading}/>
                         {errors.knowledgeUrl && <p className="text-xs text-destructive">{errors.knowledgeUrl.message}</p>}
                    </div>
                    {/* Paste Text */}
                    <div className="space-y-1.5">
                         <Label htmlFor="knowledgeText" className="text-sm font-medium flex items-center gap-2"><TextQuote className="w-4 h-4" />Or, paste text directly</Label>
                        <Textarea id="knowledgeText" placeholder="Paste product details, FAQs, or any other information here..." {...register("knowledgeText")} rows={5} disabled={isLoading}/>
                    </div>
                  </div>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold flex items-center"><Settings2 className="w-5 h-5 mr-2 text-primary" /> Configure its behavior</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="agentType">Type</Label>
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
                    <div className="space-y-1.5">
                        <Label htmlFor="agentTone">Tone</Label>
                        <Controller name="agentTone" control={control} render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}><SelectTrigger id="agentTone"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="neutral">Neutral</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="witty">Witty</SelectItem>
                            </SelectContent>
                            </Select>
                        )} />
                    </div>
                </div>
              </div>

            </CardContent>
            <CardFooter className="p-4 sm:p-6">
              <Button type="submit" disabled={isLoading} className="w-full text-lg py-6">
                {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Bot className="mr-2 h-6 w-6" />}
                {isLoading ? "Building..." : "Build My Agent"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        <div className="text-center mt-6">
            <p className="text-xs text-muted-foreground">
                Already have an account? <Button variant="link" asChild className="p-0 h-auto text-xs"><Link href="/login">Log In</Link></Button>
            </p>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
}
