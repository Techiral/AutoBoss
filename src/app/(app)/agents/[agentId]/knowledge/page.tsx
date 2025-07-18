
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
import { Upload, Loader2, FileText, Tag, AlertTriangle, Link as LinkIcon, Brain, Info, Mic, CheckCircle2, TextQuote, FileWarning } from "lucide-react";
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
  const [isProcessingUrl, setIsProcessingUrl] = useState(false);
  const [isProcessingPastedText, setIsProcessingPastedText] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
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

  const clearOtherInputs = (except: 'file' | 'url' | 'paste') => {
    if (except !== 'file') {
        setSelectedFile(null);
        const fileInput = document.getElementById('document') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }
    if (except !== 'url') setUrlInput("");
    if (except !== 'paste') setPastedTextInput("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      clearOtherInputs('file');
    } else {
      setSelectedFile(null);
    }
  };

  const handleUrlInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(event.target.value);
    if (event.target.value) clearOtherInputs('url');
  };

  const handlePastedTextInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPastedTextInput(event.target.value);
    if (event.target.value) clearOtherInputs('paste');
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

  const handleProcessUrl = async () => {
    if (!urlInput.trim()) {
        toast({ title: "No URL provided", description: "Please enter a website URL to train from.", variant: "destructive"});
        return;
    }
    let validUrl = urlInput;
    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      validUrl = `https://${urlInput}`;
    }

    try {
        new URL(validUrl);
    } catch (_) {
        toast({ title: "Invalid URL", description: "Please enter a valid website URL (e.g., https://example.com/about-us).", variant: "destructive"});
        return;
    }

    setIsProcessingUrl(true);
    try {
        const result: ProcessedUrlOutput = await processUrl({ url: validUrl });

        let displayFileName = result.title || validUrl;
        try {
            const parsedUrl = new URL(validUrl);
            displayFileName = result.title || (parsedUrl.hostname + (parsedUrl.pathname === '/' ? '' : parsedUrl.pathname));
        } catch { /* ignore if parsing fails, use validUrl or title */ }

        const textDataUri = `data:text/plain;charset=utf-8;base64,${Buffer.from(result.extractedText).toString('base64')}`;
        const knowledgeResult = await extractKnowledge({ documentDataUri: textDataUri, isPreStructuredText: false }); 

        addKnowledgeToAgent(displayFileName.substring(0,100), knowledgeResult.summary, knowledgeResult.keywords);
        setUrlInput("");
    } catch (error: any) {
        console.error("Error processing URL:", error);
        let errorMessage = error.message || "Failed to process the website. The content might be inaccessible or unsuitable for training.";
        if (errorMessage.toLowerCase().includes("status 403") || errorMessage.toLowerCase().includes("status 401")) {
            errorMessage = `Could not access ${validUrl}: Access denied (403/401). The site may require login or block automated access.`;
        } else if (errorMessage.toLowerCase().includes("status 5")) {
            errorMessage = `Could not access ${validUrl}: The website's server encountered an error. Please try again later.`;
        } else if (errorMessage.toLowerCase().includes("enotfound") || errorMessage.toLowerCase().includes("getaddrinfo") || errorMessage.toLowerCase().includes("dns lookup failed")) {
          errorMessage = `Could not connect to ${validUrl}. Please check the URL or your network connection. (DNS lookup failure)`;
        } else if (errorMessage.includes("No meaningful text content extracted")) {
            errorMessage = `No useful text content was found at ${validUrl}. It might be an image, a very complex page, require JavaScript, or direct access might be limited.`;
        } else if (errorMessage.includes("503") || errorMessage.toLowerCase().includes("model is overloaded")) {
            errorMessage = `The AI model is currently overloaded processing the content from ${validUrl}. Please try again in a few moments.`;
        }
        toast({ title: "Website Training Error", description: errorMessage, variant: "destructive" });
    } finally {
        setIsProcessingUrl(false);
    }
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

  const isVoiceAgent = currentAgent.agentType === 'voice' || currentAgent.agentType === 'hybrid';
  const isAnyLoading = isLoadingFile || isProcessingUrl || isProcessingPastedText;

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

            <div className="space-y-1.5">
                <Label htmlFor="url">Train from Website URL</Label>
                <Input id="url" type="url" placeholder="e.g., https://example.com/services" value={urlInput} onChange={handleUrlInputChange} disabled={isAnyLoading}/>
            </div>
             <Alert variant="default" className="p-3 text-xs bg-secondary mb-2">
                <Info className="h-3.5 w-3.5 text-primary" />
                <AlertTitle className="text-xs font-medium">Website Training Tip</AlertTitle>
                <AlertDescription className="text-muted-foreground text-[11px]">
                  Best for pages with clear text content. Complex sites or those needing logins may not process well.
                </AlertDescription>
            </Alert>
            <Button onClick={handleProcessUrl} disabled={isAnyLoading || !urlInput.trim()} className="w-full">
                {isProcessingUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                {isProcessingUrl ? "Fetching Website..." : "Fetch & Train URL"}
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
                <Label htmlFor="pastedText">Paste Text Content (e.g., FAQ, Product Info)</Label>
                <Textarea 
                  id="pastedText" 
                  placeholder="Paste text here (e.g., product details, FAQs, sections of a document)..." 
                  value={pastedTextInput} 
                  onChange={handlePastedTextInputChange} 
                  rows={8}
                  disabled={isAnyLoading}
                />
            </div>
            <Button onClick={handleSubmitPastedText} disabled={isAnyLoading || !pastedTextInput.trim()} className="w-full">
                {isProcessingPastedText ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TextQuote className="mr-2 h-4 w-4" />}
                {isProcessingPastedText ? "Processing Text..." : "Train from Pasted Text"}
            </Button>


            {isVoiceAgent && (
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
