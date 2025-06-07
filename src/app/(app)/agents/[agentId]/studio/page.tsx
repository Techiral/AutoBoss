
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
  "flowId": "customer-support-agent-v2",
  "name": "Intelligent Customer Support Agent",
  "description": "A flow-driven assistant that greets the customer, intelligently classifies their issue using an LLM, gathers details, provides solutions (optionally using knowledge), checks resolution with LLM understanding, and escalates if needed.",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "position": { "x": 50, "y": 50 }
    },
    {
      "id": "greet",
      "type": "sendMessage",
      "message": "Hi there! I’m your support agent. How can I assist you today?",
      "position": { "x": 50, "y": 150 }
    },
    {
      "id": "get_issue_description",
      "type": "getUserInput",
      "prompt": "Please describe your issue or question.",
      "variableName": "userIssueDescription",
      "position": { "x": 50, "y": 250 }
    },
    {
      "id": "check_category_intelligent",
      "type": "condition",
      "conditionVariable": "userIssueDescription",
      "useLLMForDecision": true, // Key change: Use LLM for this decision
      "position": { "x": 50, "y": 350 }
    },
    {
      "id": "ask_billing_details",
      "type": "getUserInput",
      "prompt": "I understand you have a billing-related question. Could you please provide your account ID or invoice number so I can look into it?",
      "variableName": "billingInfo",
      "position": { "x": 300, "y": 450 }
    },
    {
      "id": "resolve_billing",
      "type": "callLLM",
      "llmPrompt": "You are a billing support specialist. The user's issue is about billing. Their details: '{{billingInfo}}'. Provide a concise solution or clear next steps. If relevant knowledge is available, use it.",
      "outputVariable": "billingSolution",
      "useKnowledge": true,
      "position": { "x": 300, "y": 550 }
    },
    {
      "id": "send_billing_solution",
      "type": "sendMessage",
      "message": "{{billingSolution}}",
      "position": { "x": 300, "y": 650 }
    },
    {
      "id": "ask_tech_details",
      "type": "getUserInput",
      "prompt": "It sounds like a technical issue. To help you best, could you describe any error messages you're seeing, or what exactly isn't working?",
      "variableName": "techDetails",
      "position": { "x": 50, "y": 450 }
    },
    {
      "id": "resolve_technical",
      "type": "callLLM",
      "llmPrompt": "You are a technical support expert. The user described a technical problem: '{{techDetails}}'. Provide step-by-step troubleshooting. If relevant knowledge is available, incorporate it.",
      "outputVariable": "techSolution",
      "useKnowledge": true,
      "position": { "x": 50, "y": 550 }
    },
    {
      "id": "send_tech_solution",
      "type": "sendMessage",
      "message": "{{techSolution}}",
      "position": { "x": 50, "y": 650 }
    },
    {
      "id": "ask_general_query_details",
      "type": "getUserInput",
      "prompt": "I'll do my best to help with that. Could you give me a bit more detail on your query?",
      "variableName": "generalQueryDetails",
      "position": { "x": -200, "y": 450 }
    },
    {
      "id": "resolve_general_query",
      "type": "callLLM",
      "llmPrompt": "You are a general customer support agent. The user's query: '{{generalQueryDetails}}'. Provide a helpful response or direct them to the appropriate resources. Use available knowledge if applicable.",
      "outputVariable": "generalQuerySolution",
      "useKnowledge": true,
      "position": { "x": -200, "y": 550 }
    },
    {
      "id": "send_general_query_solution",
      "type": "sendMessage",
      "message": "{{generalQuerySolution}}",
      "position": { "x": -200, "y": 650 }
    },
    {
      "id": "unclear_issue_message",
      "type": "sendMessage",
      "message": "I'm not quite sure how to categorize your request. Could you please try rephrasing it, perhaps mentioning if it's about billing, a technical problem, or something else?",
      "position": { "x": 50, "y": 450 } // Default from check_category_intelligent
    },
    {
      "id": "ask_if_resolved",
      "type": "getUserInput",
      "prompt": "Did that help resolve your issue? (e.g., yes, mostly, not really, no)",
      "variableName": "userResolutionFeedback",
      "position": { "x": 50, "y": 750 }
    },
    {
      "id": "check_resolution_intelligent",
      "type": "condition",
      "conditionVariable": "userResolutionFeedback",
      "useLLMForDecision": true, // Key change: Use LLM for this decision
      "position": { "x": 50, "y": 850 }
    },
    {
      "id": "resolved_positive_message",
      "type": "sendMessage",
      "message": "Great! I'm glad I could help. If you need anything else, just let me know. 👍",
      "position": { "x": 300, "y": 950 }
    },
    {
      "id": "end_resolved_positive",
      "type": "end",
      "position": { "x": 300, "y": 1050 }
    },
    {
      "id": "resolved_negative_message",
      "type": "sendMessage",
      "message": "I’m sorry to hear that didn't fully resolve it. I can escalate this to our specialist team. They'll review the details and get back to you. Is there anything else I can note for them?",
      "variableName": "escalationNotes", // Example of capturing more info before ending or true escalation
      "position": { "x": -200, "y": 950 }
    },
    {
      "id": "end_resolved_negative_escalated",
      "type": "end",
      "position": { "x": -200, "y": 1050 }
    },
    {
      "id": "resolution_unclear_message", // Default from check_resolution_intelligent
      "type": "sendMessage",
      "message": "Okay, if you need more help later, feel free to ask!",
      "position": { "x": 50, "y": 950 }
    },
    {
      "id": "end_resolution_unclear",
      "type": "end",
      "position": { "x": 50, "y": 1050 }
    }
  ],
  "edges": [
    { "id": "e_start_to_greet", "source": "start", "target": "greet" },
    { "id": "e_greet_to_get_issue", "source": "greet", "target": "get_issue_description" },
    { "id": "e_get_issue_to_check_category", "source": "get_issue_description", "target": "check_category_intelligent" },
    // Edges from INTELLIGENT category check
    { "id": "e_cat_billing_ai", "source": "check_category_intelligent", "target": "ask_billing_details", "condition": "Billing Inquiry", "label": "Path: Billing" },
    { "id": "e_cat_tech_ai", "source": "check_category_intelligent", "target": "ask_tech_details", "condition": "Technical Support", "label": "Path: Technical" },
    { "id": "e_cat_general_ai", "source": "check_category_intelligent", "target": "ask_general_query_details", "condition": "General Question", "label": "Path: General" },
    { "id": "e_cat_unclear_ai", "source": "check_category_intelligent", "target": "unclear_issue_message", "condition": "", "label": "Path: Unclear (Default)" }, // Default path for category check
    { "id": "e_unclear_issue_to_get_issue", "source": "unclear_issue_message", "target": "get_issue_description" }, // Loop back if unclear

    { "id": "e_ask_billing_to_resolve", "source": "ask_billing_details", "target": "resolve_billing" },
    { "id": "e_resolve_billing_to_send", "source": "resolve_billing", "target": "send_billing_solution" },
    { "id": "e_send_billing_to_ask_resolved", "source": "send_billing_solution", "target": "ask_if_resolved" },

    { "id": "e_ask_tech_to_resolve", "source": "ask_tech_details", "target": "resolve_technical" },
    { "id": "e_resolve_tech_to_send", "source": "resolve_technical", "target": "send_tech_solution" },
    { "id": "e_send_tech_to_ask_resolved", "source": "send_tech_solution", "target": "ask_if_resolved" },

    { "id": "e_ask_general_to_resolve", "source": "ask_general_query_details", "target": "resolve_general_query" },
    { "id": "e_resolve_general_to_send", "source": "resolve_general_query", "target": "send_general_query_solution" },
    { "id": "e_send_general_to_ask_resolved", "source": "send_general_query_solution", "target": "ask_if_resolved" },

    { "id": "e_ask_resolved_to_check_resolution", "source": "ask_if_resolved", "target": "check_resolution_intelligent" },
    // Edges from INTELLIGENT resolution check
    { "id": "e_res_positive_ai", "source": "check_resolution_intelligent", "target": "resolved_positive_message", "condition": "Issue Resolved", "label": "Feedback: Positive" },
    { "id": "e_res_negative_ai", "source": "check_resolution_intelligent", "target": "resolved_negative_message", "condition": "Issue Not Resolved", "label": "Feedback: Negative" },
    { "id": "e_res_unclear_ai", "source": "check_resolution_intelligent", "target": "resolution_unclear_message", "condition": "", "label": "Feedback: Unclear (Default)" }, // Default path for resolution check

    { "id": "e_resolved_positive_to_end", "source": "resolved_positive_message", "target": "end_resolved_positive" },
    { "id": "e_resolved_negative_to_end", "source": "resolved_negative_message", "target": "end_resolved_negative_escalated" },
    { "id": "e_resolution_unclear_to_end", "source": "resolution_unclear_message", "target": "end_resolution_unclear" }
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
      // Basic validation: check for flowId, nodes array, and edges array
      if (parsed && parsed.nodes && Array.isArray(parsed.nodes) && parsed.edges && Array.isArray(parsed.edges) && parsed.flowId && typeof parsed.flowId === 'string') {
         // Further validation using Zod schema could be added here for deeper checks
        setParsedFlow(parsed);
        setJsonError(null);
      } else {
        setParsedFlow(null);
        setJsonError("Invalid flow structure. Must include flowId (string), nodes (array), and edges (array). Other required fields might be missing per node type.");
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
    
    const flowToSave = flowJson.trim() === "" ? undefined : parsedFlow;

    if (!flowToSave && flowJson.trim() !== "") {
      toast({ title: "No Valid Flow Data", description: "Cannot save, flow data is not valid or is empty but editor is not.", variant: "destructive"});
      return;
    }

    setIsSaving(true);
    try {
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
    setParsedFlow(sampleFlow); 
    setJsonError(null);
    toast({ title: "Sample Flow Loaded", description: "You can now edit and save this sample flow."});
  };
  
  const clearFlow = () => {
    setFlowJson("");
    setParsedFlow(null);
    setJsonError(null);
     if (currentAgent) {
      updateAgentFlow(currentAgent.id, undefined); 
      toast({ title: "Flow Cleared", description: "Flow editor and agent's flow data have been cleared."});
    } else {
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
          <CardDescription>Define your agent's conversational logic using a JSON-based flow definition. Node positions are for potential future visual rendering and not used by the current execution engine. Use `useLLMForDecision: true` on condition nodes for intelligent branching.</CardDescription>
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
                        {node.type === 'condition' && node.useLLMForDecision && <span className="text-muted-foreground block pl-4 text-xs italic">(Uses LLM for decision)</span>}
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
                        {edge.condition !== undefined && <span className="text-muted-foreground text-xs"> (If: '{edge.condition || 'Default Path'}')</span>}
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
