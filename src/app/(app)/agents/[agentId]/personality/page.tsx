
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
import { useParams } from "next/navigation"; 
import { useAppContext } from "../../../layout"; 
import type { Agent, AgentToneType } from "@/lib/types"; 
import { AgentToneSchema } from "@/lib/types"; 
import { Loader2, Smile, Settings, HelpCircle, Image as ImageIcon, MessageCircle } from "lucide-react"; 
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; 
import { storage } from '@/lib/firebase'; // Import Firebase Storage
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import Image from 'next/image';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const MAX_IMAGE_SIZE_MB = 2;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name too long"),
  role: z.string().min(10, "Role description must be at least 10 characters").max(1000, "Role description too long (max 1000 chars)"),
  personality: z.string().min(10, "Personality description must be at least 10 characters").max(1000, "Personality description too long (max 1000 chars)"),
  agentTone: AgentToneSchema.default("neutral"),
  ogDescription: z.string().max(300, "Social media description max 300 chars.").optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function PersonalityPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<Agent | null | undefined>(undefined); 
  const [generatedDetails, setGeneratedDetails] = useState<CreateAgentOutput | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const params = useParams();
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const { getAgent, updateAgent, isLoadingAgents, currentUser } = useAppContext(); // Added currentUser

  const { control, register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({ 
    resolver: zodResolver(formSchema),
    defaultValues: { 
        name: "",
        role: "",
        personality: "",
        agentTone: "neutral",
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
        setValue("ogDescription", agent.ogDescription || '');
        if (agent.agentImageUrl) {
          setImagePreview(agent.agentImageUrl);
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
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast({ title: "Image Too Large", description: `Please select an image smaller than ${MAX_IMAGE_SIZE_MB}MB.`, variant: "destructive" });
        return;
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast({ title: "Invalid Image Type", description: "Please select a JPG, PNG, WEBP, or GIF image.", variant: "destructive" });
        return;
      }
      setSelectedImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const removeImage = async () => {
    if (!currentAgent?.agentImageUrl || !currentAgent?.userId || !currentAgent?.id) return;
    setIsUploadingImage(true); // Use same loading state
    try {
      const imagePath = `agent_images/${currentAgent.userId}/${currentAgent.id}/profile_image`;
      const imageToDeleteRef = storageRef(storage, imagePath);
      await deleteObject(imageToDeleteRef);
      
      updateAgent({ ...currentAgent, agentImageUrl: undefined });
      setImagePreview(null);
      setSelectedImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast({ title: "Image Removed", description: "Agent image has been removed." });
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        // If not found in storage, just clear it from DB and UI
        updateAgent({ ...currentAgent, agentImageUrl: undefined });
        setImagePreview(null);
        setSelectedImageFile(null);
        toast({ title: "Image Cleared", description: "Agent image reference cleared." });
      } else {
        console.error("Error removing image:", error);
        toast({ title: "Error Removing Image", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsUploadingImage(false);
    }
  };


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!currentAgent || !currentUser) return;

    setIsLoading(true);
    let agentImageUrl = currentAgent.agentImageUrl; // Keep existing if no new file

    if (selectedImageFile) {
      setIsUploadingImage(true);
      try {
        const imagePath = `agent_images/${currentUser.uid}/${currentAgent.id}/profile_image`;
        const imageToUploadRef = storageRef(storage, imagePath);
        await uploadBytes(imageToUploadRef, selectedImageFile);
        agentImageUrl = await getDownloadURL(imageToUploadRef);
        setSelectedImageFile(null); // Clear after successful upload
        toast({ title: "Image Uploaded", description: "Agent image updated successfully." });
      } catch (error: any) {
        console.error("Error uploading image:", error);
        toast({ title: "Image Upload Failed", description: error.message, variant: "destructive" });
        setIsUploadingImage(false);
        setIsLoading(false);
        return; // Stop submission if image upload fails
      } finally {
        setIsUploadingImage(false);
      }
    }
    
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
        generatedName: result.agentName,
        generatedPersona: result.agentPersona,
        generatedGreeting: result.agentGreeting,
        agentImageUrl: agentImageUrl,
        ogDescription: data.ogDescription || undefined,
      };
      updateAgent({ ...currentAgent, ...updatedAgentData });

      toast({
        title: "Personality & Branding Updated!",
        description: `Agent "${result.agentName}" details have been successfully updated.`,
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}>
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
                  <Select onValueChange={field.onChange} value={field.value || "neutral"}>
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
             <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}>
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
                        <TooltipContent><p>Upload an image to represent this agent (e.g., logo, character). Recommended: square, &lt; {MAX_IMAGE_SIZE_MB}MB.</p></TooltipContent>
                    </Tooltip>
                </Label>
                {imagePreview && (
                  <div className="my-2 relative w-32 h-32 sm:w-40 sm:h-40 rounded-md overflow-hidden border">
                    <Image src={imagePreview} alt="Agent image preview" layout="fill" objectFit="cover" />
                  </div>
                )}
                <Input 
                    id="agentImage" 
                    type="file" 
                    accept={ALLOWED_IMAGE_TYPES.join(',')}
                    onChange={handleImageFileChange}
                    ref={fileInputRef}
                    className="text-xs"
                />
                {currentAgent.agentImageUrl && !selectedImageFile && (
                     <Button type="button" variant="outline" size="sm" onClick={removeImage} disabled={isUploadingImage || isLoading} className="text-xs mt-1">
                        {isUploadingImage ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin"/> : null}
                        Remove Current Image
                    </Button>
                )}
                 <p className="text-xs text-muted-foreground">Upload a square image (e.g., 400x400px). Max {MAX_IMAGE_SIZE_MB}MB. JPG, PNG, GIF, WEBP.</p>
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
          <Button type="submit" disabled={isLoading || isUploadingImage} className={cn("w-full sm:w-auto", "btn-gradient-primary")}>
            {(isLoading || isUploadingImage) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {(isLoading || isUploadingImage) ? "Saving Changes..." : "Save All Changes & Regenerate Details"}
          </Button>
        </div>
      </div>
    </form>
    </TooltipProvider>
  );
}
