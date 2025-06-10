
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { useAppContext as UseAppContextType } from "@/app/(app)/layout";
import { Badge } from "@/components/ui/badge";

interface ExtendedChatMessage extends ChatMessageType {
  // Removed debugMessages, flowNodeId, flowContext as flow system is removed
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

export const ChatInterface = forwardRef<ChatInterfaceHandles, ChatInterfaceProps>(({ agent: initialAgent, appContext, onNewAgentMessage }, ref) => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); 
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [currentAgent, setCurrentAgent] = useState<Agent>(initialAgent);
  const agentRef = useRef(currentAgent);
  const conversationHistoryRef = useRef<string[]>([]); // Stores history as string array: "User: msg", "Agent: msg"

  useEffect(() => {
    setCurrentAgent(initialAgent);
    agentRef.current = initialAgent;
    setIsInitializing(true); 
    conversationHistoryRef.current = [];
    setMessages([]); 
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
    console.log("ChatInterface (Simplified): Initializing chat for agent:", agentRef.current.id);
    setIsLoading(true);
    conversationHistoryRef.current = []; // Clear history

    const initialMessages: ExtendedChatMessage[] = [];
    
    if (agentRef.current.generatedGreeting) {
      const greetingMsg: ExtendedChatMessage = {
        id: 'agent-greeting-auto',
        sender: 'agent',
        text: agentRef.current.generatedGreeting,
        timestamp: Date.now()
      };
      initialMessages.push(greetingMsg);
      conversationHistoryRef.current.push(`Agent: ${agentRef.current.generatedGreeting}`);
      if (onNewAgentMessage) onNewAgentMessage(greetingMsg);
    }
    
    setMessages(initialMessages);
    setIsLoading(false);
    setIsInitializing(false);
    if (isManualRestart) {
      toast({ title: "Conversation Restarted", description: "The chat has been reset." });
    }
    console.log("ChatInterface (Simplified): Initialization complete.");
  }, [toast, onNewAgentMessage]);

  useEffect(() => {
    if (isInitializing && agentRef.current) { 
      initializeChat();
    }
  }, [isInitializing, initializeChat, agentRef]);

  const handleSendMessageInternal = async (messageText: string) => {
    if (messageText.trim() === "" || isLoading || isInitializing) return;

    const userMessage: ExtendedChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: messageText,
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); 
    setIsLoading(true);

    const currentHistoryForApi = [...conversationHistoryRef.current, `User: ${userMessage.text}`];
    
    console.log("ChatInterface (Simplified): Sending message to API. Agent Primary Logic:", agentRef.current.primaryLogic);

