
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Check, Globe, Code, Server, MessageSquare, Info, ShieldCheck, Share2, Mic, PhoneCall } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "../../../layout";
import type { Agent } from "@/lib/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function ExportAgentPage() {
  const params = useParams();
  const { getAgent } = useAppContext();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState("");

  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");

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
      // In a real app, you'd fetch these from a secure store if previously saved
      // For now, they are just local state.
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
  const apiEndpointChat = agent && baseUrl ? `${baseUrl}/api/agents/${agent.id}/chat` : "";
  const apiEndpointVoice = agent && baseUrl ? `${baseUrl}/api/agents/${agent.id}/voice-hook` : "";


  const primaryHsl = "var(--primary)"; 
  const primaryFgHsl = "var(--primary-foreground)"; 

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
    const WIDGET_BORDER_COLOR = '#e0e0e0'; // Consider theming this too if needed

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


  if (!agent) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Loading Chatbot Export Details...</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <p className="text-sm">Please wait while we load the chatbot information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}> <Share2 className="w-6 h-6 sm:w-7 sm:h-7"/>Deploy & Share Your Client's Chatbot: {agent.generatedName || agent.name}</CardTitle>
          <CardDescription className="text-sm">Easily embed this AI chatbot on your client's website or provide them with a direct link. Ready to go live and start generating value!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6">
          
          <div>
            <Label htmlFor="chatLauncherScript" className="flex items-center mb-1 text-sm sm:text-base font-semibold">
              <Code className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" /> Embed Chatbot on Any Website (Recommended)
            </Label>
            <Alert variant="default" className="mb-2 p-3 sm:p-4">
                <Info className="h-4 w-4 text-accent" />
                <AlertTitle className="text-sm sm:text-base text-accent">How to Use This Script</AlertTitle>
                <AlertDescription className="text-xs text-accent/90">
                  To add this chatbot to your client's website, copy the script below and paste it just before the closing &lt;/body&gt; tag on any page of their site. It will add a floating chat launcher button.
                </AlertDescription>
            </Alert>
            <div className="relative">
              <Textarea id="chatLauncherScript" value={chatLauncherScript.trim()} readOnly rows={10} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
              <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(chatLauncherScript.trim(), "Chat Launcher Script")} aria-label="Copy Chat Launcher Script" disabled={!chatLauncherScript}>
                {copied === "Chat Launcher Script" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This script creates a floating button that opens the chatbot in a popup. It's the easiest way to integrate the chatbot for most businesses.</p>
          </div>

          <div className="border-t pt-6 sm:pt-8">
            <Label htmlFor="chatbotLink" className="flex items-center mb-1 text-sm sm:text-base font-semibold">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" /> Direct Chatbot Link (For Sharing or Testing)
            </Label>
            <div className="flex items-center gap-2">
              <Input id="chatbotLink" value={chatbotLink} readOnly className="text-xs sm:text-sm"/>
              <Button variant="outline" size="icon" onClick={() => handleCopy(chatbotLink, "Chatbot Link")} aria-label="Copy Chatbot Link" disabled={!chatbotLink} className="h-9 w-9 sm:h-10 sm:w-10">
                {copied === "Chatbot Link" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Share this link for direct access to the chatbot. Useful for quick previews or when embedding isn't an option.</p>
             {!baseUrl && <p className="text-xs text-destructive mt-1">Base URL not yet available. Refresh page if needed.</p>}
             <Alert variant="default" className="mt-2 p-3 sm:p-4 bg-accent/10 dark:bg-accent/20 border-accent/30">
                <MessageSquare className="h-4 w-4 text-accent" />
                <AlertTitle className="text-accent text-sm sm:text-base">Embedding Note</AlertTitle>
                <AlertDescription className="text-accent/80 dark:text-accent/90 text-xs">
                The chat pages (like the direct link above) are designed to be embedded in iframes from any website, which is how the launcher script works.
                </AlertDescription>
            </Alert>
          </div>
          
          <Separator className="my-4 sm:my-6" />

          <div className="space-y-4">
            <h3 className={cn("font-headline text-lg sm:text-xl flex items-center gap-2", "text-gradient-dynamic")}>
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Enable Voice Calls with Twilio (Advanced)
            </h3>
            <Alert variant="default" className="p-3 sm:p-4 bg-muted/50 dark:bg-card/90 border-border/70">
                <PhoneCall className="h-4 w-4 text-muted-foreground" />
                <AlertTitle className="text-sm sm:text-base">Voice Agent Integration</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  To enable your AI agent to make and receive phone calls, provide your Twilio account credentials and phone number below. 
                  This requires additional backend setup by you or a developer to integrate with Twilio's voice services. 
                  AutoBoss provides the conversational intelligence; the call handling logic is configured in your Twilio account and interacts with the Voice API endpoint shown.
                </AlertDescription>
            </Alert>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label htmlFor="twilioSid">Twilio Account SID</Label>
                    <Input id="twilioSid" value={twilioAccountSid} onChange={(e) => setTwilioAccountSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="twilioToken">Twilio Auth Token</Label>
                    <Input id="twilioToken" type="password" value={twilioAuthToken} onChange={(e) => setTwilioAuthToken(e.target.value)} placeholder="Your Auth Token" />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label htmlFor="twilioPhone">Your Twilio Phone Number</Label>
                <Input id="twilioPhone" type="tel" value={twilioPhoneNumber} onChange={(e) => setTwilioPhoneNumber(e.target.value)} placeholder="+12345678901" />
            </div>
             <div className="space-y-1.5">
                <Label htmlFor="apiEndpointVoice" className="flex items-center mb-1 text-xs font-semibold">
                    <Server className="w-3 h-3 mr-1.5 text-primary" /> Voice API Endpoint (for Twilio Webhook)
                </Label>
                 <div className="flex items-center gap-2">
                    <Input id="apiEndpointVoice" value={apiEndpointVoice} readOnly className="text-[10px] sm:text-xs"/>
                    <Button variant="outline" size="icon" onClick={() => handleCopy(apiEndpointVoice, "Voice API Endpoint")} aria-label="Copy Voice API Endpoint" disabled={!apiEndpointVoice} className="h-8 w-8 sm:h-9 sm:w-9">
                        {copied === "Voice API Endpoint" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Configure this URL in your Twilio phone number's settings for incoming calls (Voice & Fax > A call comes in > Webhook).</p>
            </div>
            <Button disabled className="w-full sm:w-auto">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Save Twilio Configuration (Coming Soon)
            </Button>
          </div>


          <Separator className="my-4 sm:my-6" />

          <div className="space-y-3">
            <Label htmlFor="apiEndpointChat" className="flex items-center text-sm sm:text-base font-semibold">
              <Server className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" /> For Developers: Chat API Endpoint
            </Label>
             <Alert variant="default" className="p-3 sm:p-4 bg-muted/30 dark:bg-card/80 border-border/50">
                <Info className="h-4 w-4 text-muted-foreground" />
                <AlertTitle className="text-sm sm:text-base">Technical Chat API Details</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                  This POST endpoint allows programmatic interaction with the chatbot for text-based conversations.
                  <ul className="list-disc list-inside pl-3 mt-1 text-[11px] sm:text-xs">
                    <li><strong>message (string, required):</strong> User's input.</li>
                    <li><strong>flowState (object, optional):</strong> To continue a specific point in a designed conversation.</li>
                    <li><strong>conversationHistoryString (string, optional):</strong> For providing context if not using a flow.</li>
                  </ul>
                </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2">
              <Input id="apiEndpointChat" value={apiEndpointChat} readOnly className="text-xs sm:text-sm"/>
              <Button variant="outline" size="icon" onClick={() => handleCopy(apiEndpointChat, "Chat API Endpoint")} aria-label="Copy Chat API Endpoint" disabled={!apiEndpointChat} className="h-9 w-9 sm:h-10 sm:w-10">
                {copied === "Chat API Endpoint" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Use this API endpoint for custom text chat integrations if your client has specific technical needs beyond the standard embed.
            </p>
             {!baseUrl && <p className="text-xs text-destructive mt-1">Base URL not yet available.</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                <div>
                    <Label htmlFor="apiRequestExampleMinimal" className="flex items-center mb-1 text-xs sm:text-sm">
                    Example API Request (Simple Chat):
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
                    Example API Request (Resume Chat Conversation):
                    </Label>
                    <div className="relative">
                        <Textarea id="apiRequestExampleWithFlow" value={apiRequestExampleWithFlow} readOnly rows={10} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
                        <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(apiRequestExampleWithFlow, "API Request With Flow")} aria-label="Copy API Request With Flow" disabled={!apiRequestExampleWithFlow}>
                            {copied === "API Request With Flow" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="space-y-2 mt-3 sm:mt-4">
                <Label className="flex items-center mb-1 text-xs sm:text-sm">Example Chat API Responses:</Label>
                <div className="space-y-3">
                    <div>
                        <Label htmlFor="apiFlowResponseExample" className="text-[11px] sm:text-xs font-medium">If Following a Chat Conversation Design:</Label>
                        <div className="relative">
                            <Textarea id="apiFlowResponseExample" value={apiFlowResponseExample} readOnly rows={12} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
                            <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(apiFlowResponseExample, "API Flow Response")} aria-label="Copy API Flow Response" disabled={!apiFlowResponseExample}>
                                {copied === "API Flow Response" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="apiAutonomousResponseExample" className="text-[11px] sm:text-xs font-medium">If Answering Chat Freely (Using Trained Knowledge):</Label>
                         <div className="relative">
                            <Textarea id="apiAutonomousResponseExample" value={apiAutonomousResponseExample} readOnly rows={6} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
                            <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(apiAutonomousResponseExample, "API Autonomous Response")} aria-label="Copy API Autonomous Response" disabled={!apiAutonomousResponseExample}>
                                {copied === "API Autonomous Response" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
             <Alert variant="default" className="mt-3 sm:mt-4 p-3 sm:p-4">
                 <ShieldCheck className="h-4 w-4 text-primary" />
                 <AlertTitle className="text-sm sm:text-base">API Production Notes</AlertTitle>
                 <AlertDescription className="text-xs">
                     If using APIs directly in a production client application, consider API versioning, robust authentication mechanisms, rate limiting, and comprehensive logging & monitoring. The embed script handles most of this complexity for typical website chat use.
                 </AlertDescription>
             </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
