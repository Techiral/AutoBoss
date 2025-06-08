
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Check, Link as LinkIcon, Code, Globe, AlertTriangle, Info, ShieldCheck, Server, MessageSquare } from "lucide-react";
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

  // Primary colors from your globals.css (dark theme) for the script
  const primaryHsl = "217 91% 58%"; // Vibrant Blue
  const primaryFgHsl = "210 100% 98%"; // Almost White

  const chatLauncherScript = agent && baseUrl ? `
<script type="text/javascript">
(function() {
    const AGENT_ID = '${agent.id}';
    const BASE_URL = '${baseUrl}';
    const AGENT_NAME = '${agent.generatedName || agent.name}';
    const CHAT_URL = \`\${BASE_URL}/chat/\${AGENT_ID}\`;

    // Theme colors (approximating your app's theme)
    const LAUNCHER_BG_COLOR = 'hsl(${primaryHsl})';
    const LAUNCHER_FG_COLOR = 'hsl(${primaryFgHsl})';
    const HEADER_BG_COLOR = LAUNCHER_BG_COLOR;
    const HEADER_FG_COLOR = LAUNCHER_FG_COLOR;
    const WIDGET_BORDER_COLOR = '#e0e0e0'; // Light gray border

    const styles = \`
        #autoboss-launcher-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: \${LAUNCHER_BG_COLOR};
            color: \${LAUNCHER_FG_COLOR};
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            z-index: 2147483646;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        #autoboss-launcher-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        #autoboss-widget-container {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 370px;
            height: 600px;
            border: 1px solid \${WIDGET_BORDER_COLOR};
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            overflow: hidden;
            display: none; /* Initially hidden */
            z-index: 2147483647;
            background-color: #ffffff;
            flex-direction: column;
            transition: opacity 0.3s ease, transform 0.3s ease;
            opacity: 0;
            transform: translateY(20px);
        }
        #autoboss-widget-container.autoboss-widget-open {
            display: flex;
            opacity: 1;
            transform: translateY(0);
        }
        #autoboss-widget-header {
            padding: 12px 15px;
            background-color: \${HEADER_BG_COLOR};
            color: \${HEADER_FG_COLOR};
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top-left-radius: 11px;
            border-top-right-radius: 11px;
            flex-shrink: 0;
        }
        #autoboss-widget-header-title {
            font-size: 16px;
            font-weight: 600;
            font-family: 'Nunito', sans-serif; /* Match app's headline font */
        }
        #autoboss-widget-close-button {
            background: none;
            border: none;
            color: \${HEADER_FG_COLOR};
            font-size: 24px; /* Larger close icon */
            font-weight: 300; /* Lighter close icon */
            cursor: pointer;
            line-height: 1;
            padding: 0 5px;
            opacity: 0.8;
        }
        #autoboss-widget-close-button:hover {
            opacity: 1;
        }
        #autoboss-widget-iframe-wrapper {
            flex-grow: 1;
            overflow: hidden;
        }
        #autoboss-widget-container iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    \`;

    // Inject styles
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // Create launcher button
    const launcherButton = document.createElement('button');
    launcherButton.id = 'autoboss-launcher-button';
    launcherButton.title = \`Chat with \${AGENT_NAME}\`;
    launcherButton.innerHTML = '<svg viewBox="0 0 24 24" style="width:28px;height:28px;fill:currentColor;"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"></path></svg>'; // Material Icons chat icon

    // Create widget container
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'autoboss-widget-container';

    // Create header
    const widgetHeader = document.createElement('div');
    widgetHeader.id = 'autoboss-widget-header';

    const widgetTitle = document.createElement('span');
    widgetTitle.id = 'autoboss-widget-header-title';
    widgetTitle.textContent = AGENT_NAME;

    const closeButton = document.createElement('button');
    closeButton.id = 'autoboss-widget-close-button';
    closeButton.innerHTML = '&times;';
    closeButton.title = 'Close chat';

    widgetHeader.appendChild(widgetTitle);
    widgetHeader.appendChild(closeButton);
    widgetContainer.appendChild(widgetHeader);

    const iframeWrapper = document.createElement('div');
    iframeWrapper.id = 'autoboss-widget-iframe-wrapper';
    widgetContainer.appendChild(iframeWrapper);

    let iframe = null;

    function openWidget() {
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.src = CHAT_URL;
            iframeWrapper.appendChild(iframe);
        }
        widgetContainer.style.display = 'flex';
        setTimeout(() => {
            widgetContainer.classList.add('autoboss-widget-open');
        }, 10);
        launcherButton.style.display = 'none';
    }

    function closeWidget() {
        widgetContainer.classList.remove('autoboss-widget-open');
        setTimeout(() => {
            if (widgetContainer.style.display !== 'none') { // Check to prevent errors if already hidden
                 widgetContainer.style.display = 'none';
            }
        }, 300);
        launcherButton.style.display = 'flex';
    }

    launcherButton.onclick = openWidget;
    closeButton.onclick = closeWidget;

    // Append to body once DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        document.body.appendChild(launcherButton);
        document.body.appendChild(widgetContainer);
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            document.body.appendChild(launcherButton);
            document.body.appendChild(widgetContainer);
        });
    }
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
          <CardDescription>Access links, API details, and embeddable launcher to integrate your agent externally.</CardDescription>
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

           <div>
            <Label htmlFor="chatLauncherScript" className="flex items-center mb-1 text-base font-semibold">
              <Code className="w-5 h-5 mr-2 text-primary" /> Embeddable Chat Launcher
            </Label>
            <Alert variant="default" className="mb-2">
                <Info className="h-4 w-4" />
                <AlertTitle>How to Use</AlertTitle>
                <AlertDescription className="text-xs">
                  Paste this script snippet just before the closing <strong>&lt;/body&gt;</strong> tag on any HTML page where you want the chat launcher to appear.
                  It will add a button to the bottom-right of the page, which opens the chat widget as a popup.
                </AlertDescription>
            </Alert>
            <div className="relative">
              <Textarea id="chatLauncherScript" value={chatLauncherScript.trim()} readOnly rows={12} className="font-code text-xs bg-muted/50"/>
              <Button variant="outline" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleCopy(chatLauncherScript.trim(), "Chat Launcher Script")} aria-label="Copy Chat Launcher Script" disabled={!chatLauncherScript}>
                {copied === "Chat Launcher Script" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This script creates a floating button that opens your chatbot in a popup window.</p>
            <Alert variant="default" className="mt-2 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
                <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-700 dark:text-blue-300">CSP for Embedding</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-400 text-xs">
                Your AutoBoss app is configured to allow its chat pages (e.g., <code>{chatbotLink}</code>) to be embedded in iframes from any origin via the <code>Content-Security-Policy: frame-ancestors *;</code> header. This is necessary for the chat launcher script to function correctly on external websites.
                </AlertDescription>
            </Alert>
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
                  <ul className="list-disc list-inside pl-4 mt-1">
                    <li><strong>message (string, required):</strong> The user's input.</li>
                    <li><strong>flowState (object, optional):</strong> To continue a flow-based conversation.
                        <ul>
                            <li><code>context</code> (object): The FlowContext from the previous API response.</li>
                            <li><code>nextNodeId</code> (string): The nextNodeId from the previous API response.</li>
                        </ul>
                    </li>
                    <li><strong>conversationHistoryString (string, optional):</strong> For autonomous mode, provide past dialogue for better context if not resuming a flow (e.g., "User: Hi\\nAgent: Hello!").</li>
                  </ul>
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
                    <Label htmlFor="apiRequestExampleMinimal" className="flex items-center mb-1 text-sm">
                    Example Request (Minimal):
                    </Label>
                    <div className="relative">
                        <Textarea id="apiRequestExampleMinimal" value={apiRequestExampleMinimal} readOnly rows={4} className="font-code text-xs bg-muted/50"/>
                        <Button variant="outline" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleCopy(apiRequestExampleMinimal, "API Request Minimal")} aria-label="Copy API Request Minimal" disabled={!apiRequestExampleMinimal}>
                            {copied === "API Request Minimal" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                 <div>
                    <Label htmlFor="apiRequestExampleWithFlow" className="flex items-center mb-1 text-sm">
                    Example Request (Resume Flow):
                    </Label>
                    <div className="relative">
                        <Textarea id="apiRequestExampleWithFlow" value={apiRequestExampleWithFlow} readOnly rows={12} className="font-code text-xs bg-muted/50"/>
                        <Button variant="outline" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleCopy(apiRequestExampleWithFlow, "API Request With Flow")} aria-label="Copy API Request With Flow" disabled={!apiRequestExampleWithFlow}>
                            {copied === "API Request With Flow" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
                 <div>
                    <Label htmlFor="apiRequestExampleWithHistory" className="flex items-center mb-1 text-sm">
                    Example Request (Autonomous with History):
                    </Label>
                    <div className="relative">
                        <Textarea id="apiRequestExampleWithHistory" value={apiRequestExampleWithHistory} readOnly rows={6} className="font-code text-xs bg-muted/50"/>
                        <Button variant="outline" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleCopy(apiRequestExampleWithHistory, "API Request With History")} aria-label="Copy API Request With History" disabled={!apiRequestExampleWithHistory}>
                            {copied === "API Request With History" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="space-y-2 mt-4">
                <Label className="flex items-center mb-1 text-sm">Example Responses:</Label>
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="apiFlowResponseExample" className="text-xs font-medium">Flow Response:</Label>
                        <div className="relative">
                            <Textarea id="apiFlowResponseExample" value={apiFlowResponseExample} readOnly rows={14} className="font-code text-xs bg-muted/50"/>
                            <Button variant="outline" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleCopy(apiFlowResponseExample, "API Flow Response")} aria-label="Copy API Flow Response" disabled={!apiFlowResponseExample}>
                                {copied === "API Flow Response" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="apiAutonomousResponseExample" className="text-xs font-medium">Autonomous Response:</Label>
                         <div className="relative">
                            <Textarea id="apiAutonomousResponseExample" value={apiAutonomousResponseExample} readOnly rows={7} className="font-code text-xs bg-muted/50"/>
                            <Button variant="outline" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleCopy(apiAutonomousResponseExample, "API Autonomous Response")} aria-label="Copy API Autonomous Response" disabled={!apiAutonomousResponseExample}>
                                {copied === "API Autonomous Response" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="apiErrorResponseExample" className="text-xs font-medium">Error Response (e.g., HTTP 400):</Label>
                         <div className="relative">
                            <Textarea id="apiErrorResponseExample" value={apiErrorResponseExample} readOnly rows={11} className="font-code text-xs bg-muted/50"/>
                            <Button variant="outline" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleCopy(apiErrorResponseExample, "API Error Response")} aria-label="Copy API Error Response" disabled={!apiErrorResponseExample}>
                                {copied === "API Error Response" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
             <Alert variant="default" className="mt-4">
                 <ShieldCheck className="h-4 w-4" />
                 <AlertTitle>API Production Considerations</AlertTitle>
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

        </CardContent>
      </Card>
    </div>
  );
}

    