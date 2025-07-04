
"use client";

import { useState, useEffect, useRef } from "react";
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
import { generateAgentImage } from "@/ai/flows/image-generation-flow";
import { useParams } from "next/navigation"; 
import { useAppContext } from "../../../layout"; 
import type { Agent, AgentToneType } from "@/lib/types"; 
import { AgentToneSchema } from "@/lib/types"; 
import { Loader2, Smile, Settings, HelpCircle, Image as ImageIcon, MessageCircle, AlertTriangle, Mic, Sparkles } from "lucide-react"; 
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; 
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const MAX_TARGET_SIZE_BYTES = 100 * 1024; // 100KB target size
const MAX_DIMENSION = 800; // Max width/height for resizing
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']; // GIFs not supported by canvas resizing

const availableVoices = [
  { id: 'default', name: 'Default Voice (Nova)' },
  { id: 'alloy', name: 'Alloy' },
  { id: 'echo', name: 'Echo' },
  { id: 'fable', name: 'Fable' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'shimmer', name: 'Shimmer' },
];

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name too long"),
  role: z.string().min(10, "Role description must be at least 10 characters").max(1000, "Role description too long (max 1000 chars)"),
  personality: z.string().min(10, "Personality description must be at least 10 characters").max(1000, "Personality description too long (max 1000 chars)"),
  agentTone: AgentToneSchema.default("neutral"),
  voiceName: z.string().optional(),
  ogDescription: z.string().max(300, "Social media description max 300 chars.").optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function PersonalityPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null | undefined>(undefined); 
  const [generatedDetails, setGeneratedDetails] = useState<CreateAgentOutput | null>(null);
  const [selectedImageDataUri, setSelectedImageDataUri] = useState<string | undefined>(undefined);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const { toast } = useToast();
  const params = useParams();
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const { getAgent, updateAgent, isLoadingAgents } = useAppContext();

  const { control, register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({ 
    resolver: zodResolver(formSchema),
    defaultValues: { 
        name: "",
        role: "",
        personality: "",
        agentTone: "neutral",
        voiceName: "default",
        ogDescription: "",
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
        setValue("voiceName", agent.voiceName || "default");
        setValue("ogDescription", agent.ogDescription || '');
        if (agent.agentImageUrl) {
          setCurrentImageUrl(agent.agentImageUrl);
        }
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


  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast({ title: "Invalid Image Type", description: "Please select a JPG, PNG, or WEBP image.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          toast({ title: "Image Error", description: "Could not process the image. Please try another.", variant: "destructive" });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        while (dataUrl.length > MAX_TARGET_SIZE_BYTES && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl.length > MAX_TARGET_SIZE_BYTES) {
          toast({
            title: "Image Still Too Large",
            description: `After compression, the image is still too large. Please try a different or smaller file.`,
            variant: "destructive",
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        setSelectedImageDataUri(dataUrl);
        setCurrentImageUrl(dataUrl); 
        toast({ title: "Image Ready", description: "Image has been resized and is ready to be saved." });
      };
      img.onerror = () => {
        toast({ title: "Image Error", description: "Could not load the selected file as an image.", variant: "destructive"});
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  const removeImage = async () => {
    if (!currentAgent) return;
    if (!currentImageUrl) {
        toast({ title: "No Image to Remove", description: "There is no saved image for this agent." });
        return;
    }
    
    setIsLoading(true);
    try {
      await updateAgent({ ...currentAgent, agentImageUrl: null });
      setSelectedImageDataUri(undefined);
      setCurrentImageUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: "Image Removed", description: "Agent image has been removed. Don't forget to save." });
    } catch (error: any) {
      console.error("Error removing image:", error);
      toast({ title: "Error Removing Image", description: error.message || "Could not remove image.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!currentAgent) return;
    setIsGeneratingImage(true);
    const data = watch(); 
    const imagePrompt = `Minimalist, modern, and professional logo for an AI agent. Name: "${data.name}". Role: "${data.role}". Personality: "${data.personality}". Style: clean vector art, suitable for a social media profile picture, high contrast.`;
    
    try {
        const imageDataUri = await generateAgentImage(imagePrompt);
        if (imageDataUri) {
            setSelectedImageDataUri(imageDataUri);
            setCurrentImageUrl(imageDataUri);
            toast({ title: "AI Image Generated!", description: "A new image has been generated. Don't forget to save your changes." });
        } else {
            throw new Error("The image generation service did not return an image.");
        }
    } catch(error: any) {
        toast({ title: "Image Generation Failed", description: error.message || "Could not generate an image.", variant: "destructive" });
    } finally {
        setIsGeneratingImage(false);
    }
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!currentAgent) return;

    setIsLoading(true);
    
    try {
      const agentDescriptionForAI = `Name: ${data.name}\nRole: ${data.role}\nPersonality: ${data.personality}\nTone: ${data.agentTone}`;
      const result = await createAgent({ 
        agentDescription: agentDescriptionForAI, 
        agentType: currentAgent.agentType, 
        direction: currentAgent.direction,
        agentTone: data.agentTone as AgentToneType, 
      });
      setGeneratedDetails(result);
      
      const updatedAgentData: Partial<Agent> = { 
        name: data.name,
        description: `Purpose: ${currentAgent.agentPurpose || 'N/A'}. Type: ${currentAgent.agentType}. Logic: ${currentAgent.primaryLogic || 'N/A'}. Role: ${data.role}. Personality: ${data.personality}.`,
        role: data.role,
        personality: data.personality,
        agentTone: data.agentTone as AgentToneType, 
        voiceName: data.voiceName === 'default' ? null : data.voiceName,
        generatedName: result.agentName,
        generatedPersona: result.agentPersona,
        generatedGreeting: result.agentGreeting,
        ogDescription: data.ogDescription || null,
        agentImageUrl: selectedImageDataUri || currentImageUrl,
      };

      await updateAgent({ ...currentAgent, ...updatedAgentData });
      
      setSelectedImageDataUri(undefined); 
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast({
        title: "Personality & Branding Updated!",
        description: `Agent "${result.agentName}" details have been successfully updated.`,
      });
    } catch (error: any) {
      console.error("Error updating personality:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update personality. Please try again.",
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
            <Loader2 className="h-8 w-8 sm:h-10 sm:h-10 animate-spin" />
            <p className="text-xs text-muted-foreground mt-2">Fetching personality details...</p>
        </CardContent>
      </Card>
    )
  }
  if (!currentAgent) { 
      return null; 
  }

  const getButtonText = () => {
    if (isLoading) return "Saving Details...";
    return "Save All Changes & Regenerate Details";
  }

  return (
    <TooltipProvider>
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-headline text-xl sm:text-2xl flex items-center gap-2">
                <Settings className="w-6 h-6"/> Edit Agent Personality & Core Details
            </CardTitle>
            <CardDescription className="text-sm">
              Refine your agent's name, role, personality, tone, and how it introduces itself.
            </CardDescription>
          </CardHeader>
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

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="agentTone" className="flex items-center">
                    Conversational Tone
                  </Label>
                  <Controller
                    name="agentTone"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || "neutral"}>
                        <SelectTrigger id="agentTone">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="witty">Witty</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.agentTone && <p className="text-xs text-destructive">{errors.agentTone.message}</p>}
                </div>
                
                {(currentAgent.agentType === 'voice' || currentAgent.agentType === 'hybrid') && (
                    <div className="space-y-1.5">
                        <Label htmlFor="voiceName" className="flex items-center">
                            Agent Voice
                        </Label>
                         <Controller
                            name="voiceName"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value || "default"}>
                                <SelectTrigger id="voiceName">
                                  <SelectValue placeholder="Select a voice" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableVoices.map(voice => (
                                        <SelectItem key={voice.id} value={voice.id}>{voice.name}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                        {errors.voiceName && <p className="text-xs text-destructive">{errors.voiceName.message}</p>}
                    </div>
                )}
             </div>

             {(generatedDetails || (currentAgent.generatedName && currentAgent.generatedPersona)) && (
              <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t">
                  <h3 className="font-headline text-md sm:text-lg">Current AI Generated Details</h3>
                  <div>
                      <Label className="text-xs font-semibold">Generated Name (User-Facing)</Label>
                      <p className="text-sm p-2 bg-muted rounded-md mt-1">{generatedDetails?.agentName || currentAgent.generatedName}</p>
                  </div>
                  <div>
                      <Label className="text-xs font-semibold">Generated Persona (How it acts)</Label>
                      <p className="text-sm p-2 bg-muted rounded-md whitespace-pre-wrap mt-1">{generatedDetails?.agentPersona || currentAgent.generatedPersona}</p>
                  </div>
                  <div>
                      <Label className="text-xs font-semibold">Sample Greeting</Label>
                      <p className="text-sm p-2 bg-muted rounded-md mt-1">{generatedDetails?.agentGreeting || currentAgent.generatedGreeting}</p>
                  </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
           <CardHeader className="p-4 sm:p-6">
             <CardTitle className="font-headline text-xl sm:text-2xl flex items-center gap-2">
                <ImageIcon className="w-6 h-6"/> Social Sharing & Branding
            </CardTitle>
             <CardDescription className="text-sm">
                Customize how your agent appears when shared on social media.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-1.5">
                <Label htmlFor="agentImage" className="flex items-center">
                    Agent Image (for Social Sharing)
                    <Tooltip>
                        <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                        <TooltipContent side="top">
                            <p className="max-w-xs">Upload an image (e.g., logo) or generate one with AI. It will be auto-resized for fast sharing.</p>
                        </TooltipContent>
                    </Tooltip>
                </Label>
                {currentImageUrl && (
                  <div className="my-2 relative w-32 h-32 sm:w-40 sm:h-40 rounded-md overflow-hidden border">
                    <Image src={currentImageUrl} alt="Agent image preview" layout="fill" objectFit="cover" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2 items-center">
                    <Input 
                        id="agentImage" 
                        type="file" 
                        accept={ALLOWED_IMAGE_TYPES.join(',')}
                        onChange={handleImageFileChange}
                        ref={fileInputRef}
                        className="text-xs flex-1 min-w-[120px]"
                    />
                     <Button type="button" variant="outline" size="sm" onClick={handleGenerateImage} disabled={isLoading || isGeneratingImage} className="text-xs">
                        {isGeneratingImage ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin"/> : <Sparkles className="mr-1.5 h-3 w-3"/>}
                        Generate
                    </Button>
                </div>
                {currentImageUrl && (
                     <Button type="button" variant="outline" size="sm" onClick={removeImage} disabled={isLoading} className="text-xs mt-1">
                        {isLoading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin"/> : null}
                        Remove Current Image
                    </Button>
                )}
                 <Alert variant="default" className="mt-2 p-2 text-xs bg-secondary">
                    <ImageIcon className="h-3.5 w-3.5"/>
                    <AlertTitle className="text-xs font-medium">Automatic Image Resizing</AlertTitle>
                    <AlertDescription className="text-[10px]">
                        Large images will be automatically resized and compressed to under 100KB to ensure fast loading on social media.
                    </AlertDescription>
                </Alert>
            </div>
             <div className="space-y-1.5">
                <Label htmlFor="ogDescription" className="flex items-center">
                    Social Media Description
                    <Tooltip>
                        <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 ml-1.5 text-muted-foreground cursor-help"/></TooltipTrigger>
                        <TooltipContent><p>This text will be shown when the agent's link is shared (max 300 chars).</p></TooltipContent>
                    </Tooltip>
                </Label>
                <Textarea id="ogDescription" placeholder="Briefly describe what this agent does..." {...register("ogDescription")} rows={3} maxLength={300} />
                {errors.ogDescription && <p className="text-xs text-destructive">{errors.ogDescription.message}</p>}
            </div>

          </CardContent>
        </Card>

        <div className="md:col-span-3 mt-2 sm:mt-0">
          <Button type="submit" disabled={isLoading || isGeneratingImage} className="w-full sm:w-auto">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getButtonText()}
          </Button>
        </div>
      </div>
    </form>
    </TooltipProvider>
  );
}
