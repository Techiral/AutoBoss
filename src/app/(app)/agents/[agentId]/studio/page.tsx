
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
  flowId: "customer-support-agent-flow",
  name: "Customer Support Real-Time Agent",
  description: "A flow-driven assistant that greets the customer, classifies their issue, gathers details, provides an immediate solution, checks resolution, and escalates if needed.",
  nodes: [
    {
      "id": "start",
      "type": "start",
      "position": { "x": 50, "y": 50 }
    },
    {
      "id": "greet",
      "type": "sendMessage",
      "message": "Hi there! I’m your support agent. What can I help you with today?",
      "position": { "x": 50, "y": 150 }
    },
    {
      "id": "get_issue_category",
      "type": "getUserInput",
      "prompt": "Please choose your issue category (Billing, Technical, Other):",
      "variableName": "issueCategory",
      "position": { "x": 50, "y": 250 }
    },
    {
      "id": "check_category",
      "type": "condition",
      "conditionVariable": "issueCategory",
      "position": { "x": 50, "y": 350 }
    },

    {
      "id": "ask_billing_details",
      "type": "getUserInput",
      "prompt": "Got it—billing issue. Can you share your account ID or invoice number?",
      "variableName": "billingInfo",
      "position": { "x": 250, "y": 450 }
    },
    {
      "id": "resolve_billing",
      "type": "callLLM",
      "llmPrompt": "You are a billing support agent. Based on the account/invoice `{{billingInfo}}`, give a concise, accurate solution or next steps.",
      "outputVariable": "billingSolution",
      "useKnowledge": true,
      "position": { "x": 250, "y": 550 }
    },
    {
      "id": "send_billing_solution",
      "type": "sendMessage",
      "message": "{{billingSolution}}",
      "position": { "x": 250, "y": 650 }
    },

    {
      "id": "ask_tech_details",
      "type": "getUserInput",
      "prompt": "Alright—technical issue. Could you describe the error or what’s not working?",
      "variableName": "techDetails",
      "position": { "x": 50, "y": 450 } // Adjusted Y for visual clarity if parallel
    },
    {
      "id": "resolve_technical",
      "type": "callLLM",
      "llmPrompt": "You’re a technical support agent. Based on the description `{{techDetails}}`, provide step-by-step troubleshooting.",
      "outputVariable": "techSolution",
      "useKnowledge": true,
      "position": { "x": 50, "y": 550 } // Adjusted Y
    },
    {
      "id": "send_tech_solution",
      "type": "sendMessage",
      "message": "{{techSolution}}",
      "position": { "x": 50, "y": 650 } // Adjusted Y
    },

    {
      "id": "ask_general_details",
      "type": "getUserInput",
      "prompt": "Sure—other issue. Can you give me more details?",
      "variableName": "generalDetails",
      "position": { "x": -150, "y": 450 } // Adjusted Y
    },
    {
      "id": "resolve_general",
      "type": "callLLM",
      "llmPrompt": "You’re a customer support agent. Based on `{{generalDetails}}`, provide a helpful next step or resource.",
      "outputVariable": "generalSolution",
      "useKnowledge": true,
      "position": { "x": -150, "y": 550 } // Adjusted Y
    },
    {
      "id": "send_general_solution",
      "type": "sendMessage",
      "message": "{{generalSolution}}",
      "position": { "x": -150, "y": 650 } // Adjusted Y
    },

    // Common node for asking resolution, all solution paths should lead here
    {
      "id": "ask_resolution",
      "type": "getUserInput",
      "prompt": "Did that solve your problem? (yes/no)",
      "variableName": "resolved",
      "position": { "x": 50, "y": 750 } // Centralized after solutions
    },
    {
      "id": "check_resolution",
      "type": "condition",
      "conditionVariable": "resolved",
      "position": { "x": 50, "y": 850 }
    },

    {
      "id": "resolved_yes",
      "type": "sendMessage",
      "message": "Awesome! Glad I could help. If there’s anything else, just let me know. 👍",
      "position": { "x": 250, "y": 950 } // Branch for 'yes'
    },
    {
      "id": "end_resolved_yes",
      "type": "end",
      "position": { "x": 250, "y": 1050 }
    },

    {
      "id": "resolved_no",
      "type": "sendMessage",
      "message": "I’m sorry it’s still not sorted. I’ll escalate this to our specialist team—expect an email or call soon.",
      "position": { "x": -150, "y": 950 } // Branch for 'no'
    },
    {
      "id": "end_resolved_no",
      "type": "end",
      "position": { "x": -150, "y": 1050 }
    },
    {
      "id": "invalid_category_response", // Renamed for clarity
      "type": "sendMessage",
      "message": "Hmm, I didn’t catch that category. Let’s try again. Please choose Billing, Technical, or Other.",
      "position": { "x": 50, "y": 450 } // Default path from check_category
    },
    // No end node immediately after invalid_category_response, edge will loop back
    {
      "id": "end_flow_default_resolution", // Default if resolution input is not yes/no
      "type": "sendMessage",
      "message": "Okay, if you need more help later, just ask!",
      "position": { "x": 50, "y": 950 }
    },
    {
      "id": "final_end_default_resolution",
      "type": "end",
      "position": { "x": 50, "y": 1050}
    }
  ],
  "edges": [
    { "id": "e_start_greet", "source": "start", "target": "greet", "label": "Start" },
    { "id": "e_greet_category", "source": "greet", "target": "get_issue_category" },
    { "id": "e_category_check", "source": "get_issue_category", "target": "check_category" },

    { "id": "e_cat_billing", "source": "check_category", "target": "ask_billing_details", "condition": "Billing", "label": "Category: Billing" },
    { "id": "e_billing_resolve", "source": "ask_billing_details", "target": "resolve_billing" },
    { "id": "e_billing_send", "source": "resolve_billing", "target": "send_billing_solution" },

    { "id": "e_cat_tech", "source": "check_category", "target": "ask_tech_details", "condition": "Technical", "label": "Category: Technical" },
    { "id": "e_tech_resolve", "source": "ask_tech_details", "target": "resolve_technical" },
    { "id": "e_tech_send", "source": "resolve_technical", "target": "send_tech_solution" },

    { "id": "e_cat_other", "source": "check_category", "target": "ask_general_details", "condition": "Other", "label": "Category: Other" },
    { "id": "e_general_resolve", "source": "ask_general_details", "target": "resolve_general" },
    { "id": "e_general_send", "source": "resolve_general", "target": "send_general_solution" },
    
    // Default path for category check
    { "id": "e_cat_invalid", "source": "check_category", "target": "invalid_category_response", "condition": "", "label": "Invalid Category" },
    // Loop back from invalid category message to asking for category again
    { "id": "e_invalid_loop_to_category", "source": "invalid_category_response", "target": "get_issue_category"},


    // Edges from all solution paths to the common 'ask_resolution' node
    { "id": "e_billing_to_ask_resolution", "source": "send_billing_solution", "target": "ask_resolution" },
    { "id": "e_tech_to_ask_resolution", "source": "send_tech_solution", "target": "ask_resolution" },
    { "id": "e_general_to_ask_resolution", "source": "send_general_solution", "target": "ask_resolution" },

    { "id": "e_ask_resolution_to_check", "source": "ask_resolution", "target": "check_resolution" },
    { "id": "e_resolved_yes_path", "source": "check_resolution", "target": "resolved_yes", "condition": "yes", "label": "Resolved: Yes" },
    { "id": "e_yes_to_end", "source": "resolved_yes", "target": "end_resolved_yes" },

    { "id": "e_resolved_no_path", "source": "check_resolution", "target": "resolved_no", "condition": "no", "label": "Resolved: No" },
    { "id": "e_no_to_end", "source": "resolved_no", "target": "end_resolved_no" },
    
    // Default path for resolution check
    { "id": "e_resolution_default_path", "source": "check_resolution", "target": "end_flow_default_resolution", "condition": "", "label": "Resolution Unclear" },
    { "id": "e_default_resolution_to_end", "source": "end_flow_default_resolution", "target": "final_end_default_resolution"}
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
      if (parsed && parsed.nodes && Array.isArray(parsed.nodes) && parsed.edges && Array.isArray(parsed.edges) && parsed.flowId && typeof parsed.flowId === 'string') {
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
