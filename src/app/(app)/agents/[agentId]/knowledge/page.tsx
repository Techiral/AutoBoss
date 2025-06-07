
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { extractKnowledge } from "@/ai/flows/knowledge-extraction";
import { processUrlContent } from "@/ai/flows/url-processor"; // New flow
import { Upload, Loader2, FileText, Tag, AlertTriangle, Link as LinkIcon } from "lucide-react";
import type { KnowledgeItem, Agent } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppContext } from "../../../layout";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // For UI

// Function to convert text to Base64 data URI
function textToDataUri(text: string, mimeType: string = "text/plain"): string {
  const base64Encoded = btoa(unescape(encodeURIComponent(text)));
  return `data:${mimeType};base64,${base64Encoded}`;
}


export default function KnowledgePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("file");
  
  const { toast } = useToast();
  const params = useParams();
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const { getAgent, addKnowledgeItem } = useAppContext();
  const [currentAgent, setCurrentAgent] = useState<Agent | null | undefined>(undefined);

  useEffect(() => {
    if (agentId) {
      const agent = getAgent(agentId as string);
      setCurrentAgent(agent);
    }
  }, [agentId, getAgent]);

  const knowledgeItems = currentAgent?.knowledgeItems || [];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUrlInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(event.target.value);
  };

  const processAndAddKnowledge = async (dataUri: string, fileName: string) => {
    if (!agentId) {
        toast({ title: "Agent ID missing", description: "Cannot add knowledge without an agent context.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    try {
        const result = await extractKnowledge({ documentDataUri: dataUri });
        const newKnowledgeItem: KnowledgeItem = {
            id: Date.now().toString(),
            fileName: fileName,
            uploadedAt: new Date().toISOString(),
            summary: result.summary,
            keywords: result.keywords,
        };
        addKnowledgeItem(agentId, newKnowledgeItem);
        toast({
            title: "Knowledge Extracted!",
            description: `Successfully processed "${fileName}".`,
        });
    } catch (extractionError) {
        console.error("Error extracting knowledge:", extractionError);
        toast({ title: "Extraction Error", description: `Failed to extract knowledge from "${fileName}".`, variant: "destructive" });
    }
  }

  const handleSubmitFile = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      reader.onload = async () => {
        const documentDataUri = reader.result as string;
        await processAndAddKnowledge(documentDataUri, selectedFile.name);
        setSelectedFile(null); 
        setIsLoading(false);
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
        setIsLoading(false);
      };
    } catch (error) {
      console.error("Error initiating file processing:", error);
      toast({ title: "Processing Error", description: "An unexpected error occurred.", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleSubmitUrl = async () => {
    if (!urlInput.trim()) {
        toast({ title: "No URL entered", description: "Please enter a URL to process.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
        const processedResult = await processUrlContent({ url: urlInput });
        
        if (processedResult.textContent) {
            const dataUri = textToDataUri(processedResult.textContent);
            await processAndAddKnowledge(dataUri, processedResult.fileNameSuggestion);
        } else {
            toast({ title: "URL Processing Failed", description: "Could not extract text content from the URL.", variant: "destructive" });
        }
        setUrlInput("");
    } catch (error) {
        console.error("Error processing URL:", error);
        toast({ title: "URL Processing Error", description: (error as Error).message || "Failed to process content from the URL.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };


  if (currentAgent === undefined) {
    return (
      <Card>
        <CardHeader><CardTitle>Loading Knowledge...</CardTitle></CardHeader>
        <CardContent><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /></CardContent>
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
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Manage Knowledge Base</CardTitle>
          <CardDescription>Upload documents or fetch content from URLs to build agent <span className="font-semibold">{currentAgent.generatedName || currentAgent.name}</span>'s knowledge.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file"><Upload className="mr-2 h-4 w-4 inline-block"/>Upload File</TabsTrigger>
                    <TabsTrigger value="url"><LinkIcon className="mr-2 h-4 w-4 inline-block"/>Fetch from URL</TabsTrigger>
                </TabsList>
                <TabsContent value="file" className="pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="document">Upload Document</Label>
                        <Input id="document" type="file" onChange={handleFileChange} accept=".txt,.pdf,.md,.docx" disabled={isLoading}/>
                        {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
                    </div>
                    <Button onClick={handleSubmitFile} disabled={isLoading || !selectedFile} className="w-full mt-4">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isLoading ? "Processing File..." : "Extract from File"}
                    </Button>
                </TabsContent>
                <TabsContent value="url" className="pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="urlInput">Enter URL</Label>
                        <Input id="urlInput" type="url" placeholder="https://example.com/article" value={urlInput} onChange={handleUrlInputChange} disabled={isLoading}/>
                        <p className="text-xs text-muted-foreground">Supports HTML pages (main content extraction) and direct links to plain text files.</p>
                    </div>
                     <Button onClick={handleSubmitUrl} disabled={isLoading || !urlInput.trim()} className="w-full mt-4">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                        {isLoading ? "Processing URL..." : "Fetch & Extract from URL"}
                    </Button>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

      {knowledgeItems.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Uploaded Documents for {currentAgent.generatedName || currentAgent.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
              {knowledgeItems.map(item => (
                <Card key={item.id} className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/> {item.fileName}</CardTitle>
                    <CardDescription>Uploaded: {new Date(item.uploadedAt).toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {item.summary && (
                      <div>
                        <h4 className="font-semibold mb-1">Summary:</h4>
                        <p className="text-sm text-muted-foreground mb-2">{item.summary}</p>
                      </div>
                    )}
                    {item.keywords && item.keywords.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-1">Keywords:</h4>
                        <div className="flex flex-wrap gap-2">
                          {item.keywords.map(keyword => (
                            <span key={keyword} className="text-xs bg-primary/20 text-primary-foreground px-2 py-1 rounded-full flex items-center">
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
    </div>
  );
}

    