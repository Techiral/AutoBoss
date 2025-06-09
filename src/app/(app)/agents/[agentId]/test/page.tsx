
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChatInterface, ChatInterfaceHandles } from "@/components/chat-interface";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAppContext } from "../../../layout";
import type { Agent, ChatMessage as ChatMessageType } from "@/lib/types";
import { Loader2, Mic, MicOff, Volume2, Settings2, AlertTriangle } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function TestAgentPage() {
  const params = useParams();
  const appContextValue = useAppContext();
  const { getAgent, isLoadingAgents } = appContextValue;
  const [agent, setAgent] = useState<Agent | null | undefined>(undefined);
  const { toast } = useToast();

  const chatInterfaceRef = useRef<ChatInterfaceHandles>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>(undefined);
  const [speechApiError, setSpeechApiError] = useState<string | null>(null);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(true);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(true);


  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;

  useEffect(() => {
    if (!isLoadingAgents && agentId) {
      const foundAgent = getAgent(agentId as string);
      setAgent(foundAgent);
    } else if (!isLoadingAgents && !agentId) {
      setAgent(null);
    }
  }, [agentId, getAgent, isLoadingAgents]);

  const populateVoiceList = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        // Try to set a default voice, prefer non-remote, default, and English ones
        const defaultUsVoice = voices.find(voice => voice.lang.startsWith('en-US') && voice.default && !voice.localService);
        const defaultUkVoice = voices.find(voice => voice.lang.startsWith('en-GB') && voice.default && !voice.localService);
        const anyDefaultVoice = voices.find(voice => voice.default);
        const firstUsVoice = voices.find(voice => voice.lang.startsWith('en-US'));
        const firstUkVoice = voices.find(voice => voice.lang.startsWith('en-GB'));

        if (defaultUsVoice) setSelectedVoiceURI(defaultUsVoice.voiceURI);
        else if (defaultUkVoice) setSelectedVoiceURI(defaultUkVoice.voiceURI);
        else if (anyDefaultVoice) setSelectedVoiceURI(anyDefaultVoice.voiceURI);
        else if (firstUsVoice) setSelectedVoiceURI(firstUsVoice.voiceURI);
        else if (firstUkVoice) setSelectedVoiceURI(firstUkVoice.voiceURI);
        else if (voices[0]) setSelectedVoiceURI(voices[0].voiceURI);
        setSpeechSynthesisSupported(true);
      } else {
        // Voices might load async
      }
    } else {
      setSpeechSynthesisSupported(false);
      setSpeechApiError(prev => prev ? prev + " Speech synthesis not supported." : "Speech synthesis not supported.");
    }
  }, []);

  useEffect(() => {
    populateVoiceList();
    if (typeof window !== 'undefined' && window.speechSynthesis && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    if (typeof window !== 'undefined' && (!window.SpeechRecognition && !window.webkitSpeechRecognition)) {
      setSpeechRecognitionSupported(false);
      setSpeechApiError(prev => prev ? prev + " Speech recognition not supported." : "Speech recognition not supported.");
    }
  }, [populateVoiceList]);


  const speakText = useCallback((text: string) => {
    if (!text || !speechSynthesisSupported) return;
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel(); // Cancel previous speech
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoiceURI) {
      const voice = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (voice) utterance.voice = voice;
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
      toast({ title: "Speech Error", description: `Could not speak: ${event.error}`, variant: "destructive" });
      setIsSpeaking(false);
    };
    speechSynthesis.speak(utterance);
  }, [availableVoices, selectedVoiceURI, toast, speechSynthesisSupported]);

  const handleNewAgentMessage = useCallback((message: ChatMessageType) => {
    if (message.sender === 'agent' && message.text) {
      speakText(message.text);
    }
  }, [speakText]);

  const toggleListen = () => {
    if (!speechRecognitionSupported) {
       toast({ title: "Not Supported", description: "Speech recognition is not supported by your browser.", variant: "destructive"});
       return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        setSpeechApiError("Speech recognition not supported by this browser.");
        toast({ title: "Not Supported", description: "Speech recognition is not supported by your browser.", variant: "destructive"});
        setSpeechRecognitionSupported(false);
        return;
      }
      
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
        setIsListening(false);
      };
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (chatInterfaceRef.current) {
          chatInterfaceRef.current.setInputText(transcript);
          setTimeout(() => { // Allow input to update visually before sending
            chatInterfaceRef.current?.submitMessageFromText(transcript);
          }, 50);
        }
      };
      recognitionRef.current.start();
    }
  };
  
  useEffect(() => {
    return () => { // Cleanup on unmount
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
    };
  }, []);


  if (isLoadingAgents || (agent === undefined && agentId)) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl", "text-gradient-dynamic")}>Test Your Client's Chatbot</CardTitle>
          <CardDescription className="text-sm">Loading chatbot emulator...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] p-4 sm:p-6">
          <Logo className="mb-3 h-8" />
          <Loader2 className="h-10 w-10 sm:h-12 sm:h-12 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground mt-2">Initializing chatbot test environment...</p>
        </CardContent>
      </Card>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="h-full flex flex-col">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl", "text-gradient-dynamic")}>Test Chatbot: {agent.generatedName || agent.name}</CardTitle>
          <CardDescription className="text-sm">Preview and interact with this chatbot. Test all conversation paths before deploying.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 p-2 sm:p-4 md:p-6 min-h-0">
          <div className="h-full max-h-[calc(100vh-400px)] sm:max-h-[calc(100vh-430px)]">
            <ChatInterface ref={chatInterfaceRef} agent={agent} appContext={appContextValue} onNewAgentMessage={handleNewAgentMessage} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-lg sm:text-xl flex items-center gap-2", "text-gradient-dynamic")}>
            <Settings2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Voice Interaction Controls
          </CardTitle>
          <CardDescription className="text-sm">
            Use your microphone to talk to the agent and hear its responses. Requires browser permission.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          {speechApiError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Speech API Not Fully Supported</AlertTitle>
              <AlertDescription>{speechApiError} Some voice features might not work correctly in your browser.</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <Button
              onClick={toggleListen}
              disabled={!speechRecognitionSupported || isSpeaking}
              variant={isListening ? "destructive" : "outline"}
              className="w-full sm:w-auto btn-interactive"
              size="lg"
            >
              {isListening ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
              {isListening ? "Stop Listening" : "Start Listening"}
            </Button>
            <div className="w-full sm:w-auto sm:flex-1 space-y-1.5">
              <Label htmlFor="voice-select" className="text-xs">Select Voice (for Agent's Speech)</Label>
              <Select
                value={selectedVoiceURI}
                onValueChange={setSelectedVoiceURI}
                disabled={!speechSynthesisSupported || availableVoices.length === 0 || isSpeaking}
              >
                <SelectTrigger id="voice-select" className="h-10 text-sm">
                  <SelectValue placeholder={speechSynthesisSupported && availableVoices.length > 0 ? "Select a voice..." : (speechSynthesisSupported ? "Loading voices..." : "TTS Not Supported")} />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-sm">
                      {voice.name} ({voice.lang}) {voice.default && "- Default"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
            {isListening && <p className="text-sm text-primary text-center animate-pulse">Listening...</p>}
            {isSpeaking && <p className="text-sm text-accent text-center animate-pulse">Agent is speaking...</p>}
        </CardContent>
        <CardFooter className="p-4 sm:p-6 text-xs text-muted-foreground">
            Note: Voice quality and availability depend on your browser and operating system. For best results, use a modern browser like Chrome or Edge.
        </CardFooter>
      </Card>
    </div>
  );
}
    