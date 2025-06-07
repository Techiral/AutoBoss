
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "../../../layout";
import type { Agent, AgentFlowDefinition, FlowNode as JsonFlowNode, FlowEdge as JsonFlowEdge } from "@/lib/types";
import { Loader2, Save, AlertTriangle, Trash2, MousePointer, ArrowRight, MessageSquare, Zap, HelpCircle, Play, ChevronsUpDown, Settings2, Link2, Cog, BookOpen, Bot, Share2, Network, SlidersHorizontal, FileCode, MessageCircleQuestion, Timer, ArrowRightLeft, Users, BrainCircuit, StopCircle, Info, Sigma, GripVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const generateId = (prefix = "node_") => `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export type FlowNodeType = JsonFlowNode['type'];

interface VisualNode extends Omit<JsonFlowNode, 'type' | 'position' | 'message' | 'prompt' | 'llmPrompt' | 'outputVariable' | 'conditionVariable' | 'actionInputArgs' | 'transitionVariablesToPass'> {
  type: FlowNodeType;
  label: string;
  x: number;
  y: number;
  content?: string; 
}


interface VisualEdge extends JsonFlowEdge {}

interface NodeDefinition {
  type: FlowNodeType;
  label: string;
  icon: React.ElementType;
  defaultProperties?: Partial<VisualNode & JsonFlowNode>; 
  docs: {
    purpose: string;
    settings: string;
    edges: string;
    rules: string;
  };
}

const NODE_DEFINITIONS: NodeDefinition[] = [
  { type: 'start', label: 'Start', icon: Play, defaultProperties: { label: "Start" }, docs: { purpose: "Marks the entry of a flow. Always first.", settings: "None.", edges: "Exactly 1 outgoing.", rules: "Every flow requires one Start; cannot be downstream of any other node."} },
  { type: 'sendMessage', label: 'Send Message', icon: MessageSquare, defaultProperties: { message: "New message", label: "Send Message" }, docs: { purpose: "Delivers text to user. Supports {{variable}} templating.", settings: "Message content with {{variable}} support.", edges: "1 outgoing edge to next node.", rules: "For long text, consider breaking into multiple nodes." } },
  { type: 'getUserInput', label: 'Ask Question', icon: HelpCircle, defaultProperties: { prompt: "Ask something...", variableName: "userInput", label: "Ask Question" }, docs: { purpose: "Prompts user and captures reply into a variable.", settings: "Prompt text, Variable Name to store input. (Input type/validation are conceptual for now).", edges: "1 happy-path; optional 'invalid' edgeType for future validation.", rules: "Ensure Variable Name is unique if used multiple times." } },
  { type: 'callLLM', label: 'LLM Call', icon: Zap, defaultProperties: { llmPrompt: "Your LLM prompt for {{variable}}", outputVariable: "llmOutput", useKnowledge: false, label: "LLM Call" }, docs: { purpose: "Invokes an LLM with a given prompt. Can use {{variables}} from context.", settings: "LLM Prompt template, Output Variable name to store LLM response, Use Knowledge Base (boolean).", edges: "1 outgoing.", rules: "Prompts must be clear; output stored in Output Variable. Handle potential LLM errors if flow supports error paths from LLM." } },
  { type: 'condition', label: 'Condition', icon: ChevronsUpDown, defaultProperties: { conditionVariable: "varToCheck", useLLMForDecision: false, label: "Condition" }, docs: { purpose: "Routes based on a context variable's value or LLM decision.", settings: "Context Variable to check. Use LLM For Decision (boolean) - if true, LLM matches variable against edge `condition` labels. If false, direct string match on edge `condition` labels.", edges: "Multiple outgoing edges, each with a `condition` label (e.g., 'yes', 'no', 'Billing'). One edge can have an empty/default `condition` label for fallback.", rules: "If using LLM, make edge condition labels clear intents. Always have a default path." } },
  { type: 'action', label: 'Action', icon: SlidersHorizontal, defaultProperties: { actionName: "myCustomAction", label: "Action" }, docs: { purpose: "Runs a registered backend action (e.g., CRM update, DB write). Placeholder execution.", settings: "Action Name, Input Arguments (JSON string or {{var}}), Output Variable Map (JSON string like {\"contextVar\": \"actionResultKey\"}).", edges: "1 outgoing. Errors are logged.", rules: "Backend actions must be defined. Currently a placeholder." } },
  { type: 'apiCall', label: 'HTTP Request', icon: Network, defaultProperties: { apiUrl: "https://api.example.com/data", apiMethod: 'GET', label: "HTTP Request" }, docs: { purpose: "Calls an external REST API. Placeholder execution.", settings: "API URL (can use {{vars}}), Method (GET, POST, etc.), Headers (JSON string), Body Variable (context var for POST/PUT body), Output Variable (to store response).", edges: "'success' edgeType for success, 'error' for failure (conceptual), 'default' as fallback.", rules: "Currently a placeholder. Non-2xx would go to 'error' path in full impl." } },
  { type: 'code', label: 'Code (JS)', icon: FileCode, defaultProperties: { codeScript: "// Your JS code here\n// return { outputKey: 'value' };", label: "JS Code" }, docs: { purpose: "Executes inline JavaScript. Placeholder execution - NO ACTUAL EXECUTION.", settings: "JavaScript snippet. Return Variable Map (JSON string like {\"contextVar\": \"returnedKey\"}).", edges: "1 outgoing.", rules: "EXTREME CAUTION: Arbitrary JS execution is unsafe. This is a non-functional placeholder. Real use needs sandboxing." } },
  { type: 'qnaLookup', label: 'Q&A Lookup', icon: MessageCircleQuestion, defaultProperties: { qnaQueryVariable: "userQuery", qnaOutputVariable: "qnaAnswer", label: "Q&A Lookup" }, docs: { purpose: "Searches knowledge base for an answer to a query. Basic keyword match simulation.", settings: "Query Variable (context var with user's question), Output Variable (to store answer), KB ID (conceptual), Threshold (conceptual).", edges: "'found' edgeType if match, 'notFound' otherwise.", rules: "Requires `knowledgeItems` in flow input. Basic keyword search on summary/keywords." } },
  { type: 'wait', label: 'Wait / Delay', icon: Timer, defaultProperties: { waitDurationMs: 1000, label: "Wait" }, docs: { purpose: "Pauses flow for a specified duration.", settings: "Delay duration in milliseconds.", edges: "1 outgoing.", rules: "Use sparingly to avoid user frustration." } },
  { type: 'transition', label: 'Transition', icon: ArrowRightLeft, defaultProperties: { transitionTargetFlowId: "another_flow_id", label: "Transition" }, docs: { purpose: "Moves execution to another flow. Placeholder execution.", settings: "Target Flow ID, Target Node ID (optional), Variables to Pass (JSON string).", edges: "1 outgoing (usually, or acts as end).", rules: "Avoid infinite loops. Currently a placeholder." } },
  { type: 'agentSkill', label: 'Agent Skill', icon: BrainCircuit, defaultProperties: { agentSkillId: "booking_skill", label: "Agent Skill" }, docs: { purpose: "Invokes a specialized sub-agent or skill. Placeholder execution.", settings: "Agent Skill ID, Skills List (conceptual), Context Window (conceptual).", edges: "1 outgoing.", rules: "Currently a placeholder." } },
  { type: 'end', label: 'End', icon: StopCircle, defaultProperties: { endOutputVariable: "", label: "End"}, docs: { purpose: "Terminates the conversation path.", settings: "Optional Output Variable from context to be 'returned' by the flow.", edges: "No outgoing edges.", rules: "Must be reachable from all branches to avoid dead‑ends." } },
];

const WIRING_BEST_PRACTICES_DOCS = {
  title: "Wiring & Best Practices",
  points: [
    "Every non-End node needs at least one outgoing edge.",
    "Match edges to node type: 'condition' supports multiple labeled branches; 'apiCall' and 'qnaLookup' use 'success'/'error' or 'found'/'notFound' edgeTypes.",
    "Handle errors: For 'apiCall', wire an 'error' edgeType path. For 'code', errors are logged (no error path yet).",
    "Variable order: Define variables (e.g., via 'Ask Question') before using them in templates or other nodes.",
    "Avoid deep nesting: Break complex logic into sub-flows and use 'Transition' (conceptual for now).",
    "Test branches: Simulate all paths, including defaults and error conditions.",
  ]
};

const minimalInitialFlow: AgentFlowDefinition = {
  flowId: "new-agent-flow",
  name: "New Agent Flow",
  description: "A minimal flow to get started.",
  nodes: [
    { id: "start_minimal", type: "start", position: { x: 50, y: 100 }, label: "Start" },
    { id: "end_minimal", type: "end", position: { x: 300, y: 100 }, label: "End" },
  ],
  edges: [
    { id: "e_minimal_start_end", source: "start_minimal", target: "end_minimal", label: "" },
  ]
};

const complexSampleFlow: AgentFlowDefinition = { 
  flowId: "customer-support-agent-flow",
  name: "Customer Support Real-Time Agent",
  description: "A flow-driven assistant that greets the customer, classifies their issue, gathers details, provides an immediate solution, checks resolution, and escalates if needed.",
  nodes: [
    { id: "start", type: "start", position: { x: 50, y: 50 }, label: "Start" },
    { id: "greet_user_node_1", type: "sendMessage", message: "Hi there! I’m your support agent. What can I help you with today?", position: { x: 50, y: 150 }, label: "Greet User" },
    { id: "get_issue_category_node_2", type: "getUserInput", prompt: "Please choose your issue category (e.g., Billing, Technical, Other):", variableName: "issueCategory", position: { x: 50, y: 250 }, label: "Get Issue Category" },
    { id: "check_category_node_3", type: "condition", conditionVariable: "issueCategory", useLLMForDecision: true, position: { x: 50, y: 350 }, label: "Check Category (LLM)" },
    { id: "ask_billing_details_node_4", type: "getUserInput", prompt: "Got it—billing issue. Can you share your account ID or invoice number?", variableName: "billingInfo", position: { x: 250, y: 450 }, label: "Ask Billing Details" },
    { id: "resolve_billing_node_5", type: "callLLM", llmPrompt: "You are a billing support agent. User '{{userName}}' has a billing issue regarding '{{billingInfo}}'. Provide a concise, accurate solution or next steps. Knowledge may be available.", outputVariable: "billingSolution", useKnowledge: true, position: { x: 250, y: 550 }, label: "Resolve Billing (LLM)" },
    { id: "send_billing_solution_node_6", type: "sendMessage", message: "{{billingSolution}}", position: { x: 250, y: 650 }, label: "Send Billing Solution" },
    { id: "ask_tech_details_node_7", type: "getUserInput", prompt: "Alright—technical issue. Could you describe the error or what’s not working?", variableName: "techDetails", position: { x: 50, y: 450 }, label: "Ask Tech Details" },
    { id: "resolve_technical_node_8", type: "callLLM", llmPrompt: "You’re a technical support agent. User '{{userName}}' is facing: '{{techDetails}}'. Provide step-by-step troubleshooting. Knowledge may be available.", outputVariable: "techSolution", useKnowledge: true, position: { x: 50, y: 550 }, label: "Resolve Tech (LLM)" },
    { id: "send_tech_solution_node_9", type: "sendMessage", message: "{{techSolution}}", position: { x: 50, y: 650 }, label: "Send Tech Solution" },
    { id: "ask_general_details_node_10", type: "getUserInput", prompt: "Sure—other issue. Can you give me more details about '{{issueCategory}}'?", variableName: "generalDetails", position: { x: -150, y: 450 }, label: "Ask General Details" },
    { id: "resolve_general_node_11", type: "callLLM", llmPrompt: "You’re a customer support agent. User '{{userName}}' has an issue about '{{issueCategory}}' with details '{{generalDetails}}'. Provide a helpful next step or resource. Knowledge may be available.", outputVariable: "generalSolution", useKnowledge: true, position: { x: -150, y: 550 }, label: "Resolve General (LLM)" },
    { id: "send_general_solution_node_12", type: "sendMessage", message: "{{generalSolution}}", position: { x: -150, y: 650 }, label: "Send General Solution" },
    { id: "ask_resolution_node_13", type: "getUserInput", prompt: "Did that solve your problem? (yes/no)", variableName: "resolvedConfirmation", position: { x: 50, y: 750 }, label: "Ask Resolution" },
    { id: "check_resolution_node_14", type: "condition", conditionVariable: "resolvedConfirmation", useLLMForDecision: true, position: { x: 50, y: 850 }, label: "Check Resolution (LLM)" },
    { id: "resolved_yes_node_15", type: "sendMessage", message: "Awesome! Glad I could help. If there’s anything else, just let me know. 👍", position: { x: 250, y: 950 }, label: "Resolved: Yes" },
    { id: "end_resolved_yes_node_16", type: "end", position: { x: 250, y: 1050 }, label: "End (Yes)" },
    { id: "resolved_no_node_17", type: "sendMessage", message: "I’m sorry it’s still not sorted. I’ll escalate this to our specialist team—expect an email or call soon.", position: { x: -150, y: 950 }, label: "Resolved: No" },
    { id: "end_resolved_no_node_18", type: "end", position: { x: -150, y: 1050 }, label: "End (No)" },
    { id: "invalid_category_node_19", type: "sendMessage", message: "Hmm, I didn’t quite catch that category. Let’s try again: Billing, Technical, or Other?", position: { x: 50, y: 500 }, label: "Invalid Category" }, 
  ],
  edges: [
    { id: "e_start_greet", source: "start", target: "greet_user_node_1", label: "Start" },
    { id: "e_greet_getissue", source: "greet_user_node_1", target: "get_issue_category_node_2" },
    { id: "e_getissue_checkissue", source: "get_issue_category_node_2", target: "check_category_node_3" },
    { id: "e_check_billing", source: "check_category_node_3", target: "ask_billing_details_node_4", condition: "User has a billing related question or issue.", label: "Billing Issue" },
    { id: "e_billing_getdetails", source: "ask_billing_details_node_4", target: "resolve_billing_node_5" },
    { id: "e_getdetails_lookup", source: "resolve_billing_node_5", target: "send_billing_solution_node_6" },
    { id: "e_billing_askresolved", source: "send_billing_solution_node_6", target: "ask_resolution_node_13" },
    { id: "e_check_technical", source: "check_category_node_3", target: "ask_tech_details_node_7", condition: "User has a technical problem or needs technical support.", label: "Technical Issue" },
    { id: "e_technical_getdesc", source: "ask_tech_details_node_7", target: "resolve_technical_node_8" },
    { id: "e_getdesc_resolve", source: "resolve_technical_node_8", target: "send_tech_solution_node_9" },
    { id: "e_technical_askresolved", source: "send_tech_solution_node_9", target: "ask_resolution_node_13" },
    { id: "e_check_other", source: "check_category_node_3", target: "ask_general_details_node_10", condition: "User issue does not fit billing or technical, or is general.", label: "Other Issue" },
    { id: "e_other_getdetails_other", source: "ask_general_details_node_10", target: "resolve_general_node_11" },
    { id: "e_getdetails_handleother", source: "resolve_general_node_11", target: "send_general_solution_node_12" },
    { id: "e_other_askresolved", source: "send_general_solution_node_12", target: "ask_resolution_node_13" },
    { id: "e_askresolved_check", source: "ask_resolution_node_13", target: "check_resolution_node_14" },
    { id: "e_check_is_resolved_yes", source: "check_resolution_node_14", target: "resolved_yes_node_15", condition: "User indicates the issue is resolved or problem is solved.", label: "Issue Resolved" },
    { id: "e_check_is_resolved_no", source: "check_resolution_node_14", target: "resolved_no_node_17", condition: "User indicates the issue is not resolved or problem persists.", label: "Issue Not Resolved" },
    { id: "e_resolved_end", source: "resolved_yes_node_15", target: "end_resolved_yes_node_16" },
    { id: "e_notresolved_end", source: "resolved_no_node_17", target: "end_resolved_no_node_18" },
    { id: "e_check_invalid_category_default", source: "check_category_node_3", target: "invalid_category_node_19", condition: "" , edgeType: "default", label: "Default/Invalid Category"}, 
    { id: "e_invalid_cat_to_get_category", source: "invalid_category_node_19", target: "get_issue_category_node_2"}, 
  ]
};


export default function AgentStudioPage() {
  const params = useParams();
  const { toast } = useToast();
  const { getAgent, updateAgentFlow } = useAppContext();
  
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const [currentAgent, setCurrentAgent] = useState<Agent | null | undefined>(undefined);
  
  const [nodes, setNodes] = useState<VisualNode[]>([]);
  const [edges, setEdges] = useState<VisualEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContentRef = useRef<HTMLDivElement>(null); // Ref for the pannable content
  const [draggingNodeInfo, setDraggingNodeInfo] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  
  const [edgeDragInfo, setEdgeDragInfo] = useState<{
    sourceNodeId: string;
    startX: number;      // Virtual X of source port
    startY: number;      // Virtual Y of source port
    currentX: number;    // Virtual X of mouse cursor
    currentY: number;    // Virtual Y of mouse cursor
  } | null>(null);

  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStartCoords, setPanStartCoords] = useState<{ x: number; y: number } | null>(null);


  const loadFlowToVisual = useCallback((flowDef: AgentFlowDefinition | undefined) => {
    const flowToLoad = flowDef && flowDef.nodes && flowDef.nodes.length > 0 ? flowDef : minimalInitialFlow; 
    
    const loadedNodes: VisualNode[] = flowToLoad.nodes.map((jsonNode: JsonFlowNode) => ({
      id: jsonNode.id,
      type: jsonNode.type as FlowNodeType,
      label: jsonNode.label || NODE_DEFINITIONS.find(def => def.type === jsonNode.type)?.defaultProperties?.label || jsonNode.id,
      x: jsonNode.position?.x || Math.random() * 400,
      y: jsonNode.position?.y || Math.random() * 300,
      ...jsonNode, // include all other properties from JsonFlowNode
      content: jsonNode.message || jsonNode.prompt || jsonNode.llmPrompt || jsonNode.codeScript,
    }));
    const loadedEdges: VisualEdge[] = flowToLoad.edges.map((jsonEdge: JsonFlowEdge) => ({
      ...jsonEdge, 
      label: jsonEdge.label || jsonEdge.condition, 
    }));
    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setCanvasOffset({ x: 0, y: 0 }); // Reset pan on new flow load
  }, []);

  useEffect(() => {
    if (agentId) {
      const agent = getAgent(agentId as string);
      setCurrentAgent(agent);
      loadFlowToVisual(agent?.flow);
    }
  }, [agentId, getAgent, loadFlowToVisual]);

  const handleDragStartWidget = (event: React.DragEvent<HTMLDivElement>, nodeType: FlowNodeType) => {
    event.dataTransfer.setData("application/visual-node-type", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDropOnCanvas = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!canvasRef.current) return;

    const nodeType = event.dataTransfer.getData("application/visual-node-type") as FlowNodeType;
    if (!nodeType) return;

    const canvasBounds = canvasRef.current.getBoundingClientRect();
    // Calculate drop position relative to the viewport, then convert to virtual coordinates
    const viewportX = event.clientX - canvasBounds.left;
    const viewportY = event.clientY - canvasBounds.top;

    const virtualX = viewportX + canvasOffset.x;
    const virtualY = viewportY + canvasOffset.y;
    
    const nodeDef = NODE_DEFINITIONS.find(w => w.type === nodeType);
    const defaultLabel = nodeDef?.defaultProperties?.label || nodeDef?.label || 'Node';
    const newNodeId = generateId(nodeType.replace(/\s+/g, '_') + '_'); 
    
    const newNode: VisualNode = {
      id: newNodeId,
      type: nodeType,
      label: defaultLabel,
      x: Math.max(0, virtualX - 75), // Adjust for node center being dragged
      y: Math.max(0, virtualY - 25),
      ...(nodeDef?.defaultProperties || {}), 
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNodeId);
  };

  const handleDragOverCanvas = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleNodeMouseDown = (event: React.MouseEvent<HTMLDivElement>, nodeId: string) => {
    if ((event.target as HTMLElement).dataset.port === 'out' || (event.target as HTMLElement).dataset.port === 'in') {
        event.stopPropagation(); 
        return;
    }
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const canvasBounds = canvasRef.current.getBoundingClientRect();
    // Calculate offsetX/Y relative to the node's visual top-left in the viewport
    const nodeElement = event.currentTarget;
    const nodeRect = nodeElement.getBoundingClientRect();

    const offsetX = event.clientX - nodeRect.left;
    const offsetY = event.clientY - nodeRect.top;

    setDraggingNodeInfo({ id: nodeId, offsetX, offsetY });
    setEdgeDragInfo(null); 
    setSelectedNodeId(nodeId);
    event.stopPropagation(); 
  };
  
  const nodeWidth = 180; 
  const nodeHeight = 70; 

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    // Check if the click is directly on the canvas background (canvasContentRef)
    // or on the canvasRef if canvasContentRef is not the direct target (e.g. empty space)
    if (event.target === canvasRef.current || event.target === canvasContentRef.current ) {
        setIsPanning(true);
        setPanStartCoords({ x: event.clientX, y: event.clientY });
        setSelectedNodeId(null);
        if (edgeDragInfo) {
            setEdgeDragInfo(null);
        }
        event.preventDefault(); // Important to prevent text selection during pan
    }
  };


  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const mouseX_viewport = event.clientX - canvasBounds.left;
    const mouseY_viewport = event.clientY - canvasBounds.top;

    if (isPanning && panStartCoords) {
        const dx = event.clientX - panStartCoords.x;
        const dy = event.clientY - panStartCoords.y;
        setCanvasOffset(prevOffset => ({ x: prevOffset.x - dx, y: prevOffset.y - dy }));
        setPanStartCoords({ x: event.clientX, y: event.clientY });
        event.preventDefault();
    } else if (draggingNodeInfo) {
        // Calculate new virtual top-left for the node
        const newVirtualX = mouseX_viewport - draggingNodeInfo.offsetX + canvasOffset.x;
        const newVirtualY = mouseY_viewport - draggingNodeInfo.offsetY + canvasOffset.y;
        
        setNodes((nds) =>
        nds.map((n) => (n.id === draggingNodeInfo.id ? { ...n, x: newVirtualX, y: newVirtualY } : n))
        );
    } else if (edgeDragInfo) {
        const currentVirtualX = mouseX_viewport + canvasOffset.x;
        const currentVirtualY = mouseY_viewport + canvasOffset.y;
        setEdgeDragInfo(prev => prev ? {...prev, currentX: currentVirtualX, currentY: currentVirtualY} : null);
    }
  };

  const handleCanvasMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
        setIsPanning(false);
        setPanStartCoords(null);
    }
    if (draggingNodeInfo) {
        setDraggingNodeInfo(null);
    }
    // If releasing mouse not on an input port during an edge drag
    if (edgeDragInfo && !(event.target as HTMLElement).dataset.port?.includes('in')) {
        const targetElement = event.target as HTMLElement;
        // Check if the drop target is outside any node's input port area
        const isInputPort = targetElement.dataset.port === 'in';
        
        if (!isInputPort) {
             setEdgeDragInfo(null); // Cancel drag if not dropped on an input port
        }
        // if it IS an input port, handlePortMouseUp will take care of clearing edgeDragInfo
    }
  };
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
      // Deselect node if clicking on canvas background
      if (e.target === canvasRef.current || e.target === canvasContentRef.current) { 
        setSelectedNodeId(null);
      }
  };

  const handlePortMouseDown = (event: React.MouseEvent, nodeId: string, portType: 'out') => {
    event.stopPropagation(); 
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || portType !== 'out' || sourceNode.type === 'end') {
        if (sourceNode && sourceNode.type === 'end') {
            toast({title: "Invalid Start", description: "Cannot drag an edge from an 'End' node.", variant: "destructive"});
        }
        return;
    }
    
    if (!canvasRef.current) return;
    setDraggingNodeInfo(null); 
    
    const portElement = event.currentTarget as HTMLDivElement;
    const portRect = portElement.getBoundingClientRect();
    const canvasViewportRect = canvasRef.current.getBoundingClientRect();

    // Calculate virtual coordinates for the start of the edge drag
    const startX_virtual = (portRect.left + portRect.width / 2 - canvasViewportRect.left) + canvasOffset.x;
    const startY_virtual = (portRect.top + portRect.height / 2 - canvasViewportRect.top) + canvasOffset.y;

    setEdgeDragInfo({
        sourceNodeId: nodeId,
        startX: startX_virtual,
        startY: startY_virtual,
        currentX: startX_virtual, 
        currentY: startY_virtual,
    });
  };

  const handlePortMouseUp = (event: React.MouseEvent, targetNodeId: string, portType: 'in') => {
    event.stopPropagation();
    if (!edgeDragInfo || portType !== 'in') {
        if (edgeDragInfo) setEdgeDragInfo(null); 
        return;
    }

    const targetNode = nodes.find(n => n.id === targetNodeId);
    if (!targetNode || targetNode.type === 'start') {
        toast({title: "Invalid Connection", description: "Cannot connect to a 'Start' node's input.", variant:"destructive"});
        setEdgeDragInfo(null);
        return;
    }

    if (edgeDragInfo.sourceNodeId === targetNodeId) {
        toast({title: "Invalid Connection", description: "Cannot connect a node to itself.", variant:"destructive"});
        setEdgeDragInfo(null);
        return;
    }
    
    const existingEdge = edges.find(e => e.source === edgeDragInfo.sourceNodeId && e.target === targetNodeId);
    if (existingEdge) {
        toast({title: "Connection Exists", description: "An edge already exists between these nodes."});
        setEdgeDragInfo(null);
        return;
    }

    const sourceNode = nodes.find(n=>n.id===edgeDragInfo.sourceNodeId);
    let defaultEdgeLabel = "";
    let defaultEdgeType: JsonFlowEdge['edgeType'] = 'default';

    if (sourceNode?.type === 'condition') defaultEdgeLabel = "Case";
    else if (sourceNode?.type === 'qnaLookup') { defaultEdgeLabel = "Found"; defaultEdgeType = "found"; }
    else if (sourceNode?.type === 'apiCall') { defaultEdgeLabel = "Success"; defaultEdgeType = "success"; }
    else if (sourceNode?.type === 'getUserInput') { defaultEdgeLabel = "Valid"; defaultEdgeType = "default"; }


    const newEdge: VisualEdge = {
        id: generateId('edge_'),
        source: edgeDragInfo.sourceNodeId,
        target: targetNodeId,
        label: defaultEdgeLabel, 
        condition: defaultEdgeLabel, // For condition nodes, label is the condition
        edgeType: defaultEdgeType,
    };
    setEdges((eds) => eds.concat(newEdge));
    toast({ title: "Edge Created!", description: `Connected ${sourceNode?.label} to ${targetNode.label}.`});
    setEdgeDragInfo(null);
  };
  
  const updateSelectedNodeProperties = (updatedProps: Partial<JsonFlowNode>) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => {
        if (n.id === selectedNodeId) {
            const newProps = {...n, ...updatedProps};
            // Keep 'content' consistent with specific fields if they are updated
            if (updatedProps.message !== undefined) newProps.content = updatedProps.message;
            else if (updatedProps.prompt !== undefined) newProps.content = updatedProps.prompt;
            else if (updatedProps.llmPrompt !== undefined) newProps.content = updatedProps.llmPrompt;
            else if (updatedProps.codeScript !== undefined) newProps.content = updatedProps.codeScript;
            return newProps;
        }
        return n;
    }));
  };


  const updateEdgeProperty = (edgeId: string, updatedProps: Partial<VisualEdge>) => {
    setEdges(eds => eds.map(e => {
      if (e.id === edgeId) {
        const newEdge = {...e, ...updatedProps};
        // If label is updated, also update condition for condition nodes (or vice-versa if that's the primary input)
        if (updatedProps.label !== undefined) {
          newEdge.condition = updatedProps.label;
        }
        return newEdge;
      }
      return e;
    }));
  };

  const deleteNode = (nodeIdToDelete: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeIdToDelete));
    setEdges(eds => eds.filter(e => e.source !== nodeIdToDelete && e.target !== nodeIdToDelete));
    if (selectedNodeId === nodeIdToDelete) setSelectedNodeId(null);
  };

  const deleteEdge = (edgeIdToDelete: string) => {
    setEdges(eds => eds.filter(e => e.id !== edgeIdToDelete));
  };

  const convertToMermaid = useCallback((): string => {
    let mermaidStr = "graph TD;\n";
    nodes.forEach(node => {
      const mermaidId = node.id.replace(/[^a-zA-Z0-9_]/g, '_'); 
      const displayLabel = node.label ? node.label.replace(/"/g, '#quot;') : node.id;
      const nodeDef = NODE_DEFINITIONS.find(d => d.type === node.type);
      let shapeStart = '["'; 
      let shapeEnd = '"]';
      if (node.type === 'start' || node.type === 'end') { shapeStart = '(("'; shapeEnd = '"))'; } 
      else if (node.type === 'condition') { shapeStart = '{{"'; shapeEnd = '"}}'; } 
      
      mermaidStr += `  ${mermaidId}${shapeStart}${displayLabel} (${nodeDef?.label || node.type})${shapeEnd};\n`;
    });
    edges.forEach(edge => {
      const sourceMermaidId = edge.source.replace(/[^a-zA-Z0-9_]/g, '_');
      const targetMermaidId = edge.target.replace(/[^a-zA-Z0-9_]/g, '_');
      const edgeLabelText = edge.label || edge.edgeType || ""; // Use label, fallback to edgeType
      const edgeLabel = edgeLabelText && edgeLabelText !== 'default' ? `|${edgeLabelText.replace(/"/g, '#quot;')}|` : '';
      mermaidStr += `  ${sourceMermaidId} -->${edgeLabel} ${targetMermaidId};\n`;
    });
    return mermaidStr;
  }, [nodes, edges]);

  const convertToAgentFlowDefinition = useCallback((): AgentFlowDefinition | null => {
    const hasStartNode = nodes.some(n => n.type === 'start');
    const hasEndNode = nodes.some(n => n.type === 'end');

    if (!hasStartNode && nodes.length > 0) { // Allow empty flow, but if nodes exist, start is needed
        toast({ title: "Invalid Flow", description: "A flow must have at least one 'Start' node if it has any nodes.", variant: "destructive"});
        return null;
    }
    if (!hasEndNode && nodes.length > 0) { 
        toast({ title: "Incomplete Flow", description: "It's recommended to have at least one 'End' node.", variant: "default"});
    }
     
    for (const node of nodes) {
        const nodeDef = NODE_DEFINITIONS.find(d => d.type === node.type);
        if (!nodeDef) {
             toast({ title: "Invalid Node Type", description: `Node '${node.label}' has an unrecognized type '${node.type}'.`, variant: "destructive"});
            return null;
        }
        if (node.type === 'callLLM' && (!node.llmPrompt || !node.outputVariable)) {
            toast({ title: "Invalid Node Config", description: `LLM Call node '${node.label}' is missing a prompt or output variable.`, variant: "destructive"});
            return null;
        }
        if (node.type === 'getUserInput' && (!node.prompt || !node.variableName)) {
            toast({ title: "Invalid Node Config", description: `Ask Question node '${node.label}' is missing a prompt or variable name.`, variant: "destructive"});
            return null;
        }
        if (node.type === 'condition' && !node.conditionVariable) {
             toast({ title: "Invalid Node Config", description: `Condition node '${node.label}' is missing a 'Variable to Check'.`, variant: "destructive"});
            return null;
        }
    }

    const jsonNodes: JsonFlowNode[] = nodes.map(node => {
      // Destructure to explicitly pick known fields and handle potential extra fields from VisualNode
      const { x, y, content, ...restOfVisualNode } = node;
      
      // Ensure only properties defined in JsonFlowNode are passed
      const baseJsonNode: Partial<JsonFlowNode> = {
          id: restOfVisualNode.id,
          type: restOfVisualNode.type,
          label: restOfVisualNode.label,
          position: { x: node.x, y: node.y },
      };

      // Add type-specific properties
      if (node.type === 'sendMessage') baseJsonNode.message = node.message;
      if (node.type === 'getUserInput') { baseJsonNode.prompt = node.prompt; baseJsonNode.variableName = node.variableName; baseJsonNode.inputType = node.inputType; baseJsonNode.validationRules = node.validationRules; }
      if (node.type === 'callLLM') { baseJsonNode.llmPrompt = node.llmPrompt; baseJsonNode.outputVariable = node.outputVariable; baseJsonNode.useKnowledge = node.useKnowledge; }
      if (node.type === 'condition') { baseJsonNode.conditionVariable = node.conditionVariable; baseJsonNode.useLLMForDecision = node.useLLMForDecision; }
      if (node.type === 'apiCall') { baseJsonNode.apiUrl = node.apiUrl; baseJsonNode.apiMethod = node.apiMethod; baseJsonNode.apiHeaders = node.apiHeaders; baseJsonNode.apiBodyVariable = node.apiBodyVariable; baseJsonNode.apiOutputVariable = node.apiOutputVariable;}
      if (node.type === 'action') { baseJsonNode.actionName = node.actionName; baseJsonNode.actionInputArgs = node.actionInputArgs; baseJsonNode.actionOutputVarMap = node.actionOutputVarMap; }
      if (node.type === 'code') { baseJsonNode.codeScript = node.codeScript; baseJsonNode.codeReturnVarMap = node.codeReturnVarMap; }
      if (node.type === 'qnaLookup') { baseJsonNode.qnaKnowledgeBaseId = node.qnaKnowledgeBaseId; baseJsonNode.qnaQueryVariable = node.qnaQueryVariable; baseJsonNode.qnaOutputVariable = node.qnaOutputVariable; baseJsonNode.qnaFallbackText = node.qnaFallbackText; }
      if (node.type === 'wait') { baseJsonNode.waitDurationMs = node.waitDurationMs; }
      if (node.type === 'transition') { baseJsonNode.transitionTargetFlowId = node.transitionTargetFlowId; baseJsonNode.transitionVariablesToPass = node.transitionVariablesToPass; }
      if (node.type === 'agentSkill') { baseJsonNode.agentSkillId = node.agentSkillId; baseJsonNode.agentSkillsList = node.agentSkillsList; }
      if (node.type === 'end') { baseJsonNode.endOutputVariable = node.endOutputVariable; }
      
      return baseJsonNode as JsonFlowNode;
    });

    const jsonEdges: JsonFlowEdge[] = edges.map(edge => {
      const { ...restOfEdge } = edge; // Spread to make a new object
      return { // Explicitly create the JsonFlowEdge structure
        id: restOfEdge.id,
        source: restOfEdge.source,
        target: restOfEdge.target,
        label: restOfEdge.label,
        condition: restOfEdge.condition,
        edgeType: restOfEdge.edgeType,
      };
    });
    
    const flowId = currentAgent?.flow?.flowId || generateId('flow_');
    const flowName = currentAgent?.flow?.name || "My Visual Flow";
    const flowDescription = currentAgent?.flow?.description || "A flow created with the visual editor.";
    
    return { flowId, name: flowName, description: flowDescription, nodes: jsonNodes, edges: jsonEdges };
  }, [nodes, edges, currentAgent, toast]);

  const handleSaveFlow = useCallback(() => {
    if (!currentAgent) {
      toast({ title: "Agent Not Found", description: "Cannot save flow.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    setMermaidCode(convertToMermaid()); 
    
    try {
      const agentFlowDef = convertToAgentFlowDefinition();
      if (!agentFlowDef) { 
        setIsSaving(false);
        return; // Validation messages are handled by convertToAgentFlowDefinition
      }
      updateAgentFlow(currentAgent.id, agentFlowDef);
      toast({ title: "Flow Saved!", description: `Flow "${agentFlowDef.name}" visually designed and updated.` });
    } catch (error: any) {
      console.error("Error saving flow:", error);
      toast({ title: "Save Error", description: error.message || "Could not save the flow.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [currentAgent, convertToMermaid, convertToAgentFlowDefinition, updateAgentFlow, toast]);
  
  const resetToComplexSampleFlow = () => {
    loadFlowToVisual(complexSampleFlow); 
    setSelectedNodeId(null);
    setMermaidCode("");
     if (currentAgent) {
      toast({ title: "Flow Reset", description: "Visual flow editor reset to sample flow."});
    }
  };

  const selectedNodeDetails = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const selectedNodeDefinition = selectedNodeDetails ? NODE_DEFINITIONS.find(def => def.type === selectedNodeDetails.type) : null;

  useEffect(() => {
    if(nodes.length > 0 || edges.length > 0) {
        setMermaidCode(convertToMermaid());
    } else {
        setMermaidCode("");
    }
  }, [nodes, edges, convertToMermaid]);

  if (currentAgent === undefined) return <Card><CardHeader><CardTitle>Loading Studio...</CardTitle></CardHeader><CardContent><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /></CardContent></Card>;
  if (!currentAgent) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Agent Not Found</AlertTitle></Alert>;

  const portSize = 10; 

  return (
    <TooltipProvider>
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
      <Card className="col-span-2 h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Node Tools</CardTitle>
        </CardHeader>
        <ScrollArea className="flex-grow">
        <CardContent className="space-y-2 p-2">
          {NODE_DEFINITIONS.map(def => (
            <Tooltip key={def.type}>
              <TooltipTrigger asChild>
                <div
                  draggable
                  onDragStart={(e) => handleDragStartWidget(e, def.type)}
                  className="p-2 border rounded-md cursor-grab flex items-center gap-2 hover:bg-muted active:cursor-grabbing transition-colors"
                >
                  <def.icon className="w-5 h-5 text-primary shrink-0"/>
                  <span className="text-sm">{def.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="start" className="max-w-xs z-[60]"> {/* Ensure tooltip is above canvas content */}
                <p className="font-semibold">{def.label}</p>
                <p className="text-xs text-muted-foreground">{def.docs.purpose}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </CardContent>
        </ScrollArea>
         <CardFooter className="p-2 border-t mt-auto">
            <Button onClick={resetToComplexSampleFlow} variant="outline" size="sm" className="w-full"><Trash2 className="mr-2 h-4 w-4" />Reset to Sample</Button>
        </CardFooter>
      </Card>

      <Card 
        className="col-span-6 xl:col-span-7 h-full relative overflow-hidden bg-muted/20 border-dashed border-input cursor-grab"
        ref={canvasRef}
        onDrop={handleDropOnCanvas}
        onDragOver={handleDragOverCanvas}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp} 
        onClick={handleCanvasClick} // For deselecting
      >
        <div 
            ref={canvasContentRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none" // Content div handles its own pointer events for nodes
            style={{ transform: `translate(${-canvasOffset.x}px, ${-canvasOffset.y}px)` }}
        >
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none"> {/* SVG for edges */}
            {edges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;
                
                const x1 = sourceNode.x + nodeWidth; 
                const y1 = sourceNode.y + nodeHeight / 2;
                const x2 = targetNode.x; 
                const y2 = targetNode.y + nodeHeight / 2;

                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                const angle = Math.atan2(y2 - y1, x2 - x1);
                const arrowLength = 8;
                const arrowPoint1X = x2 - arrowLength * Math.cos(angle - Math.PI / 6);
                const arrowPoint1Y = y2 - arrowLength * Math.sin(angle - Math.PI / 6);
                const arrowPoint2X = x2 - arrowLength * Math.cos(angle + Math.PI / 6);
                const arrowPoint2Y = y2 - arrowLength * Math.sin(angle + Math.PI / 6);

                return (
                <g key={edge.id} className="group/edge"> {/* Removed onClick as edges are not directly editable yet */}
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--primary)/0.5)" strokeWidth="1.5" className="group-hover/edge:stroke-primary transition-colors" />
                    <polygon points={`${x2},${y2} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`} fill="hsl(var(--primary)/0.5)" className="group-hover/edge:fill-primary transition-colors"/>
                    {(edge.label || (edge.edgeType && edge.edgeType !== 'default')) && (
                    <text x={midX} y={midY - 5} fill="hsl(var(--foreground))" fontSize="10px" textAnchor="middle" className="pointer-events-none select-none bg-background/50 px-1 rounded">
                        {edge.label || edge.edgeType}
                    </text>
                    )}
                </g>
                );
            })}
            {edgeDragInfo && ( // Temporary line for edge dragging, uses virtual coordinates
                    <line
                        x1={edgeDragInfo.startX}
                        y1={edgeDragInfo.startY}
                        x2={edgeDragInfo.currentX}
                        y2={edgeDragInfo.currentY}
                        stroke="hsl(var(--ring))"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                    />
                )}
            </svg>
            {nodes.map(node => (
            <div
                key={node.id}
                data-node-id={node.id} // For easier access if needed
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                className="absolute p-2 border rounded bg-card shadow cursor-grab select-none flex flex-col justify-center group/node pointer-events-auto" // Nodes need pointer events
                style={{ 
                    left: node.x,  // Use virtual coordinates directly
                    top: node.y,   // Use virtual coordinates directly
                    width: `${nodeWidth}px`,
                    height: `${nodeHeight}px`,
                    borderColor: selectedNodeId === node.id ? 'hsl(var(--ring))' : 'hsl(var(--border))',
                    boxShadow: selectedNodeId === node.id ? '0 0 0 2px hsl(var(--ring))' : '0 1px 3px rgba(0,0,0,0.1)',
                    zIndex: draggingNodeInfo?.id === node.id || edgeDragInfo?.sourceNodeId === node.id ? 10 : 1, // Bring dragged/source node to front
                }}
            >
                {node.type !== 'start' && (
                    <div 
                        data-port="in"
                        onMouseUp={(e) => handlePortMouseUp(e, node.id, 'in')}
                        title={`Connect to ${node.label}`}
                        className="absolute -left-[6px] top-1/2 -translate-y-1/2 cursor-crosshair pointer-events-auto bg-background rounded-full"
                        style={{width: `${portSize+2}px`, height: `${portSize+2}px`, display:'flex', alignItems:'center', justifyContent:'center'}}
                    >
                    <div className="w-2 h-2 bg-primary/70 rounded-full border border-background ring-1 ring-primary/70 group-hover/node:bg-primary group-hover/node:ring-primary transition-all"/>
                    </div>
                )}

                <div className="flex items-center gap-1 mb-0.5 overflow-hidden">
                {(() => {
                    const nodeDef = NODE_DEFINITIONS.find(w=>w.type === node.type);
                    const WidgetIcon = nodeDef?.icon;
                    return WidgetIcon ? <WidgetIcon className="w-3 h-3 text-primary shrink-0" /> : <GripVertical className="w-3 h-3 text-muted-foreground shrink-0"/>;
                })()}
                <span className="text-xs font-medium truncate" title={node.label}>{node.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate" title={node.content || node.variableName || node.type}>
                { node.type === 'sendMessage' ? (node.message || '...') :
                    node.type === 'getUserInput' ? (node.variableName ? `Var: ${node.variableName}`: '...') :
                    node.type === 'callLLM' ? (node.outputVariable ? `Out: ${node.outputVariable}`: '...') :
                    node.type === 'condition' ? (node.conditionVariable ? `If: ${node.conditionVariable}`: '...') :
                    node.type === 'action' ? (node.actionName || 'Action') :
                    node.type === 'apiCall' ? (node.apiUrl ? node.apiUrl.substring(0,20)+'...' : 'HTTP Req') :
                    node.type === 'code' ? 'JS Code' :
                    node.type === 'qnaLookup' ? (node.qnaOutputVariable || 'Q&A') :
                    node.type === 'wait' ? `${node.waitDurationMs || 0}ms Wait` :
                    node.type === 'transition' ? (node.transitionTargetFlowId || 'Transition') :
                    node.type === 'agentSkill' ? (node.agentSkillId || 'Agent Skill') :
                    NODE_DEFINITIONS.find(d=>d.type === node.type)?.label || node.type
                }
                </p>
                
                {node.type !== 'end' && (
                    <div 
                        data-port="out"
                        onMouseDown={(e) => handlePortMouseDown(e, node.id, 'out')}
                        title={`Connect from ${node.label}`}
                        className="absolute -right-[6px] top-1/2 -translate-y-1/2 cursor-crosshair pointer-events-auto bg-background rounded-full"
                        style={{width: `${portSize+2}px`, height: `${portSize+2}px`, display:'flex', alignItems:'center', justifyContent:'center'}}
                    >
                        <div className="w-2 h-2 bg-primary/70 rounded-full border border-background ring-1 ring-primary/70 group-hover/node:bg-primary group-hover/node:ring-primary transition-all"/>
                    </div>
                )}
            </div>
            ))}
        </div> {/* End of canvasContentRef */}
      </Card>

      <Card className="col-span-4 xl:col-span-3 h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            {selectedNodeDetails ? `Edit: ${selectedNodeDetails.label}` : "Node Guide / Output"}
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-grow">
        <CardContent className="p-3 space-y-3 text-sm">
          {selectedNodeDetails ? (
            <>
              <div className="space-y-3 p-2 border rounded-md bg-background">
                <h3 className="font-semibold text-base mb-1">Properties</h3>
                <div>
                  <Label htmlFor="nodeLabel" className="text-xs">Node Label (ID: {selectedNodeDetails.id})</Label>
                  <Input id="nodeLabel" value={selectedNodeDetails.label} onChange={e => updateSelectedNodeProperties({ label: e.target.value })} className="h-8 text-sm"/>
                </div>
                
                { selectedNodeDetails.type === 'sendMessage' && (
                  <div><Label htmlFor="nodeMessage" className="text-xs">Message Text</Label><Textarea id="nodeMessage" value={selectedNodeDetails.message || ""} onChange={e => updateSelectedNodeProperties({ message: e.target.value })} rows={3} className="text-sm"/></div>
                )}
                 { selectedNodeDetails.type === 'getUserInput' && (
                  <>
                    <div><Label htmlFor="nodePrompt" className="text-xs">Prompt Text</Label><Textarea id="nodePrompt" value={selectedNodeDetails.prompt || ""} onChange={e => updateSelectedNodeProperties({ prompt: e.target.value })} rows={2} className="text-sm"/></div>
                    <div><Label htmlFor="nodeVariable" className="text-xs">Output Variable Name</Label><Input id="nodeVariable" value={selectedNodeDetails.variableName || ""} onChange={e => updateSelectedNodeProperties({ variableName: e.target.value })}  className="h-8 text-sm"/></div>
                    <div><Label htmlFor="nodeInputType" className="text-xs">Input Type (Conceptual)</Label><Input id="nodeInputType" value={selectedNodeDetails.inputType || ""} onChange={e => updateSelectedNodeProperties({ inputType: e.target.value })}  className="h-8 text-sm" placeholder="e.g., text, number"/></div>
                    <div><Label htmlFor="nodeValidation" className="text-xs">Validation Rules (Conceptual)</Label><Input id="nodeValidation" value={selectedNodeDetails.validationRules || ""} onChange={e => updateSelectedNodeProperties({ validationRules: e.target.value })}  className="h-8 text-sm" placeholder="e.g., regex"/></div>

                  </>
                )}
                { selectedNodeDetails.type === 'callLLM' && (
                  <>
                    <div><Label htmlFor="llmPrompt" className="text-xs">LLM Prompt</Label><Textarea id="llmPrompt" value={selectedNodeDetails.llmPrompt || ""} onChange={e => updateSelectedNodeProperties({ llmPrompt: e.target.value })} rows={3} className="text-sm"/></div>
                    <div><Label htmlFor="llmOutputVar" className="text-xs">Output Variable Name</Label><Input id="llmOutputVar" value={selectedNodeDetails.outputVariable || ""} onChange={e => updateSelectedNodeProperties({ outputVariable: e.target.value })}  className="h-8 text-sm"/></div>
                    <div className="flex items-center space-x-2 pt-1"><Checkbox id="useKnowledge" checked={!!selectedNodeDetails.useKnowledge} onCheckedChange={(checked) => updateSelectedNodeProperties({ useKnowledge: !!checked })}/><Label htmlFor="useKnowledge" className="text-xs font-normal cursor-pointer">Use Knowledge Base</Label></div>
                  </>
                )}
                { selectedNodeDetails.type === 'condition' && (
                   <>
                    <div><Label htmlFor="conditionVar" className="text-xs">Variable to Check</Label><Input id="conditionVar" value={selectedNodeDetails.conditionVariable || ""} onChange={e => updateSelectedNodeProperties({ conditionVariable: e.target.value })}  className="h-8 text-sm"/></div>
                    <div className="flex items-center space-x-2 pt-1"><Checkbox id="useLLMForDecision" checked={!!selectedNodeDetails.useLLMForDecision} onCheckedChange={(checked) => updateSelectedNodeProperties({ useLLMForDecision: !!checked })}/><Label htmlFor="useLLMForDecision" className="text-xs font-normal cursor-pointer">Use LLM for Decision</Label></div>
                   </>
                )}
                 { selectedNodeDetails.type === 'apiCall' && (
                    <>
                        <div><Label htmlFor="apiUrl" className="text-xs">API URL</Label><Input id="apiUrl" value={selectedNodeDetails.apiUrl || ""} onChange={e => updateSelectedNodeProperties({ apiUrl: e.target.value })} className="h-8 text-sm"/></div>
                        <div><Label htmlFor="apiMethod" className="text-xs">Method</Label>
                            <Select value={selectedNodeDetails.apiMethod || 'GET'} onValueChange={value => updateSelectedNodeProperties({ apiMethod: value as JsonFlowNode['apiMethod'] })}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div><Label htmlFor="apiHeaders" className="text-xs">Headers (JSON String)</Label><Textarea id="apiHeaders" placeholder='{ "Content-Type": "application/json" }' value={selectedNodeDetails.apiHeaders ? (typeof selectedNodeDetails.apiHeaders === 'string' ? selectedNodeDetails.apiHeaders : JSON.stringify(selectedNodeDetails.apiHeaders)) : ""} onChange={e => updateSelectedNodeProperties({ apiHeaders: e.target.value as any })} rows={2} className="text-sm font-code"/></div>
                        <div><Label htmlFor="apiBodyVar" className="text-xs">Body Variable (from context)</Label><Input id="apiBodyVar" value={selectedNodeDetails.apiBodyVariable || ""} onChange={e => updateSelectedNodeProperties({ apiBodyVariable: e.target.value })} className="h-8 text-sm"/></div>
                        <div><Label htmlFor="apiOutputVar" className="text-xs">Output Variable (for response)</Label><Input id="apiOutputVar" value={selectedNodeDetails.apiOutputVariable || ""} onChange={e => updateSelectedNodeProperties({ apiOutputVariable: e.target.value })} className="h-8 text-sm"/></div>
                    </>
                )}
                 { selectedNodeDetails.type === 'action' && (
                    <>
                        <div><Label htmlFor="actionName" className="text-xs">Action Name</Label><Input id="actionName" value={selectedNodeDetails.actionName || ""} onChange={e => updateSelectedNodeProperties({ actionName: e.target.value })} className="h-8 text-sm"/></div>
                        <div><Label htmlFor="actionInputs" className="text-xs">Input Arguments (JSON string or {{vars}})</Label><Textarea id="actionInputs" placeholder='{ "param1": "{{contextVar}}" }' value={selectedNodeDetails.actionInputArgs ? (typeof selectedNodeDetails.actionInputArgs === 'string' ? selectedNodeDetails.actionInputArgs : JSON.stringify(selectedNodeDetails.actionInputArgs)) : ""} onChange={e => updateSelectedNodeProperties({ actionInputArgs: e.target.value as any })} rows={2} className="text-sm font-code"/></div>
                        <div><Label htmlFor="actionOutputMap" className="text-xs">Output Variable Map (JSON string)</Label><Textarea id="actionOutputMap" placeholder='{ "contextVar": "actionResultKey" }' value={selectedNodeDetails.actionOutputVarMap ? (typeof selectedNodeDetails.actionOutputVarMap === 'string' ? selectedNodeDetails.actionOutputVarMap : JSON.stringify(selectedNodeDetails.actionOutputVarMap)) : ""} onChange={e => updateSelectedNodeProperties({ actionOutputVarMap: e.target.value as any })} className="text-sm font-code h-8"/></div>
                    </>
                )}
                 { selectedNodeDetails.type === 'code' && (
                    <>
                        <div><Label htmlFor="codeScript" className="text-xs">JavaScript Code (Placeholder - Not Executed)</Label><Textarea id="codeScript" value={selectedNodeDetails.codeScript || ""} onChange={e => updateSelectedNodeProperties({ codeScript: e.target.value })} rows={3} className="text-sm font-code"/></div>
                        <div><Label htmlFor="codeReturnMap" className="text-xs">Return Variable Map (JSON string)</Label><Textarea id="codeReturnMap" placeholder='{ "contextVar": "returnedObjectKey" }' value={selectedNodeDetails.codeReturnVarMap ? (typeof selectedNodeDetails.codeReturnVarMap === 'string' ? selectedNodeDetails.codeReturnVarMap : JSON.stringify(selectedNodeDetails.codeReturnVarMap)) : ""} onChange={e => updateSelectedNodeProperties({ codeReturnVarMap: e.target.value as any })} className="text-sm font-code h-8"/></div>
                    </>
                )}
                { selectedNodeDetails.type === 'qnaLookup' && (
                   <>
                    <div><Label htmlFor="qnaQueryVar" className="text-xs">Query Variable (from context)</Label><Input id="qnaQueryVar" value={selectedNodeDetails.qnaQueryVariable || ""} onChange={e => updateSelectedNodeProperties({ qnaQueryVariable: e.target.value })} className="h-8 text-sm"/></div>
                    <div><Label htmlFor="qnaKBID" className="text-xs">Knowledge Base ID (Conceptual)</Label><Input id="qnaKBID" value={selectedNodeDetails.qnaKnowledgeBaseId || ""} onChange={e => updateSelectedNodeProperties({ qnaKnowledgeBaseId: e.target.value })} className="h-8 text-sm"/></div>
                    <div><Label htmlFor="qnaOutputVar" className="text-xs">Output Variable (for answer)</Label><Input id="qnaOutputVar" value={selectedNodeDetails.qnaOutputVariable || ""} onChange={e => updateSelectedNodeProperties({ qnaOutputVariable: e.target.value })} className="h-8 text-sm"/></div>
                    <div><Label htmlFor="qnaFallbackText" className="text-xs">Fallback Text</Label><Textarea id="qnaFallbackText" value={selectedNodeDetails.qnaFallbackText || ""} onChange={e => updateSelectedNodeProperties({ qnaFallbackText: e.target.value })} rows={2} className="text-sm"/></div>
                   </>
                )}
                { selectedNodeDetails.type === 'wait' && (
                    <div><Label htmlFor="waitDuration" className="text-xs">Wait Duration (ms)</Label><Input id="waitDuration" type="number" value={selectedNodeDetails.waitDurationMs || 0} onChange={e => updateSelectedNodeProperties({ waitDurationMs: parseInt(e.target.value) || 0 })} className="h-8 text-sm"/></div>
                )}
                { selectedNodeDetails.type === 'transition' && (
                    <>
                      <div><Label htmlFor="transitionFlowId" className="text-xs">Target Flow ID</Label><Input id="transitionFlowId" value={selectedNodeDetails.transitionTargetFlowId || ""} onChange={e => updateSelectedNodeProperties({ transitionTargetFlowId: e.target.value })} className="h-8 text-sm"/></div>
                      <div><Label htmlFor="transitionVars" className="text-xs">Variables to Pass (JSON string)</Label><Textarea id="transitionVars" placeholder='{ "targetVar": "{{currentVar}}" }' value={selectedNodeDetails.transitionVariablesToPass ? (typeof selectedNodeDetails.transitionVariablesToPass === 'string' ? selectedNodeDetails.transitionVariablesToPass : JSON.stringify(selectedNodeDetails.transitionVariablesToPass)) : ""} onChange={e => updateSelectedNodeProperties({ transitionVariablesToPass: e.target.value as any })} rows={2} className="text-sm font-code"/></div>
                    </>
                )}
                 { selectedNodeDetails.type === 'agentSkill' && (
                   <>
                    <div><Label htmlFor="agentSkillId" className="text-xs">Agent Skill ID</Label><Input id="agentSkillId" value={selectedNodeDetails.agentSkillId || ""} onChange={e => updateSelectedNodeProperties({ agentSkillId: e.target.value })} className="h-8 text-sm"/></div>
                     <div><Label htmlFor="agentSkillsList" className="text-xs">Skills List (Conceptual, comma-sep)</Label><Input id="agentSkillsList" value={selectedNodeDetails.agentSkillsList?.join(',') || ""} onChange={e => updateSelectedNodeProperties({ agentSkillsList: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })} className="h-8 text-sm"/></div>
                   </>
                )}
                { selectedNodeDetails.type === 'end' && (
                     <div><Label htmlFor="endOutputVar" className="text-xs">Output Variable (from context)</Label><Input id="endOutputVar" value={selectedNodeDetails.endOutputVariable || ""} onChange={e => updateSelectedNodeProperties({ endOutputVariable: e.target.value })} className="h-8 text-sm"/></div>
                )}


                <Button variant="outline" size="sm" onClick={() => deleteNode(selectedNodeDetails.id)} className="text-destructive border-destructive hover:bg-destructive/10 w-full mt-2">
                  <Trash2 className="mr-2 h-3 w-3" /> Delete Node
                </Button>
                <hr className="my-3"/>
                <Label className="text-xs text-muted-foreground block mb-1">Outgoing Edges:</Label>
                {edges.filter(e => e.source === selectedNodeDetails.id).length === 0 && <p className="text-xs text-muted-foreground italic">No outgoing edges.</p>}
                {edges.filter(e => e.source === selectedNodeDetails.id).map(edge => (
                  <div key={edge.id} className="text-xs space-y-1 border p-1.5 rounded mb-1 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="truncate" title={`To: ${nodes.find(n=>n.id===edge.target)?.label || edge.target}`}>To: {nodes.find(n=>n.id===edge.target)?.label || edge.target}</span>
                      <Button variant="ghost" size="icon" onClick={() => deleteEdge(edge.id)} className="h-5 w-5 shrink-0"><Trash2 className="h-3 w-3 text-destructive"/></Button>
                    </div>
                    {(selectedNodeDetails.type === 'condition' || selectedNodeDetails.type === 'apiCall' || selectedNodeDetails.type === 'qnaLookup' || selectedNodeDetails.type === 'getUserInput') && (
                        <div>
                            <Label htmlFor={`edgeLabel-${edge.id}`} className="text-[10px]">{selectedNodeDetails.type === 'condition' ? 'Condition/Case Label' : 'Edge Label'}</Label>
                            <Input id={`edgeLabel-${edge.id}`} placeholder="Edge Label / Condition" value={edge.label || ""} onChange={e => updateEdgeProperty(edge.id, { label: e.target.value })} className="h-7 text-xs mt-1"/>
                        </div>
                    )}
                     {(selectedNodeDetails.type === 'apiCall' || selectedNodeDetails.type === 'qnaLookup' || selectedNodeDetails.type === 'getUserInput' ) && (
                        <div>
                          <Label htmlFor={`edgeType-${edge.id}`} className="text-[10px]">Edge Type</Label>
                           <Select value={edge.edgeType || 'default'} onValueChange={value => updateEdgeProperty(edge.id, { edgeType: value as JsonFlowEdge['edgeType'] })}>
                                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Default</SelectItem>
                                    <SelectItem value="success">Success (apiCall)</SelectItem>
                                    <SelectItem value="error">Error (apiCall)</SelectItem>
                                    <SelectItem value="invalid">Invalid Input (getUserInput)</SelectItem>
                                    <SelectItem value="found">Found (qnaLookup)</SelectItem>
                                    <SelectItem value="notFound">Not Found (qnaLookup)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                  </div>
                ))}
              </div>
              {selectedNodeDefinition && (
                <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="docs">
                    <AccordionTrigger className="text-base hover:no-underline">
                      <Tooltip>
                        <TooltipTrigger asChild><Info className="mr-2 h-4 w-4 text-blue-500"/></TooltipTrigger>
                        <TooltipContent side="top" className="z-[60]"><p>Node Documentation</p></TooltipContent>
                      </Tooltip>
                       Documentation: {selectedNodeDefinition.label}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-xs p-2 border-t bg-muted/30 rounded-b-md">
                      <div><strong className="block text-primary">Purpose:</strong> {selectedNodeDefinition.docs.purpose}</div>
                      <div><strong className="block text-primary">Key Settings:</strong> {selectedNodeDefinition.docs.settings}</div>
                      <div><strong className="block text-primary">Connections/Edges:</strong> {selectedNodeDefinition.docs.edges}</div>
                      <div><strong className="block text-primary">Usage Rules & Best Practices:</strong> {selectedNodeDefinition.docs.rules}</div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </>
          ) : (
            <div className="text-left py-2 space-y-3">
                <div className="flex items-center gap-2">
                   <MousePointer className="w-8 h-8 text-muted-foreground"/>
                   <p className="text-sm text-muted-foreground">Select a node for details & editing. Drag the canvas background to pan.</p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="wiring-practices">
                    <AccordionTrigger className="text-base hover:no-underline">
                       <Tooltip>
                        <TooltipTrigger asChild><Sigma className="mr-2 h-4 w-4 text-blue-500"/></TooltipTrigger>
                        <TooltipContent side="top" className="z-[60]"><p>General Wiring Guide</p></TooltipContent>
                      </Tooltip>
                      {WIRING_BEST_PRACTICES_DOCS.title}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1 text-xs p-2 border-t bg-muted/30 rounded-b-md">
                      {WIRING_BEST_PRACTICES_DOCS.points.map((point, index) => (
                        <p key={index}>• {point}</p>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
            </div>
          )}
        </CardContent>
        </ScrollArea>
         <CardFooter className="p-2 border-t mt-auto space-y-2 flex-col items-stretch">
             {mermaidCode && (
                <details className="w-full">
                  <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">View Generated Mermaid Code</summary>
                  <ScrollArea className="h-[100px] bg-muted/50 p-1.5 rounded mt-1">
                    <pre className="text-[10px] whitespace-pre-wrap">{mermaidCode}</pre>
                  </ScrollArea>
                </details>
              )}
          <Button onClick={handleSaveFlow} disabled={isSaving} className="w-full">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Visual Flow
          </Button>
        </CardFooter>
      </Card>
    </div>
    </TooltipProvider>
  );
}