    try {
      const response = await fetch(`/api/agents/${agentRef.current.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: currentHistoryForApi, // Send current turn's history
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorDetail = data.error ? (data.error.message + (data.error.details ? ` ${JSON.stringify(data.error.details)}` : '')) : `API Error: ${response.status}`;
        throw new Error(errorDetail);
      }
      
      let agentResponses: ExtendedChatMessage[] = [];

      if (data.reply) { // Simplified API only returns 'reply' now
        agentResponses.push({
          id: `auto-resp-${Date.now()}`,
          sender: 'agent',
          text: data.reply,
          timestamp: Date.now(),
          reasoning: data.reasoning,
          relevantKnowledgeIds: data.relevantKnowledgeIds,
        });
      }

      if (agentResponses.length > 0) {
        setMessages((prev) => [...prev, ...agentResponses]);
        agentResponses.forEach(msg => { 
          if (onNewAgentMessage) onNewAgentMessage(msg);
          conversationHistoryRef.current.push(`Agent: ${msg.text}`); // Update history with agent's reply
        });
      } else {
         // Handle case where API might not return a message (e.g., error not caught above, or empty reply)
         const noReplyMsg: ExtendedChatMessage = {
           id: `no-reply-${Date.now()}`, sender: 'agent', text: "I didn't receive a specific response. Please try again.", timestamp: Date.now()
         };
         setMessages((prev) => [...prev, noReplyMsg]);
         if (onNewAgentMessage) onNewAgentMessage(noReplyMsg);
         conversationHistoryRef.current.push(`Agent: ${noReplyMsg.text}`);
      }
      
      if (data.error) { 
         toast({ title: "Chatbot Error", description: data.error, variant: "destructive" });
      }

    } catch (error: any) {
      console.error("ChatInterface (Simplified): Error calling chat API:", error);
      toast({ title: "API Error", description: error.message || "Could not get a response.", variant: "destructive" });
      const errorResponse: ExtendedChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: `Sorry, I encountered an API error: ${error.message}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorResponse]);
      if(onNewAgentMessage) onNewAgentMessage(errorResponse);
      conversationHistoryRef.current.push(`Agent: ${errorResponse.text}`);
    } finally {
      setIsLoading(false);
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
    console.log("ChatInterface (Simplified): Restarting conversation...");
    setInput("");
    setMessages([]); 
    setIsInitializing(true); // Will trigger initializeChat
  };


  return (
    <div className="flex flex-col h-full border rounded-lg shadow-sm bg-card">
      <div className="p-2 border-b flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
        <Button
          variant="outline"
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
            <span className="text-xs text-muted-foreground">
                {/* Simplified message as flow state is removed */}
                {agentRef.current.primaryLogic === 'rag' ? "Using knowledge base..." : "Ready for your questions"}
            </span>
        </div>
      </div>
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollAreaRef}>
        <div className="space-y-3 sm:space-y-4">
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
                  "max-w-[75%] sm:max-w-[70%] rounded-lg p-2 sm:p-3 text-sm shadow",
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap text-xs sm:text-sm">{message.text}</p>
                {(message.reasoning || (message.relevantKnowledgeIds && message.relevantKnowledgeIds.length > 0)) && (
                  <Accordion type="single" collapsible className="mt-1.5 sm:mt-2 text-xs w-full">
                    <AccordionItem value="item-1" className="border-b-0">
                      <AccordionTrigger className="py-1 hover:no-underline text-muted-foreground text-[10px] sm:text-xs [&[data-state=open]>svg]:text-foreground">
                        <Info size={10} className="mr-1 sm:size-12" /> AI Details
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-0 space-y-1 bg-background/30 p-1.5 sm:p-2 rounded max-h-48 sm:max-h-60 overflow-y-auto">
                        {message.reasoning && <p className="text-[10px] sm:text-xs"><strong>AI Reasoning:</strong> {message.reasoning}</p>}
                        {message.relevantKnowledgeIds && message.relevantKnowledgeIds.length > 0 && (
                          <div>
                            <strong className="text-[10px] sm:text-xs">Used Knowledge:</strong>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {message.relevantKnowledgeIds.map(id => {
                                const item = agentRef.current.knowledgeItems?.find(k => k.id === id);
                                return <Badge key={id} variant="secondary" className="text-[9px] sm:text-xs px-1.5 py-0.5">{item?.fileName || id}</Badge>;
                              })}
                            </div>
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
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
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarFallback><Bot size={16} className="sm:size-18" /></AvatarFallback>
              </Avatar>
              <div className="max-w-[70%] rounded-lg p-2 sm:p-3 text-sm shadow bg-muted">
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" />
              </div>
            </div>
          )}
          {isLoading && !isInitializing && messages.length > 0 && messages[messages.length - 1].sender === 'user' && (
            <div className="flex items-end gap-2 justify-start">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                <AvatarFallback><Bot size={16} className="sm:size-18" /></AvatarFallback>
              </Avatar>
              <div className="max-w-[70%] rounded-lg p-2 sm:p-3 text-sm shadow bg-muted">
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-2 sm:p-4">
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"Ask your chatbot anything..."}
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

