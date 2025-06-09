
"use client";

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Info, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType, Agent, FlowContext, AgentFlowDefinition, KnowledgeItem } from "@/lib/types";
// Removed direct import of autonomousReasoning and executeAgentFlow as API call is used.
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
  debugMessages?: string[];
}

export interface ChatInterfaceHandles {
  submitMessageFromText: (text: string) => Promise<void>;
  setInputText: (text: string) => void;
  focusInput: () => void;
}

interface ChatInterfaceProps {
  agent: Agent;
  appContext?: ReturnType<UseAppContextType>; // Make appContext optional for public chat page
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
  
  // State for flow execution
  const [currentFlowContext, setCurrentFlowContext] = useState<FlowContext | undefined>(undefined);
  const [nextNodeIdToResume, setNextNodeIdToResume] = useState<string | undefined>(undefined);

  // Refs to hold current values for async operations and API calls
  const agentRef = useRef(currentAgent);
  const currentFlowContextRef = useRef(currentFlowContext);
  const nextNodeIdToResumeRef = useRef(nextNodeIdToResume);

  useEffect(() => {
    setCurrentAgent(initialAgent);
    agentRef.current = initialAgent;
    // When agent changes, reset initialization and flow state
    setIsInitializing(true); 
    setCurrentFlowContext(undefined);
    currentFlowContextRef.current = undefined;
    setNextNodeIdToResume(undefined);
    nextNodeIdToResumeRef.current = undefined;
    setMessages([]); // Clear messages when agent changes
  }, [initialAgent]);

  useEffect(() => {
    currentFlowContextRef.current = currentFlowContext;
  }, [currentFlowContext]);

  useEffect(() => {
    nextNodeIdToResumeRef.current = nextNodeIdToResume;
  }, [nextNodeIdToResume]);

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
    console.log("ChatInterface: Initializing chat for agent:", agentRef.current.id, "Manual restart:", isManualRestart);
    setIsLoading(true);

    const initialMessages: ExtendedChatMessage[] = [];
    let initialContext: FlowContext = { conversationHistory: [] };
    let initialNextNodeId: string | undefined = undefined;

    // Add agent's generated greeting if it exists and primary logic is not 'flow' (flow handles its own greeting)
    if (agentRef.current.generatedGreeting && agentRef.current.primaryLogic !== 'flow') {
      const greetingMsg: ExtendedChatMessage = {
        id: 'agent-greeting-auto',
        sender: 'agent',
        text: agentRef.current.generatedGreeting,
        timestamp: Date.now()
      };
      initialMessages.push(greetingMsg);
      initialContext.conversationHistory.push(`Agent: ${agentRef.current.generatedGreeting}`);
      if (onNewAgentMessage) onNewAgentMessage(greetingMsg);
    }
    
