
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "../../../layout";
import type { Agent, AgentFlowDefinition } from "@/lib/types"; // These types come from lib/types
import { Loader2, Save, FileJson, AlertTriangle, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle } from "@/components/ui/alert";

const sampleFlow: AgentFlowDefinition = {
  flowId: "sample-welcome-flow",
  name: "Sample Welcome Onboarding",
  description: "A sample flow to greet users and ask for their name, then uses knowledge.",
  nodes: [
    { id: "start", type: "start", position: { x: 50, y: 50 } },
    { id: "greet", type: "sendMessage", message: "Hello! Welcome to AgentVerse. I can use my knowledge base. What's your name?", position: { x: 50, y: 150 } },
    { id: "get_name", type: "getUserInput", prompt: "Please tell me your name.", variableName: "userName", position: { x: 50, y: 250 } },
    { 
      id: "confirm_name_with_knowledge", 
      type: "callLLM", 
      llmPrompt: "User's name is {{userName}}. Respond with a friendly confirmation like 'Nice to meet you, {{userName}}!' and mention something from your knowledge if relevant.", 
      outputVariable: "confirmationMessage", 
      useKnowledge: true, // Use knowledge here
      position: { x: 50, y: 350 } 
    },
    { id: "send_confirmation", type: "sendMessage", message: "{{confirmationMessage}}", position: { x: 50, y: 450 } },
    { id: "end", type: "end", position: { x: 50, y: 550 } }
  ],
  edges: [
    { id: "e_start_greet", source: "start", target: "greet", label: "Start" },
    { id: "e_greet_get_name", source: "greet", target: "get_name" },
    { id: "e_get_name_confirm_name", source: "get_name", target: "confirm_name_with_knowledge" },
    { id: "e_confirm_name_send_confirmation", source: "confirm_name_with_knowledge", target: "send_confirmation"},
    { id: "e_send_confirmation_end", source: "send_confirmation", target: "end" }
  ]
};

