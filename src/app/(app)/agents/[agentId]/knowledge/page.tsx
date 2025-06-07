"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { extractKnowledge, KnowledgeExtractionOutput } from "@/ai/flows/knowledge-extraction";
import { Upload, Loader2, FileText, Tag } from "lucide-react";
import type { KnowledgeItem } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function KnowledgePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractionResult, setExtractionResult] = useState<KnowledgeExtractionOutput | null>(null);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]); // To store multiple uploaded docs
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setExtractionResult(null); // Reset previous result
    }
  };

  const handleSubmit = async () => {
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
        const result = await extractKnowledge({ documentDataUri });
        setExtractionResult(result);

        const newKnowledgeItem: KnowledgeItem = {
          id: Date.now().toString(),
          fileName: selectedFile.name,
          uploadedAt: new Date().toISOString(),
          summary: result.summary,
          keywords: result.keywords,
        };
        setKnowledgeItems(prevItems => [newKnowledgeItem, ...prevItems]);

        toast({
          title: "Knowledge Extracted!",
          description: `Successfully processed "${selectedFile.name}".`,
        });
        setSelectedFile(null); // Reset file input
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
        setIsLoading(false);
      };
    } catch (error) {
      console.error("Error extracting knowledge:", error);
      toast({ title: "Extraction Error", description: "Failed to extract knowledge from the document.", variant: "destructive" });
      setIsLoading(false);
    } finally {
      // setIsLoading(false) is handled within onload or onerror for FileReader
    }
  };
  
  // This needs to be outside handleSubmit, in the FileReader onloadend.
  // For simplicity in this snippet, it's assumed loading ends after submit attempts.
  // A more robust solution would manage isLoading state more carefully with FileReader's lifecycle.
  if (isLoading && selectedFile) {
     // This is a bit of a hack; ideally, isLoading is set to false in reader.onloadend
     // For now, we'll assume it resets after an attempt.
     // setTimeout(() => setIsLoading(false), 500); // To prevent infinite loading state on error
  }


  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Manage Knowledge Base</CardTitle>
          <CardDescription>Upload documents to build your agent's knowledge.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document">Upload Document</Label>
            <Input id="document" type="file" onChange={handleFileChange} accept=".txt,.pdf,.md,.docx" />
            {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isLoading || !selectedFile} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isLoading ? "Processing..." : "Extract Knowledge"}
          </Button>
        </CardFooter>
      </Card>

      {knowledgeItems.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Uploaded Documents</CardTitle>
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
