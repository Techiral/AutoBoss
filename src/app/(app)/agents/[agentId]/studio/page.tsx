
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "../../../layout";
import type { Agent, AgentFlowDefinition, FlowNode as JsonFlowNode, FlowEdge as JsonFlowEdge } from "@/lib/types";
import { Loader2, Save, AlertTriangle, Trash2, MousePointer, ArrowRight, MessageSquare, Zap, HelpCircle, Play, ChevronsUpDown, Settings2, Link2, Cog, BookOpen, Bot, Share2, Network, SlidersHorizontal, FileCode, MessageCircleQuestion, Timer, ArrowRightLeft, Users, BrainCircuit, StopCircle, Info } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const generateId = (prefix = "node_") => `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export type FlowNodeType = JsonFlowNode['type']; // Use the extended type from lib/types

interface VisualNode {
  id: string;
  type: FlowNodeType;
  label: string;
  x: number;
  y: number;
  // Common properties, specific ones based on type
  content?: string; // For message, prompt, llmPrompt, codeScript
  variableName?: string; // For getUserInput (output), callLLM (output), condition (input)
  useKnowledge?: boolean; // For callLLM
  useLLMForDecision?: boolean; // For condition
  // New node type specific properties (placeholders for now)
  actionName?: string;
  apiUrl?: string;
  qnaKnowledgeBaseId?: string;
  waitDurationMs?: number;
  transitionTargetFlowId?: string;
  agentSkillId?: string;
}

interface VisualEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string; // For condition edges or general labels
  edgeType?: JsonFlowEdge['edgeType'];
}

interface NodeDefinition {
  type: FlowNodeType;
  label: string;
  icon: React.ElementType;
  defaultProperties?: Partial<VisualNode>;
  docs: {
    purpose: string;
    settings: string;
    edges: string;
    rules: string;
  };
}

const NODE_DEFINITIONS: NodeDefinition[] = [
  { type: 'start', label: 'Start', icon: Play, docs: { purpose: "Marks the entry of a flow. Always first.", settings: "None.", edges: "Exactly 1 outgoing.", rules: "Every flow requires one Start; cannot be downstream of any other node."} },
  { type: 'sendMessage', label: 'Send Message', icon: MessageSquare, defaultProperties: { content: "New message" }, docs: { purpose: "Delivers text, cards, quick replies, or carousels to user.", settings: "Channel selector, typing simulation, templates (`{{var}}`).", edges: "1 outgoing edge to next node.", rules: "For long text (>640 chars) split across nodes; ensure channel compatibility." } },
  { type: 'getUserInput', label: 'Ask Question', icon: HelpCircle, defaultProperties: { content: "Ask something...", variableName: "userInput" }, docs: { purpose: "Prompts user and captures reply.", settings: "Input type (text, number, email, choice, date), validation (regex, ranges), variable name.", edges: "1 happy-path; optional invalid path.", rules: "If validation on, wire both valid & invalid outputs; otherwise fallback can drop." } },
  { type: 'callLLM', label: 'LLM Call', icon: Zap, defaultProperties: { content: "Your LLM prompt for {{variable}}", variableName: "llmOutput", useKnowledge: false }, docs: { purpose: "Invokes an LLM prompt (openAI, etc.) inline.", settings: "Prompt template, `useKnowledge` flag, output var.", edges: "1 outgoing.", rules: "Prompts must be clear; beware latency (200–1000ms). Handle missing or malformed responses with fallback." } },
  { type: 'condition', label: 'Condition', icon: ChevronsUpDown, defaultProperties: { variableName: "conditionVariable", useLLMForDecision: false }, docs: { purpose: "Routes based on expressions (`{{state.age}} > 18`).", settings: "List of JS/Nunjucks expressions, default branch.", edges: "One per branch + default.", rules: "Evaluated in order; always include default to catch unmatched cases." } },
  { type: 'action', label: 'Action', icon: SlidersHorizontal, defaultProperties: { actionName: "myCustomAction" }, docs: { purpose: "Runs a registered action (CRM update, DB write, custom logic).", settings: "Action name, input args, output map.", edges: "1 outgoing; errors bubble to global fallback.", rules: "Custom actions must exist in code; handle errors via fallback flow." } },
  { type: 'apiCall', label: 'HTTP Request', icon: Network, defaultProperties: { apiUrl: "https://api.example.com/data" }, docs: { purpose: "Calls external REST endpoint.", settings: "URL (templated), method, headers, body, timeout, retry.", edges: "Success + error.", rules: "Non-2xx → error edge; account for rate limits and retries." } },
  { type: 'code', label: 'Code (JS)', icon: FileCode, defaultProperties: { content: "// Your JS code here\nreturn {};" }, docs: { purpose: "Executes inline JavaScript with access to `state`, `temp`, `event.payload`.", settings: "Script editor, return var mapping.", edges: "1 outgoing; exceptions → flow error.", rules: "Keep snippets synchronous and concise; heavy logic belongs in actions." } },
  { type: 'qnaLookup', label: 'Q&A Lookup', icon: MessageCircleQuestion, defaultProperties: { qnaKnowledgeBaseId: "kb_default" }, docs: { purpose: "Hits a Q&A (KB) for best match to user input.", settings: "KB ID, threshold, fallback text.", edges: "Found (≥ threshold) + Not found.", rules: "Always wire both edges or user can get stuck without response." } },
  { type: 'wait', label: 'Wait / Delay', icon: Timer, defaultProperties: { waitDurationMs: 1000 }, docs: { purpose: "Pauses flow to simulate typing or timing.", settings: "Delay duration (ms/sec).", edges: "1 outgoing.", rules: "Use sparingly (<2s) to avoid user frustration." } },
  { type: 'transition', label: 'Transition', icon: ArrowRightLeft, defaultProperties: { transitionTargetFlowId: "another_flow_id" }, docs: { purpose: "Moves execution to another flow.", settings: "Target flow ID, entry node, variables to pass.", edges: "1 outgoing.", rules: "Avoid infinite loops; ensure variables exist upstream." } },
  { type: 'agentSkill', label: 'Agent Skill', icon: BrainCircuit, defaultProperties: { agentSkillId: "booking_agent_skill" }, docs: { purpose: "Spins up an AI agent with a predefined persona & toolset (e.g., booking agent, troubleshooting agent).", settings: "Agent ID, skills list (search, memory, external API connectors), context window.", edges: "Typically single outgoing to resume flow after agent completes.", rules: "Define clear handoff points; manage token/context limits; chain only when agent response needed." } },
  { type: 'end', label: 'End', icon: StopCircle, docs: { purpose: "Terminates the conversation path.", settings: "Optional `output` variable to return data to parent flow.", edges: "No outgoing edges.", rules: "Must be reachable from all branches to avoid dead‑ends." } },
];

const WIRING_BEST_PRACTICES_DOCS = {
  title: "Wiring & Best Practices",
  points: [
    "Every non-End node needs ≥1 outgoing edge.",
    "Match edges to node type: only Condition supports multiple branches, HTTP/Action support error paths.",
    "Handle errors: wire error outputs for HTTP, Action, Code.",
    "Variable order: define before use (e.g. collect user input before templating).",
    "Avoid deep nesting: break complex logic into sub-flows and use Transition.",
    "Test branches: simulate all paths (valid, invalid, error, default).",
  ]
};

// Sample flow definition, using the provided complex customer support example
const sampleFlow: AgentFlowDefinition = {
  flowId: "sample-customer-support-flow",
  name: "Sample Customer Support",
  description: "A sample flow demonstrating basic customer interaction with conditional logic and LLM usage.",
  nodes: [
    { id: "start_node", type: "start", position: { x: 50, y: 50 } },
    { id: "greet_user", type: "sendMessage", message: "Hello! I'm your AI assistant. How can I help you today?", position: { x: 50, y: 150 } },
    { id: "get_issue_type", type: "getUserInput", prompt: "First, could you tell me if your issue is related to 'Billing', 'Technical support', or 'Other'?", variableName: "issueType", position: { x: 50, y: 250 } },
    { id: "check_issue_type", type: "condition", conditionVariable: "issueType", useLLMForDecision: true, position: { x: 50, y: 350 } },
    { id: "billing_inquiry", type: "sendMessage", message: "Okay, for billing issues, I can help with that.", position: { x: 250, y: 450 } },
    { id: "get_billing_details", type: "getUserInput", prompt: "Please provide your account number or invoice ID.", variableName: "billingDetails", position: { x: 250, y: 550 } },
    { id: "lookup_billing_info", type: "callLLM", llmPrompt: "User '{{userName}}' has a billing issue with details: {{billingDetails}}. Provide a concise summary or next step based on this. You can refer to our knowledge base.", outputVariable: "billingResolution", useKnowledge: true, position: { x: 250, y: 650 } },
    { id: "send_billing_resolution", type: "sendMessage", message: "Here's what I found or the next step for your billing query: {{billingResolution}}", position: { x: 250, y: 750 } },
    { id: "technical_inquiry", type: "sendMessage", message: "I see, a technical issue. Let's try to resolve it.", position: { x: 50, y: 450 } },
    { id: "get_tech_description", type: "getUserInput", prompt: "Can you describe the technical problem you're experiencing?", variableName: "techDescription", position: { x: 50, y: 550 } },
    { id: "resolve_tech_issue", type: "callLLM", llmPrompt: "User '{{userName}}' is facing a technical issue: {{techDescription}}. Provide troubleshooting steps or guidance from our knowledge base.", outputVariable: "techSolution", useKnowledge: true, position: { x: 50, y: 650 } },
    { id: "send_tech_solution", type: "sendMessage", message: "Here are some steps you can try: {{techSolution}}", position: { x: 50, y: 750 } },
    { id: "other_inquiry", type: "sendMessage", message: "Alright, for other issues, let me get some more details.", position: { x: -150, y: 450 } },
    { id: "get_other_details", type: "getUserInput", prompt: "Please describe your issue in more detail.", variableName: "otherDetails", position: { x: -150, y: 550 } },
    { id: "handle_other_issue", type: "callLLM", llmPrompt: "User '{{userName}}' has an issue: {{otherDetails}}. Provide general assistance or direct them to the appropriate resource using our knowledge base.", outputVariable: "otherSolution", useKnowledge: true, position: { x: -150, y: 650 } },
    { id: "send_other_solution", type: "sendMessage", message: "Regarding your issue: {{otherSolution}}", position: { x: -150, y: 750 } },
    { id: "ask_if_resolved", type: "getUserInput", prompt: "Did this resolve your issue? (Yes/No)", variableName: "isResolved", position: { x: 50, y: 850 } },
    { id: "check_resolution", type: "condition", conditionVariable: "isResolved", useLLMForDecision: true, position: { x: 50, y: 950 } },
    { id: "issue_resolved_msg", type: "sendMessage", message: "Great! I'm glad I could help. Is there anything else?", position: { x: 250, y: 1050 } },
    { id: "issue_not_resolved_msg", type: "sendMessage", message: "I'm sorry to hear that. I'll note this down. For further assistance, please contact our support team directly.", position: { x: -150, y: 1050 } },
    { id: "invalid_category_node", type: "sendMessage", message: "I didn't quite catch that category. Could you please specify if it's 'Billing', 'Technical', or 'Other'?", position: { x: -150, y: 300 } }, // Placeholder for invalid category
    { id: "end_resolved", type: "end", position: { x: 250, y: 1150 } },
    { id: "end_not_resolved", type: "end", position: { x: -150, y: 1150 } },
    { id: "end_after_invalid_cat", type: "end", position: { x: -150, y: 400 } },
  ],
  edges: [
    { id: "e_start_greet", source: "start_node", target: "greet_user", label: "Start" },
    { id: "e_greet_getissue", source: "greet_user", target: "get_issue_type" },
    { id: "e_getissue_checkissue", source: "get_issue_type", target: "check_issue_type" },
    { id: "e_check_billing", source: "check_issue_type", target: "billing_inquiry", condition: "User has a billing related question or issue." },
    { id: "e_billing_getdetails", source: "billing_inquiry", target: "get_billing_details" },
    { id: "e_getdetails_lookup", source: "get_billing_details", target: "lookup_billing_info" },
    { id: "e_lookup_sendresolution", source: "lookup_billing_info", target: "send_billing_resolution" },
    { id: "e_billing_askresolved", source: "send_billing_resolution", target: "ask_if_resolved" },
    { id: "e_check_technical", source: "check_issue_type", target: "technical_inquiry", condition: "User has a technical problem or needs technical support." },
    { id: "e_technical_getdesc", source: "technical_inquiry", target: "get_tech_description" },
    { id: "e_getdesc_resolve", source: "get_tech_description", target: "resolve_tech_issue" },
    { id: "e_resolve_sendsolution", source: "resolve_tech_issue", target: "send_tech_solution" },
    { id: "e_technical_askresolved", source: "send_tech_solution", target: "ask_if_resolved" },
    { id: "e_check_other", source: "check_issue_type", target: "other_inquiry", condition: "User issue does not fit billing or technical, or is general." },
    { id: "e_other_getdetails_other", source: "other_inquiry", target: "get_other_details" },
    { id: "e_getdetails_handleother", source: "get_other_details", target: "handle_other_issue" },
    { id: "e_handleother_sendothersolution", source: "handle_other_issue", target: "send_other_solution" },
    { id: "e_other_askresolved", source: "send_other_solution", target: "ask_if_resolved" },
    { id: "e_askresolved_check", source: "ask_if_resolved", target: "check_resolution" },
    { id: "e_check_is_resolved_yes", source: "check_resolution", target: "issue_resolved_msg", condition: "User indicates the issue is resolved or problem is solved." },
    { id: "e_check_is_resolved_no", source: "check_resolution", target: "issue_not_resolved_msg", condition: "User indicates the issue is not resolved or problem persists." },
    { id: "e_resolved_end", source: "issue_resolved_msg", target: "end_resolved" },
    { id: "e_notresolved_end", source: "issue_not_resolved_msg", target: "end_not_resolved" },
    { id: "e_check_invalid_category", source: "check_issue_type", target: "invalid_category_node", condition: "" }, // Default for LLM if no other condition matches
    { id: "e_invalid_cat_to_end", source: "invalid_category_node", target: "end_after_invalid_cat" },
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
  const [draggingNodeInfo, setDraggingNodeInfo] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  
  const [edgeDragInfo, setEdgeDragInfo] = useState<{
    sourceNodeId: string;
    sourceNodeX: number;
    sourceNodeY: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const loadFlowToVisual = useCallback((flowDef: AgentFlowDefinition | undefined) => {
    const flowToLoad = flowDef && flowDef.nodes && flowDef.nodes.length > 0 ? flowDef : sampleFlow;
    
    const loadedNodes: VisualNode[] = flowToLoad.nodes.map((jsonNode: JsonFlowNode) => ({
      id: jsonNode.id,
      type: jsonNode.type as FlowNodeType,
      label: jsonNode.id, 
      x: jsonNode.position?.x || Math.random() * 400,
      y: jsonNode.position?.y || Math.random() * 300,
      content: jsonNode.message || jsonNode.prompt || jsonNode.llmPrompt || jsonNode.codeScript,
      variableName: jsonNode.variableName || jsonNode.outputVariable || jsonNode.conditionVariable,
      useKnowledge: jsonNode.useKnowledge,
      useLLMForDecision: jsonNode.useLLMForDecision,
      actionName: jsonNode.actionName,
      apiUrl: jsonNode.apiUrl,
      qnaKnowledgeBaseId: jsonNode.qnaKnowledgeBaseId,
      waitDurationMs: jsonNode.waitDurationMs,
      transitionTargetFlowId: jsonNode.transitionTargetFlowId,
      agentSkillId: jsonNode.agentSkillId,
    }));
    const loadedEdges: VisualEdge[] = flowToLoad.edges.map((jsonEdge: JsonFlowEdge) => ({
      id: jsonEdge.id,
      sourceId: jsonEdge.source,
      targetId: jsonEdge.target,
      label: jsonEdge.condition || jsonEdge.label, 
      edgeType: jsonEdge.edgeType
    }));
    setNodes(loadedNodes);
    setEdges(loadedEdges);
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
    const x = event.clientX - canvasBounds.left;
    const y = event.clientY - canvasBounds.top;
    
    const nodeDef = NODE_DEFINITIONS.find(w => w.type === nodeType);
    const defaultLabel = nodeDef?.label || 'Node';
    const newNodeId = generateId(nodeType + '_');
    const newNode: VisualNode = {
      id: newNodeId,
      type: nodeType,
      label: `${defaultLabel} ${nodes.filter(n => n.type === nodeType).length + 1}`,
      x: Math.max(0, x - 75), 
      y: Math.max(0, y - 25),
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
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current) return;
    if (event.target !== event.currentTarget && (event.target as HTMLElement).dataset.port) {
        return;
    }

    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const offsetX = event.clientX - canvasBounds.left - node.x;
    const offsetY = event.clientY - canvasBounds.top - node.y;
    setDraggingNodeInfo({ id: nodeId, offsetX, offsetY });
    setEdgeDragInfo(null);
    setSelectedNodeId(nodeId);
    event.stopPropagation(); 
  };
  
  const nodeWidth = 180; // Increased width for better label visibility
  const nodeHeight = 70; // Increased height for more content

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const canvasBounds = canvasRef.current.getBoundingClientRect();

    if (draggingNodeInfo) {
        let x = event.clientX - canvasBounds.left - draggingNodeInfo.offsetX;
        let y = event.clientY - canvasBounds.top - draggingNodeInfo.offsetY;
        x = Math.max(0, Math.min(x, canvasBounds.width - nodeWidth)); 
        y = Math.max(0, Math.min(y, canvasBounds.height - nodeHeight));
        setNodes((nds) =>
        nds.map((n) => (n.id === draggingNodeInfo.id ? { ...n, x, y } : n))
        );
    } else if (edgeDragInfo) {
        const currentX = event.clientX - canvasBounds.left;
        const currentY = event.clientY - canvasBounds.top;
        setEdgeDragInfo(prev => prev ? {...prev, currentX, currentY} : null);
    }
  };

  const handleCanvasMouseUp = () => {
    if (draggingNodeInfo) {
        setDraggingNodeInfo(null);
    }
    if (edgeDragInfo) {
        setEdgeDragInfo(null);
    }
  };
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === canvasRef.current) { 
        setSelectedNodeId(null);
        setEdgeDragInfo(null);
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
    const startX = sourceNode.x + nodeWidth;
    const startY = sourceNode.y + nodeHeight / 2;

    setEdgeDragInfo({
        sourceNodeId: nodeId,
        sourceNodeX: sourceNode.x,
        sourceNodeY: sourceNode.y,
        startX: startX,
        startY: startY,
        currentX: startX,
        currentY: startY,
    });
    toast({title: "Connecting...", description: `Drag from ${sourceNode.label} to an input port.`});
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
    
    const existingEdge = edges.find(e => e.sourceId === edgeDragInfo.sourceNodeId && e.targetId === targetNodeId);
    if (existingEdge) {
        toast({title: "Connection Exists", description: "An edge already exists between these nodes."});
        setEdgeDragInfo(null);
        return;
    }

    const newEdge: VisualEdge = {
        id: generateId('edge_'),
        sourceId: edgeDragInfo.sourceNodeId,
        targetId: targetNodeId,
        label: '', 
    };
    setEdges((eds) => eds.concat(newEdge));
    const sourceNode = nodes.find(n=>n.id===edgeDragInfo.sourceNodeId);
    toast({ title: "Edge Created!", description: `Connected ${sourceNode?.label} to ${targetNode.label}.`});
    setEdgeDragInfo(null);
  };
  
  const updateSelectedNodeProperties = (updatedProps: Partial<VisualNode>) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => n.id === selectedNodeId ? {...n, ...updatedProps} : n));
  };

  const updateEdgeProperty = (edgeId: string, updatedProps: Partial<VisualEdge>) => {
    setEdges(eds => eds.map(e => e.id === edgeId ? {...e, ...updatedProps} : e));
  };

  const deleteNode = (nodeIdToDelete: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeIdToDelete));
    setEdges(eds => eds.filter(e => e.sourceId !== nodeIdToDelete && e.targetId !== nodeIdToDelete));
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
      const sourceMermaidId = edge.sourceId.replace(/[^a-zA-Z0-9_]/g, '_');
      const targetMermaidId = edge.targetId.replace(/[^a-zA-Z0-9_]/g, '_');
      const edgeLabelText = edge.label || edge.edgeType || "";
      const edgeLabel = edgeLabelText ? `|${edgeLabelText.replace(/"/g, '#quot;')}|` : '';
      mermaidStr += `  ${sourceMermaidId} -->${edgeLabel} ${targetMermaidId};\n`;
    });
    return mermaidStr;
  }, [nodes, edges]);

  const convertToAgentFlowDefinition = useCallback((): AgentFlowDefinition => {
    const jsonNodes: JsonFlowNode[] = nodes.map(node => {
      const baseJsonNode: Omit<JsonFlowNode, 'type'> & {type: string} = { 
        id: node.id,
        type: node.type, 
        position: { x: node.x, y: node.y },
      };
      // Add specific properties based on node type
      // This needs to be expanded for all new node types and their settings
      switch (node.type) {
        case 'sendMessage':
          return { ...baseJsonNode, type: 'sendMessage', message: node.content || "" };
        case 'getUserInput':
          return { ...baseJsonNode, type: 'getUserInput', prompt: node.content || "", variableName: node.variableName || "" };
        case 'callLLM':
          return { ...baseJsonNode, type: 'callLLM', llmPrompt: node.content || "", outputVariable: node.variableName || "", useKnowledge: !!node.useKnowledge };
        case 'condition':
          return { ...baseJsonNode, type: 'condition', conditionVariable: node.variableName || "", useLLMForDecision: !!node.useLLMForDecision };
        case 'action':
          return { ...baseJsonNode, type: 'action', actionName: node.actionName || "" };
        case 'apiCall':
          return { ...baseJsonNode, type: 'apiCall', apiUrl: node.apiUrl || "" };
        case 'code':
          return { ...baseJsonNode, type: 'code', codeScript: node.content || "" };
        case 'qnaLookup':
          return { ...baseJsonNode, type: 'qnaLookup', qnaKnowledgeBaseId: node.qnaKnowledgeBaseId || "" };
        case 'wait':
          return { ...baseJsonNode, type: 'wait', waitDurationMs: node.waitDurationMs || 0 };
        case 'transition':
          return { ...baseJsonNode, type: 'transition', transitionTargetFlowId: node.transitionTargetFlowId || "" };
        case 'agentSkill':
          return { ...baseJsonNode, type: 'agentSkill', agentSkillId: node.agentSkillId || "" };
        case 'start':
        case 'end':
           return { ...baseJsonNode, type: node.type};
        default: 
          console.warn(`Unknown node type during JSON conversion: ${node.type}`);
          return { ...baseJsonNode, type: node.type }; // Fallback, but should be exhaustive
      }
    });

    const jsonEdges: JsonFlowEdge[] = edges.map(edge => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      label: edge.label, 
      condition: edge.label, // For condition nodes, label is the condition
      edgeType: edge.edgeType
    }));
    
    const flowId = currentAgent?.flow?.flowId || generateId('flow_');
    const flowName = currentAgent?.flow?.name || "My Visual Flow";
    const flowDescription = currentAgent?.flow?.description || "A flow created with the visual editor.";
    
    if (nodes.length > 0 && (!nodes.some(n => n.type === 'start') || !nodes.some(n => n.type === 'end'))) {
        toast({ title: "Invalid Flow", description: "A flow must have at least one 'Start' and one 'End' node.", variant: "destructive"});
    }

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
      updateAgentFlow(currentAgent.id, agentFlowDef);
      toast({ title: "Flow Saved!", description: `Flow "${agentFlowDef.name}" visually designed and updated.` });
    } catch (error: any) {
      console.error("Error saving flow:", error);
      toast({ title: "Save Error", description: error.message || "Could not save the flow.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [currentAgent, convertToMermaid, convertToAgentFlowDefinition, updateAgentFlow, toast]);
  
  const resetToSampleFlow = () => {
    loadFlowToVisual(sampleFlow); // Reloads the sample flow definition
    setSelectedNodeId(null);
    setMermaidCode("");
     if (currentAgent) {
      // Optionally save this reset state
      // updateAgentFlow(currentAgent.id, sampleFlow); 
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

  const portSize = 8; 

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
      <Card className="col-span-2 h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Node Tools</CardTitle>
        </CardHeader>
        <ScrollArea className="flex-grow">
        <CardContent className="space-y-2 p-2">
          {NODE_DEFINITIONS.map(widget => (
            <div
              key={widget.type}
              draggable
              onDragStart={(e) => handleDragStartWidget(e, widget.type)}
              className="p-2 border rounded-md cursor-grab flex items-center gap-2 hover:bg-muted active:cursor-grabbing transition-colors"
            >
              <widget.icon className="w-5 h-5 text-primary shrink-0"/>
              <span className="text-sm">{widget.label}</span>
            </div>
          ))}
        </CardContent>
        </ScrollArea>
         <CardFooter className="p-2 border-t mt-auto">
            <Button onClick={resetToSampleFlow} variant="outline" size="sm" className="w-full"><Trash2 className="mr-2 h-4 w-4" />Reset to Sample</Button>
        </CardFooter>
      </Card>

      <Card 
        className="col-span-6 xl:col-span-7 h-full relative overflow-auto bg-muted/20 border-dashed border-input"
        ref={canvasRef}
        onDrop={handleDropOnCanvas}
        onDragOver={handleDragOverCanvas}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp} 
        onClick={handleCanvasClick}
      >
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.sourceId);
            const targetNode = nodes.find(n => n.id === edge.targetId);
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
              <g key={edge.id} className="cursor-pointer" onClick={(e) => { /* Future: select edge */ e.stopPropagation(); }}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--primary)/0.7)" strokeWidth="1.5" />
                <polygon points={`${x2},${y2} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`} fill="hsl(var(--primary)/0.7)" />
                {(edge.label || edge.edgeType) && (
                  <text x={midX} y={midY - 5} fill="hsl(var(--foreground))" fontSize="10px" textAnchor="middle" className="pointer-events-none select-none">
                    {edge.label || edge.edgeType}
                  </text>
                )}
              </g>
            );
          })}
           {edgeDragInfo && (
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
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            className="absolute p-2 border rounded bg-card shadow cursor-grab select-none flex flex-col justify-center"
            style={{ 
                left: node.x, 
                top: node.y,
                width: `${nodeWidth}px`,
                height: `${nodeHeight}px`,
                borderColor: selectedNodeId === node.id ? 'hsl(var(--ring))' : 'hsl(var(--border))',
                boxShadow: selectedNodeId === node.id ? '0 0 0 1px hsl(var(--ring))' : '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
             {node.type !== 'start' && (
                <div 
                    data-port="in"
                    onMouseUp={(e) => handlePortMouseUp(e, node.id, 'in')}
                    title={`Connect to ${node.label}`}
                    className="absolute -left-[5px] top-1/2 -translate-y-1/2 cursor-crosshair pointer-events-auto"
                    style={{width: `${portSize+4}px`, height: `${portSize+4}px`, display:'flex', alignItems:'center', justifyContent:'center'}}
                >
                   <div className="w-2 h-2 bg-primary/70 rounded-full border border-background ring-1 ring-primary/70 hover:bg-primary hover:ring-primary transition-all"/>
                </div>
             )}

            <div className="flex items-center gap-1 mb-0.5 overflow-hidden">
              {(() => {
                const WidgetIcon = NODE_DEFINITIONS.find(w=>w.type === node.type)?.icon;
                return WidgetIcon ? <WidgetIcon className="w-3 h-3 text-primary shrink-0" /> : <Link2 className="w-3 h-3 text-muted-foreground shrink-0"/>;
              })()}
              <span className="text-xs font-medium truncate" title={node.label}>{node.label}</span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate" title={node.content || node.variableName || node.type}>
              { node.type === 'sendMessage' ? (node.content || '...') :
                node.type === 'getUserInput' ? (node.variableName ? `Var: ${node.variableName}`: '...') :
                node.type === 'callLLM' ? (node.variableName ? `Out: ${node.variableName}`: '...') :
                node.type === 'condition' ? (node.variableName ? `If: ${node.variableName}`: '...') :
                node.type === 'action' ? (node.actionName || 'Action') :
                node.type === 'apiCall' ? (node.apiUrl ? node.apiUrl.substring(0,20)+'...' : 'HTTP Req') :
                node.type === 'code' ? 'JS Code' :
                node.type === 'qnaLookup' ? (node.qnaKnowledgeBaseId || 'Q&A') :
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
                    className="absolute -right-[5px] top-1/2 -translate-y-1/2 cursor-crosshair pointer-events-auto"
                     style={{width: `${portSize+4}px`, height: `${portSize+4}px`, display:'flex', alignItems:'center', justifyContent:'center'}}
                 >
                    <div className="w-2 h-2 bg-primary/70 rounded-full border border-background ring-1 ring-primary/70 hover:bg-primary hover:ring-primary transition-all"/>
                 </div>
            )}
          </div>
        ))}
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
                  <Label htmlFor="nodeLabel" className="text-xs">Node Label (ID)</Label>
                  <Input id="nodeLabel" value={selectedNodeDetails.label} onChange={e => updateSelectedNodeProperties({ label: e.target.value })} className="h-8 text-sm"/>
                </div>
                {/* --- Property inputs based on node type --- */}
                { (selectedNodeDetails.type === 'sendMessage' || selectedNodeDetails.type === 'callLLM') && (
                  <div>
                    <Label htmlFor="nodeContent" className="text-xs">{selectedNodeDetails.type === 'sendMessage' ? 'Message Text' : 'LLM Prompt'}</Label>
                    <Textarea id="nodeContent" value={selectedNodeDetails.content || ""} onChange={e => updateSelectedNodeProperties({ content: e.target.value })} rows={3} className="text-sm"/>
                  </div>
                )}
                 { selectedNodeDetails.type === 'getUserInput' && (
                  <>
                    <div>
                      <Label htmlFor="nodePrompt" className="text-xs">Prompt Text</Label>
                      <Textarea id="nodePrompt" value={selectedNodeDetails.content || ""} onChange={e => updateSelectedNodeProperties({ content: e.target.value })} rows={2} className="text-sm"/>
                    </div>
                    <div>
                      <Label htmlFor="nodeVariable" className="text-xs">Output Variable Name</Label>
                      <Input id="nodeVariable" value={selectedNodeDetails.variableName || ""} onChange={e => updateSelectedNodeProperties({ variableName: e.target.value })}  className="h-8 text-sm"/>
                    </div>
                  </>
                )}
                { (selectedNodeDetails.type === 'callLLM' || selectedNodeDetails.type === 'condition') && selectedNodeDetails.type !== 'getUserInput' && (
                  <div>
                    <Label htmlFor="nodeVariable" className="text-xs">{selectedNodeDetails.type === 'condition' ? 'Variable to Check' : 'Output Variable Name'}</Label>
                    <Input id="nodeVariable" value={selectedNodeDetails.variableName || ""} onChange={e => updateSelectedNodeProperties({ variableName: e.target.value })}  className="h-8 text-sm"/>
                  </div>
                )}
                { selectedNodeDetails.type === 'callLLM' && (
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox id="useKnowledge" checked={!!selectedNodeDetails.useKnowledge} onCheckedChange={(checked) => updateSelectedNodeProperties({ useKnowledge: !!checked })}/>
                    <Label htmlFor="useKnowledge" className="text-xs font-normal cursor-pointer">Use Knowledge Base</Label>
                  </div>
                )}
                { selectedNodeDetails.type === 'condition' && (
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox id="useLLMForDecision" checked={!!selectedNodeDetails.useLLMForDecision} onCheckedChange={(checked) => updateSelectedNodeProperties({ useLLMForDecision: !!checked })}/>
                    <Label htmlFor="useLLMForDecision" className="text-xs font-normal cursor-pointer">Use LLM for Decision</Label>
                  </div>
                )}
                { selectedNodeDetails.type === 'action' && (
                    <div><Label htmlFor="actionName" className="text-xs">Action Name</Label><Input id="actionName" value={selectedNodeDetails.actionName || ""} onChange={e => updateSelectedNodeProperties({ actionName: e.target.value })} className="h-8 text-sm"/></div>
                )}
                { selectedNodeDetails.type === 'apiCall' && (
                    <div><Label htmlFor="apiUrl" className="text-xs">API URL</Label><Input id="apiUrl" value={selectedNodeDetails.apiUrl || ""} onChange={e => updateSelectedNodeProperties({ apiUrl: e.target.value })} className="h-8 text-sm"/></div>
                )}
                { selectedNodeDetails.type === 'code' && (
                    <div><Label htmlFor="codeScript" className="text-xs">JavaScript Code</Label><Textarea id="codeScript" value={selectedNodeDetails.content || ""} onChange={e => updateSelectedNodeProperties({ content: e.target.value })} rows={3} className="text-sm font-code"/></div>
                )}
                { selectedNodeDetails.type === 'qnaLookup' && (
                    <div><Label htmlFor="qnaKbId" className="text-xs">Knowledge Base ID</Label><Input id="qnaKbId" value={selectedNodeDetails.qnaKnowledgeBaseId || ""} onChange={e => updateSelectedNodeProperties({ qnaKnowledgeBaseId: e.target.value })} className="h-8 text-sm"/></div>
                )}
                { selectedNodeDetails.type === 'wait' && (
                    <div><Label htmlFor="waitDuration" className="text-xs">Wait Duration (ms)</Label><Input id="waitDuration" type="number" value={selectedNodeDetails.waitDurationMs || 0} onChange={e => updateSelectedNodeProperties({ waitDurationMs: parseInt(e.target.value) || 0 })} className="h-8 text-sm"/></div>
                )}
                { selectedNodeDetails.type === 'transition' && (
                    <div><Label htmlFor="transitionFlowId" className="text-xs">Target Flow ID</Label><Input id="transitionFlowId" value={selectedNodeDetails.transitionTargetFlowId || ""} onChange={e => updateSelectedNodeProperties({ transitionTargetFlowId: e.target.value })} className="h-8 text-sm"/></div>
                )}
                 { selectedNodeDetails.type === 'agentSkill' && (
                    <div><Label htmlFor="agentSkillId" className="text-xs">Agent Skill ID</Label><Input id="agentSkillId" value={selectedNodeDetails.agentSkillId || ""} onChange={e => updateSelectedNodeProperties({ agentSkillId: e.target.value })} className="h-8 text-sm"/></div>
                )}

                <Button variant="outline" size="sm" onClick={() => deleteNode(selectedNodeDetails.id)} className="text-destructive border-destructive hover:bg-destructive/10 w-full mt-2">
                  <Trash2 className="mr-2 h-3 w-3" /> Delete Node
                </Button>
                <hr className="my-3"/>
                <Label className="text-xs text-muted-foreground block mb-1">Outgoing Edges:</Label>
                {edges.filter(e => e.sourceId === selectedNodeDetails.id).length === 0 && <p className="text-xs text-muted-foreground italic">No outgoing edges.</p>}
                {edges.filter(e => e.sourceId === selectedNodeDetails.id).map(edge => (
                  <div key={edge.id} className="text-xs space-y-1 border p-1.5 rounded mb-1 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="truncate" title={`To: ${nodes.find(n=>n.id===edge.targetId)?.label || edge.targetId}`}>To: {nodes.find(n=>n.id===edge.targetId)?.label || edge.targetId}</span>
                      <Button variant="ghost" size="icon" onClick={() => deleteEdge(edge.id)} className="h-5 w-5 shrink-0"><Trash2 className="h-3 w-3 text-destructive"/></Button>
                    </div>
                    {(selectedNodeDetails.type === 'condition' || selectedNodeDetails.type === 'apiCall' || selectedNodeDetails.type === 'qnaLookup') && (
                      <Input placeholder="Edge Label / Condition" value={edge.label || ""} onChange={e => updateEdgeProperty(edge.id, { label: e.target.value })} className="h-7 text-xs mt-1"/>
                    )}
                    {/* Allow setting edgeType for relevant nodes */}
                     {(selectedNodeDetails.type === 'apiCall' || selectedNodeDetails.type === 'qnaLookup' || selectedNodeDetails.type === 'getUserInput' ) && (
                        <div>
                          <Label htmlFor={`edgeType-${edge.id}`} className="text-[10px]">Edge Type</Label>
                          <select id={`edgeType-${edge.id}`} value={edge.edgeType || 'default'} onChange={e => updateEdgeProperty(edge.id, { edgeType: e.target.value as JsonFlowEdge['edgeType'] })} className="w-full h-7 text-xs border rounded bg-background p-1">
                            <option value="default">Default</option>
                            <option value="success">Success</option>
                            <option value="error">Error</option>
                            <option value="invalid">Invalid Input</option>
                            <option value="found">Found (Q&A)</option>
                            <option value="notFound">Not Found (Q&A)</option>
                          </select>
                        </div>
                    )}
                  </div>
                ))}
              </div>
              {selectedNodeDefinition && (
                <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="docs">
                    <AccordionTrigger className="text-base hover:no-underline">
                      <Info className="mr-2 h-4 w-4"/> Node Documentation: {selectedNodeDefinition.label}
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
                   <p className="text-sm text-muted-foreground">Select a node or tool for details.</p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="wiring-practices">
                    <AccordionTrigger className="text-base hover:no-underline"><Info className="mr-2 h-4 w-4"/> {WIRING_BEST_PRACTICES_DOCS.title}</AccordionTrigger>
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
  );
}