export default function AgentStudioPage() {
  const params = useParams();
  const { toast } = useToast();
  const { getAgent, updateAgentFlow } = useAppContext();
  
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const [currentAgent, setCurrentAgent] = useState<Agent | null | undefined>(undefined);
  const [flowJson, setFlowJson] = useState<string>("");
  const [parsedFlow, setParsedFlow] = useState<AgentFlowDefinition | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (agentId) {
      const agent = getAgent(agentId as string);
      setCurrentAgent(agent);
      if (agent?.flow) {
        const flowString = JSON.stringify(agent.flow, null, 2);
        setFlowJson(flowString);
        setParsedFlow(agent.flow);
        setJsonError(null);
      } else {
        setFlowJson(""); 
        setParsedFlow(null);
      }
    }
  }, [agentId, getAgent]); 

  const handleJsonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newJson = event.target.value;
    setFlowJson(newJson);
    try {
      if (newJson.trim() === "") {
        setParsedFlow(null);
        setJsonError(null);
        return;
      }
      const parsed = JSON.parse(newJson);
      if (parsed && parsed.nodes && parsed.edges && parsed.flowId) {
        setParsedFlow(parsed);
        setJsonError(null);
      } else {
        setParsedFlow(null);
        setJsonError("Invalid flow structure. Missing flowId, nodes, or edges.");
      }
    } catch (error) {
      setParsedFlow(null);
      setJsonError("Invalid JSON format. " + (error as Error).message);
    }
  };

  const handleSaveFlow = () => {
    if (!currentAgent) {
        toast({ title: "Agent Not Found", description: "Cannot save flow, agent not loaded.", variant: "destructive" });
        return;
    }
    if (jsonError && flowJson.trim() !== "") { 
        toast({ title: "Invalid JSON", description: "Cannot save, JSON is invalid.", variant: "destructive"});
        return;
    }
    if (!parsedFlow && flowJson.trim() !== "") { 
      toast({ title: "No Valid Flow Data", description: "Cannot save, flow data is not valid or empty.", variant: "destructive"});
      return;
    }

    setIsSaving(true);
    try {
      updateAgentFlow(currentAgent.id, parsedFlow || undefined as any); 
      toast({
        title: "Flow Saved!",
        description: parsedFlow ? `Flow "${parsedFlow.name}" has been updated for agent ${currentAgent.generatedName || currentAgent.name}.` : `Flow cleared for agent ${currentAgent.generatedName || currentAgent.name}.`,
      });
    } catch (error) {
      console.error("Error saving flow:", error);
      toast({ title: "Save Error", description: "Could not save the flow.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const loadSample = () => {
    const sampleJsonString = JSON.stringify(sampleFlow, null, 2);
    setFlowJson(sampleJsonString);
    setParsedFlow(sampleFlow);
    setJsonError(null);
    toast({ title: "Sample Flow Loaded", description: "You can now edit and save this sample flow."});
  };
  
  const clearFlow = () => {
    setFlowJson("");
    setParsedFlow(null);
    setJsonError(null);
     if (currentAgent) {
      updateAgentFlow(currentAgent.id, undefined as any); 
      toast({ title: "Flow Cleared", description: "Flow editor and agent's flow data have been cleared."});
    } else {
      toast({ title: "Flow Cleared", description: "Flow editor has been cleared."});
    }
  };


  if (currentAgent === undefined) return <Card><CardHeader><CardTitle>Loading Studio...</CardTitle></CardHeader><CardContent><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /></CardContent></Card>;
  if (!currentAgent) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Agent Not Found</AlertTitle></Alert>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Agent Flow Studio: {currentAgent.generatedName || currentAgent.name}</CardTitle>
          <CardDescription>Define your agent's conversational logic using a JSON-based flow definition. Node positions are for potential future visual rendering and not used by the current execution engine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={loadSample} variant="outline" size="sm"><FileJson className="mr-2 h-4 w-4" />Load Sample Flow</Button>
            <Button onClick={clearFlow} variant="destructive" size="sm" disabled={!flowJson && (!currentAgent.flow || Object.keys(currentAgent.flow).length === 0)}><Trash2 className="mr-2 h-4 w-4" />Clear Flow & Editor</Button>
          </div>
          <Textarea
            value={flowJson}
            onChange={handleJsonChange}
            rows={25}
            placeholder="Paste or write your agent flow JSON here, or leave empty to clear the flow..."
            className="font-code text-xs bg-muted/30 border-input focus:border-primary"
          />
          {jsonError && (
            <Alert variant="destructive" className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>JSON Error</AlertTitle>
              <p className="text-xs">{jsonError}</p>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSaveFlow} 
            disabled={isSaving || (!!jsonError && flowJson.trim() !== "")} 
            className="w-full"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Flow
          </Button>
        </CardFooter>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Flow Structure</CardTitle>
          <CardDescription>A basic overview of your parsed flow.</CardDescription>
        </CardHeader>
        <CardContent>
          {parsedFlow ? (
            <ScrollArea className="h-[600px] pr-3">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Flow: {parsedFlow.name}</h4>
                  <p className="text-xs text-muted-foreground">{parsedFlow.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Nodes ({parsedFlow.nodes.length}):</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                    {parsedFlow.nodes.map(node => (
                      <li key={node.id} className="text-xs">
                        <span className="font-medium">{node.id}</span> ({node.type})
                        {node.useKnowledge && <span className="text-muted-foreground block pl-4 text-xs italic">(Uses Knowledge)</span>}
                        {node.message && <span className="text-muted-foreground block pl-4 text-xs">Msg: "{node.message}"</span>}
                        {node.prompt && <span className="text-muted-foreground block pl-4 text-xs">Prompt: "{node.prompt}"</span>}
                        {node.llmPrompt && <span className="text-muted-foreground block pl-4 text-xs">LLM Prompt: "{node.llmPrompt}"</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Edges ({parsedFlow.edges.length}):</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm pl-2">
                    {parsedFlow.edges.map(edge => (
                      <li key={edge.id} className="text-xs">
                        {edge.source} <span className="text-primary mx-1">&rarr;</span> {edge.target}
                        {edge.label && <span className="text-muted-foreground text-xs"> ({edge.label})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground">
              {flowJson.trim() ? "JSON is invalid or not structured correctly." : "No flow loaded or defined. Paste JSON or load a sample."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