    // If agent logic involves a flow, try to execute its initial steps (e.g. start node -> sendMessage)
    if ((agentRef.current.primaryLogic === 'flow' || agentRef.current.primaryLogic === 'hybrid') && agentRef.current.flow) {
      try {
        const response = await fetch(`/api/agents/${agentRef.current.id}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: undefined, // No user message for initialization
            flowState: { context: initialContext, nextNodeId: agentRef.current.flow.nodes.find(n=>n.type==='start')?.id },
          }),
        });
        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message || "Initialization API error");
        }
        
        if (data.messages && Array.isArray(data.messages)) {
          const flowInitMessages: ExtendedChatMessage[] = data.messages.map((msgText: string, index: number) => ({
            id: `flow-init-${Date.now()}-${index}`,
            sender: 'agent',
            text: msgText,
            timestamp: Date.now() + index,
            debugMessages: data.debugLog && index === data.messages.length -1 ? data.debugLog : undefined,
            flowNodeId: data.newFlowState?.context?.currentNodeId,
            flowContext: data.newFlowState?.context,
          }));
          initialMessages.push(...flowInitMessages);
          flowInitMessages.forEach(msg => { if (onNewAgentMessage) onNewAgentMessage(msg); });
        }
        if (data.newFlowState) {
          initialContext = data.newFlowState.context;
          initialNextNodeId = data.newFlowState.nextNodeId;
        }
      } catch (err: any) {
        console.error("ChatInterface: Error during flow initialization API call:", err);
        toast({ title: "Chatbot Init Error", description: err.message || "Could not start the flow.", variant: "destructive" });
         initialMessages.push({ id: 'init-error', sender: 'agent', text: `Error initializing: ${err.message}`, timestamp: Date.now() });
      }
    }

    setMessages(initialMessages);
    setCurrentFlowContext(initialContext);
    currentFlowContextRef.current = initialContext;
    setNextNodeIdToResume(initialNextNodeId);
    nextNodeIdToResumeRef.current = initialNextNodeId;

    setIsLoading(false);
    setIsInitializing(false);
    if (isManualRestart) {
      toast({ title: "Conversation Restarted", description: "The chat has been reset." });
    }
    console.log("ChatInterface: Initialization complete. Context:", initialContext, "NextNode:", initialNextNodeId);
  }, [toast, onNewAgentMessage]);

  useEffect(() => {
    if (isInitializing && agentRef.current) { // Only initialize if agent is set
      initializeChat();
    }
  }, [isInitializing, initializeChat, agentRef.current]); // Depend on agentRef.current

  const handleSendMessageInternal = async (messageText: string) => {
    if (messageText.trim() === "" || isLoading || isInitializing) return; // Removed isRestarting as it's handled by isInitializing

    const userMessage: ExtendedChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: messageText,
      timestamp: Date.now(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); 
    setIsLoading(true);

    // Prepare flowState for the API call
    const flowStateForApi = {
      context: {
        ...(currentFlowContextRef.current || { conversationHistory: [] }), // Ensure context is at least an empty history
        conversationHistory: [...(currentFlowContextRef.current?.conversationHistory || []), `User: ${userMessage.text}`]
      },
      nextNodeId: nextNodeIdToResumeRef.current,
    };
    
    console.log("ChatInterface: Sending message to API. Agent Primary Logic:", agentRef.current.primaryLogic, "Flow State:", flowStateForApi);

    try {
      const response = await fetch(`/api/agents/${agentRef.current.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          flowState: flowStateForApi,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorDetail = data.error ? (data.error.message + (data.error.details ? ` ${JSON.stringify(data.error.details)}` : '')) : `API Error: ${response.status}`;
        throw new Error(errorDetail);
      }
      
      let agentResponses: ExtendedChatMessage[] = [];

      if (data.type === 'flow' && data.messages && Array.isArray(data.messages)) {
        agentResponses = data.messages.map((msgText: string, index: number) => ({
          id: `flow-resp-${Date.now()}-${index}`,
          sender: 'agent',
          text: msgText,
          timestamp: Date.now() + index,
          debugMessages: data.debugLog && index === data.messages.length - 1 ? data.debugLog : undefined,
          flowNodeId: data.newFlowState?.context?.currentNodeId,
          flowContext: data.newFlowState?.context,
        }));
      } else if ((data.type === 'autonomous' || data.type === 'rag' || data.type === 'prompt') && data.reply) {
        agentResponses.push({
          id: `auto-resp-${Date.now()}`,
          sender: 'agent',
          text: data.reply,
          timestamp: Date.now(),
          reasoning: data.reasoning,
          relevantKnowledgeIds: data.relevantKnowledgeIds,
          // No specific flowNodeId for pure autonomous, but context still updates
          flowContext: data.newFlowState?.context,
        });
      }

      if (agentResponses.length > 0) {
        setMessages((prev) => [...prev, ...agentResponses]);
        agentResponses.forEach(msg => { if (onNewAgentMessage) onNewAgentMessage(msg); });
      } else if (data.debugLog && data.debugLog.length > 0) {
         // If no visible messages but there's a debug log, attach to user message or a system message
         // For simplicity, let's just log it if no agent message was produced this turn
         console.log("ChatInterface: Debug log from API (no agent messages):", data.debugLog);
      }


      if (data.newFlowState) {
        console.log("ChatInterface: Received newFlowState from API:", data.newFlowState);
        setCurrentFlowContext(data.newFlowState.context);
        currentFlowContextRef.current = data.newFlowState.context;
        setNextNodeIdToResume(data.newFlowState.nextNodeId);
        nextNodeIdToResumeRef.current = data.newFlowState.nextNodeId;
      } else {
        // If no newFlowState, it means it was likely a pure autonomous, RAG, or prompt response
        // We still need to update the local conversation history in the context
        const currentContext = currentFlowContextRef.current || {conversationHistory: []};
        const newHistory = [...currentContext.conversationHistory];
        agentResponses.forEach(ar => newHistory.push(`Agent: ${ar.text}`));
        const updatedContextOnlyHistory = {...currentContext, conversationHistory: newHistory};
        
        setCurrentFlowContext(updatedAutonomousContextOnlyHistory);
        currentFlowContextRef.current = updatedAutonomousContextOnlyHistory;
        // For non-flow responses, there's no nextNodeId to resume
        setNextNodeIdToResume(undefined);
        nextNodeIdToResumeRef.current = undefined;
      }
      
      if (data.error) { // API might return 200 but still have an error in payload for flows
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
    if (isInitializing || isLoading) return; // Prevent restart if already processing
    console.log("ChatInterface: Restarting conversation...");
    setInput("");
    setMessages([]); // Immediately clear UI messages
    setIsInitializing(true); // This will trigger the useEffect for initializeChat
  };


  return (
    <div className="flex flex-col h-full border rounded-lg shadow-sm bg-card">
      <div className="p-2 border-b flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRestartConversation}
          disabled={isInitializing || isLoading} // Disabled during init or active loading
          title="Restart Conversation"
          className="px-2 py-1 h-auto text-xs w-full sm:w-auto"
        >
          {isInitializing ? <Loader2 size={14} className="mr-1 animate-spin" /> : <RefreshCw size={14} className="mr-1" />} 
          {isInitializing ? "Initializing..." : "Restart"}
        </Button>
        <div className="flex items-center gap-1 w-full sm:w-auto justify-end sm:justify-center">
            <span className="text-xs text-muted-foreground">
                {nextNodeIdToResumeRef.current ? "Following conversation steps..." : 
                 (agentRef.current.primaryLogic === 'flow' && !isInitializing ? "Flow ended or waiting..." : "Ready for your questions")}
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
                {(message.debugMessages || message.intent || message.reasoning || message.flowNodeId || message.flowContext || message.entities || message.relevantKnowledgeIds) && (
                  <Accordion type="single" collapsible className="mt-1.5 sm:mt-2 text-xs w-full">
                    <AccordionItem value="item-1" className="border-b-0">
                      <AccordionTrigger className="py-1 hover:no-underline text-muted-foreground text-[10px] sm:text-xs [&[data-state=open]>svg]:text-foreground">
                        <Info size={10} className="mr-1 sm:size-12" /> Chat Details
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-0 space-y-1 bg-background/30 p-1.5 sm:p-2 rounded max-h-48 sm:max-h-60 overflow-y-auto">
                        {message.debugMessages && message.debugMessages.length > 0 && (
                            <div>
                                <strong className="text-[10px] sm:text-xs">System Log:</strong>
                                <ul className="list-disc list-inside pl-2 text-[9px] sm:text-[10px]">
                                    {message.debugMessages.map((log, i) => <li key={i}>{log}</li>)}
                                </ul>
                            </div>
                        )}
                        {message.flowNodeId && <p className="text-[10px] sm:text-xs"><strong>Current Step ID:</strong> {message.flowNodeId}</p>}
                        {message.intent && <p className="text-[10px] sm:text-xs"><strong>Intent:</strong> {message.intent}</p>}
                        {message.entities && Object.keys(message.entities).length > 0 && (
                          <p className="text-[10px] sm:text-xs"><strong>Entities:</strong> {JSON.stringify(message.entities)}</p>
                        )}
                        {message.reasoning && <p className="text-[10px] sm:text-xs"><strong>AI Reasoning:</strong> {message.reasoning}</p>}
                        {message.relevantKnowledgeIds && message.relevantKnowledgeIds.length > 0 && (
                          <div>
                            <strong className="text-[10px] sm:text-xs">Used Knowledge:</strong>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {message.relevantKnowledgeIds.map(id => {
                                const item = agentRef.current.knowledgeItems?.find(k => k.id === id); // Use agentRef
                                return <Badge key={id} variant="secondary" className="text-[9px] sm:text-xs px-1.5 py-0.5">{item?.fileName || id}</Badge>;
                              })}
                            </div>
                          </div>
                        )}
                        {message.flowContext && (
                          <details className="text-xs cursor-pointer mt-1">
                            <summary className="font-semibold text-[10px] sm:text-xs">Step Context Variables</summary>
                            <pre className="whitespace-pre-wrap bg-muted/50 p-1 rounded text-[9px] sm:text-[10px] max-h-32 sm:max-h-48 overflow-auto mt-0.5 border">
                              {JSON.stringify(message.flowContext, null, 2)}
                            </pre>
                          </details>
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
            placeholder={nextNodeIdToResumeRef.current ? "Your response..." : "Ask your chatbot anything..."}
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
