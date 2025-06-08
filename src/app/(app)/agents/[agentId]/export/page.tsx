
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Check, Link as LinkIcon, Code, Globe, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "../../../layout";
import type { Agent } from "@/lib/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function ExportAgentPage() {
  const params = useParams();
  const { getAgent } = useAppContext();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState("");

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    // Ensure this runs only on the client where window is available
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []); // Empty dependency array: runs once on mount

  useEffect(() => {
    if (agentId) {
      const foundAgent = getAgent(agentId as string);
      setAgent(foundAgent || null);
    }
  }, [agentId, getAgent]);

  const handleCopy = (textToCopy: string, type: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(type);
      toast({ title: `${type} Copied!`, description: `${type} has been copied to your clipboard.` });
      setTimeout(() => setCopied(null), 2000);
    }).catch(err => {
      toast({ title: "Copy Failed", description: "Could not copy to clipboard.", variant: "destructive" });
      console.error('Failed to copy: ', err);
    });
  };
  
  const chatbotLink = agent && baseUrl ? `${baseUrl}/chat/${agent.id}` : "";
  const apiEndpoint = agent && baseUrl ? `${baseUrl}/api/agents/${agent.id}/chat` : ""; 

  const iframeWidgetCode = agent && chatbotLink ? `<iframe
  src="${chatbotLink}"
  width="350"
  height="500"
  frameborder="0"
  style="border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"
  title="AutoBoss Chatbot: ${agent.generatedName || agent.name}"
></iframe>
` : "";


  if (!agent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Export Details...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please wait while we load the agent information. If the agent ID is invalid, this page may not load correctly.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Export Agent: {agent.generatedName || agent.name}</CardTitle>
          <CardDescription>Get the necessary code and links to integrate your agent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <Label htmlFor="chatbotLink" className="flex items-center mb-1">
              <Globe className="w-4 h-4 mr-2 text-primary" /> Direct Chatbot Link
            </Label>
            <div className="flex items-center gap-2">
              <Input id="chatbotLink" value={chatbotLink} readOnly />
              <Button variant="outline" size="icon" onClick={() => handleCopy(chatbotLink, "Chatbot Link")} aria-label="Copy Chatbot Link" disabled={!chatbotLink}>
                {copied === "Chatbot Link" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Share this link directly with users to chat with your agent.</p>
             {!baseUrl && <p className="text-xs text-destructive mt-1">Base URL not yet available. This will populate on client-side.</p>}
          </div>

          <div>
            <Label htmlFor="apiEndpoint" className="flex items-center mb-1">
              <LinkIcon className="w-4 h-4 mr-2 text-primary" /> API Endpoint
            </Label>
             <Alert variant="destructive" className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Development API</AlertTitle>
                <AlertDescription>
                This API endpoint is illustrative and uses a simplified, non-persistent agent interaction model. It's not suitable for production use without secure agent data storage, retrieval, and authentication.
                </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              <Input id="apiEndpoint" value={apiEndpoint} readOnly />
              <Button variant="outline" size="icon" onClick={() => handleCopy(apiEndpoint, "API Endpoint")} aria-label="Copy API Endpoint" disabled={!apiEndpoint}>
                {copied === "API Endpoint" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Use this API endpoint to integrate with external systems. (POST: {`{"message": "your message"}`})</p>
             {!baseUrl && <p className="text-xs text-destructive mt-1">Base URL not yet available. This will populate on client-side.</p>}
          </div>
          
          <div>
            <Label htmlFor="widgetCode" className="flex items-center mb-1">
              <Code className="w-4 h-4 mr-2 text-primary" /> Embeddable Chat Widget (via Iframe)
            </Label>
            <div className="relative">
              <Textarea id="widgetCode" value={iframeWidgetCode} readOnly rows={10} className="font-code text-xs" />
              <Button variant="outline" size="icon" className="absolute top-2 right-2" onClick={() => handleCopy(iframeWidgetCode, "Widget Code")} aria-label="Copy Widget Code" disabled={!iframeWidgetCode}>
                {copied === "Widget Code" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Copy and paste this HTML iframe code into your website to embed the chat.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
