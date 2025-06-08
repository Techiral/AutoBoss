
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Check, Globe, Code, Server, MessageSquare, Info, ShieldCheck } from "lucide-react"; // Removed LinkIcon, AlertTriangle
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

  const primaryHsl = "217 91% 58%"; 
  const primaryFgHsl = "210 100% 98%"; 

  const chatLauncherScript = agent && baseUrl ? `
<script type="text/javascript">
(function() {
    const AGENT_ID = '${agent.id}';
    const BASE_URL = '${baseUrl}';
    const AGENT_NAME = '${agent.generatedName || agent.name}';
    const CHAT_URL = \`\${BASE_URL}/chat/\${AGENT_ID}\`;
    const LAUNCHER_BG_COLOR = 'hsl(${primaryHsl})';
    const LAUNCHER_FG_COLOR = 'hsl(${primaryFgHsl})';
    const HEADER_BG_COLOR = LAUNCHER_BG_COLOR;
    const HEADER_FG_COLOR = LAUNCHER_FG_COLOR;
    const WIDGET_BORDER_COLOR = '#e0e0e0'; 

    const styles = \`
        #autoboss-launcher-button {
            position: fixed; bottom: 20px; right: 20px; background-color: \${LAUNCHER_BG_COLOR};
            color: \${LAUNCHER_FG_COLOR}; border: none; border-radius: 50%;
            width: 50px; height: 50px; /* Smaller on mobile */
            box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; z-index: 2147483646;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        @media (min-width: 640px) { /* sm breakpoint */
          #autoboss-launcher-button { width: 60px; height: 60px; }
        }
        #autoboss-launcher-button:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        #autoboss-widget-container {
            position: fixed; bottom: 20px; right: 20px; /* Adjusted for mobile */
            width: calc(100% - 40px); max-width: 370px; /* Responsive width */
            height: 70vh; max-height: 600px; /* Responsive height */
            border: 1px solid \${WIDGET_BORDER_COLOR}; border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15); overflow: hidden; display: none;
            z-index: 2147483647; background-color: #ffffff; flex-direction: column;
            transition: opacity 0.3s ease, transform 0.3s ease; opacity: 0; transform: translateY(20px);
        }
         @media (min-width: 640px) { /* sm breakpoint */
          #autoboss-widget-container { bottom: 90px; }
        }
        #autoboss-widget-container.autoboss-widget-open { display: flex; opacity: 1; transform: translateY(0); }
        #autoboss-widget-header {
            padding: 10px 12px; background-color: \${HEADER_BG_COLOR}; color: \${HEADER_FG_COLOR};
            display: flex; justify-content: space-between; align-items: center;
            border-top-left-radius: 11px; border-top-right-radius: 11px; flex-shrink: 0;
        }
        #autoboss-widget-header-title { font-size: 14px; sm:font-size: 16px; font-weight: 600; font-family: 'Nunito', sans-serif; }
        #autoboss-widget-close-button {
            background: none; border: none; color: \${HEADER_FG_COLOR}; font-size: 20px; sm:font-size: 24px;
            font-weight: 300; cursor: pointer; line-height: 1; padding: 0 5px; opacity: 0.8;
        }
        #autoboss-widget-close-button:hover { opacity: 1; }
        #autoboss-widget-iframe-wrapper { flex-grow: 1; overflow: hidden; }
        #autoboss-widget-container iframe { width: 100%; height: 100%; border: none; }
    \`;
    const styleSheet = document.createElement("style"); styleSheet.type = "text/css"; styleSheet.innerText = styles; document.head.appendChild(styleSheet);
    const launcherButton = document.createElement('button'); launcherButton.id = 'autoboss-launcher-button'; launcherButton.title = \`Chat with \${AGENT_NAME}\`;
    launcherButton.innerHTML = '<svg viewBox="0 0 24 24" style="width:24px;height:24px;fill:currentColor;"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>';
    const widgetContainer = document.createElement('div'); widgetContainer.id = 'autoboss-widget-container';
    const widgetHeader = document.createElement('div'); widgetHeader.id = 'autoboss-widget-header';
    const widgetTitle = document.createElement('span'); widgetTitle.id = 'autoboss-widget-header-title'; widgetTitle.textContent = AGENT_NAME;
    const closeButton = document.createElement('button'); closeButton.id = 'autoboss-widget-close-button'; closeButton.innerHTML = '&times;'; closeButton.title = 'Close chat';
    widgetHeader.appendChild(widgetTitle); widgetHeader.appendChild(closeButton); widgetContainer.appendChild(widgetHeader);
    const iframeWrapper = document.createElement('div'); iframeWrapper.id = 'autoboss-widget-iframe-wrapper'; widgetContainer.appendChild(iframeWrapper);
    let iframe = null;
    function openWidget() {
        if (!iframe) { iframe = document.createElement('iframe'); iframe.src = CHAT_URL; iframeWrapper.appendChild(iframe); }
        widgetContainer.style.display = 'flex'; setTimeout(() => { widgetContainer.classList.add('autoboss-widget-open'); }, 10);
        launcherButton.style.display = 'none';
    }
    function closeWidget() {
        widgetContainer.classList.remove('autoboss-widget-open');
        setTimeout(() => { if (widgetContainer.style.display !== 'none') { widgetContainer.style.display = 'none'; } }, 300);
        launcherButton.style.display = 'flex';
    }
    launcherButton.onclick = openWidget; closeButton.onclick = closeWidget;
    if (document.readyState === 'complete' || document.readyState === 'interactive') { document.body.appendChild(launcherButton); document.body.appendChild(widgetContainer); } 
    else { document.addEventListener('DOMContentLoaded', function() { document.body.appendChild(launcherButton); document.body.appendChild(widgetContainer); }); }
})();
</script>
` : "";


  const apiRequestExampleMinimal = `{
  "message": "Hello, what can you do?"
}`;

  const apiRequestExampleWithFlow = `{
  "message": "My order ID is 12345",
  "flowState": {
    "context": {
      "conversationHistory": ["User: I want to check my order status", "Agent: Sure, what is your order ID?"],
      "waitingForInput": "get_order_id_node",
      "someOtherVariable": "someValueFromPreviousSteps"
    },
    "nextNodeId": "get_order_id_node"
  }
}`;

  const apiRequestExampleWithHistory = `{
  "message": "Tell me more about your products.",
  "conversationHistoryString": "User: Hi there!\\nAgent: Hello! How can I assist you today?"
}`;


  const apiFlowResponseExample = `{
  "type": "flow",
  "messages": ["Sure, I can help with that.", "What is your order number?"],
  "newFlowState": {
    "context": {
      "conversationHistory": ["User: I want to check my order", "Agent: Sure, I can help with that.", "Agent: What is your order number?"],
      "waitingForInput": "get_order_id_node",
      "userId": "user123"
    },
    "nextNodeId": "get_order_id_node"
  },
  "isFlowFinished": false
}`;

  const apiAutonomousResponseExample = `{
  "type": "autonomous",
  "reply": "As an AI assistant, I can answer your questions based on my knowledge.",
  "reasoning": "User asked about capabilities, providing general info."
}`;

  const apiErrorResponseExample = `{
  "error": {
    "code": 400,
    "message": "Invalid request body.",
    "details": {
      "issues": [
        { "path": ["message"], "message": "Message cannot be empty." }
      ]
    }
  }
}`;


  if (!agent) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Loading Export Details...</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <p className="text-sm">Please wait while we load the agent information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-headline text-xl sm:text-2xl">Export Agent: {agent.generatedName || agent.name}</CardTitle>
          <CardDescription className="text-sm">Access links, API details, and embeddable launcher to integrate your agent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6">
          <div>
            <Label htmlFor="chatbotLink" className="flex items-center mb-1 text-sm sm:text-base font-semibold">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" /> Direct Chatbot Link
            </Label>
            <div className="flex items-center gap-2">
              <Input id="chatbotLink" value={chatbotLink} readOnly className="text-xs sm:text-sm"/>
              <Button variant="outline" size="icon" onClick={() => handleCopy(chatbotLink, "Chatbot Link")} aria-label="Copy Chatbot Link" disabled={!chatbotLink} className="h-9 w-9 sm:h-10 sm:w-10">
                {copied === "Chatbot Link" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Share this link for direct chat access.</p>
             {!baseUrl && <p className="text-xs text-destructive mt-1">Base URL not yet available.</p>}
          </div>

           <div>
            <Label htmlFor="chatLauncherScript" className="flex items-center mb-1 text-sm sm:text-base font-semibold">
              <Code className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" /> Embeddable Chat Launcher
            </Label>
            <Alert variant="default" className="mb-2 p-3 sm:p-4">
                <Info className="h-4 w-4" />
                <AlertTitle className="text-sm sm:text-base">How to Use</AlertTitle>
                <AlertDescription className="text-xs">
                  Paste this script before &lt;/body&gt; on any HTML page for a chat launcher button.
                </AlertDescription>
            </Alert>
            <div className="relative">
              <Textarea id="chatLauncherScript" value={chatLauncherScript.trim()} readOnly rows={10} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
              <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(chatLauncherScript.trim(), "Chat Launcher Script")} aria-label="Copy Chat Launcher Script" disabled={!chatLauncherScript}>
                {copied === "Chat Launcher Script" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Creates a floating button that opens the chat in a popup.</p>
            <Alert variant="default" className="mt-2 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-700 dark:text-blue-300 text-sm sm:text-base">CSP for Embedding</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-400 text-xs">
                Your app allows chat pages (e.g., <code>{chatbotLink ? chatbotLink.substring(0,30)+'...' : ''}</code>) to be embedded in iframes from any origin.
                </AlertDescription>
            </Alert>
          </div>

          <div className="space-y-3">
            <Label htmlFor="apiEndpoint" className="flex items-center text-sm sm:text-base font-semibold">
              <Server className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" /> API Endpoint (POST)
            </Label>
             <Alert variant="default" className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-700 dark:text-blue-300 text-sm sm:text-base">API Capabilities</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-400 text-xs">
                  Interacts with agent flows or provides autonomous responses. Includes input validation and standardized JSON errors.
                  <ul className="list-disc list-inside pl-3 mt-1 text-[11px] sm:text-xs">
                    <li><strong>message (string, required):</strong> User's input.</li>
                    <li><strong>flowState (object, optional):</strong> To continue a flow.</li>
                    <li><strong>conversationHistoryString (string, optional):</strong> For autonomous mode context.</li>
                  </ul>
                </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              <Input id="apiEndpoint" value={apiEndpoint} readOnly className="text-xs sm:text-sm"/>
              <Button variant="outline" size="icon" onClick={() => handleCopy(apiEndpoint, "API Endpoint")} aria-label="Copy API Endpoint" disabled={!apiEndpoint} className="h-9 w-9 sm:h-10 sm:w-10">
                {copied === "API Endpoint" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Use this API endpoint to integrate with external systems.
            </p>
             {!baseUrl && <p className="text-xs text-destructive mt-1">Base URL not yet available.</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                <div>
                    <Label htmlFor="apiRequestExampleMinimal" className="flex items-center mb-1 text-xs sm:text-sm">
                    Example Request (Minimal):
                    </Label>
                    <div className="relative">
                        <Textarea id="apiRequestExampleMinimal" value={apiRequestExampleMinimal} readOnly rows={3} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
                        <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(apiRequestExampleMinimal, "API Request Minimal")} aria-label="Copy API Request Minimal" disabled={!apiRequestExampleMinimal}>
                            {copied === "API Request Minimal" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                        </Button>
                    </div>
                </div>
                 <div>
                    <Label htmlFor="apiRequestExampleWithFlow" className="flex items-center mb-1 text-xs sm:text-sm">
                    Example Request (Resume Flow):
                    </Label>
                    <div className="relative">
                        <Textarea id="apiRequestExampleWithFlow" value={apiRequestExampleWithFlow} readOnly rows={10} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
                        <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(apiRequestExampleWithFlow, "API Request With Flow")} aria-label="Copy API Request With Flow" disabled={!apiRequestExampleWithFlow}>
                            {copied === "API Request With Flow" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                        </Button>
                    </div>
                </div>
                 <div>
                    <Label htmlFor="apiRequestExampleWithHistory" className="flex items-center mb-1 text-xs sm:text-sm">
                    Example Request (Autonomous):
                    </Label>
                    <div className="relative">
                        <Textarea id="apiRequestExampleWithHistory" value={apiRequestExampleWithHistory} readOnly rows={5} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
                        <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(apiRequestExampleWithHistory, "API Request With History")} aria-label="Copy API Request With History" disabled={!apiRequestExampleWithHistory}>
                            {copied === "API Request With History" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="space-y-2 mt-3 sm:mt-4">
                <Label className="flex items-center mb-1 text-xs sm:text-sm">Example Responses:</Label>
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="apiFlowResponseExample" className="text-[11px] sm:text-xs font-medium">Flow Response:</Label>
                        <div className="relative">
                            <Textarea id="apiFlowResponseExample" value={apiFlowResponseExample} readOnly rows={12} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
                            <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(apiFlowResponseExample, "API Flow Response")} aria-label="Copy API Flow Response" disabled={!apiFlowResponseExample}>
                                {copied === "API Flow Response" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="apiAutonomousResponseExample" className="text-[11px] sm:text-xs font-medium">Autonomous Response:</Label>
                         <div className="relative">
                            <Textarea id="apiAutonomousResponseExample" value={apiAutonomousResponseExample} readOnly rows={6} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
                            <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(apiAutonomousResponseExample, "API Autonomous Response")} aria-label="Copy API Autonomous Response" disabled={!apiAutonomousResponseExample}>
                                {copied === "API Autonomous Response" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="apiErrorResponseExample" className="text-[11px] sm:text-xs font-medium">Error Response (e.g., HTTP 400):</Label>
                         <div className="relative">
                            <Textarea id="apiErrorResponseExample" value={apiErrorResponseExample} readOnly rows={9} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
                            <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(apiErrorResponseExample, "API Error Response")} aria-label="Copy API Error Response" disabled={!apiErrorResponseExample}>
                                {copied === "API Error Response" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
             <Alert variant="default" className="mt-3 sm:mt-4 p-3 sm:p-4">
                 <ShieldCheck className="h-4 w-4" />
                 <AlertTitle className="text-sm sm:text-base">API Production Considerations</AlertTitle>
                 <AlertDescription className="text-xs">
                     For production, consider: versioning, robust auth, rate limiting, logging & monitoring.
                 </AlertDescription>
             </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    