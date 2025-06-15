
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Check, Globe, Code, Server, MessageSquare, Info, ShieldCheck, Share2, Mic, PhoneCall, Loader2, ExternalLink, Eye, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "../../../layout";
import type { Agent } from "@/lib/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Timestamp } from "firebase/firestore";

export default function ExportAgentPage() {
  const params = useParams();
  const router = useRouter();
  const { getAgent, updateAgent } = useAppContext(); // Added updateAgent
  const [agent, setAgent] = useState<Agent | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState("");

  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");
  const [isPubliclyShared, setIsPubliclyShared] = useState(false);
  const [isSavingShareSetting, setIsSavingShareSetting] = useState(false);

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
      if (foundAgent) {
        setIsPubliclyShared(foundAgent.isPubliclyShared || false);
      }
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

  const primaryHslRef = useRef("217 91% 58%"); 
  const primaryFgHslRef = useRef("210 100% 98%");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement);
      const primaryVar = computedStyle.getPropertyValue('--primary').trim();
      const primaryFgVar = computedStyle.getPropertyValue('--primary-foreground').trim();
      if (primaryVar) primaryHslRef.current = primaryVar;
      if (primaryFgVar) primaryFgHslRef.current = primaryFgVar;
    }
  }, []);

  const poweredByAttribution = `
    <div style="font-family: sans-serif; text-align: center; font-size: 10px; color: #aaa; padding: 5px 0; margin-top: 5px; border-top: 1px solid #eee;">
        Powered by <a href="${baseUrl}" target="_blank" style="color: #888; text-decoration: none;">AutoBoss</a>
    </div>`;

  const chatLauncherScript = agent && baseUrl ? `
<script type="text/javascript">
(function() {
    const AGENT_ID = '${agent.id}';
    const BASE_URL = '${baseUrl}';
    const AGENT_NAME = '${agent.generatedName || agent.name}';
    const CHAT_URL = \`\${BASE_URL}/chat/\${AGENT_ID}\`;
    const LAUNCHER_BG_COLOR = 'hsl(${primaryHslRef.current})';
    const LAUNCHER_FG_COLOR = 'hsl(${primaryFgHslRef.current})';
    const HEADER_BG_COLOR = LAUNCHER_BG_COLOR;
    const HEADER_FG_COLOR = LAUNCHER_FG_COLOR;
    const WIDGET_BORDER_COLOR = '#e0e0e0';
    const POWERED_BY_HTML = \`${agent.isPubliclyShared ? poweredByAttribution.replace(/\n\s*/g, '') : ''}\`;

    const styles = \`
        #autoboss-launcher-button {
            position: fixed; bottom: 20px; right: 20px; background-color: \${LAUNCHER_BG_COLOR};
            color: \${LAUNCHER_FG_COLOR}; border: none; border-radius: 50%;
            width: 50px; height: 50px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; z-index: 2147483646;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        @media (min-width: 640px) { #autoboss-launcher-button { width: 60px; height: 60px; } }
        #autoboss-launcher-button:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        #autoboss-widget-container {
            position: fixed; bottom: 20px; right: 20px;
            width: calc(100% - 40px); max-width: 370px; 
            height: 70vh; max-height: 600px; 
            border: 1px solid \${WIDGET_BORDER_COLOR}; border-radius: 12px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.15); overflow: hidden; display: none;
            z-index: 2147483647; background-color: #ffffff; flex-direction: column;
            transition: opacity 0.3s ease, transform 0.3s ease; opacity: 0; transform: translateY(20px);
        }
         @media (min-width: 640px) { #autoboss-widget-container { bottom: 90px; } }
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
        #autoboss-widget-iframe-wrapper { flex-grow: 1; overflow: hidden; position: relative; }
        #autoboss-widget-container iframe { width: 100%; height: 100%; border: none; }
        #autoboss-powered-by { position: absolute; bottom: 0; left: 0; right: 0; background: #fff; z-index: 1; }
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
        if (!iframe) { 
            iframe = document.createElement('iframe'); iframe.src = CHAT_URL; 
            iframeWrapper.appendChild(iframe); 
            if (POWERED_BY_HTML) { 
                const poweredByDiv = document.createElement('div'); 
                poweredByDiv.id = 'autoboss-powered-by'; 
                poweredByDiv.innerHTML = POWERED_BY_HTML; 
                iframeWrapper.appendChild(poweredByDiv);
                iframe.style.height = 'calc(100% - 25px)'; // Adjust iframe height if attribution is present
            }
        }
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

  const handleShareToggle = async (checked: boolean) => {
    if (!agent) return;
    setIsSavingShareSetting(true);
    try {
      const updatedAgentData: Partial<Agent> = {
        isPubliclyShared: checked,
        sharedAt: checked ? Timestamp.now() : null,
      };
      await updateAgent({ ...agent, ...updatedAgentData });
      setIsPubliclyShared(checked);
      setAgent(prev => prev ? ({...prev, ...updatedAgentData, sharedAt: checked ? (Timestamp.now() as any) : null }) : null); // Update local agent state
      toast({
        title: `Agent Showcase Status Updated`,
        description: `Agent is now ${checked ? 'publicly shared' : 'private'}.`,
      });
    } catch (error) {
      console.error("Error updating share setting:", error);
      toast({ title: "Error", description: "Could not update share setting.", variant: "destructive" });
    } finally {
      setIsSavingShareSetting(false);
    }
  };


  if (!agent) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6"><CardTitle className="text-lg sm:text-xl">Loading Agent Export Details...</CardTitle></CardHeader>
        <CardContent className="p-4 sm:p-6"><Loader2 className="animate-spin mr-2 h-5 w-5 inline"/>Please wait...</CardContent>
      </Card>
    );
  }

  const showChatFeatures = agent.agentType === 'chat' || agent.agentType === 'hybrid';
  const showVoiceFeatures = agent.agentType === 'voice' || agent.agentType === 'hybrid';

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}> <Share2 className="w-6 h-6 sm:w-7 sm:h-7"/>Deploy & Share: {agent.generatedName || agent.name}</CardTitle>
          <CardDescription className="text-sm">Easily embed this AI agent or provide direct links for your client. Use the tabs below to navigate different deployment options.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Tabs defaultValue="embed" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 mb-4 sm:mb-6 h-auto sm:h-10">
              <TabsTrigger value="embed" className="text-xs sm:text-sm py-1.5 sm:py-2">Embed & Share Links</TabsTrigger>
              <TabsTrigger value="voice" className="text-xs sm:text-sm py-1.5 sm:py-2" disabled={!showVoiceFeatures}>Voice (Twilio Setup)</TabsTrigger>
              <TabsTrigger value="api" className="text-xs sm:text-sm py-1.5 sm:py-2">Developer API</TabsTrigger>
              <TabsTrigger value="showcase" className="text-xs sm:text-sm py-1.5 sm:py-2">Public Showcase</TabsTrigger>
            </TabsList>

            <TabsContent value="embed" className="space-y-6 sm:space-y-8">
              {showChatFeatures ? (
                <>
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
                    <p className="text-xs text-muted-foreground mt-1">This script creates a floating button that opens the chatbot in a popup. It's the easiest way to integrate. Test this script on a simple HTML page before deploying to a live client site.</p>
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
                    <p className="text-xs text-muted-foreground mt-1">Share this link for direct access. Useful for quick previews or when embedding isn't an option.</p>
                     {!baseUrl && <p className="text-xs text-destructive mt-1">Base URL not yet available. Refresh page if needed.</p>}
                     <Alert variant="default" className="mt-2 p-3 sm:p-4 bg-accent/10 dark:bg-accent/20 border-accent/30">
                        <MessageSquare className="h-4 w-4 text-accent" />
                        <AlertTitle className="text-accent text-sm sm:text-base">Embedding Note</AlertTitle>
                        <AlertDescription className="text-accent/80 dark:text-accent/90 text-xs">
                        The chat pages (like the direct link above) are designed to be embedded in iframes from any website, which is how the launcher script works.
                        </AlertDescription>
                    </Alert>
                  </div>
                </>
              ) : (
                <Alert variant="default">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <AlertTitle>Chat Features Not Applicable</AlertTitle>
                  <AlertDescription>Chat embed script and direct chat links are available for 'Chat' or 'Hybrid' agent types. This agent is 'Voice'-only.</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="voice" className="space-y-4">
              {showVoiceFeatures ? (
                <div className="space-y-4">
                  <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                    <Mic className="w-5 h-5 sm:w-6 sm:w-6 text-primary" /> Enable Voice Calls with Twilio
                  </h3>
                  <Alert variant="default" className="p-3 sm:p-4 bg-muted/50 dark:bg-card/90 border-border/70">
                      <PhoneCall className="h-4 w-4 text-muted-foreground" />
                      <AlertTitle className="text-sm sm:text-base">Voice Agent Integration</AlertTitle>
                      <AlertDescription className="text-xs text-muted-foreground">
                        To enable your AI agent to make and receive phone calls *using your Twilio account*, first save your Twilio credentials in your main <Button variant="link" asChild className="p-0 h-auto text-xs"><Link href="/settings">User Profile Settings <ExternalLink className="w-2.5 h-2.5 ml-0.5"/></Link></Button>.
                        The fields below are for your reference and to help you configure your Twilio phone number's webhook.
                      </AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                          <Label htmlFor="twilioSid">Twilio Account SID (Reference)</Label>
                          <Input id="twilioSid" value={twilioAccountSid} onChange={(e) => setTwilioAccountSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                      </div>
                      <div className="space-y-1.5">
                          <Label htmlFor="twilioToken">Twilio Auth Token (Reference)</Label>
                          <Input id="twilioToken" type="password" value={twilioAuthToken} onChange={(e) => setTwilioAuthToken(e.target.value)} placeholder="Your Auth Token" />
                      </div>
                  </div>
                  <div className="space-y-1.5">
                      <Label htmlFor="twilioPhone">Your Twilio Phone Number (Reference)</Label>
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
                      <p className="text-[10px] text-muted-foreground mt-0.5">Configure this URL in your Twilio phone number's settings for incoming calls (Voice & Fax &gt; A call comes in &gt; Webhook).</p>
                  </div>
                  <Button asChild className="w-full sm:w-auto">
                    <Link href="/settings">
                      <Info className="mr-2 h-4 w-4" />
                      Important: Save Credentials in User Settings or Server Environment
                    </Link>
                  </Button>
                </div>
              ) : (
                 <Alert variant="default">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <AlertTitle>Voice Features Not Applicable</AlertTitle>
                    <AlertDescription>Twilio configuration for voice calls is available for 'Voice' or 'Hybrid' agent types. This agent is 'Chat'-only.</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="api" className="space-y-3">
              <Label className="flex items-center text-sm sm:text-base font-semibold">
                <Server className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary" /> For Developers: API Endpoints
              </Label>
               <Alert variant="default" className="p-3 sm:p-4 bg-muted/30 dark:bg-card/80 border-border/50">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <AlertTitle className="text-sm sm:text-base">Technical API Details</AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground">
                    These POST endpoints allow programmatic interaction with the agent.
                    <ul className="list-disc list-inside pl-3 mt-1 text-[11px] sm:text-xs">
                      <li><strong>message (string, required for chat):</strong> User's input.</li>
                      <li><strong>conversationHistory (array of strings, optional):</strong> Past messages in "Sender: Message" format.</li>
                    </ul>
                  </AlertDescription>
              </Alert>
              <div className="space-y-2">
                  <div>
                      <Label htmlFor="apiEndpointChat" className="text-xs font-semibold">Chat API Endpoint</Label>
                      <div className="flex items-center gap-2">
                        <Input id="apiEndpointChat" value={apiEndpointChat} readOnly className="text-xs sm:text-sm"/>
                        <Button variant="outline" size="icon" onClick={() => handleCopy(apiEndpointChat, "Chat API Endpoint")} aria-label="Copy Chat API Endpoint" disabled={!apiEndpointChat} className="h-9 w-9 sm:h-10 sm:w-10">
                          {copied === "Chat API Endpoint" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                  </div>
                  {showVoiceFeatures && (
                      <div>
                          <Label htmlFor="apiEndpointVoiceDev" className="text-xs font-semibold">Voice API Endpoint (Webhook)</Label>
                          <div className="flex items-center gap-2">
                              <Input id="apiEndpointVoiceDev" value={apiEndpointVoice} readOnly className="text-xs sm:text-sm"/>
                              <Button variant="outline" size="icon" onClick={() => handleCopy(apiEndpointVoice, "Voice API Endpoint Dev")} aria-label="Copy Voice API Endpoint" disabled={!apiEndpointVoice} className="h-9 w-9 sm:h-10 sm:w-10">
                                  {copied === "Voice API Endpoint Dev" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                              </Button>
                          </div>
                           <p className="text-[10px] text-muted-foreground mt-0.5">Use this for Twilio webhook configuration if building a voice agent.</p>
                      </div>
                  )}
              </div>
               {!baseUrl && <p className="text-xs text-destructive mt-1">Base URL not yet available.</p>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                  <div>
                      <Label htmlFor="apiRequestExampleMinimal" className="flex items-center mb-1 text-xs sm:text-sm">
                      Example Chat API Request (Simple):
                      </Label>
                      <div className="relative">
                          <Textarea id="apiRequestExampleMinimal" value={`{\n  "message": "Hello, what can you do?"\n}`} readOnly rows={3} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
                          <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(`{\n  "message": "Hello, what can you do?"\n}`, "API Request Minimal")} aria-label="Copy API Request Minimal" >
                              {copied === "API Request Minimal" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                          </Button>
                      </div>
                  </div>
                   <div>
                      <Label htmlFor="apiRequestExampleWithFlow" className="flex items-center mb-1 text-xs sm:text-sm">
                      Example Chat API Request (With History):
                      </Label>
                      <div className="relative">
                          <Textarea id="apiRequestExampleWithFlow" value={`{\n  "message": "My order ID is 12345",\n  "conversationHistory": ["User: I want to check my order status", "Agent: Sure, what is your order ID?"]\n}`} readOnly rows={6} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
                          <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(`{\n  "message": "My order ID is 12345",\n  "conversationHistory": ["User: I want to check my order status", "Agent: Sure, what is your order ID?"]\n}`, "API Request With Flow")} aria-label="Copy API Request With Flow">
                              {copied === "API Request With Flow" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                          </Button>
                      </div>
                  </div>
              </div>
              <div className="space-y-2 mt-3 sm:mt-4">
                  <Label className="flex items-center mb-1 text-xs sm:text-sm">Example Chat API Response:</Label>
                    <div>
                        <Label htmlFor="apiAutonomousResponseExample" className="text-[11px] sm:text-xs font-medium">Typical Chat Response:</Label>
                         <div className="relative">
                            <Textarea id="apiAutonomousResponseExample" value={`{\n  "reply": "As an AI assistant, I can answer your questions based on my knowledge.",\n  "reasoning": "...",\n  "relevantKnowledgeIds": []\n}`} readOnly rows={5} className="font-code text-[10px] sm:text-xs bg-muted/50 p-2"/>
                            <Button variant="outline" size="icon" className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleCopy(`{\n  "reply": "As an AI assistant, I can answer your questions based on my knowledge.",\n  "reasoning": "...",\n  "relevantKnowledgeIds": []\n}`, "API Autonomous Response")} aria-label="Copy API Autonomous Response">
                                {copied === "API Autonomous Response" ? <Check className="w-3 h-3 sm:w-4 sm:w-4 text-green-500" /> : <Copy className="w-3 h-3 sm:w-4 sm:w-4" />}
                            </Button>
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
            </TabsContent>

            <TabsContent value="showcase" className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                        <Eye className="w-5 h-5 sm:w-6 sm:w-6 text-primary" /> Public Agent Showcase
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Opt-in to list this agent in the public AutoBoss Showcase. This can help attract users and demonstrate your work.
                    </p>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg bg-muted/30">
                    <Switch
                        id="showcase-switch"
                        checked={isPubliclyShared}
                        onCheckedChange={handleShareToggle}
                        disabled={isSavingShareSetting}
                    />
                    <Label htmlFor="showcase-switch" className="text-sm font-medium flex-1 cursor-pointer">
                        {isPubliclyShared ? "This agent IS publicly listed in the Showcase" : "List this agent in the Public Showcase"}
                    </Label>
                    {isSavingShareSetting && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
                {isPubliclyShared && (
                    <Alert variant="default" className="bg-green-500/10 dark:bg-green-500/20 border-green-500/30">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400"/>
                        <AlertTitle className="text-green-700 dark:text-green-300 font-medium">Agent is Live in Showcase!</AlertTitle>
                        <AlertDescription className="text-green-600/90 dark:text-green-200/90 text-xs">
                            Other users can now discover this agent. 
                            <Link href="/showcase" className="underline ml-1 hover:text-green-500" target="_blank">View Showcase</Link>
                        </AlertDescription>
                    </Alert>
                )}
                 <Alert variant="default" className="mt-3">
                   <Info className="h-4 w-4"/>
                   <AlertTitle>Important Considerations</AlertTitle>
                   <AlertDescription className="text-xs">
                     By making this agent public, its name, description, image, and a link to its chat interface will be visible to anyone visiting the showcase. Ensure your agent's personality and branding are client-appropriate if you built this for someone else.
                     You can toggle this off at any time.
                   </AlertDescription>
               </Alert>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

