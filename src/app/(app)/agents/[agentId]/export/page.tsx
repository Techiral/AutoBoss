"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Check, Link as LinkIcon, Code, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "../../../layout";
import type { Agent } from "@/lib/types";

export default function ExportAgentPage() {
  const params = useParams();
  const { getAgent } = useAppContext();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

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

  const chatWidgetCode = agent ? `<script>
  // AgentVerse Chat Widget
  // Agent ID: ${agent.id}
  (function() {
    var d = document;
    var s = d.createElement('script');
    s.src = 'https://cdn.agentverse.com/widget.js'; // Fictional CDN
    s.async = true;
    s.setAttribute('data-agent-id', '${agent.id}');
    var e = d.getElementsByTagName('script')[0];
    e.parentNode.insertBefore(s, e);
  })();
</script>
<div id="agentverse-chat-widget-container"></div>` : "";

  const apiEndpoint = agent ? `https://api.agentverse.com/v1/agents/${agent.id}/chat` : ""; // Fictional API
  const chatbotLink = agent ? `https://chat.agentverse.com/${agent.id}` : ""; // Fictional Link

  if (!agent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Export Details...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please wait while we load the agent information.</p>
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
          {/* Chatbot Link Section */}
          <div>
            <Label htmlFor="chatbotLink" className="flex items-center mb-1">
              <Globe className="w-4 h-4 mr-2 text-primary" /> Direct Chatbot Link
            </Label>
            <div className="flex items-center gap-2">
              <Input id="chatbotLink" value={chatbotLink} readOnly />
              <Button variant="outline" size="icon" onClick={() => handleCopy(chatbotLink, "Chatbot Link")} aria-label="Copy Chatbot Link">
                {copied === "Chatbot Link" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Share this link directly with users to chat with your agent.</p>
          </div>

          {/* API Endpoint Section */}
          <div>
            <Label htmlFor="apiEndpoint" className="flex items-center mb-1">
              <LinkIcon className="w-4 h-4 mr-2 text-primary" /> API Endpoint
            </Label>
            <div className="flex items-center gap-2">
              <Input id="apiEndpoint" value={apiEndpoint} readOnly />
              <Button variant="outline" size="icon" onClick={() => handleCopy(apiEndpoint, "API Endpoint")} aria-label="Copy API Endpoint">
                {copied === "API Endpoint" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Use this webhook endpoint to integrate with external systems.</p>
          </div>

          {/* Embeddable Widget Code Section */}
          <div>
            <Label htmlFor="widgetCode" className="flex items-center mb-1">
              <Code className="w-4 h-4 mr-2 text-primary" /> Embeddable Chat Widget
            </Label>
            <div className="relative">
              <Textarea id="widgetCode" value={chatWidgetCode} readOnly rows={10} className="font-code text-xs" />
              <Button variant="outline" size="icon" className="absolute top-2 right-2" onClick={() => handleCopy(chatWidgetCode, "Widget Code")} aria-label="Copy Widget Code">
                {copied === "Widget Code" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Copy and paste this code into your website's HTML to embed the chat widget.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
