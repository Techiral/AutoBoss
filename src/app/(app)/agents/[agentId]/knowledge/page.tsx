
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { extractKnowledge } from "@/ai/flows/knowledge-extraction";
import { processUrl } from "@/ai/flows/url-processor";
import { Upload, Loader2, FileText, Tag, AlertTriangle, Link as LinkIcon, Brain, Info, Mic, CheckCircle2, TextQuote, FileWarning, Trash2, PlusCircle } from "lucide-react";
import type { KnowledgeItem, Agent, ProcessedUrlOutput } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppContext } from "../../../layout";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import Papa from 'papaparse';

pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.mjs`;

function csvToStructuredText(csvString: string, fileName: string): string {
  const parseResult = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  if (parseResult.errors.length > 0) {
    console.warn(`CSV parsing errors for ${fileName}:`, parseResult.errors);
    return `Could not fully parse CSV: ${fileName}. Errors: ${parseResult.errors.map(e => e.message).join(', ')}`;
  }

  if (!parseResult.data || parseResult.data.length === 0) {
    return `Empty CSV file (or only headers found): ${fileName}.`;
  }

  let textRepresentation = `Content of CSV file "${fileName}":\n\n`;

  parseResult.data.forEach((row, index) => {
    const headers = Object.keys(row);
    if (headers.length === 0) return; 

    const firstHeader = headers[0];
    const firstValue = row[firstHeader];

    let entryPreamble = `Entry ${index + 1}`;
    if (firstHeader && firstValue && firstValue.trim() !== "") {
      entryPreamble = `Details for ${firstHeader.trim()} "${firstValue.trim()}" (Entry ${index + 1})`;
    } else if (firstHeader) {
      entryPreamble = `Entry ${index + 1} (First Header: ${firstHeader.trim()})`;
    }

    textRepresentation += `${entryPreamble}:\n`;

    const rowDetails = headers.map(header => {
      const value = row[header] || 'N/A';
      return `  - The ${header.trim()} is "${value.trim()}".`;
    });

    textRepresentation += rowDetails.join("\n") + "\n\n";
  });

  return textRepresentation.trim();
}


export default function KnowledgePage() {
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [isProcessingUrls, setIsProcessingUrls] = useState(false);
  const [isProcessingPastedText, setIsProcessingPastedText] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [urlInput, setUrlInput] = useState("");
  const [urlList, setUrlList] = useState<string[]>([]);
  
  const [pastedTextInput, setPastedTextInput] = useState("");

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
    } else {
      setSelectedFile(null);
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
        description: `Successfully processed and added "${fileName.substring(0, 100)}${fileName.length > 100 ? '...' : ''}". Your agent is now smarter!`,
    });
  }

  const handleSubmitFile = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }

    setIsLoadingFile(true);
    const originalFileName = selectedFile.name;
    let isPreStructured = false;

    try {
      let documentDataUri: string;
      let effectiveMimeType = selectedFile.type;
      const fileNameLower = originalFileName.toLowerCase();

      if (fileNameLower.endsWith('.pdf')) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        let textContent = "";
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContentItems = await page.getTextContent();
          textContentItems.items.forEach(item => {
            if ('str' in item) {
              textContent += item.str + " ";
            }
          });
          textContent += "\n";
        }
        if (!textContent.trim()) throw new Error("No text content found in PDF.");
        documentDataUri = `data:text/plain;charset=utf-8;base64,${Buffer.from(textContent).toString('base64')}`;
        effectiveMimeType = 'text/plain';
      } else if (fileNameLower.endsWith('.docx')) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const { value: textContent } = await mammoth.extractRawText({ arrayBuffer });
        if (!textContent.trim()) throw new Error("No text content found in DOCX.");
        documentDataUri = `data:text/plain;charset=utf-8;base64,${Buffer.from(textContent).toString('base64')}`;
        effectiveMimeType = 'text/plain';
      } else if (fileNameLower.endsWith('.csv')) {
        const csvTextContent = await selectedFile.text();
        const plainTextFromCsv = csvToStructuredText(csvTextContent, originalFileName);
        if (!plainTextFromCsv.trim()) throw new Error("Empty CSV or no content after conversion.");
        documentDataUri = `data:text/plain;charset=utf-8;base64,${Buffer.from(plainTextFromCsv).toString('base64')}`;
        effectiveMimeType = 'text/plain';
        isPreStructured = true; 
      } else {
        documentDataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            let result = reader.result as string;
             if (!effectiveMimeType || effectiveMimeType === 'application/octet-stream') {
                if (fileNameLower.endsWith('.txt')) effectiveMimeType = 'text/plain';
                else if (fileNameLower.endsWith('.md')) effectiveMimeType = 'text/markdown';
                else if (fileNameLower.endsWith('.json')) effectiveMimeType = 'application/json';
                else if (fileNameLower.endsWith('.html') || fileNameLower.endsWith('.htm')) effectiveMimeType = 'text/html';
             }
             if (effectiveMimeType && effectiveMimeType !== selectedFile.type) {
                const base64Marker = ';base64,';
                const base64DataIndex = result.indexOf(base64Marker);
                if (base64DataIndex !== -1) {
                  const base64Data = result.substring(base64DataIndex + base64Marker.length);
                  result = `data:${effectiveMimeType};base64,${base64Data}`;
                }
             }
             if (result.startsWith('data:application/octet-stream')) {
                 reject(new Error(`File "${originalFileName}" seems to be a generic binary file not directly supported for training. Please try common text-based formats (TXT, MD, PDF, DOCX, CSV) or web pages.`));
                 return;
             }
            resolve(result);
          };
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(selectedFile);
        });
      }

      const result = await extractKnowledge({ documentDataUri: documentDataUri, isPreStructuredText: isPreStructured });
      addKnowledgeToAgent(originalFileName, result.summary, result.keywords);

    } catch (extractionError: any) {
        console.error("Error processing or extracting knowledge from file:", extractionError);
        let errorMessage = extractionError.message || `Failed to extract information from "${originalFileName}". The file might be too complex, empty, or in an unsupported format.`;
        if (errorMessage.includes("503") || errorMessage.toLowerCase().includes("model is overloaded")) {
            errorMessage = `The AI model is currently overloaded processing "${originalFileName}". Please try again in a few moments. For very large documents, consider breaking them into smaller parts.`;
        }
        toast({ title: "File Training Error", description: errorMessage, variant: "destructive" });
    } finally {
      setSelectedFile(null);
      const fileInput = document.getElementById('document') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setIsLoadingFile(false);
    }
  };

  const handleAddUrlToList = () => {
    if (!urlInput.trim()) return;
    let validUrl = urlInput.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = `https://${validUrl}`;
    }
    try {
        new URL(validUrl);
        if (!urlList.includes(validUrl)) {
            setUrlList([...urlList, validUrl]);
            setUrlInput("");
        } else {
            toast({ title: "Duplicate URL", description: "This URL is already in the list.", variant: "destructive" });
        }
    } catch (_) {
        toast({ title: "Invalid URL", description: "Please enter a valid website URL.", variant: "destructive" });
    }
  };

  const handleRemoveUrlFromList = (urlToRemove: string) => {
    setUrlList(urlList.filter(url => url !== urlToRemove));
  };
  
  const handleProcessUrls = async () => {
    if (urlList.length === 0) {
        toast({ title: "No URLs to process", description: "Please add at least one URL to the list.", variant: "destructive"});
        return;
    }

    setIsProcessingUrls(true);
    toast({ title: `Starting to process ${urlList.length} URL(s)...`, description: "This may take a moment." });

    const results = await Promise.allSettled(
        urlList.map(async (url) => {
            try {
                const result: ProcessedUrlOutput = await processUrl({ url });
                let displayFileName = result.title || url;
                try {
                    const parsedUrl = new URL(url);
                    displayFileName = result.title || (parsedUrl.hostname + (parsedUrl.pathname === '/' ? '' : parsedUrl.pathname));
                } catch { /* ignore */ }

                const textDataUri = `data:text/plain;charset=utf-8;base64,${Buffer.from(result.extractedText).toString('base64')}`;
                const knowledgeResult = await extractKnowledge({ documentDataUri: textDataUri, isPreStructuredText: false });
                
                return { success: true, fileName: displayFileName, summary: knowledgeResult.summary, keywords: knowledgeResult.keywords };
            } catch (error: any) {
                console.error(`Failed to process URL ${url}:`, error);
                return { success: false, url: url, error: error.message };
            }
        })
    );

    let successCount = 0;
    results.forEach(res => {
        if (res.status === 'fulfilled' && res.value.success) {
            const { fileName, summary, keywords } = res.value;
            addKnowledgeToAgent(fileName.substring(0, 100), summary, keywords);
            successCount++;
        } else if (res.status === 'fulfilled' && !res.value.success) {
            toast({ title: `Failed to process URL`, description: `Could not train from ${res.value.url}. Reason: ${res.value.error}`, variant: "destructive" });
        } else if (res.status === 'rejected') {
            toast({ title: `Critical Error Processing URL`, description: res.reason?.message || "An unknown error occurred.", variant: "destructive" });
        }
    });

    if (successCount > 0) {
      toast({ title: "Processing Complete", description: `Successfully trained agent from ${successCount} out of ${urlList.length} URLs.` });
    }

    setUrlList([]);
    setIsProcessingUrls(false);
  };


  const handleSubmitPastedText = async () => {
    if (!pastedTextInput.trim()) {
      toast({ title: "No text provided", description: "Please paste some text to train from.", variant: "destructive"});
      return;
    }
    setIsProcessingPastedText(true);
    try {
      const fileName = `Pasted Text - ${new Date().toLocaleString()}`;
      const textDataUri = `data:text/plain;charset=utf-8;base64,${Buffer.from(pastedTextInput).toString('base64')}`;
      
      const knowledgeResult = await extractKnowledge({ documentDataUri: textDataUri, isPreStructuredText: false });
      addKnowledgeToAgent(fileName, knowledgeResult.summary, knowledgeResult.keywords);
      setPastedTextInput("");
    } catch (error: any)
      {
      console.error("Error processing pasted text:", error);
      let errorMessage = error.message || "Failed to process the pasted text.";
      if (errorMessage.includes("503") || errorMessage.toLowerCase().includes("model is overloaded")) {
            errorMessage = `The AI model is currently overloaded processing the pasted text. Please try again in a few moments. For very long text, consider breaking it into smaller parts.`;
      }
      toast({ title: "Pasted Text Training Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsProcessingPastedText(false);
    }
  };

  if (isLoadingAgents || currentAgent === undefined) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-headline text-lg sm:text-xl text-primary">Train Agent</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)]">
          <Logo className="mb-3 h-8" />
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground mt-2">Loading training data...</p>
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

  const isAnyLoading = isLoadingFile || isProcessingUrls || isProcessingPastedText;

  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-headline text-lg sm:text-2xl text-primary">Train Your Agent with Business Data</CardTitle>
          <CardDescription className="text-sm">Make your agent an expert! Upload documents, add website pages, or paste text specific to the business it will serve for <span className="font-semibold">{currentAgent.generatedName || currentAgent.name}</span>.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            
            <Alert variant="default" className="p-3 text-xs bg-destructive/10 border-destructive/20 text-destructive-foreground">
                <FileWarning className="h-3.5 w-3.5" />
                <AlertTitle className="text-xs font-medium">Training Large Documents (e.g., Books)</AlertTitle>
                <AlertDescription className="text-[11px]">
                  For very large documents like entire books, processing can take longer and may sometimes fail if the AI model is temporarily busy.
                  If you encounter issues, try uploading smaller sections or chapters individually. This can also lead to more focused knowledge for your agent.
                </AlertDescription>
            </Alert>

            <div className="space-y-1.5">
                <Label htmlFor="document">Upload Document</Label>
                <Input id="document" type="file" onChange={handleFileChange} accept=".txt,.pdf,.md,.docx,.json,.csv,.html,.htm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/markdown,application/json,text/html" disabled={isAnyLoading}/>
                {selectedFile && <p className="text-xs sm:text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
            </div>
            <Button onClick={handleSubmitFile} disabled={isAnyLoading || !selectedFile} className="w-full">
                {isLoadingFile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isLoadingFile ? "Processing File..." : "Upload & Train File"}
            </Button>

            <Alert variant="default" className="p-3 text-xs bg-secondary">
                <Info className="h-3.5 w-3.5 text-primary" />
                <AlertTitle className="text-xs font-medium">Supported File Types</AlertTitle>
                <AlertDescription className="text-muted-foreground text-[11px]">
                  TXT, MD, PDF (text-based), DOCX, CSV, JSON, HTML. For PDF/DOCX, ensure selectable text. Scanned images may not work well. CSVs become detailed text descriptions.
                </AlertDescription>
            </Alert>


            <div className="relative my-3 sm:my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-3">
                <Label htmlFor="url">Train from Website URLs</Label>
                <div className="flex gap-2">
                    <Input id="url" type="url" placeholder="https://example.com/about-us" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} disabled={isAnyLoading}/>
                    <Button variant="outline" size="icon" onClick={handleAddUrlToList} disabled={isAnyLoading || !urlInput.trim()} aria-label="Add URL to list">
                        <PlusCircle size={18} />
                    </Button>
                </div>
                 {urlList.length > 0 && (
                    <div className="space-y-2 p-2 border rounded-md max-h-40 overflow-y-auto">
                        {urlList.map((url, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                                <span className="truncate pr-2">{url}</span>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemoveUrlFromList(url)} disabled={isAnyLoading}>
                                    <Trash2 size={12} />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
                 <Alert variant="default" className="p-3 text-xs bg-secondary mb-2">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    <AlertTitle className="text-xs font-medium">Website Training Tip</AlertTitle>
                    <AlertDescription className="text-muted-foreground text-[11px]">
                      Add multiple pages (e.g., pricing, services, FAQ) for a more complete knowledge base.
                    </AlertDescription>
                </Alert>
                <Button onClick={handleProcessUrls} disabled={isAnyLoading || urlList.length === 0} className="w-full">
                    {isProcessingUrls ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                    {isProcessingUrls ? `Processing ${urlList.length} URLs...` : `Fetch & Train ${urlList.length} URL(s)`}
                </Button>
            </div>

            <div className="relative my-3 sm:my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="pastedText">Paste Text Content (e.g., FAQ, Product Info)</Label>
                <Textarea 
                  id="pastedText" 
                  placeholder="Paste text here (e.g., product details, FAQs, sections of a document)..." 
                  value={pastedTextInput} 
                  onChange={(e) => setPastedTextInput(e.target.value)}
                  rows={8}
                  disabled={isAnyLoading}
                />
            </div>
            <Button onClick={handleSubmitPastedText} disabled={isAnyLoading || !pastedTextInput.trim()} className="w-full">
                {isProcessingPastedText ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TextQuote className="mr-2 h-4 w-4" />}
                {isProcessingPastedText ? "Processing Text..." : "Train from Pasted Text"}
            </Button>


            {currentAgent.agentType === 'voice' && (
                <Alert variant="default" className="mt-4 p-3 text-xs bg-secondary">
                    <Mic className="h-3.5 w-3.5 text-primary" />
                    <AlertTitle className="text-primary text-xs font-medium">Training Voice Agents?</AlertTitle>
                    <AlertDescription className="text-muted-foreground text-[11px]">
                    For voice, upload sales scripts, product details, common objections, and how to handle them. This helps the AI sound natural and effective.
                    </AlertDescription>
                </Alert>
            )}
        </CardContent>
      </Card>

      {knowledgeItems.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-headline text-lg sm:text-xl flex items-center gap-2 text-primary">
                <Brain className="w-5 h-5 sm:w-6 sm:w-6 text-primary"/> Trained Knowledge for: {currentAgent.generatedName || currentAgent.name}
            </CardTitle>
             <CardDescription className="text-sm">This is the custom business data your agent uses to answer questions. For CSVs, this is the full structured text.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <ScrollArea className="h-[calc(100vh-350px)] sm:h-[calc(100vh-300px)] max-h-[500px] sm:max-h-[600px] pr-3 sm:pr-4">
              <div className="space-y-3 sm:space-y-4">
              {knowledgeItems.map(item => (
                <Card key={item.id} className="bg-muted/50">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        {(item.fileName.startsWith('http://') || item.fileName.startsWith('https://')) ? <LinkIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0"/> : 
                         (item.fileName.startsWith('Pasted Text')) ? <TextQuote className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0"/> :
                         <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0"/>}
                        <span className="truncate text-sm sm:text-base" title={item.fileName}>{item.fileName}</span>
                    </CardTitle>
                    <CardDescription className="text-xs">Trained: {new Date(item.uploadedAt).toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0">
                    {item.summary && (
                      <div>
                        <h4 className="font-semibold text-xs sm:text-sm mb-1">
                          {item.fileName.toLowerCase().endsWith('.csv') ? "Full Structured Content:" : "Key Information (Summary):"}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 whitespace-pre-wrap max-h-48 overflow-y-auto">{item.summary}</p>
                      </div>
                    )}
                    {item.keywords && item.keywords.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-xs sm:text-sm mb-1">Main Topics (Keywords):</h4>
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
            <CardTitle className="font-headline text-lg sm:text-xl flex items-center gap-2 text-primary">
                 <Brain className="w-5 h-5 sm:w-6 sm:w-6 text-primary"/>Agent Knowledge Base is Empty
            </CardTitle>
          </CardHeader>
           <CardContent className="flex flex-col items-center justify-center min-h-[200px] sm:min-h-[300px] p-4 sm:p-6">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">Your agent hasn't been trained with any business data yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Use the panel on the left to upload documents, add website content, or paste text.</p>
          </CardContent>
        </Card>
       )}
    </div>
  );
}

