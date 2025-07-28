
"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUp, Upload, FileText, LinkIcon, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Agent, KnowledgeItem } from "@/lib/types";
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { createAgent, CreateAgentOutput } from "@/ai/flows/agent-creation";
import { extractKnowledge } from "@/ai/flows/knowledge-extraction";
import { processUrl } from "@/ai/flows/url-processor";
import { useAppContext } from "./(app)/layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import Papa from 'papaparse';

pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;

const SESSION_STORAGE_KEY = 'agentBuilderDraft';

const convertAgentTimestamps = (agentData: any): Agent => {
  const newAgent = { ...agentData };
  if (newAgent.createdAt && newAgent.createdAt.toDate) {
    newAgent.createdAt = newAgent.createdAt.toDate().toISOString();
  }
  if (newAgent.sharedAt && newAgent.sharedAt.toDate) {
    newAgent.sharedAt = newAgent.sharedAt.toDate().toISOString();
  }
  return newAgent as Agent;
};

const builderFormSchema = z.object({
  prompt: z.string().min(10, "Please describe the agent you want to build in more detail.").max(500),
});

type BuilderFormData = z.infer<typeof builderFormSchema>;

type KnowledgeSource = {
  type: 'file';
  fileName: string;
  fileDataUri: string; // Store as Data URI to survive session storage
  isPreStructured: boolean;
} | {
  type: 'text';
  text: string;
  fileName: string;
} | {
  type: 'url';
  url: string;
};

function AgentShowcaseCard({ agent }: { agent: Agent }) {
  return (
    <div className="group">
      <Link href={`/chat/${agent.id}`} target="_blank">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted border border-border group-hover:opacity-80 transition-opacity">
          <Image
            src={agent.agentImageUrl || "https://placehold.co/400x300.png"}
            alt={agent.generatedName || "Agent Image"}
            width={400}
            height={300}
            className="h-full w-full object-cover"
            data-ai-hint="abstract technology"
          />
        </div>
      </Link>
      <div className="mt-2">
        <h3 className="text-sm font-medium text-foreground truncate">{agent.generatedName || agent.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{agent.showcaseMetrics?.queriesHandled || 0} Interactions</p>
          <Badge variant="secondary" className="text-xs capitalize">{agent.agentType || "Chat"}</Badge>
        </div>
      </div>
    </div>
  );
}

function csvToStructuredText(csvString: string, fileName: string): string {
  const parseResult = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
  });
  if (parseResult.errors.length > 0) return `Could not fully parse CSV: ${fileName}.`;
  if (!parseResult.data || parseResult.data.length === 0) return `Empty CSV file: ${fileName}.`;
  let textRepresentation = `Content of CSV file "${fileName}":\n\n`;
  parseResult.data.forEach((row, index) => {
    const headers = Object.keys(row);
    if (headers.length === 0) return;
    const firstHeader = headers[0];
    const firstValue = row[firstHeader];
    let entryPreamble = `Entry ${index + 1}`;
    if (firstHeader && firstValue && firstValue.trim() !== "") {
      entryPreamble = `Details for ${firstHeader.trim()} "${firstValue.trim()}" (Entry ${index + 1})`;
    }
    textRepresentation += `${entryPreamble}:\n`;
    const rowDetails = headers.map(header => `  - The ${header.trim()} is "${(row[header] || 'N/A').trim()}".`);
    textRepresentation += rowDetails.join("\n") + "\n\n";
  });
  return textRepresentation.trim();
}

