
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { extractKnowledge } from "@/ai/flows/knowledge-extraction";
import { processUrl } from "@/ai/flows/url-processor"; 
import { Upload, Loader2, FileText, Tag, AlertTriangle, Link as LinkIcon } from "lucide-react";
import type { KnowledgeItem, Agent } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppContext } from "../../../layout";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";

export default function KnowledgePage() {
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  
  const { toast } = useToast();
  const params = useParams();
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const { getAgent, addKnowledgeItem, isLoadingAgents } = useAppContext();
  const [currentAgent, setCurrentAgent] = useState<Agent | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoadingAgents && agentId) {
      const agent = getAgent(agentId as string);
      setCurrentAgent(agent);
    } else if (!isLoadingAgents && !agentId) {
      setCurrentAgent(null);
    }
  }, [agentId, getAgent, isLoadingAgents]);

  const knowledgeItems = currentAgent?.knowledgeItems || [];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUrlInput(""); 
    } else {
      setSelectedFile(null);
    }
  };

  const handleUrlInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(event.target.value);
    if (event.target.value) {
        setSelectedFile(null); 
        const fileInput = document.getElementById('document') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
  };

  const addKnowledgeToAgent = (fileName: string, summary: string, keywords: string[]) => {
     if (!agentId) {
        toast({ title: "Agent ID missing", description: "Cannot add knowledge without an agent context.", variant: "destructive" });
        return;
    }
    const newKnowledgeItem: KnowledgeItem = {
        id: Date.now().toString(),
        fileName: fileName,
        uploadedAt: new Date().toISOString(),
        summary: summary,
        keywords: keywords,
    };
    addKnowledgeItem(agentId, newKnowledgeItem);
    toast({
        title: "Knowledge Added!",
        description: `Successfully processed and added "${fileName}".`,
    });
  }


  const handleSubmitFile = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    
    setIsLoadingFile(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onload = async () => {
        let documentDataUri = reader.result as string;
        const originalFileMimeType = selectedFile.type;
        let effectiveMimeType = originalFileMimeType;
        const fileName = selectedFile.name.toLowerCase();

        if (!effectiveMimeType || effectiveMimeType === 'application/octet-stream') {
          if (fileName.endsWith('.txt')) effectiveMimeType = 'text/plain';
          else if (fileName.endsWith('.md')) effectiveMimeType = 'text/markdown';
          else if (fileName.endsWith('.json')) effectiveMimeType = 'application/json';
          else if (fileName.endsWith('.csv')) effectiveMimeType = 'text/csv';
          else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) effectiveMimeType = 'text/html';
        }

        if (effectiveMimeType && effectiveMimeType !== originalFileMimeType) {
          const base64Marker = ';base64,';
          const base64DataIndex = documentDataUri.indexOf(base64Marker);
          if (base64DataIndex !== -1) {
            const base64Data = documentDataUri.substring(base64DataIndex + base64Marker.length);
            documentDataUri = `data:${effectiveMimeType};base64,${base64Data}`;
          }
        }
        
        if (documentDataUri.startsWith('data:application/octet-stream')) {
            toast({
                title: "Unsupported File Type",
                description: `File "${selectedFile.name}" has a generic type not directly supported by AI. Try common text (TXT, MD, PDF) or image formats.`,
                variant: "destructive",
            });
            setIsLoadingFile(false);
            setSelectedFile(null);
            const fileInput = document.getElementById('document') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            return; 
        }
        try {
            const result = await extractKnowledge({ documentDataUri: documentDataUri });
            addKnowledgeToAgent(selectedFile.name, result.summary, result.keywords);
        } catch (extractionError: any) {
            console.error("Error extracting knowledge from file:", extractionError);
            const errorMessage = extractionError.message || `Failed to extract knowledge from "${selectedFile.name}".`;
            toast({ title: "File Extraction Error", description: errorMessage, variant: "destructive" });
        }
        setSelectedFile(null); 
        const fileInput = document.getElementById('document') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        setIsLoadingFile(false);
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
        setIsLoadingFile(false);
      };
    } catch (error) {
      console.error("Error initiating file processing:", error);
      toast({ title: "File Processing Error", description: "An unexpected error occurred.", variant: "destructive" });
      setIsLoadingFile(false);
    }
  };

  const handleProcessUrl = async () => {
    if (!urlInput.trim()) {
        toast({ title: "No URL provided", description: "Please enter a URL to process.", variant: "destructive"});
        return;
    }
    try {
        new URL(urlInput); 
    } catch (_) {
        toast({ title: "Invalid URL", description: "Please enter a valid URL (e.g., https://example.com).", variant: "destructive"});
        return;
    }

    setIsProcessingUrl(true);
    try {
        const result = await processUrl({ url: urlInput });
        let displayUrl = urlInput;
        try {
            const parsedUrl = new URL(urlInput);
            displayUrl = parsedUrl.hostname + (parsedUrl.pathname === '/' ? '' : parsedUrl.pathname);
        } catch { /* ignore */ }

        addKnowledgeToAgent(displayUrl.substring(0,100), result.summary, result.keywords); 
        setUrlInput(""); 
    } catch (error: any) {
        console.error("Error processing URL:", error);
        const errorMessage = error.message || "Failed to process the URL. The URL might be inaccessible or the content unsuitable.";
        toast({ title: "URL Processing Error", description: errorMessage, variant: "destructive" });
    } finally {
        setIsProcessingUrl(false);
    }
  };


  if (isLoadingAgents || currentAgent === undefined) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Loading Knowledge...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
          <Logo className="mb-3 h-8" />
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground mt-2">Fetching knowledge base...</p>
        </CardContent>
      </Card>
    )
  }

  if (!currentAgent) {
    return (
       <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Agent Not Found</AlertTitle>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-headline text-lg sm:text-2xl">Add Knowledge</CardTitle>
          <CardDescription className="text-sm">Upload documents or process URLs to build agent <span className="font-semibold">{currentAgent.generatedName || currentAgent.name}</span>'s knowledge.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-1.5">
                <Label htmlFor="document">Upload Document</Label>
                <Input id="document" type="file" onChange={handleFileChange} accept=".txt,.pdf,.md,.docx,.json,.csv,.html,.htm,image/png,image/jpeg" disabled={isLoadingFile || isProcessingUrl}/>
                {selectedFile && <p className="text-xs sm:text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
            </div>
            <Button onClick={handleSubmitFile} disabled={isLoadingFile || !selectedFile || isProcessingUrl} className="w-full">
                {isLoadingFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isLoadingFile ? "Processing File..." : "Extract from File"}
            </Button>

            <div className="relative my-3 sm:my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="url">Process URL</Label>
                <Input id="url" type="url" placeholder="https://example.com/article" value={urlInput} onChange={handleUrlInputChange} disabled={isProcessingUrl || isLoadingFile}/>
            </div>
            <Button onClick={handleProcessUrl} disabled={isProcessingUrl || !urlInput.trim() || isLoadingFile} className="w-full">
                {isProcessingUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                {isProcessingUrl ? "Processing URL..." : "Process URL"}
            </Button>
        </CardContent>
      </Card>

      {knowledgeItems.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-headline text-lg sm:text-xl">Knowledge Base for {currentAgent.generatedName || currentAgent.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ScrollArea className="h-[calc(100vh-350px)] sm:h-[calc(100vh-300px)] max-h-[500px] sm:max-h-[600px] pr-3 sm:pr-4"> 
              <div className="space-y-3 sm:space-y-4">
              {knowledgeItems.map(item => (
                <Card key={item.id} className="bg-muted/50">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        {item.fileName.startsWith('http') ? <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0"/> : <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0"/>} 
                        <span className="truncate text-sm sm:text-base" title={item.fileName}>{item.fileName}</span>
                    </CardTitle>
                    <CardDescription className="text-xs">Added: {new Date(item.uploadedAt).toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    {item.summary && (
                      <div>
                        <h4 className="font-semibold text-xs sm:text-sm mb-1">Summary:</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2">{item.summary}</p>
                      </div>
                    )}
                    {item.keywords && item.keywords.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-xs sm:text-sm mb-1">Keywords:</h4>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {item.keywords.map(keyword => (
                            <span key={keyword} className="text-xs bg-primary/20 text-primary-foreground px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full flex items-center">
                              <Tag className="mr-1 h-3 w-3"/>{keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
       {knowledgeItems.length === 0 && (
         <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-headline text-lg sm:text-xl">Knowledge Base Empty</CardTitle>
          </CardHeader>
           <CardContent className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px] p-4 sm:p-6">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">No documents or URLs processed yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Use the panel on the left to add knowledge.</p>
          </CardContent>
        </Card>
       )}
    </div>
  );
}
