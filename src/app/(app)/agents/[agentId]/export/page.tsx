
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
  const { getAgent, updateAgent } = useAppContext(); 
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
      toast({ title: "Copy Failed", description: "Oops! Could not copy to clipboard. You may need to do it manually.", variant: "destructive" });
      console.error('Failed to copy: ', err);
    });
  };

  const chatbotLink = agent && baseUrl ? `${baseUrl}/chat/${agent.id}` : "";
  const apiEndpointChat = agent && baseUrl ? `${baseUrl}/api/agents/${agent.id}/chat` : "";
  const apiEndpointVoice = agent && baseUrl ? `${baseUrl}/api/agents/${agent.id}/voice-hook` : "";

  const primaryHslRef = useRef("0 0% 100%"); 
  const primaryFgHslRef = useRef("0 0% 0%");

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
    const POWERED_BY_HTML = \`${agent.isPubliclyShared ? poweredByAttribution.replace(/\\n\\s*/g, '').replace(/"/g, '\\"') : ''}\`;

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
        #autoboss-powered-by { 
            font-family: sans-serif; text-align: center; font-size: 10px; color: #aaa; 
            padding: 3px 0; border-top: 1px solid #eee; background-color: #fff;
            position: absolute; bottom: 0; left: 0; right: 0; z-index: 1;
        }
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
                iframe.style.height = 'calc(100% - 25px)'; 
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
      setAgent(prev => prev ? ({...prev, ...updatedAgentData, sharedAt: checked ? (Timestamp.now() as any) : null }) : null); 
      toast({
        title: `Showcase Status Updated!`,
        description: `Agent is now ${checked ? 'publicly listed' : 'private'}.`,
      });
    } catch (error) {
      console.error("Error updating share setting:", error);
      toast({ title: "Update Failed", description: "Oops! Could not update share setting.", variant: "destructive" });
    } finally {
      setIsSavingShareSetting(false);
    }
  };

  const generateShareLink = (platform: 'twitter' | 'linkedin') => {
    if (!agent) return;
    const agentUrl = encodeURIComponent(`${baseUrl}/chat/${agent.id}`);
    const agentName = encodeURIComponent(agent.generatedName || agent.name);
    const text = encodeURIComponent(`Check out this AI Agent I built for ${agent.clientName || 'a client'} with AutoBoss: "${agentName}"!`);
    
    if (platform === 'twitter') {
      router.push(`https://twitter.com/intent/tweet?url=${agentUrl}&text=${text}`);
    } else if (platform === 'linkedin') {
      router.push(`https://www.linkedin.com/sharing/share-offsite/?url=${agentUrl}`);
    }
  };


  if (!agent) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6"><CardTitle className="text-lg sm:text-xl">Loading Agent Details...</CardTitle></CardHeader>
        <CardContent className="p-4 sm:p-6"><Loader2 className="animate-spin mr-2 h-5 w-5 inline"/>Please wait...</CardContent>
      </Card>
    );
  }

  const showChatFeatures = agent.agentType === 'chat' || agent.agentType === 'hybrid';
  const showVoiceFeatures = agent.agentType === 'voice' || agent.agentType === 'hybrid';

  const getDefaultTab = () => {
    if (showChatFeatures) return "chat";
    if (showVoiceFeatures) return "voice";
    return "share";
  }

  return (
    <div className="space-y-4">
        <Card>
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="font-headline text-2xl sm:text-3xl flex items-center gap-2"> <Share2 className="w-6 h-6 sm:w-7 sm:h-7"/>Deploy & Share: {agent.generatedName || agent.name}</CardTitle>
                <CardDescription className="text-sm">Get your AI agent working for your client. Choose how you want to deploy it below.</CardDescription>
            </CardHeader>
        </Card>
        <Tabs defaultValue={getDefaultTab()} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                {showChatFeatures && <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-2"/>Website Chat</TabsTrigger>}
                {showVoiceFeatures && <TabsTrigger value="voice"><PhoneCall className="w-4 h-4 mr-2"/>Voice Calling</TabsTrigger>}
                <TabsTrigger value="share"><Eye className="w-4 h-4 mr-2"/>Public Showcase</TabsTrigger>
                <TabsTrigger value="api"><Code className="w-4 h-4 mr-2"/>Developer API</TabsTrigger>
            </TabsList>
            
            {showChatFeatures && (
                <TabsContent value="chat">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg"><Code className="w-5 h-5 mr-2" />Add a Chatbot to Any Website</CardTitle>
                            <CardDescription>Give this code to your client. Pasting it on their website will add a chat bubble that opens your agent.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>How to Install</AlertTitle>
                                <AlertDescription className="text-xs">
                                   <ol className="list-decimal pl-4 space-y-1">
                                        <li>Click the "Copy Script" button below.</li>
                                        <li>Paste this single line of code anywhere in the website's HTML, ideally just before the closing `&lt;/body&gt;` tag.</li>
                                        <li>That's it! The chat launcher will appear on the site.</li>
                                   </ol>
                                </AlertDescription>
                            </Alert>
                            <div className="relative">
                                <Label htmlFor="chatLauncherScript" className="text-xs font-semibold">One-Line Install Script</Label>
                                <Textarea id="chatLauncherScript" value={chatLauncherScript.trim()} readOnly rows={6} className="font-code text-xs bg-muted/50 p-2 mt-1"/>
                                <Button variant="outline" size="icon" className="absolute top-7 right-2 h-7 w-7" onClick={() => handleCopy(chatLauncherScript.trim(), "Embed Script")} aria-label="Copy Chat Launcher Script" disabled={!chatLauncherScript}>
                                {copied === "Embed Script" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                            <div>
                                <Label htmlFor="chatbotLink" className="text-sm font-semibold">Or, Share a Direct Link</Label>
                                <div className="flex items-center gap-2 mt-1">
                                <Input id="chatbotLink" value={chatbotLink} readOnly className="text-sm"/>
                                <Button variant="outline" size="icon" onClick={() => handleCopy(chatbotLink, "Chat Link")} aria-label="Copy Chatbot Link" disabled={!chatbotLink} className="h-9 w-9">
                                    {copied === "Chat Link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            )}

            {showVoiceFeatures && (
                <TabsContent value="voice">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center text-lg"><PhoneCall className="w-5 h-5 mr-2" /> Connect to a Phone Number</CardTitle>
                            <CardDescription>Use this webhook URL in your Twilio phone number settings to power an AI voice agent.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <Alert>
                                <Info className="h-4 w-4" />
                                <AlertTitle>How It Works</AlertTitle>
                                <AlertDescription className="text-xs">
                                   When someone calls your client's Twilio number, Twilio will send a request to this URL. Your agent will then respond and handle the call.
                                </AlertDescription>
                            </Alert>
                            <div className="space-y-1.5">
                                <Label htmlFor="apiEndpointVoice" className="text-sm font-semibold">Twilio Voice Webhook URL</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Input id="apiEndpointVoice" value={apiEndpointVoice} readOnly className="text-xs"/>
                                    <Button variant="outline" size="icon" onClick={() => handleCopy(apiEndpointVoice, "Webhook URL")} aria-label="Copy Voice API Endpoint" disabled={!apiEndpointVoice} className="h-9 w-9">
                                        {copied === "Webhook URL" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                            <Alert variant="default" className="bg-secondary">
                                <Info className="h-4 w-4" />
                                <AlertTitle>Important Setup Note</AlertTitle>
                                <AlertDescription className="text-xs">
                                    For voice calls to work, you or your client's Twilio credentials must be added in the main <Button variant="link" asChild className="p-0 h-auto text-xs"><Link href="/settings">Settings <ExternalLink className="w-2.5 h-2.5 ml-0.5"/></Link></Button> page.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>
                </TabsContent>
            )}

            <TabsContent value="share">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg"><Eye className="w-5 h-5 mr-2" /> Public Showcase</CardTitle>
                        <CardDescription>Opt-in to list this agent in the public AutoBoss Showcase to demonstrate your work and attract new clients.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-3 p-4 border rounded-lg bg-secondary">
                            <Switch
                                id="showcase-switch"
                                checked={isPubliclyShared}
                                onCheckedChange={handleShareToggle}
                                disabled={isSavingShareSetting}
                            />
                            <Label htmlFor="showcase-switch" className="text-sm font-medium flex-1 cursor-pointer">
                                {isPubliclyShared ? "This agent IS publicly listed" : "List this agent publicly"}
                            </Label>
                            {isSavingShareSetting && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                        {isPubliclyShared && (
                            <>
                            <Alert variant="default" className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
                                <CheckCircle className="h-4 w-4"/>
                                <AlertTitle className="font-medium">Your Agent is Live!</AlertTitle>
                                <AlertDescription className="text-xs">
                                    Other users can now discover and interact with this agent. 
                                    <Button variant="link" asChild className="p-0 h-auto text-xs ml-1"><Link href="/showcase" target="_blank">View Showcase <ExternalLink className="w-2.5 h-2.5 ml-0.5" /></Link></Button>
                                </AlertDescription>
                            </Alert>
                            <div className="flex items-center gap-2 pt-2">
                                <Button onClick={() => generateShareLink('twitter')} size="sm" className="flex-1 text-xs">Share on X / Twitter</Button>
                                <Button onClick={() => generateShareLink('linkedin')} size="sm" className="flex-1 text-xs">Share on LinkedIn</Button>
                            </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

             <TabsContent value="api">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg"><Server className="w-5 h-5 mr-2" /> Developer API</CardTitle>
                        <CardDescription>For advanced users. Use this endpoint for custom programmatic integrations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="apiEndpointChat" className="text-sm font-semibold">Chat API Endpoint (POST)</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Input id="apiEndpointChat" value={apiEndpointChat} readOnly className="text-sm"/>
                            <Button variant="outline" size="icon" onClick={() => handleCopy(apiEndpointChat, "Chat API Endpoint")} aria-label="Copy Chat API Endpoint" disabled={!apiEndpointChat} className="h-9 w-9">
                            {copied === "Chat API Endpoint" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                    <Alert variant="default" className="bg-secondary">
                        <Info className="h-4 w-4" />
                        <AlertTitle>API Usage</AlertTitle>
                        <AlertDescription className="text-xs">
                            Send a JSON body with a `message` (string) and optional `conversationHistory` (array of strings) to this endpoint.
                        </AlertDescription>
                    </Alert>
                    </CardContent>
                </Card>
            </TabsContent>

        </Tabs>
    </div>
  );
}
