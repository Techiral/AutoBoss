
"use client";

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Info, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType, Agent } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import type { useAppContext as UseAppContextType } from "@/app/(app)/layout";
import { Badge } from "@/components/ui/badge";

interface ExtendedChatMessage extends ChatMessageType {
  reasoning?: string;
  relevantKnowledgeIds?: string[];
}

export interface ChatInterfaceHandles {
  submitMessageFromText: (text: string) => Promise<void>;
  setInputText: (text: string) => void;
  focusInput: () => void;
}

interface ChatInterfaceProps {
  agent: Agent;
  appContext?: ReturnType<UseAppContextType>; 
  onNewAgentMessage?: (message: ExtendedChatMessage) => void;
}

const PLACEHOLDER_RESPONSES = [
  "give me a moment",
  "let me check",
  "one moment please",
  "i'm looking into that",
  "hang on",
  "just a second",
  "let me see",
  "i'll check on that",
  "allow me a moment",
];

const MAX_AUTO_RETRIES = 1; 
const AUTO_RETRY_DELAY_MS = 1000; 

export const ChatInterface = forwardRef<ChatInterfaceHandles, ChatInterfaceProps>(({ agent: initialAgent, appContext, onNewAgentMessage }, ref) => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); 
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [currentAgent, setCurrentAgent] = useState<Agent>(initialAgent);
  const agentRef = useRef(currentAgent); 
  const lastUserMessageRef = useRef<string | null>(null);
  const autoRetryCountRef = useRef<number>(0);


  useEffect(() => {
    setCurrentAgent(initialAgent);
    agentRef.current = initialAgent;
    setIsInitializing(true); 
    setMessages([]); 
    lastUserMessageRef.current = null;
    autoRetryCountRef.current = 0;
    setConversationId(null); // Reset conversation ID on agent change
  }, [initialAgent]);


  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = useCallback(async (isManualRestart = false) => {
    if (!agentRef.current) return;
    console.log("ChatInterface: Initializing chat for agent:", agentRef.current.id);
    setIsLoading(true);
    lastUserMessageRef.current = null;
    autoRetryCountRef.current = 0;
    setConversationId(null);

    const initialMessagesList: ExtendedChatMessage[] = [];
    
    if (agentRef.current.generatedGreeting) {
      const greetingMsg: ExtendedChatMessage = {
        id: 'agent-greeting-auto',
        sender: 'agent',
        text: agentRef.current.generatedGreeting,
        timestamp: Date.now()
      };
      initialMessagesList.push(greetingMsg);
      if (onNewAgentMessage) onNewAgentMessage(greetingMsg);
    }
    
    setMessages(initialMessagesList);
    setIsLoading(false);
    setIsInitializing(false);
    if (isManualRestart) {
      toast({ title: "Conversation Restarted", description: "The chat has been reset." });
    }
    console.log("ChatInterface: Initialization complete.");
  }, [toast, onNewAgentMessage]);

  useEffect(() => {
    if (isInitializing && agentRef.current) { 
      initializeChat();
    }
  }, [isInitializing, initializeChat, agentRef]);


  const handleSendMessageInternal = async (messageText: string, isAutoRetry: boolean = false) => {
    if (messageText.trim() === "" || (isLoading && !isAutoRetry) || isInitializing) return;

    if (!isAutoRetry) {
      lastUserMessageRef.current = messageText; 
      autoRetryCountRef.current = 0; 

      const userMessage: ExtendedChatMessage = {
        id: Date.now().toString(),
        sender: "user",
        text: messageText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput(""); 
    }
    
    setIsLoading(true);
    
    console.log("ChatInterface: Sending message to API. Agent Primary Logic:", agentRef.current.primaryLogic, "Is Auto Retry:", isAutoRetry, "Conv ID:", conversationId);

    try {
      const response = await fetch(`/api/agents/${agentRef.current.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId: conversationId || undefined,
          agentConfig: {
            userId: agentRef.current.userId,
            generatedName: agentRef.current.generatedName,
            generatedPersona: agentRef.current.generatedPersona,
            role: agentRef.current.role,
            agentTone: agentRef.current.agentTone,
            primaryLogic: agentRef.current.primaryLogic,
            knowledgeItems: agentRef.current.knowledgeItems || [],
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorDetail = data.error ? (data.error.message + (data.error.details ? ` ${JSON.stringify(data.error.details)}` : '')) : `API Error: ${response.status}`;
        throw new Error(errorDetail);
      }
      
      // Persist the conversationId returned from the API
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      
      let agentResponseText = data.reply;
      let agentResponse: ExtendedChatMessage | null = null;

      if (agentResponseText) { 
        agentResponse = {
          id: `auto-resp-${Date.now()}`,
          sender: 'agent',
          text: agentResponseText,
          timestamp: Date.now(),
          reasoning: data.reasoning, 
          relevantKnowledgeIds: data.relevantKnowledgeIds, 
        };
        
        setMessages((prev) => [...prev, agentResponse as ExtendedChatMessage]);
        if (onNewAgentMessage) onNewAgentMessage(agentResponse);
        
        const lowerCaseAgentResponse = agentResponseText.toLowerCase();
        const isPlaceholder = PLACEHOLDER_RESPONSES.some(phrase => lowerCaseAgentResponse.includes(phrase));

        if (isPlaceholder && autoRetryCountRef.current < MAX_AUTO_RETRIES && lastUserMessageRef.current) {
          console.log(`ChatInterface: Agent responded with placeholder "${agentResponseText}". Attempting auto-retry ${autoRetryCountRef.current + 1}.`);
          autoRetryCountRef.current++;
          setTimeout(() => {
            handleSendMessageInternal(lastUserMessageRef.current!, true); 
          }, AUTO_RETRY_DELAY_MS);
          return; 
        } else if (isPlaceholder) {
          console.log("ChatInterface: Agent responded with placeholder, but max auto-retries reached or no last user message.");
        }
        autoRetryCountRef.current = 0; 

      } else {
         const noReplyMsg: ExtendedChatMessage = {
           id: `no-reply-${Date.now()}`, sender: 'agent', text: "I didn't receive a specific response. Please try again.", timestamp: Date.now()
         };
         setMessages((prev) => [...prev, noReplyMsg]);
         if (onNewAgentMessage) onNewAgentMessage(noReplyMsg);
         autoRetryCountRef.current = 0; 
      }
      
      if (data.error) { 
         toast({ title: "Chatbot Error", description: data.error, variant: "destructive" });
      }

    } catch (error: any) {
      console.error("ChatInterface: Error calling chat API:", error);
      toast({ title: "API Error", description: error.message || "Could not get a response.", variant: "destructive" });
      const errorResponse: ExtendedChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: `Sorry, I encountered an API error: ${error.message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorResponse]);
      if(onNewAgentMessage) onNewAgentMessage(errorResponse);
      autoRetryCountRef.current = 0; 
    } finally {
      const lowerCaseAgentResponse = messages[messages.length -1]?.text?.toLowerCase() || "";
      const wasPlaceholderAndRetrying = PLACEHOLDER_RESPONSES.some(phrase => lowerCaseAgentResponse.includes(phrase)) && autoRetryCountRef.current > 0 && autoRetryCountRef.current <= MAX_AUTO_RETRIES;
      
      if(!wasPlaceholderAndRetrying || autoRetryCountRef.current >= MAX_AUTO_RETRIES) {
         setIsLoading(false);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    submitMessageFromText: async (text: string) => {
      await handleSendMessageInternal(text);
    },
    setInputText: (text: string) => {
      setInput(text);
    },
    focusInput: () => {
      inputRef.current?.focus();
    }
  }));

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSendMessageInternal(input);
  };


  const handleRestartConversation = () => {
    if (isInitializing || isLoading) return; 
    console.log("ChatInterface: Restarting conversation...");
    setInput("");
    setMessages([]); 
    setIsInitializing(true); 
  };


  return (
    <div className="flex flex-col h-full border rounded-lg bg-card">
      <div className="p-2 border-b flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestartConversation}
          disabled={isInitializing || isLoading} 
          title="Restart Conversation"
          className="px-2 py-1 h-auto text-xs w-full sm:w-auto"
        >
          {isInitializing ? <Loader2 size={14} className="mr-1 animate-spin" /> : <RefreshCw size={14} className="mr-1" />} 
          {isInitializing ? "Initializing..." : "Restart"}
        </Button>
        <div className="flex items-center gap-1 w-full sm:w-auto justify-end sm:justify-center">
            <span className="text-xs text-foreground/80">
                {agentRef.current.primaryLogic === 'rag' ? "Using knowledge base..." : "Ready for your questions"}
            </span>
        </div>
      </div>
      
      <div className="flex-1 min-h-0"> 
        <ScrollArea className="h-full" ref={scrollAreaRef}> 
          <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-end gap-2",
                  message.sender === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.sender === "agent" && (
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                    <AvatarFallback><Bot size={16} className="sm:size-18" /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[75%] sm:max-w-[70%] rounded-lg p-2 sm:p-3 text-sm",
                    message.sender === "user"
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap text-xs sm:text-sm">{message.text}</p>
                </div>
                {message.sender === "user" && (
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                    <AvatarFallback><User size={16} className="sm:size-18" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {(isLoading && isInitializing) && messages.length === 0 && (
              <div className="flex items-end gap-2 justify-start">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8"><AvatarFallback><Bot size={16} /></AvatarFallback></Avatar>
                <div className="max-w-[70%] rounded-lg p-2 sm:p-3 text-sm bg-muted"><Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground" /></div>
              </div>
            )}
            {isLoading && !isInitializing && messages.length > 0 && messages[messages.length - 1].sender === 'user' && (
              <div className="flex items-end gap-2 justify-start">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8"><AvatarFallback><Bot size={16} /></AvatarFallback></Avatar>
                <div className="max-w-[70%] rounded-lg p-2 sm:p-3 text-sm bg-muted"><Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-muted-foreground" /></div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="border-t p-2 sm:p-4">
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Type your message..."}
            className="flex-1 h-9 sm:h-10 text-sm"
            disabled={isLoading || isInitializing}
          />
          <Button type="submit" size="icon" disabled={isLoading || isInitializing || input.trim() === ""} className="h-9 w-9 sm:h-10 sm:w-10">
            {(isLoading && !isInitializing) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
});
ChatInterface.displayName = "ChatInterface";
