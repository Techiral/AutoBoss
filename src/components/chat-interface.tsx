
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Info, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, Agent, FlowContext, AgentFlowDefinition, KnowledgeItem } from "@/lib/types";
import { autonomousReasoning } from "@/ai/flows/autonomous-reasoning";
import { executeAgentFlow, ExecuteAgentFlowInput } from "@/ai/flows/execute-agent-flow";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { useAppContext as UseAppContextType } from "@/app/(app)/layout";
import { Badge } from "@/components/ui/badge";

interface ChatInterfaceProps {
  agent: Agent;
  appContext?: ReturnType<UseAppContextType>;
}

export function ChatInterface({ agent: initialAgent, appContext }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [currentAgent, setCurrentAgent] = useState<Agent>(initialAgent);
  const getAgentFlowFromAppContext = appContext?.getAgentFlow;

  const [currentFlowContext, setCurrentFlowContext] = useState<FlowContext>({ conversationHistory: [] });
  const [currentAgentFlow, setCurrentAgentFlow] = useState<AgentFlowDefinition | undefined>(undefined);
  const [nextNodeIdToResume, setNextNodeIdToResume] = useState<string | undefined>(undefined);

  const currentFlowContextRef = useRef(currentFlowContext);
  const nextNodeIdToResumeRef = useRef(nextNodeIdToResume);
  const currentAgentFlowRef = useRef(currentAgentFlow);
  const agentKnowledgeItemsRef = useRef(currentAgent.knowledgeItems);
  const agentRef = useRef(currentAgent);

  useEffect(() => {
    currentFlowContextRef.current = currentFlowContext;
  }, [currentFlowContext]);

  useEffect(() => {
    nextNodeIdToResumeRef.current = nextNodeIdToResume;
  }, [nextNodeIdToResume]);

  useEffect(() => {
    currentAgentFlowRef.current = currentAgentFlow;
  }, [currentAgentFlow]);

  useEffect(() => {
    setCurrentAgent(initialAgent);
    agentRef.current = initialAgent;
    agentKnowledgeItemsRef.current = initialAgent.knowledgeItems;

    const flowToUse = getAgentFlowFromAppContext ? getAgentFlowFromAppContext(initialAgent.id) : initialAgent.flow;
    setCurrentAgentFlow(flowToUse);
    currentAgentFlowRef.current = flowToUse;
    setIsInitializing(true);
  }, [initialAgent, getAgentFlowFromAppContext]);


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

    setIsLoading(true);
    let aggregatedMessages: ChatMessage[] = [];
    let tempContextForInit: FlowContext = { conversationHistory: [], waitingForInput: undefined, currentNodeId: undefined };
    let tempNextNodeIdForInit: string | undefined = undefined;

    if (agentRef.current.generatedGreeting) {
      aggregatedMessages.push({
        id: 'agent-greeting',
        sender: 'agent',
        text: agentRef.current.generatedGreeting,
        timestamp: Date.now()
      });
      tempContextForInit.conversationHistory = [`Agent: ${agentRef.current.generatedGreeting}`];
    }

    const flowToExecute = currentAgentFlowRef.current;
    if (flowToExecute && flowToExecute.nodes.find(n => n.type === 'start')) {
      try {
        const flowResult = await executeAgentFlow({
          flowDefinition: flowToExecute,
          currentContext: { ...tempContextForInit },
          currentMessage: undefined, // No user message on init
          startNodeId: flowToExecute.nodes.find(n => n.type === 'start')?.id,
          knowledgeItems: agentKnowledgeItemsRef.current || [],
          agent: agentRef.current,
        });

        const agentResponses: ChatMessage[] = flowResult.messagesToSend.map((msg, index) => ({
          id: `flow-init-${Date.now()}-${index}`,
          sender: 'agent',
          text: msg,
          timestamp: Date.now() + index,
          flowNodeId: flowResult.updatedContext.currentNodeId,
          flowContext: { ...flowResult.updatedContext }
        }));

        aggregatedMessages = [...aggregatedMessages, ...agentResponses];
        const agentMessagesForHistory = flowResult.messagesToSend.filter(m => !m.startsWith("(System:")).map(m => `Agent: ${m}`);
        tempContextForInit = { ...flowResult.updatedContext, conversationHistory: [...(tempContextForInit.conversationHistory || []), ...agentMessagesForHistory] };
        tempNextNodeIdForInit = flowResult.nextNodeId;

        if (flowResult.error) {
          toast({ title: "Chatbot Error", description: `An issue occurred: ${flowResult.error}`, variant: "destructive" });
          aggregatedMessages.push({ id: 'flow-error-init', sender: 'agent', text: `System notice: ${flowResult.error}`, timestamp: Date.now() });
        }
      } catch (err: any) {
        console.error("Error initializing flow:", err);
        const errorMessage = err.message || "Could not start the chatbot conversation.";
        toast({ title: "Chatbot Initialization Error", description: errorMessage, variant: "destructive" });
        aggregatedMessages.push({ id: 'flow-error-init-catch', sender: 'agent', text: `System error: ${errorMessage}`, timestamp: Date.now() });
      }
    }

    setMessages(aggregatedMessages);
    currentFlowContextRef.current = tempContextForInit;
    setCurrentFlowContext(tempContextForInit);
    nextNodeIdToResumeRef.current = tempNextNodeIdForInit;
    setNextNodeIdToResume(tempNextNodeIdForInit);

    setIsLoading(false);
    setIsInitializing(false);
    if (isManualRestart) {
      toast({ title: "Conversation Restarted", description: "The chat has been reset." });
    }
  }, [toast]);


  useEffect(() => {
    if (isInitializing) {
      setMessages([]);
      const initialEmptyContext = { conversationHistory: [], waitingForInput: undefined, currentNodeId: undefined };
      setCurrentFlowContext(initialEmptyContext);
      currentFlowContextRef.current = initialEmptyContext;
      setNextNodeIdToResume(undefined);
      nextNodeIdToResumeRef.current = undefined;
      initializeChat();
    }
  }, [isInitializing, initializeChat]);


  const handleSendMessage = async () => {
    if (input.trim() === "" || isLoading || isRestarting || isInitializing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: Date.now(),
    };
    
    const currentInput = input; // Capture input before clearing
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, userMessage]); // Add user message immediately

    // Prepare context including the new user message
    const turnContextForFlow: FlowContext = {
      ...currentFlowContextRef.current,
      conversationHistory: [...(currentFlowContextRef.current.conversationHistory || []), `User: ${userMessage.text}`]
    };
    

    try {
      const currentKnowledge: KnowledgeItem[] = agentKnowledgeItemsRef.current || [];
      let executedAsFlow = false;
      let flowFinishedWithoutNextNode = false;

      // Try to continue or start a flow
      if (currentAgentFlowRef.current && currentAgentFlowRef.current.nodes.find(n => n.type === 'start')) {
        const flowToExecute = currentAgentFlowRef.current;
        const nodeIdForExecution = nextNodeIdToResumeRef.current || flowToExecute.nodes.find(n => n.type === 'start')?.id;

        if (nodeIdForExecution) {
            const flowInput: ExecuteAgentFlowInput = {
                flowDefinition: flowToExecute,
                currentContext: turnContextForFlow,
                currentMessage: currentInput,
                startNodeId: nodeIdForExecution,
                knowledgeItems: currentKnowledge,
                agent: agentRef.current,
            };

            const result = await executeAgentFlow(flowInput);
            executedAsFlow = true; 

            const agentResponses: ChatMessage[] = result.messagesToSend.map((msg, index) => ({
                id: `flow-${Date.now()}-${index}`,
                sender: 'agent',
                text: msg,
                timestamp: Date.now() + index,
                flowNodeId: result.updatedContext.currentNodeId,
                flowContext: { ...result.updatedContext },
            }));
            setMessages((prev) => [...prev, ...agentResponses]);

            const newAgentMessagesForHistory = result.messagesToSend.filter(m => !m.startsWith("(System:")).map(msg => `Agent: ${msg}`);
            currentFlowContextRef.current = {
                ...result.updatedContext,
                conversationHistory: [...(turnContextForFlow.conversationHistory || []), ...newAgentMessagesForHistory]
            };
            setCurrentFlowContext(currentFlowContextRef.current);
            nextNodeIdToResumeRef.current = result.nextNodeId ? result.nextNodeId : undefined;
            setNextNodeIdToResume(result.nextNodeId ? result.nextNodeId : undefined);

            if (result.error) {
                toast({ title: "Chatbot Error", description: `An issue occurred: ${result.error}`, variant: "destructive" });
                setMessages(prev => [...prev, { id: 'flow-error-exec', sender: 'agent', text: `System notice: ${result.error}`, timestamp: Date.now() }]);
            }
            if (result.isFlowFinished && !result.nextNodeId) {
                flowFinishedWithoutNextNode = true;
                nextNodeIdToResumeRef.current = undefined; // Ensure it's cleared for autonomous
                setNextNodeIdToResume(undefined);
            }
        }
      }

      // If no flow was active/triggered OR if an active flow finished and isn't waiting for more input, use autonomous reasoning.
      if (!executedAsFlow || flowFinishedWithoutNextNode) {
        const currentConversationHistoryForReasoning = [...messages, userMessage]; // Use messages from state *before* this response
        const contextStringForReasoning = currentConversationHistoryForReasoning.map(m => `${m.sender === 'user' ? 'User' : 'Agent'}: ${m.text}`).join('\n');

        const reasoningResult = await autonomousReasoning({
          agentName: agentRef.current.generatedName,
          agentPersona: agentRef.current.generatedPersona,
          agentRole: agentRef.current.role,
          context: contextStringForReasoning, // This context does not include the potential flow messages from this turn yet
          userInput: userMessage.text,
          knowledgeItems: currentKnowledge
        });

        const agentResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          text: reasoningResult.responseToUser,
          timestamp: Date.now(),
          reasoning: reasoningResult.reasoning,
          relevantKnowledgeIds: reasoningResult.relevantKnowledgeIds,
        };
        setMessages((prev) => [...prev, agentResponse]);
        
        // Update context for autonomous response
        const newHistoryEntryForAutonomous = `Agent: ${reasoningResult.responseToUser}`;
        const updatedAutonomousContextHistory = [...(currentFlowContextRef.current.conversationHistory || []), newHistoryEntryForAutonomous];
        const newContextForAutonomous = { // Reset flow-specific parts of context
          conversationHistory: updatedAutonomousContextHistory,
          waitingForInput: undefined, 
          currentNodeId: undefined
        };
        currentFlowContextRef.current = newContextForAutonomous;
        setCurrentFlowContext(newContextForAutonomous);
      }
    } catch (error: any) {
      console.error("Error processing message:", error);
      const errorMessage = error.message || "Could not get a response from the chatbot.";
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
      });
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartConversation = async () => {
    if (isRestarting || isInitializing) return;
    setIsRestarting(true);
    setInput("");

    const flowToUse = getAgentFlowFromAppContext ? getAgentFlowFromAppContext(agentRef.current.id) : agentRef.current.flow;
    setCurrentAgentFlow(flowToUse);
    currentAgentFlowRef.current = flowToUse;

    setIsInitializing(true); // This will trigger the useEffect to call initializeChat
    setIsRestarting(false);
  };


  return (
    <div className="flex flex-col h-full border rounded-lg shadow-sm bg-card">
      <div className="p-2 border-b flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRestartConversation}
          disabled={isRestarting || isInitializing || isLoading}
          title="Restart Conversation"
          className="px-2 py-1 h-auto text-xs w-full sm:w-auto"
        >
          {isRestarting ? <Loader2 size={14} className="mr-1 animate-spin" /> : <RefreshCw size={14} className="mr-1" />} Restart
        </Button>
        <div className="flex items-center gap-1 w-full sm:w-auto justify-end sm:justify-center">
            <span className="text-xs text-muted-foreground">
                {nextNodeIdToResumeRef.current ? "Following conversation steps..." : "Ready for your questions"}
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
                {(message.intent || message.reasoning || message.flowNodeId || message.flowContext || message.entities || message.relevantKnowledgeIds || message.text.startsWith("(System:")) && (
                  <Accordion type="single" collapsible className="mt-1.5 sm:mt-2 text-xs w-full">
                    <AccordionItem value="item-1" className="border-b-0">
                      <AccordionTrigger className="py-1 hover:no-underline text-muted-foreground text-[10px] sm:text-xs [&[data-state=open]>svg]:text-foreground">
                        <Info size={10} className="mr-1 sm:size-12" /> Chat Details
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-0 space-y-1 bg-background/30 p-1.5 sm:p-2 rounded max-h-48 sm:max-h-60 overflow-y-auto">
                        {message.text.startsWith("(System:") && <p className="text-[10px] sm:text-xs"><strong>System Message:</strong> {message.text}</p>}
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
                                const item = agentKnowledgeItemsRef.current?.find(k => k.id === id);
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
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={nextNodeIdToResumeRef.current ? "Your response..." : "Ask your chatbot anything..."}
            className="flex-1 h-9 sm:h-10 text-sm"
            disabled={isLoading || isRestarting || isInitializing}
          />
          <Button type="submit" size="icon" disabled={isLoading || isRestarting || isInitializing || input.trim() === ""} className="h-9 w-9 sm:h-10 sm:w-10">
            {(isLoading && !isInitializing && !isRestarting) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
