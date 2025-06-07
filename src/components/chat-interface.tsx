
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Info, ChevronDown, Zap, Cog } from "lucide-react";
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
import { useAppContext } from "@/app/(app)/layout"; // For getting flow definition

interface ChatInterfaceProps {
  agent: Agent;
}

type ChatMode = "autonomous" | "flow";

export function ChatInterface({ agent }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { getAgentFlow } = useAppContext();

  const [chatMode, setChatMode] = useState<ChatMode>("autonomous");
  const [currentFlowContext, setCurrentFlowContext] = useState<FlowContext>({});
  const [currentAgentFlow, setCurrentAgentFlow] = useState<AgentFlowDefinition | undefined>(undefined);
  const [nextNodeIdToResume, setNextNodeIdToResume] = useState<string | undefined>(undefined);


  useEffect(() => {
    const flow = getAgentFlow(agent.id);
    setCurrentAgentFlow(flow);
    if (flow) {
      setChatMode("flow"); // Default to flow mode if agent has a flow
      // Reset context if agent or flow changes
      setCurrentFlowContext({ conversationHistory: [] }); 
      setNextNodeIdToResume(undefined);
    } else {
      setChatMode("autonomous");
    }
  }, [agent.id, getAgentFlow]);


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
  
  const initializeChat = useCallback(() => {
    let initialMessages: ChatMessage[] = [];
    if (agent.generatedGreeting) {
      initialMessages.push({
        id: 'agent-greeting',
        sender: 'agent',
        text: agent.generatedGreeting,
        timestamp: Date.now()
      });
    }

    if (chatMode === "flow" && currentAgentFlow) {
      // If flow mode, try to kick off the flow from the start node (e.g., for an initial message)
      // This call happens without user input, so currentMessage is undefined.
      // The flow should handle this, e.g. by sending its first message or prompting if start node is getUserInput
      setIsLoading(true);
      executeAgentFlow({
        flowDefinition: currentAgentFlow,
        currentContext: { ...currentFlowContext, waitingForInput: undefined }, // Fresh context, ensure waitingForInput is clear
        currentMessage: undefined, // No user message yet
        startNodeId: currentAgentFlow.nodes.find(n => n.type === 'start')?.id,
      }).then(flowResult => {
        const agentResponses: ChatMessage[] = flowResult.messagesToSend.map((msg, index) => ({
          id: `flow-init-${Date.now()}-${index}`,
          sender: 'agent',
          text: msg,
          timestamp: Date.now() + index,
          flowNodeId: flowResult.updatedContext.currentNodeId,
        }));
        setMessages(prev => [...prev, ...agentResponses]);
        setCurrentFlowContext(flowResult.updatedContext);
        if (flowResult.nextNodeId) {
          setNextNodeIdToResume(flowResult.nextNodeId);
        } else {
          setNextNodeIdToResume(undefined);
        }
        if (flowResult.error) {
          toast({ title: "Flow Error", description: flowResult.error, variant: "destructive" });
        }
      }).catch(err => {
        console.error("Error initializing flow:", err);
        toast({ title: "Flow Init Error", description: "Could not start the agent flow.", variant: "destructive" });
        setMessages(prev => [...prev, {id: 'flow-error-init', sender: 'agent', text: "Error starting my conversation flow.", timestamp: Date.now()}]);
      }).finally(() => setIsLoading(false));
    }
     setMessages(initialMessages);
  }, [agent.generatedGreeting, chatMode, currentAgentFlow, toast, currentFlowContext]);


  useEffect(() => {
    // Initialize chat when agent or flow definition changes
    setMessages([]); // Clear previous messages
    initializeChat();
  }, [agent, currentAgentFlow, initializeChat]); // Rerun if agent or its flow definition changes


  const handleSendMessage = async () => {
    if (input.trim() === "" || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input; // Capture input before clearing
    setInput("");
    setIsLoading(true);

    try {
      if (chatMode === "flow" && currentAgentFlow) {
        const flowInput: ExecuteAgentFlowInput = {
          flowDefinition: currentAgentFlow,
          currentContext: { // Pass a fresh copy of context
            ...currentFlowContext,
            conversationHistory: [...(currentFlowContext.conversationHistory || []), userMessage],
             // Ensure waitingForInput is correctly set if resuming
            waitingForInput: nextNodeIdToResume ? nextNodeIdToResume : undefined,
          },
          currentMessage: currentInput,
          startNodeId: nextNodeIdToResume || currentAgentFlow.nodes.find(n => n.type === 'start')?.id,
        };
        
        const result = await executeAgentFlow(flowInput);

        const agentResponses: ChatMessage[] = result.messagesToSend.map((msg, index) => ({
          id: `flow-${Date.now()}-${index}`,
          sender: 'agent',
          text: msg,
          timestamp: Date.now() + index,
          flowNodeId: result.updatedContext.currentNodeId,
          flowContext: result.updatedContext, // For debug
        }));
        setMessages((prev) => [...prev, ...agentResponses]);
        setCurrentFlowContext(result.updatedContext); // Update context for next turn

        if (result.nextNodeId) {
          setNextNodeIdToResume(result.nextNodeId); // Flow is waiting for more input
        } else {
          setNextNodeIdToResume(undefined); // Flow completed or ended
        }

        if (result.error) {
          toast({ title: "Flow Execution Error", description: result.error, variant: "destructive" });
        }
        if (result.isFlowFinished) {
          // toast({ title: "Flow Finished", description: "The conversation flow has completed."});
           setNextNodeIdToResume(undefined); // Ensure no resume if flow finished
        }

      } else { // Autonomous mode
        const intentResult = await recognizeIntent({ userInput: userMessage.text });
        setMessages(prev => prev.map(m => m.id === userMessage.id ? {...m, intent: intentResult.intent, entities: intentResult.entities } : m));
        
        const reasoningContext = messages.map(m => `${m.sender}: ${m.text}`).join('\n') + `\nUser: ${userMessage.text}`;
        const reasoningResult = await autonomousReasoning({ context: reasoningContext, userInput: userMessage.text });

        const agentResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "agent",
          text: reasoningResult.nextAction,
          timestamp: Date.now(),
          reasoning: reasoningResult.reasoning,
          intent: intentResult.intent,
        };
        setMessages((prev) => [...prev, agentResponse]);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      toast({
        title: "Error",
        description: "Could not get a response from the agent.",
        variant: "destructive",
      });
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] max-h-[700px] border rounded-lg shadow-lg bg-card">
      <div className="p-2 border-b flex justify-end items-center gap-2 text-xs">
        <span>Mode:</span>
        <Button 
            variant={chatMode === 'flow' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => {
              if (currentAgentFlow) setChatMode('flow');
              else toast({title: "No Flow", description: "This agent has no flow defined. Create one in the Studio.", variant: "destructive"});
            }}
            disabled={!currentAgentFlow}
            title={!currentAgentFlow ? "No flow defined for this agent" : "Switch to Flow Execution Mode"}
            className="px-2 py-1 h-auto"
        >
            <Zap size={14} className="mr-1"/> Flow
        </Button>
        <Button 
            variant={chatMode === 'autonomous' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setChatMode('autonomous')}
            title="Switch to Autonomous Reasoning Mode"
            className="px-2 py-1 h-auto"
        >
           <Cog size={14} className="mr-1"/> Autonomous
        </Button>
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
                {(message.intent || message.reasoning || message.flowNodeId) && (
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
                            <details className="text-xs">
                                <summary>Flow Context</summary>
                                <pre className="whitespace-pre-wrap bg-muted/50 p-1 rounded text-[10px] max-h-32 overflow-auto">
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
          {isLoading && (
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
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || input.trim() === ""}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
