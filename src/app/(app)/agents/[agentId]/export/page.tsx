
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Check, Link as LinkIcon, Code, Globe, AlertTriangle, Info, ShieldCheck, Server, BookOpen } from "lucide-react";
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
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []); 

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
  title="${agent.generatedName || agent.name} Chatbot"
></iframe>
` : "";

  const apiRequestExample = `{
  "message": "Hello, what can you do?",
  // Optional: To continue a flow-based conversation, include 'flowState'.
  // "flowState": {
  //   "context": { /* FlowContext object from a previous response's 'newFlowState.context' */ },
  //   "nextNodeId": "/* Node ID from a previous response's 'newFlowState.nextNodeId' */"
  // },
  // Optional: For autonomous mode (if no flow or not resuming a flow),
  // provide conversation history for better context.
  // "conversationHistoryString": "User: Previous message\\nAgent: Previous reply"
}`;

  const apiResponseExample = `// Example Flow Response:
{
  "type": "flow",
  "messages": ["Sure, I can help with that.", "What is your order number?"],
  "newFlowState": {
    "context": { "conversationHistory": [...], "waitingForInput": "get_order_id_node" },
    "nextNodeId": "get_order_id_node"
  },
  "isFlowFinished": false 
}

// Example Autonomous Response:
{
  "type": "autonomous",
  "reply": "As an AI assistant, I can answer your questions based on my knowledge.",
  "reasoning": "User asked about capabilities, providing general info."
}

// Example Error Response (e.g., 400 Bad Request):
{
  "error": {
    "code": 400,
    "message": "Invalid request body.",
    "details": { 
      "issues": [ { "path": ["message"], "message": "Message cannot be empty." } ] 
    }
  }
}`;


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
          <CardDescription>Access links and API details to integrate your agent externally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <Label htmlFor="chatbotLink" className="flex items-center mb-1 text-base font-semibold">
              <Globe className="w-5 h-5 mr-2 text-primary" /> Direct Chatbot Link
            </Label>
            <div className="flex items-center gap-2">
              <Input id="chatbotLink" value={chatbotLink} readOnly />
              <Button variant="outline" size="icon" onClick={() => handleCopy(chatbotLink, "Chatbot Link")} aria-label="Copy Chatbot Link" disabled={!chatbotLink}>
                {copied === "Chatbot Link" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Share this link directly with users to chat with your agent via a public page.</p>
             {!baseUrl && <p className="text-xs text-destructive mt-1">Base URL not yet available. This will populate on client-side.</p>}
          </div>

          <div className="space-y-3">
            <Label htmlFor="apiEndpoint" className="flex items-center text-base font-semibold">
              <Server className="w-5 h-5 mr-2 text-primary" /> API Endpoint (POST)
            </Label>
             <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-700 dark:text-blue-300">Enhanced API Capabilities</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-400 text-xs">
                This API interacts with your agent's defined flows or provides autonomous responses. 
                It includes input validation and standardized JSON error responses.
                For flow-based interactions, your client application needs to manage and send back the `newFlowState` (context and nextNodeId) received from previous API responses to continue the conversation flow.
                </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              <Input id="apiEndpoint" value={apiEndpoint} readOnly />
              <Button variant="outline" size="icon" onClick={() => handleCopy(apiEndpoint, "API Endpoint")} aria-label="Copy API Endpoint" disabled={!apiEndpoint}>
                {copied === "API Endpoint" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Use this API endpoint to integrate with external systems. Body should be JSON.
            </p>
             {!baseUrl && <p className="text-xs text-destructive mt-1">Base URL not yet available. This will populate on client-side.</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                    <Label htmlFor="apiRequestExample" className="flex items-center mb-1 text-sm">
                    Example Request Body:
                    </Label>
                    <div className="relative">
                        <Textarea id="apiRequestExample" value={apiRequestExample} readOnly rows={12} className="font-code text-xs bg-muted/50"/>
                        <Button variant="outline" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleCopy(apiRequestExample, "API Request Example")} aria-label="Copy API Request Example" disabled={!apiRequestExample}>
                            {copied === "API Request Example" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                 <div>
                    <Label htmlFor="apiResponseExample" className="flex items-center mb-1 text-sm">
                    Example Response Bodies:
                    </Label>
                    <div className="relative">
                        <Textarea id="apiResponseExample" value={apiResponseExample} readOnly rows={12} className="font-code text-xs bg-muted/50"/>
                        <Button variant="outline" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleCopy(apiResponseExample, "API Response Example")} aria-label="Copy API Response Example" disabled={!apiResponseExample}>
                            {copied === "API Response Example" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </div>
             <Alert variant="default" className="mt-4">
                 <ShieldCheck className="h-4 w-4" />
                 <AlertTitle>Production API Considerations</AlertTitle>
                 <AlertDescription className="text-xs">
                     For a production-grade API, consider implementing:
                     <ul className="list-disc list-inside pl-4 mt-1">
                         <li><strong>Versioning:</strong> Use path (e.g., `/api/v1/...`) or header versioning.</li>
                         <li><strong>Robust Authentication:</strong> Secure with API keys or OAuth 2.0 bearer tokens. (Currently relies on Firebase session if called from an authenticated client).</li>
                         <li><strong>Rate Limiting:</strong> Protect your backend from abuse.</li>
                         <li><strong>Comprehensive Logging & Monitoring:</strong> For traceability and performance tracking.</li>
                     </ul>
                 </AlertDescription>
             </Alert>
          </div>
          
          <div>
            <Label htmlFor="widgetCode" className="flex items-center mb-1 text-base font-semibold">
              <Code className="w-5 h-5 mr-2 text-primary" /> Embeddable Chat Widget (Iframe)
            </Label>
            <div className="relative">
              <Textarea id="widgetCode" value={iframeWidgetCode} readOnly rows={8} className="font-code text-xs" />
              <Button variant="outline" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleCopy(iframeWidgetCode, "Widget Code")} aria-label="Copy Widget Code" disabled={!iframeWidgetCode}>
                {copied === "Widget Code" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Paste this HTML into your website to embed the chat.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
