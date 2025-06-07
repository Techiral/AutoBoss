
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "../../../layout";
import type { Agent, AgentFlowDefinition } from "@/lib/types";
import { Loader2, Save, FileJson, AlertTriangle, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle } from "@/components/ui/alert";

const sampleFlow: AgentFlowDefinition = {
  flowId: "sample-conditional-flow",
  name: "Sample Conditional Welcome",
  description: "A sample flow that greets, asks for a name, asks about jokes, and branches conditionally.",
  nodes: [
    { id: "start", type: "start", position: { x: 50, y: 50 } },
    { id: "greet", type: "sendMessage", message: "Hello! I'm your friendly flow-driven assistant. What's your name?", position: { x: 50, y: 150 } },
    { id: "get_name", type: "getUserInput", prompt: "Please enter your name:", variableName: "userName", position: { x: 50, y: 250 } },
    { 
      id: "welcome_user", 
      type: "sendMessage", 
      message: "Nice to meet you, {{userName}}! I can use my knowledge base if needed for tasks.", 
      position: { x: 50, y: 350 } 
    },
    { id: "ask_joke_preference", type: "getUserInput", prompt: "Do you like jokes? (Please type 'yes' or 'no')", variableName: "likesJokes", position: { x: 50, y: 450 } },
    { id: "check_joke_preference", type: "condition", conditionVariable: "likesJokes", position: { x: 50, y: 550 } },
    { 
      id: "tell_joke", 
      type: "callLLM", 
      llmPrompt: "Tell me a short, clean, and funny joke. User {{userName}} likes jokes.", 
      outputVariable: "jokeText", 
      useKnowledge: false, // Jokes usually don't need external knowledge
      position: { x: 250, y: 650 } 
    },
    { id: "send_joke", type: "sendMessage", message: "{{jokeText}}", position: { x: 250, y: 750 } },
    { id: "end_joke", type: "end", position: { x: 250, y: 850 } },
    { id: "no_joke_reply", type: "sendMessage", message: "Alright, {{userName}}, no jokes today then. How else can I help?", position: { x: -150, y: 650 } },
    { id: "end_no_joke", type: "end", position: { x: -150, y: 750 } },
    { id: "confused_reply", type: "sendMessage", message: "Hmm, I didn't quite catch if you like jokes, {{userName}}. Let's move on.", position: {x: 50, y: 650} },
    { id: "end_confused", type: "end", position: {x: 50, y: 750 }}
  ],
  edges: [
    { id: "e_start_greet", source: "start", target: "greet", label: "Start" },
    { id: "e_greet_get_name", source: "greet", target: "get_name" },
    { id: "e_get_name_welcome", source: "get_name", target: "welcome_user" },
    { id: "e_welcome_ask_joke", source: "welcome_user", target: "ask_joke_preference" },
    { id: "e_ask_joke_check", source: "ask_joke_preference", target: "check_joke_preference" },
    { id: "e_check_joke_yes", source: "check_joke_preference", target: "tell_joke", condition: "yes", label: "User likes jokes" },
    { id: "e_tell_joke_send", source: "tell_joke", target: "send_joke" },
    { id: "e_send_joke_end", source: "send_joke", target: "end_joke" },
    { id: "e_check_joke_no", source: "check_joke_preference", target: "no_joke_reply", condition: "no", label: "User dislikes jokes" },
    { id: "e_no_joke_end", source: "no_joke_reply", target: "end_no_joke" },
    { id: "e_check_joke_confused", source: "check_joke_preference", target: "confused_reply", condition: "", label: "Default/Confused" }, // Default path if not "yes" or "no"
    { id: "e_confused_end", source: "confused_reply", target: "end_confused"}
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
      // Basic validation: check for essential flow properties
      if (parsed && parsed.nodes && Array.isArray(parsed.nodes) && parsed.edges && Array.isArray(parsed.edges) && parsed.flowId && typeof parsed.flowId === 'string') {
        // Further validation could be done here against AgentFlowDefinitionSchema if needed,
        // but for now, basic structure check is enough for the UI.
        setParsedFlow(parsed);
        setJsonError(null);
      } else {
        setParsedFlow(null);
        setJsonError("Invalid flow structure. Must include flowId (string), nodes (array), and edges (array).");
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
    
    // If flowJson is empty, parsedFlow will be null (or should be set to null for clarity before saving)
    const flowToSave = flowJson.trim() === "" ? undefined : parsedFlow;

    if (!flowToSave && flowJson.trim() !== "") {
      // This case means JSON is present but not parsable into a valid flow structure,
      // which should ideally be caught by jsonError state.
      toast({ title: "No Valid Flow Data", description: "Cannot save, flow data is not valid or is empty but editor is not.", variant: "destructive"});
      return;
    }


    setIsSaving(true);
    try {
      // Pass undefined if flowToSave is null/undefined, otherwise pass the flow object
      updateAgentFlow(currentAgent.id, flowToSave); 
      toast({
        title: "Flow Saved!",
        description: flowToSave ? `Flow "${flowToSave.name}" has been updated for agent ${currentAgent.generatedName || currentAgent.name}.` : `Flow cleared for agent ${currentAgent.generatedName || currentAgent.name}.`,
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
    setParsedFlow(sampleFlow); // Assume sampleFlow is always valid
    setJsonError(null);
    toast({ title: "Sample Flow Loaded", description: "You can now edit and save this sample flow."});
  };
  
  const clearFlow = () => {
    setFlowJson("");
    setParsedFlow(null);
    setJsonError(null);
     if (currentAgent) {
      updateAgentFlow(currentAgent.id, undefined); // Explicitly pass undefined
      toast({ title: "Flow Cleared", description: "Flow editor and agent's flow data have been cleared."});
    } else {
      // Should not happen if UI is correct, but good for robustness
      toast({ title: "Flow Editor Cleared", description: "Flow editor has been cleared (no agent context found to update).", variant: "default"});
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
            disabled={isSaving || (!!jsonError && flowJson.trim() !== "") || (!parsedFlow && flowJson.trim() !== "")} 
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
                        {node.conditionVariable && <span className="text-muted-foreground block pl-4 text-xs italic">(Checks: {node.conditionVariable})</span>}
                        {node.useKnowledge && <span className="text-muted-foreground block pl-4 text-xs italic">(Uses Knowledge)</span>}
                        {node.message && <span className="text-muted-foreground block pl-4 text-xs">Msg: "{node.message}"</span>}
                        {node.prompt && <span className="text-muted-foreground block pl-4 text-xs">Prompt: "{node.prompt}"</span>}
                        {node.llmPrompt && <span className="text-muted-foreground block pl-4 text-xs">LLM Prompt: "{node.llmPrompt}"</span>}
                        {node.variableName && <span className="text-muted-foreground block pl-4 text-xs">Stores in: "{node.variableName}"</span>}
                         {node.outputVariable && <span className="text-muted-foreground block pl-4 text-xs">Output to: "{node.outputVariable}"</span>}
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
                        {edge.condition !== undefined && <span className="text-muted-foreground text-xs"> (If: '{edge.condition || 'Default'}')</span>}
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
