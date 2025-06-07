
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Info, Cog, Zap, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, Agent, FlowContext, AgentFlowDefinition } from "@/lib/types";
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
  const [isLoading, setIsLoading] = useState(false); // General loading for send message or init
  const [isInitializing, setIsInitializing] = useState(true); // Specifically for initial chat setup/reset
  const [isRestarting, setIsRestarting] = useState(false); // For restart button state
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { getAgentFlow } = useAppContext();

  const [chatMode, setChatMode] = useState<ChatMode>("autonomous");
  const [currentFlowContext, setCurrentFlowContext] = useState<FlowContext>({ conversationHistory: [] });
  const [currentAgentFlow, setCurrentAgentFlow] = useState<AgentFlowDefinition | undefined>(undefined);
  const [nextNodeIdToResume, setNextNodeIdToResume] = useState<string | undefined>(undefined);

  // Refs to hold the latest state for use in event handlers
  const currentFlowContextRef = useRef(currentFlowContext);
  const nextNodeIdToResumeRef = useRef(nextNodeIdToResume);
  const currentAgentFlowRef = useRef(currentAgentFlow);
  const agentKnowledgeItemsRef = useRef(agent.knowledgeItems);
  const agentRef = useRef(agent); // Ref for the agent object itself

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
    agentKnowledgeItemsRef.current = agent.knowledgeItems;
    agentRef.current = agent; // Keep agent ref updated
  }, [agent]);


  // Effect to initialize/reset chat when agent or core flow properties change
   useEffect(() => {
    const flow = getAgentFlow(agentRef.current.id);
    setCurrentAgentFlow(flow); 
    
    if (flow) {
      setChatMode("flow");
    } else {
      setChatMode("autonomous");
    }
    setMessages([]);
    // Critical: Reset context before initialization call that will populate it
    const initialEmptyContext = { conversationHistory: [], waitingForInput: undefined, currentNodeId: undefined };
    setCurrentFlowContext(initialEmptyContext);
    currentFlowContextRef.current = initialEmptyContext; // Direct ref update
    setNextNodeIdToResume(undefined);
    nextNodeIdToResumeRef.current = undefined; // Direct ref update

    setIsInitializing(true); 
  }, [agentRef.current.id, getAgentFlow]); // Depends on agent.id via agentRef

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

    const currentMode = currentAgentFlowRef.current ? "flow" : "autonomous";

    if (agentRef.current.generatedGreeting && (currentMode === "autonomous" || !currentAgentFlowRef.current)) {
      aggregatedMessages.push({
        id: 'agent-greeting',
        sender: 'agent',
        text: agentRef.current.generatedGreeting,
        timestamp: Date.now()
      });
    }
    
    if (currentMode === "flow" && currentAgentFlowRef.current) {
      try {
        const flowToExecute = currentAgentFlowRef.current;
        const flowResult = await executeAgentFlow({
          flowDefinition: flowToExecute,
          currentContext: { ...tempContextForInit }, 
          currentMessage: undefined,
          startNodeId: flowToExecute.nodes.find(n => n.type === 'start')?.id,
          knowledgeItems: agentKnowledgeItemsRef.current || [],
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
        tempContextForInit = { ...flowResult.updatedContext }; 
        tempNextNodeIdForInit = flowResult.nextNodeId;

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
    // Directly update refs along with state to ensure they are immediately current
    currentFlowContextRef.current = tempContextForInit;
    setCurrentFlowContext(tempContextForInit); 
    nextNodeIdToResumeRef.current = tempNextNodeIdForInit;
    setNextNodeIdToResume(tempNextNodeIdForInit); 

    setIsLoading(false);
    setIsInitializing(false); 
    if (isManualRestart) {
        toast({ title: "Conversation Restarted", description: "The chat has been reset." });
    }
  // Use refs for dependencies that don't need to trigger re-creation of initializeChat itself
  // agent.id changes trigger the outer useEffect, which then calls initializeChat via isInitializing flag
  }, [toast]);


  // Effect to run initializeChat when isInitializing is true
  useEffect(() => {
    if (isInitializing) {
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
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const determinedChatMode = currentAgentFlowRef.current ? "flow" : "autonomous";

      if (determinedChatMode === "flow" && currentAgentFlowRef.current) {
        const turnContext: FlowContext = {
          ...currentFlowContextRef.current, // Use ref for latest context
          conversationHistory: [...(currentFlowContextRef.current.conversationHistory || []), userMessage],
        };
        
        const flowInput: ExecuteAgentFlowInput = {
          flowDefinition: currentAgentFlowRef.current,
          currentContext: turnContext,
          currentMessage: currentInput,
          startNodeId: nextNodeIdToResumeRef.current || currentAgentFlowRef.current.nodes.find(n => n.type === 'start')?.id, // Use ref
          knowledgeItems: agentKnowledgeItemsRef.current || [],
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
        
        // Directly update refs along with state
        currentFlowContextRef.current = { ...result.updatedContext };
        setCurrentFlowContext({ ...result.updatedContext }); 
        nextNodeIdToResumeRef.current = result.nextNodeId ? result.nextNodeId : undefined;
        setNextNodeIdToResume(result.nextNodeId ? result.nextNodeId : undefined);

        if (result.error) {
          toast({ title: "Flow Execution Error", description: result.error, variant: "destructive" });
           setMessages(prev => [...prev, {id: 'flow-error-exec', sender: 'agent', text: `Flow error: ${result.error}`, timestamp: Date.now()}]);
        }
        if (result.isFlowFinished) {
           setMessages(prev => [...prev, {id: 'flow-finished-msg', sender: 'agent', text: "(Flow has finished)", timestamp: Date.now()}]);
           nextNodeIdToResumeRef.current = undefined; // Clear ref
           setNextNodeIdToResume(undefined); // Clear state
        }

      } else { 
        const currentConversationHistory = [...messages, userMessage]; 
        const contextStringForReasoning = currentConversationHistory.map(m => `${m.sender === 'user' ? 'User' : 'Agent'}: ${m.text}`).join('\n');
        
        const intentResult = await recognizeIntent({ userInput: userMessage.text });
        
        const reasoningResult = await autonomousReasoning({ 
            context: contextStringForReasoning, 
            userInput: userMessage.text,
            knowledgeItems: agentKnowledgeItemsRef.current || []
        });

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
    if (isRestarting) return; // Prevent multiple restart calls
    setIsRestarting(true);
    setInput(""); 
    setMessages([]); 
    
    const initialEmptyContext = { conversationHistory: [], waitingForInput: undefined, currentNodeId: undefined };
    setCurrentFlowContext(initialEmptyContext);
    currentFlowContextRef.current = initialEmptyContext; // Direct ref update
    
    setNextNodeIdToResume(undefined);
    nextNodeIdToResumeRef.current = undefined; // Direct ref update
    
    // isInitializing will trigger initializeChat effect
    // No need to await initializeChat here, let the effect handle it
    setIsInitializing(true); 
    setIsRestarting(false); 
  };


  return (
    <div className="flex flex-col h-[calc(100vh-250px)] max-h-[700px] border rounded-lg shadow-lg bg-card">
      <div className="p-2 border-b flex justify-between items-center gap-2 text-xs">
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRestartConversation} 
            disabled={isRestarting || isInitializing || isLoading}
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
                  if (currentAgentFlowRef.current) { 
                    setChatMode('flow');
                    // Trigger re-initialization for the new mode by setting isInitializing
                    // Reset context before to ensure clean start for new mode
                    const initialEmptyContext = { conversationHistory: [], waitingForInput: undefined, currentNodeId: undefined };
                    setCurrentFlowContext(initialEmptyContext);
                    currentFlowContextRef.current = initialEmptyContext;
                    setNextNodeIdToResume(undefined);
                    nextNodeIdToResumeRef.current = undefined;
                    setIsInitializing(true); 
                  } else {
                    toast({title: "No Flow Defined", description: "This agent does not have a flow. Please define one in the Studio.", variant: "destructive"});
                  }
                }}
                disabled={!currentAgentFlowRef.current || isLoading || isRestarting || isInitializing}
                title={!currentAgentFlowRef.current ? "No flow defined for this agent" : "Switch to Flow Execution Mode"}
                className="px-2 py-1 h-auto"
            >
                <Zap size={14} className="mr-1"/> Flow
            </Button>
            <Button 
                variant={chatMode === 'autonomous' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => {
                  setChatMode('autonomous');
                  // Trigger re-initialization for the new mode
                  const initialEmptyContext = { conversationHistory: [], waitingForInput: undefined, currentNodeId: undefined };
                  setCurrentFlowContext(initialEmptyContext);
                  currentFlowContextRef.current = initialEmptyContext;
                  setNextNodeIdToResume(undefined);
                  nextNodeIdToResumeRef.current = undefined;
                  setIsInitializing(true);
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
          {(isLoading && isInitializing) && messages.length === 0 && ( 
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
            placeholder={nextNodeIdToResumeRef.current ? "Response awaited by flow..." : "Type your message..."}
            className="flex-1"
            disabled={isLoading || isRestarting || isInitializing} // General loading check
          />
          <Button type="submit" size="icon" disabled={isLoading || isRestarting || isInitializing || input.trim() === ""}>
            { (isLoading && !isInitializing && !isRestarting) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

