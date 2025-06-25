"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChatInterface, ChatInterfaceHandles } from "@/components/chat-interface";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAppContext } from "../../../layout";
import type { Agent, ChatMessage as ChatMessageType } from "@/lib/types";
import { Loader2, Mic, MicOff, Volume2, VolumeX, Settings2, AlertTriangle, PhoneOff, MessageSquare } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { generateSpeech } from "@/ai/flows/text-to-speech-flow";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

// Helper function to strip emojis from text, as they can cause issues with TTS engines
function stripEmojis(text: string): string {
  if (!text) return "";
  return text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
}

export default function TestAgentPage() {
  const params = useParams();
  const appContextValue = useAppContext();
  const { getAgent, isLoadingAgents } = appContextValue;
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined);
  const { toast } = useToast();

  const chatInterfaceRef = useRef<ChatInterfaceHandles>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(true);
  const [speechApiError, setSpeechApiError] = useState<string | null>(null);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true);
  
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (!isLoadingAgents && agentId) {
      const foundAgent = getAgent(agentId as string);
      setAgent(foundAgent);
      if (foundAgent?.agentType === 'voice' || foundAgent?.agentType === 'hybrid') {
        setAutoSpeakEnabled(true);
      }
    } else if (!isLoadingAgents && !agentId) {
      setAgent(null);
    }
  }, [agentId, getAgent, isLoadingAgents]);

  const stopCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.onerror = null;
      currentAudioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);


  useEffect(() => {
    if (typeof window !== 'undefined' && (!window.SpeechRecognition && !window.webkitSpeechRecognition)) {
      setSpeechRecognitionSupported(false);
      setSpeechApiError("Speech recognition not supported by your browser.");
    }
    
    // Cleanup on unmount
    return () => {
      recognitionRef.current?.abort();
      stopCurrentAudio();
    };
  }, [stopCurrentAudio]);


  const speakText = useCallback(async (text: string) => {
    if (!text || !autoSpeakEnabled || !agent) return;

    stopCurrentAudio();

    const cleanedText = stripEmojis(text);
    if (!cleanedText) return;

    setIsSpeaking(true);

    try {
      const result = await generateSpeech({
        text: cleanedText,
        voiceName: agent.voiceName,
      });

      const newAudio = new Audio(result.audioUrl);
      currentAudioRef.current = newAudio;

      newAudio.onended = () => {
        setIsSpeaking(false);
        currentAudioRef.current = null;
      };

      newAudio.onerror = (e) => {
        const error = (e.target as HTMLAudioElement).error;
        console.error("Audio playback error:", error);
        toast({ title: "Audio Error", description: error?.code ? `Could not play agent's voice. Code: ${error.code}, Message: ${error.message}` : "The browser could not play the generated audio.", variant: "destructive" });
        setIsSpeaking(false);
        currentAudioRef.current = null;
      };

      await newAudio.play();

    } catch (error: any) {
      console.error("Error generating or playing speech:", error);
      toast({ title: "Speech Generation Failed", description: error.message || "Could not generate voice.", variant: "destructive" });
      setIsSpeaking(false);
      currentAudioRef.current = null;
    }
  }, [agent, toast, autoSpeakEnabled, stopCurrentAudio]);


  const handleNewAgentMessage = useCallback((message: ChatMessageType) => {
    if (message.sender === 'agent' && message.text && autoSpeakEnabled) {
      speakText(message.text);
    }
  }, [speakText, autoSpeakEnabled]);

  const toggleListen = () => {
    if (!speechRecognitionSupported) {
       toast({ title: "Not Supported", description: "Speech recognition is not supported by your browser.", variant: "destructive"});
       return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      stopCurrentAudio();

      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false; 
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        let errorMsg = `Speech recognition error: ${event.error}.`;
        if (event.error === 'no-speech') errorMsg = "No speech was detected. Please try again.";
        if (event.error === 'audio-capture') errorMsg = "Audio capture failed. Check microphone permissions.";
        if (event.error === 'not-allowed') errorMsg = "Microphone access was denied.";
        
        toast({ title: "Speech Error", description: errorMsg, variant: "destructive" });
      };
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (chatInterfaceRef.current) {
          chatInterfaceRef.current.setInputText(transcript);
          setTimeout(() => { 
            chatInterfaceRef.current?.submitMessageFromText(transcript);
          }, 50);
        }
      };
      recognitionRef.current.start();
    }
  };

  if (isLoadingAgents || (agent === undefined && agentId)) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-headline text-xl sm:text-2xl text-primary">Test Your Client's Agent</CardTitle>
          <CardDescription className="text-sm">Loading agent emulator...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] p-4 sm:p-6">
          <Logo className="mb-3 h-8" />
          <Loader2 className="h-10 w-10 sm:h-12 sm:h-12 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground mt-2">Initializing agent test environment...</p>
        </CardContent>
      </Card>
    );
  }

  if (!agent) {
     return (
        <Alert variant="destructive" className="max-w-md w-full">
            <AlertTriangle className="h-6 w-6 sm:h-8 sm:h-8 mx-auto mb-2" />
            <AlertTitle className="text-lg sm:text-xl mb-1">Agent Not Found</AlertTitle>
            <AlertDescription className="text-sm">The agent details could not be loaded.</AlertDescription>
        </Alert>
    );
  }

  const showVoiceControls = agent.agentType === 'voice' || agent.agentType === 'hybrid';

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="h-[55vh] flex flex-col">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-headline text-xl sm:text-2xl text-primary">Test Agent: {agent.generatedName || agent.name}</CardTitle>
          <CardDescription className="text-sm">Preview and interact with this agent. Test all conversation paths before deploying.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-2 sm:p-4 md:p-6 min-h-0">
          <div className="h-full">
            <ChatInterface ref={chatInterfaceRef} agent={agent} appContext={appContextValue} onNewAgentMessage={handleNewAgentMessage} />
          </div>
        </CardContent>
      </Card>

      {showVoiceControls ? (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-headline text-lg sm:text-xl flex items-center gap-2 text-primary">
              <Settings2 className="w-5 h-5 sm:w-6 sm:w-6 text-primary" /> Voice Interaction Controls
            </CardTitle>
            <CardDescription className="text-sm">
              Enable voice input/output to test your agent's conversational abilities. This uses the agent's configured voice.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {speechApiError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Browser Support Notice</AlertTitle>
                <AlertDescription>{speechApiError}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <Button
                onClick={toggleListen}
                disabled={!speechRecognitionSupported || isSpeaking}
                variant={isListening ? "destructive" : "outline"}
                className="w-full sm:w-auto"
                size="lg"
                title={isListening ? "Stop voice input" : "Start voice input"}
              >
                {isListening ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
                {isListening ? "Stop Listening" : "Start Listening"}
              </Button>
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start">
                <Switch
                  id="auto-speak-switch"
                  checked={autoSpeakEnabled}
                  onCheckedChange={setAutoSpeakEnabled}
                  disabled={isSpeaking}
                />
                <Label htmlFor="auto-speak-switch" className="text-sm flex items-center gap-1 cursor-pointer">
                  {autoSpeakEnabled ? <Volume2 size={18} className="text-primary"/> : <VolumeX size={18} className="text-muted-foreground"/>}
                   Auto-Speak Agent Voice
                </Label>
              </div>
            </div>
             {isListening && <p className="text-sm text-primary text-center animate-pulse">Listening for your input...</p>}
             {isSpeaking && autoSpeakEnabled && <p className="text-sm text-primary text-center animate-pulse">Agent is speaking...</p>}
          </CardContent>
          <CardFooter className="p-4 sm:p-6 text-xs text-muted-foreground">
              <Alert variant="default" className="bg-secondary">
                  <PhoneOff className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary text-sm">Voice Test Simulation</AlertTitle>
                  <AlertDescription className="text-muted-foreground text-xs">
                    This page now simulates calls using your agent's actual configured voice. The real-world call via Twilio will use its own high-quality voice synthesis.
                  </AlertDescription>
              </Alert>
          </CardFooter>
        </Card>
      ) : (
        <Alert variant="default" className="mt-4 bg-secondary">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <AlertTitle>Chat-Only Agent</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            This is a chat-only agent. Voice interaction controls are available for 'Voice' or 'Hybrid' agent types, configurable during agent creation or in its personality settings.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
