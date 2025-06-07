
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Info, Cog, Zap, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, Agent, FlowContext, AgentFlowDefinition, KnowledgeItem } from "@/lib/types";
import { recognizeIntent } from "@/ai/flows/intent-recognition";
import { autonomousReasoning } from "@/ai/flows/autonomous-reasoning";
import { executeAgentFlow, ExecuteAgentFlowInput } from "@/ai/flows/execute-agent-flow";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAppContext } from "@/app/(app)/layout";

interface ChatInterfaceProps {
  agent: Agent;
}

type ChatMode = "autonomous" | "flow";

export function ChatInterface({ agent }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRestarting, setIsRestarting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { getAgentFlow } = useAppContext();

  const [chatMode, setChatMode] = useState<ChatMode>("autonomous");
  const [currentFlowContext, setCurrentFlowContext] = useState<FlowContext>({ conversationHistory: [] });
  const [currentAgentFlow, setCurrentAgentFlow] = useState<AgentFlowDefinition | undefined>(undefined);
  const [nextNodeIdToResume, setNextNodeIdToResume] = useState<string | undefined>(undefined);

  useEffect(() => {
    const flow = getAgentFlow(agent.id);
    setCurrentAgentFlow(flow);
    if (flow) {
      setChatMode("flow");
    } else {
      setChatMode("autonomous");
    }
    // When agent or flow changes, reset chat state before initializing
    setMessages([]);
    setCurrentFlowContext({ conversationHistory: [], waitingForInput: undefined, currentNodeId: undefined });
    setNextNodeIdToResume(undefined);
    setIsInitializing(true); // Indicate that we need to initialize
  }, [agent.id, getAgentFlow]); // agent.id will cause currentAgentFlow to re-evaluate due to getAgentFlow

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
    setIsLoading(true);
    setIsInitializing(true);
    
    let aggregatedMessages: ChatMessage[] = [];
    let tempContext: FlowContext = { conversationHistory: [], waitingForInput: undefined, currentNodeId: undefined };
    let tempNextNodeId: string | undefined = undefined;

    if (agent.generatedGreeting && (chatMode === "autonomous" || !currentAgentFlow)) {
      aggregatedMessages.push({
        id: 'agent-greeting',
        sender: 'agent',
        text: agent.generatedGreeting,
        timestamp: Date.now()
      });
    }

    if (chatMode === "flow" && currentAgentFlow) {
      try {
        const flowResult = await executeAgentFlow({
          flowDefinition: currentAgentFlow,
          currentContext: { ...tempContext }, // Start with empty context for flow
          currentMessage: undefined,
          startNodeId: currentAgentFlow.nodes.find(n => n.type === 'start')?.id,
          knowledgeItems: agent.knowledgeItems || [],
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
        tempContext = { ...flowResult.updatedContext };
        tempNextNodeId = flowResult.nextNodeId;

        if (flowResult.error) {
          toast({ title: "Flow Error", description: flowResult.error, variant: "destructive" });
          aggregatedMessages.push({id: 'flow-error-init', sender: 'agent', text: `Error starting flow: ${flowResult.error}`, timestamp: Date.now()});
        }
      } catch (err: any) {
        console.error("Error initializing flow:", err);
        const errorMessage = err.message || "Could not start the agent flow.";
        toast({ title: "Flow Initialization Error", description: errorMessage, variant: "destructive" });
        aggregatedMessages.push({id: 'flow-error-init-catch', sender: 'agent', text: `System error: ${errorMessage}`, timestamp: Date.now()});
      }
    }
    
    setMessages(aggregatedMessages);
    setCurrentFlowContext(tempContext); // Set context after flow execution
    setNextNodeIdToResume(tempNextNodeId);
    setIsLoading(false);
    setIsInitializing(false);
    if (isManualRestart) {
        toast({ title: "Conversation Restarted", description: "The chat has been reset." });
    }
  }, [agent.id, agent.generatedGreeting, agent.knowledgeItems, chatMode, currentAgentFlow, toast]);


  useEffect(() => {
    // This effect now runs when isInitializing is true, or when key dependencies change that necessitate a re-init
    if (isInitializing || (!currentAgentFlow && chatMode === "flow") ) { // also re-init if flow mode selected but no flow
        initializeChat();
    }
  }, [isInitializing, currentAgentFlow, chatMode, initializeChat]);


  const handleSendMessage = async () => {
    if (input.trim() === "" || isLoading || isRestarting || isInitializing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      if (chatMode === "flow" && currentAgentFlow) {
        const turnContext: FlowContext = {
          ...currentFlowContext,
          conversationHistory: [...(currentFlowContext.conversationHistory || []), userMessage],
        };
        
        const flowInput: ExecuteAgentFlowInput = {
          flowDefinition: currentAgentFlow,
          currentContext: turnContext,
          currentMessage: currentInput,
          startNodeId: nextNodeIdToResume || currentAgentFlow.nodes.find(n => n.type === 'start')?.id, 
          knowledgeItems: agent.knowledgeItems || [],
        };
        
        const result = await executeAgentFlow(flowInput);

        const agentResponses: ChatMessage[] = result.messagesToSend.map((msg, index) => ({
          id: `flow-${Date.now()}-${index}`,
          sender: 'agent',
          text: msg,
          timestamp: Date.now() + index,
          flowNodeId: result.updatedContext.currentNodeId,
          flowContext: { ...result.updatedContext },
        }));
        setMessages((prev) => [...prev, ...agentResponses]);
        setCurrentFlowContext({ ...result.updatedContext }); 

        if (result.nextNodeId) {
          setNextNodeIdToResume(result.nextNodeId); 
        } else {
          setNextNodeIdToResume(undefined); 
        }

        if (result.error) {
          toast({ title: "Flow Execution Error", description: result.error, variant: "destructive" });
           setMessages(prev => [...prev, {id: 'flow-error-exec', sender: 'agent', text: `Flow error: ${result.error}`, timestamp: Date.now()}]);
        }
        if (result.isFlowFinished) {
           setMessages(prev => [...prev, {id: 'flow-finished-msg', sender: 'agent', text: "(Flow has finished)", timestamp: Date.now()}]);
           setNextNodeIdToResume(undefined);
        }

      } else { 
        const intentResult = await recognizeIntent({ userInput: userMessage.text });
        setMessages(prev => prev.map(m => m.id === userMessage.id ? {...m, intent: intentResult.intent, entities: intentResult.entities } : m));
        
        const currentConversationHistory = [...messages, userMessage]; 
        const contextStringForReasoning = currentConversationHistory.map(m => `${m.sender === 'user' ? 'User' : 'Agent'}: ${m.text}`).join('\n');
        
        const reasoningResult = await autonomousReasoning({ context: contextStringForReasoning, userInput: userMessage.text });

        const agentResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          text: reasoningResult.responseToUser,
          timestamp: Date.now(),
          reasoning: reasoningResult.reasoning,
          intent: intentResult.intent, 
          entities: intentResult.entities, 
        };
        setMessages((prev) => [...prev, agentResponse]);
      }
    } catch (error: any) {
      console.error("Error processing message:", error);
      const errorMessage = error.message || "Could not get a response from the agent.";
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
    if (isLoading || isRestarting || isInitializing) return;
    setIsRestarting(true);
    setInput(""); 
    setMessages([]); // Clear messages immediately for responsiveness
    setCurrentFlowContext({ conversationHistory: [], waitingForInput: undefined, currentNodeId: undefined });
    setNextNodeIdToResume(undefined);
    await initializeChat(true); 
    setIsRestarting(false);
  };


  return (
    <div className="flex flex-col h-[calc(100vh-250px)] max-h-[700px] border rounded-lg shadow-lg bg-card">
      <div className="p-2 border-b flex justify-between items-center gap-2 text-xs">
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRestartConversation} 
            disabled={isLoading || isRestarting || isInitializing} 
            title="Restart Conversation"
            className="px-2 py-1 h-auto"
        >
            {isRestarting ? <Loader2 size={14} className="mr-1 animate-spin"/> : <RefreshCw size={14} className="mr-1"/>} Restart
        </Button>
        <div className="flex items-center gap-1">
            <span>Mode:</span>
            <Button 
                variant={chatMode === 'flow' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => {
                  if (currentAgentFlow) {
                    setChatMode('flow');
                    setMessages([]); 
                    setCurrentFlowContext({ conversationHistory: [], waitingForInput: undefined, currentNodeId: undefined });
                    setNextNodeIdToResume(undefined);
                    setIsInitializing(true); // Trigger re-initialization for the new mode
                  } else {
                    toast({title: "No Flow Defined", description: "This agent does not have a flow. Please define one in the Studio.", variant: "destructive"});
                  }
                }}
                disabled={!currentAgentFlow || isLoading || isRestarting || isInitializing}
                title={!currentAgentFlow ? "No flow defined for this agent" : "Switch to Flow Execution Mode"}
                className="px-2 py-1 h-auto"
            >
                <Zap size={14} className="mr-1"/> Flow
            </Button>
            <Button 
                variant={chatMode === 'autonomous' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => {
                  setChatMode('autonomous');
                  setMessages([]);
                  setCurrentFlowContext({ conversationHistory: [], waitingForInput: undefined, currentNodeId: undefined });
                  setNextNodeIdToResume(undefined);
                  setIsInitializing(true); // Trigger re-initialization for the new mode
                }}
                disabled={isLoading || isRestarting || isInitializing}
                title="Switch to Autonomous Reasoning Mode"
                className="px-2 py-1 h-auto"
            >
            <Cog size={14} className="mr-1"/> Autonomous
            </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-end gap-2",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.sender === "agent" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot size={18}/></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[70%] rounded-lg p-3 text-sm shadow",
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {(message.intent || message.reasoning || message.flowNodeId || message.flowContext || message.entities) && (
                  <Accordion type="single" collapsible className="mt-2 text-xs w-full">
                    <AccordionItem value="item-1" className="border-b-0">
                      <AccordionTrigger className="py-1 hover:no-underline text-muted-foreground [&[data-state=open]>svg]:text-foreground">
                        <Info size={12} className="mr-1" /> AI Debug Info 
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-0 space-y-1 bg-background/30 p-2 rounded">
                        {message.flowNodeId && <p><strong>Flow Node:</strong> {message.flowNodeId}</p>}
                        {message.intent && <p><strong>Intent:</strong> {message.intent}</p>}
                        {message.entities && Object.keys(message.entities).length > 0 && (
                          <p><strong>Entities:</strong> {JSON.stringify(message.entities)}</p>
                        )}
                        {message.reasoning && <p><strong>Reasoning:</strong> {message.reasoning}</p>}
                        {message.flowContext && (
                            <details className="text-xs cursor-pointer">
                                <summary className="font-semibold">Flow Context (click to expand)</summary>
                                <pre className="whitespace-pre-wrap bg-muted/50 p-1 rounded text-[10px] max-h-48 overflow-auto mt-1 border">
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
                 <Avatar className="h-8 w-8">
                   <AvatarFallback><User size={18}/></AvatarFallback>
                 </Avatar>
              )}
            </div>
          ))}
          {(isLoading || isInitializing) && messages.length === 0 && ( // Initial loading/initializing state for greetings or flow start
             <div className="flex items-end gap-2 justify-start">
               <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot size={18}/></AvatarFallback>
                </Avatar>
              <div className="max-w-[70%] rounded-lg p-3 text-sm shadow bg-muted">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          )}
          {isLoading && !isInitializing && messages.length > 0 && messages[messages.length-1].sender === 'user' && ( 
            <div className="flex items-end gap-2 justify-start">
               <Avatar className="h-8 w-8">
                  <AvatarFallback><Bot size={18}/></AvatarFallback>
                </Avatar>
              <div className="max-w-[70%] rounded-lg p-3 text-sm shadow bg-muted">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
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
            placeholder={nextNodeIdToResume ? "Response awaited by flow..." : "Type your message..."}
            className="flex-1"
            disabled={isLoading || isRestarting || isInitializing}
          />
          <Button type="submit" size="icon" disabled={isLoading || isRestarting || isInitializing || input.trim() === ""}>
            {(isLoading && !isRestarting && !isInitializing) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