export default function VibeBuilderHomepage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingKnowledge, setIsProcessingKnowledge] = useState(false);
  const [publicAgents, setPublicAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [knowledgeSource, setKnowledgeSource] = useState<KnowledgeSource | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);

  const [pastedText, setPastedText] = useState("");
  const [urlInput, setUrlInput] = useState("");

  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { addAgent: addAgentToContext, addKnowledgeItem } = useAppContext();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<BuilderFormData>({
    resolver: zodResolver(builderFormSchema),
  });

  useEffect(() => {
    try {
      const draftJson = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (draftJson) {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        const draft = JSON.parse(draftJson);
        if (draft.prompt) setValue("prompt", draft.prompt);
        if (draft.knowledgeSource) setKnowledgeSource(draft.knowledgeSource);
        if (draft.isPublic) setIsPublic(draft.isPublic);
        toast({ title: "Draft Restored", description: "Your previous agent draft has been loaded." });
      }
    } catch (e) {
      console.error("Failed to parse or restore agent draft from session storage", e);
    }
  }, [setValue, toast]);

  useEffect(() => {
    async function fetchPublicAgents() {
      try {
        const agentsRef = collection(db, 'agents');
        const q = query(agentsRef, where('isPubliclyShared', '==', true));
        const querySnapshot = await getDocs(q);
        const agents: Agent[] = [];
        querySnapshot.forEach((doc) => {
          agents.push(convertAgentTimestamps({ id: doc.id, ...doc.data() }));
        });
        setPublicAgents(agents.sort((a,b) => (b.showcaseMetrics?.queriesHandled || 0) - (a.showcaseMetrics?.queriesHandled || 0)));
      } catch (error) {
        console.error("Error fetching public agents:", error);
        toast({ title: "Error", description: "Could not load community agents.", variant: "destructive" });
      } finally {
        setIsLoadingAgents(false);
      }
    }
    fetchPublicAgents();
  }, [toast]);

  const handleSetFileSource = async (file: File | null) => {
    if (!file) return;
    setIsProcessingKnowledge(true);
    try {
      const fileDataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const isPreStructured = file.name.toLowerCase().endsWith('.csv');
      setKnowledgeSource({ type: 'file', fileName: file.name, fileDataUri, isPreStructured });
      toast({ title: "File Attached", description: `${file.name} is ready.` });
      setIsFileDialogOpen(false);
    } catch (e) {
      toast({ title: "Error", description: "Could not read file.", variant: "destructive" });
    } finally {
      setIsProcessingKnowledge(false);
    }
  };

  const handleSetTextSource = () => {
    if (!pastedText.trim()) return;
    setKnowledgeSource({ type: 'text', text: pastedText, fileName: `Pasted Text - ${new Date().toLocaleTimeString()}` });
    setIsTextDialogOpen(false);
    toast({ title: "Text Content Added", description: `Ready to be used for agent creation.` });
  };

  const handleSetUrlSource = () => {
    if (!urlInput.trim()) return;
    let validUrl = urlInput;
    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      validUrl = `https://${urlInput}`;
    }
    setKnowledgeSource({ type: 'url', url: validUrl });
    setIsUrlDialogOpen(false);
    toast({ title: "URL Added", description: `Agent will learn from ${validUrl}.` });
  };

  const processAndAddKnowledge = async (agentId: string, source: KnowledgeSource) => {
    let fileName: string = "Knowledge";
    let documentDataUri: string;
    let isPreStructured = false;

    try {
      if (source.type === 'file') {
        fileName = source.fileName;
        isPreStructured = source.isPreStructured;
        const fileResponse = await fetch(source.fileDataUri);
        const blob = await fileResponse.blob();
        
        if (isPreStructured) {
            const textContent = await blob.text();
            const structuredText = csvToStructuredText(textContent, source.fileName);
            documentDataUri = `data:text/plain;base64,${Buffer.from(structuredText).toString('base64')}`;
        } else if (fileName.toLowerCase().endsWith('.pdf')) {
            const arrayBuffer = await blob.arrayBuffer();
            const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let textContent = "";
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                textContent += (await page.getTextContent()).items.map(item => 'str' in item ? item.str : '').join(' ');
            }
            documentDataUri = `data:text/plain;base64,${Buffer.from(textContent).toString('base64')}`;
        } else if (fileName.toLowerCase().endsWith('.docx')) {
            const arrayBuffer = await blob.arrayBuffer();
            const { value } = await mammoth.extractRawText({ arrayBuffer });
            documentDataUri = `data:text/plain;base64,${Buffer.from(value).toString('base64')}`;
        } else {
             documentDataUri = source.fileDataUri;
        }
      } else if (source.type === 'text') {
        fileName = source.fileName;
        documentDataUri = `data:text/plain;base64,${Buffer.from(source.text).toString('base64')}`;
      } else { // URL
        fileName = source.url;
        const urlResult = await processUrl({ url: source.url });
        documentDataUri = `data:text/plain;base64,${Buffer.from(urlResult.extractedText).toString('base64')}`;
        fileName = urlResult.title || fileName;
      }

      const knowledgeResult = await extractKnowledge({ documentDataUri, isPreStructuredText: isPreStructured });
      
      const newKnowledgeItem: KnowledgeItem = {
        id: Date.now().toString(),
        fileName: fileName,
        uploadedAt: new Date().toISOString(),
        summary: knowledgeResult.summary,
        keywords: knowledgeResult.keywords,
      };

      await addKnowledgeItem(agentId, newKnowledgeItem);
      toast({ title: "Knowledge Added!", description: `Agent has been successfully trained with "${fileName}".`});
      return true;
    } catch (error: any) {
       console.error("Error processing knowledge source:", error);
       toast({ title: "Knowledge Training Failed", description: `Could not process "${fileName}". Error: ${error.message}`, variant: "destructive" });
       return false;
    }
  };

  const onSubmit: SubmitHandler<BuilderFormData> = async (data) => {
    if (!currentUser) {
      const draft = JSON.stringify({ prompt: data.prompt, knowledgeSource, isPublic });
      sessionStorage.setItem(SESSION_STORAGE_KEY, draft);
      router.push('/login?redirect=/');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const agentDescriptionForAI = `Create an AI agent based on this user prompt: "${data.prompt}" ${knowledgeSource ? 'It should be knowledgeable about the attached document.' : ''}`;
      
      const aiResult = await createAgent({
        agentDescription: agentDescriptionForAI,
        agentType: 'chat',
      });

      const tempClientId = "default_client"; 
      const tempClientName = "Default Client";

      const agentDataForContext: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'userId' | 'clientId' | 'clientName'> = {
        name: `Agent: ${data.prompt.substring(0, 20)}...`,
        description: data.prompt,
        agentType: 'chat',
        primaryLogic: knowledgeSource ? 'rag' : 'prompt',
        isPubliclyShared: isPublic,
        sharedAt: isPublic ? Timestamp.now() : null,
        generatedName: aiResult.agentName,
        generatedPersona: aiResult.agentPersona,
        generatedGreeting: aiResult.agentGreeting,
      };

      const newAgent = await addAgentToContext(agentDataForContext, tempClientId, tempClientName);

      if (newAgent) {
        toast({ title: "Agent Created!", description: "Now processing knowledge source if provided." });
        
        if (knowledgeSource) {
          const knowledgeSuccess = await processAndAddKnowledge(newAgent.id, knowledgeSource);
          if (!knowledgeSuccess) {
            toast({ title: "Partial Success", description: `Agent was created, but knowledge training failed. You can add it later in the agent's settings.`, variant: "destructive" });
          }
        }
        
        router.push(`/agents/${newAgent.id}/personality`);
      } else {
         throw new Error("Could not create agent in the database. You may need to create a client first in the dashboard.");
      }

    } catch (error: any) {
       toast({ title: "Agent Creation Failed", description: error.message || "An unknown error occurred.", variant: "destructive" });
       setIsLoading(false);
    } 
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-full max-w-screen-xl items-center justify-between px-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo className="h-7" />
          </Link>
          <UserNav />
        </div>
      </header>

      <main className="container mx-auto max-w-screen-xl px-4 pt-24 pb-12">
        <div className="text-center">
          <h1 className="font-headline text-4xl sm:text-5xl font-bold">Build something <span className="text-primary">Lovable</span></h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground">
            Create agents, apps, and websites by chatting with AI
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="relative">
              <Textarea
                id="prompt"
                placeholder="Ask AgentVerse to create..."
                {...register("prompt")}
                rows={3}
                className="resize-none rounded-lg border-2 border-border bg-card p-4 pr-20 text-base focus-visible:ring-primary"
              />
              <Button type="submit" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <ArrowUp />}
                <span className="sr-only">Submit</span>
              </Button>
            </div>
            {errors.prompt && <p className="text-xs text-destructive mt-2">{errors.prompt.message}</p>}
          </form>

          <div className="mt-3 flex items-center gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setIsFileDialogOpen(true)}><Upload size={14} /> Attach</Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setIsTextDialogOpen(true)}><FileText size={14} /> Paste Text</Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setIsUrlDialogOpen(true)}><LinkIcon size={14} /> From URL</Button>
            <Button variant="outline" size="sm" className="text-xs gap-1.5" data-state={isPublic ? 'active' : 'inactive'} onClick={() => setIsPublic(!isPublic)}><Globe size={14} /> Public</Button>
          </div>
          {knowledgeSource && (
              <div className="mt-2 text-xs text-muted-foreground p-2 bg-secondary rounded-md">
                <strong>Knowledge Source Ready:</strong> {
                  knowledgeSource.type === 'file' ? knowledgeSource.fileName : 
                  knowledgeSource.type === 'text' ? 'Pasted Text' : 
                  knowledgeSource.url
                }. This will be used when you create the agent.
              </div>
            )}
        </div>
        
        <div className="mt-16 sm:mt-20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">From the Community</h2>
            <Button variant="link" asChild>
              <Link href="/showcase">View All</Link>
            </Button>
          </div>
          
          <div className="mt-6">
            {isLoadingAgents ? (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-[4/3] w-full rounded-lg bg-muted animate-pulse"></div>
                    <div className="h-4 w-3/4 rounded bg-muted animate-pulse"></div>
                    <div className="h-3 w-1/2 rounded bg-muted animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : publicAgents.length > 0 ? (
               <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {publicAgents.slice(0, 4).map((agent) => (
                  <AgentShowcaseCard key={agent.id} agent={agent}/>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <p>No community agents have been shared yet.</p>
                <p className="text-xs mt-1">Be the first to showcase your creation!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* File Upload Dialog */}
      <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach Knowledge File</DialogTitle>
            <DialogDescription>Upload a document for your agent to learn from. Supported: PDF, DOCX, TXT, CSV.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="knowledge-file">Document</Label>
            <Input id="knowledge-file" type="file" onChange={(e) => handleSetFileSource(e.target.files?.[0] || null)} disabled={isProcessingKnowledge} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="secondary" disabled={isProcessingKnowledge}>Cancel</Button></DialogClose>
            {isProcessingKnowledge && <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Paste Text Dialog */}
      <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paste Text Content</DialogTitle>
            <DialogDescription>Paste any text, like an FAQ or product details, for your agent to learn.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Paste your content here..."
              rows={10}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
          </div>
          <DialogFooter>
             <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
             <Button onClick={handleSetTextSource} disabled={!pastedText.trim()}>Add Text</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* From URL Dialog */}
      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Train from Website</DialogTitle>
            <DialogDescription>Enter a URL and the agent will learn from the content on that page.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="url-input">Website URL</Label>
            <Input id="url-input" type="url" placeholder="https://example.com" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
            <Button onClick={handleSetUrlSource} disabled={!urlInput.trim()}>Add URL</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
