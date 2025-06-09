
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "../../../layout";
import type { Agent, AgentFlowDefinition, FlowNode as JsonFlowNode, FlowEdge as JsonFlowEdge, AgentType, AgentDirection } from "@/lib/types";
import { Loader2, Save, AlertTriangle, Trash2, MousePointer, MessageSquare, Zap, HelpCircle, Play, ChevronsUpDown, Settings2, BookOpen, Bot as BotIcon, StopCircle, Info, Sigma, GripVertical, Timer, PanelLeft, PanelRight, FileQuestion } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";


const generateId = (prefix = "node_") => `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export type FlowNodeType = JsonFlowNode['type'];

interface VisualNode extends Omit<JsonFlowNode, 'type' | 'position' | 'message' | 'prompt' | 'llmPrompt' | 'outputVariable' | 'conditionVariable' | 'qnaKnowledgeBaseId' | 'qnaThreshold' | 'waitDurationMs' | 'agentContextWindow'> {
  type: FlowNodeType;
  label: string;
  x: number;
  y: number;
  content?: string; 
  message?: string; 
  prompt?: string; 
  variableName?: string; 
  inputType?: string; 
  validationRules?: string; 
  llmPrompt?: string; 
  outputVariable?: string; 
  useKnowledge?: boolean; 
  conditionVariable?: string; 
  useLLMForDecision?: boolean; 
  qnaQueryVariable?: string; 
  qnaFallbackText?: string; 
  waitDurationMs?: number; 
  endOutputVariable?: string; 
}


interface VisualEdge extends JsonFlowEdge {}

interface NodeDefinition {
  type: FlowNodeType;
  paletteLabel: string; // Renamed from 'label' to avoid confusion with node instance label
  icon: React.ElementType;
  defaultProperties?: Partial<VisualNode & JsonFlowNode>;
  docs: { 
    purpose: string;
    keySettings: string; // Renamed for clarity
    connectingIt: string;
    importantTips: string;
  };
}

const NODE_DEFINITIONS: NodeDefinition[] = [
  { 
    type: 'start', paletteLabel: 'Start Conversation', icon: Play, defaultProperties: { label: "Start" }, 
    docs: { 
      purpose: "Every conversation design begins with this step. It's the official starting point.", 
      keySettings: "No special settings needed. If your agent has a 'Generated Greeting' (from the Personality page), that's often said before this flow truly begins in a live chat.", 
      connectingIt: "Drag a connection from its right-side port (circle) to the first action your chatbot should take, like 'Send a Message' or 'Ask User & Save Answer'.", 
      importantTips: "You must have exactly one 'Start Conversation' step. Think of it as 'GO!' for your chatbot's logic."
    } 
  },
  { 
    type: 'sendMessage', paletteLabel: 'Send a Message', icon: MessageSquare, defaultProperties: { label: "Send Message", message: "Hello! How can I help you?" }, 
    docs: { 
      purpose: "Use this for your chatbot to say something to the user. Great for greetings, giving information, or confirming an action.", 
      keySettings: "In 'Message Text', type exactly what you want the chatbot to say. To use information collected earlier (like a user's name), type `{{variableName}}`. For example, if you saved the user's name as `userName`, you could type: `Hello {{userName}}!`", 
      connectingIt: "Connect this to the next step after the message is sent. This could be waiting for the user's reply ('Ask User & Save Answer'), making a decision, or ending the chat.", 
      importantTips: "Keep messages clear and friendly. If you use `{{variables}}`, make sure they were saved in an earlier 'Ask User & Save Answer' step."
    } 
  },
  { 
    type: 'getUserInput', paletteLabel: 'Ask User & Save Answer', icon: HelpCircle, defaultProperties: { label: "Get User Name", prompt: "What's your name?", variableName: "userName" }, 
    docs: { 
      purpose: "Use this to ask the user a question and store their reply. The chatbot will pause and wait for the user to type something.", 
      keySettings: "1. 'Chatbot's Question for User': Type the question the chatbot should ask (e.g., 'What is your email?').\n2. 'Save User's Answer as (Variable Name)': Give a short, memorable nickname for the user's answer (e.g., `userEmail`, `orderNumber`). Avoid spaces or special characters. This nickname is how you'll use their answer later.", 
      connectingIt: "Connect this to what happens *after* the user replies. Often, this is a 'Make a Decision' step (to check their answer) or an 'Ask AI' step to process what they said.", 
      importantTips: "This step *always* waits for the user. Make your question clear. The variable name you choose is important! You'll use it like `{{yourVariableName}}` in other steps."
    } 
  },
  { 
    type: 'callLLM', paletteLabel: 'Ask AI / Smart Response', icon: Zap, defaultProperties: { label: "AI Assistant Reply", llmPrompt: "The user said: {{lastUserInput}}. Respond helpfully and concisely.", outputVariable: "aiResponse", useKnowledge: true }, 
    docs: { 
      purpose: "This is your chatbot's 'brainpower' step! Use it to get the AI to generate text, answer complex questions, summarize information, or make intelligent choices based on the conversation so far.", 
      keySettings: "1. 'Instruction for AI (Prompt)': Tell the AI *exactly* what to do. Be clear! Example: `User's problem: {{userProblem}}. Suggest three solutions.` You can use `{{variables}}` (like `{{userName}}` or `{{userQuery}}`) to give the AI context from earlier steps. Tip: Use `{{conversationHistory}}` to give the AI the last few messages for better context.\n2. 'Save AI's Response as (Variable Name)': Give a nickname to store what the AI generates (e.g., `aiSolution`, `summaryText`).\n3. 'Allow AI to use Trained Knowledge': Check this if you want the AI to also use information from documents/websites you've added in the 'Knowledge' tab.", 
      connectingIt: "Usually, you'll connect this to a 'Send a Message' step to show the AI's response (e.g., `{{aiSolution}}`) to the user.", 
      importantTips: "Good instructions (prompts) are key! Test different phrasings. If the AI should use specific knowledge, make sure 'Use Trained Knowledge' is checked and that knowledge exists."
    } 
  },
  { 
    type: 'condition', paletteLabel: 'Make a Decision', icon: ChevronsUpDown, defaultProperties: { label: "Check User Choice", conditionVariable: "userChoice", useLLMForDecision: false }, 
    docs: { 
      purpose: "Lets your chatbot take different paths based on a user's answer or other saved information. This is how you create branching conversations (if X, then Y, else Z).", 
      keySettings: "1. 'Variable to Base Decision On': Enter the variable name (e.g., `userChoice` that you saved from an 'Ask User & Save Answer' step).\n2. For each outgoing connection (arrow) from this step, click the connection and in its 'Decision Outcome / User Input Value' field, type one possible value of the variable (e.g., 'Yes', 'No', 'OptionA').\n3. 'Use AI to Understand User's Intent': If checked, the AI tries to match the user's input to your connection labels even if it's not an exact word-for-word match. Good for free-text answers.", 
      connectingIt: "Draw one connection for each possible choice or outcome. **Crucially, always add one connection that has an *empty* 'Decision Outcome' field – this will be the 'Default / Other' path if the user says something unexpected.**", 
      importantTips: "Make sure every decision path eventually leads to another step or an 'End Conversation'. An empty 'Decision Outcome' on an edge makes it the default fallback path."
    } 
  },
  { 
    type: 'qnaLookup', paletteLabel: 'Answer from Knowledge', icon: FileQuestion, defaultProperties: { label: "FAQ Answer", qnaQueryVariable: "userQuestion", qnaOutputVariable: "kbAnswer", qnaFallbackText: "I couldn't find that in our knowledge base. Can you ask another way?" }, 
    docs: { 
      purpose: "Directly searches the chatbot's 'Trained Knowledge' (from the 'Knowledge' tab) to answer user questions. Perfect for FAQs or specific information retrieval.", 
      keySettings: "1. 'User's Question (Variable)': Specify the variable holding the user's query (e.g., `{{userQuery}}` that you saved from an 'Ask User & Save Answer' step).\n2. 'Save Found Answer As (Variable)': Give a nickname to store the answer if found (e.g., `foundFaqAnswer`).\n3. 'Message if No Answer Found': What the chatbot should say if it doesn't find a relevant answer in its knowledge.", 
      connectingIt: "Typically has two outgoing connections: one for 'If Answer Found' (set its 'Connection Type' to `found` in the edge properties) and another for 'If Answer Not Found' (set 'Connection Type' to `notFound`). If these specific types aren't set, it will try a 'Default' connection.", 
      importantTips: "This step needs good quality information in the 'Knowledge' tab to work well. The better the training data, the better the answers."
    } 
  },
   { 
    type: 'wait', paletteLabel: 'Add Delay', icon: Timer, defaultProperties: { label: "Short Pause", waitDurationMs: 1500 }, 
    docs: { 
      purpose: "Makes the chatbot pause for a moment. Useful for simulating 'typing' to make the interaction feel more natural, or to give the user a moment to read a longer message before the next one appears.", 
      keySettings: "Set the 'Delay Duration (ms)'. 1000ms = 1 second. (e.g., 1500 for 1.5 seconds).", 
      connectingIt: "Connect to the step that should happen after the pause.", 
      importantTips: "Use short delays (1-3 seconds) for a typing effect. Don't make users wait too long unnecessarily."
    } 
  },
  { 
    type: 'end', paletteLabel: 'End Conversation', icon: StopCircle, defaultProperties: { label: "End Chat"}, 
    docs: { 
      purpose: "Marks the end of a particular path in your conversation design. This tells the system that this part of the chat is complete.", 
      keySettings: "Usually no settings needed. Advanced: 'Output Variable from Context' can pass a final data point if this flow is part of a larger system (rarely used for basic chatbots).", 
      connectingIt: "This step should NOT have any outgoing connections. It's the final stop for a conversation branch.", 
      importantTips: "Ensure all possible paths in your conversation eventually reach an 'End Conversation' step. This prevents the chatbot from getting stuck or confused."
    } 
  },
];


const WIRING_BEST_PRACTICES_DOCS = {
  title: "Conversation Design Tips",
  points: [
    "Start Simple: Build a basic path first, then add more branches.",
    "Always Connect Steps: Every step (except 'End Conversation') should have an arrow leading to the next step.",
    "Use Variables Wisely: Give clear names to variables from 'Ask User & Save Answer' (e.g., `customerName`, `issueType`). Use them with `{{variableName}}` in other steps.",
    "Test Decision Paths: For 'Make a Decision' steps, ensure every choice has a path, and *always* have a 'Default / Other' path for unexpected answers (an edge with an empty 'Decision Outcome' value).",
    "Guide the User: Tell users what kind of answers you expect (e.g., 'Please type Yes or No', 'Enter your order number').",
    "Keep it Concise: Chatbot messages should be easy to read and understand quickly.",
    "Save Often: Use the 'Save Conversation Design' button regularly!",
    "Test, Test, Test: Use the 'Test Agent' tab frequently to try out your conversation as you build it.",
  ]
};

export const minimalInitialFlow: AgentFlowDefinition = {
  flowId: "new-agent-flow",
  name: "New Agent Flow",
  description: "A minimal flow to get started.",
  nodes: [
    { id: "start_minimal", type: "start", label: "Start", position: { x: 50, y: 100 } },
    { id: "send_greeting_minimal", type: "sendMessage", label: "Greet User", message: "Hello! How can I assist you today?", position: { x: 250, y: 100 } },
    { id: "end_minimal", type: "end", label: "End", position: { x: 500, y: 100 } },
  ],
  edges: [
    { id: "e_minimal_start_greet", source: "start_minimal", target: "send_greeting_minimal" },
    { id: "e_minimal_greet_end", source: "send_greeting_minimal", target: "end_minimal" },
  ]
};

export const customerSupportFlow: AgentFlowDefinition = {
  flowId: "customer-support-flow",
  name: "Simple Customer Support",
  description: "A very basic flow to guide users to product info or tech help.",
  nodes: [
    { id: "cs_start", type: "start", label: "Start", position: { x: 50, y: 50 } },
    { id: "cs_greet", type: "sendMessage", label: "Greet & Ask", message: "Welcome to Support! Are you looking for (A) Product Info or (B) Tech Help?", position: { x: 50, y: 150 } },
    { id: "cs_get_choice", type: "getUserInput", label: "Get Choice", prompt: "Please type A or B.", variableName: "userSupportChoice", position: { x: 50, y: 250 } },
    { id: "cs_check_choice", type: "condition", label: "Check Choice", conditionVariable: "userSupportChoice", useLLMForDecision: false, position: { x: 50, y: 350 } },
    { id: "cs_send_prod_info", type: "sendMessage", label: "Product Info Msg", message: "For Product Info, please visit our website example.com/products.", position: { x: 250, y: 450 } },
    { id: "cs_end_prod", type: "end", label: "End Product Path", position: { x: 250, y: 550 } },
    { id: "cs_send_tech_info", type: "sendMessage", label: "Tech Help Msg", message: "For Tech Help, please describe your issue, and our team will review it.", position: { x: -150, y: 450 } },
    { id: "cs_end_tech", type: "end", label: "End Tech Path", position: { x: -150, y: 550 } },
    { id: "cs_default_reply", type: "sendMessage", label: "Invalid Choice Msg", message: "Sorry, I didn't understand that. Please type A for Product Info or B for Tech Help.", position: { x: 50, y: 480 } }
  ],
  edges: [
    { id: "ecs_s_g", source: "cs_start", target: "cs_greet" },
    { id: "ecs_g_gc", source: "cs_greet", target: "cs_get_choice" },
    { id: "ecs_gc_cc", source: "cs_get_choice", target: "cs_check_choice" },
    { id: "ecs_cc_prod", source: "cs_check_choice", target: "cs_send_prod_info", condition: "A", label: "A" },
    { id: "ecs_spi_end", source: "cs_send_prod_info", target: "cs_end_prod" },
    { id: "ecs_cc_tech", source: "cs_check_choice", target: "cs_send_tech_info", condition: "B", label: "B" },
    { id: "ecs_sti_end", source: "cs_send_tech_info", target: "cs_end_tech" },
    { id: "ecs_cc_default", source: "cs_check_choice", target: "cs_default_reply", condition: "", label: "Default/Other", edgeType: "default" },
    { id: "ecs_dr_loop", source: "cs_default_reply", target: "cs_get_choice" }
  ]
};

export const faqFlowMinimal: AgentFlowDefinition = {
  flowId: "faq-flow-minimal",
  name: "FAQ Agent (Minimal Greeting)",
  description: "A minimal flow that greets and then expects autonomous reasoning or Q&A for subsequent interactions (if agent is RAG/Hybrid).",
  nodes: [
    { id: "faq_start", type: "start", label: "Start FAQ", position: { x: 50, y: 50 } },
    { id: "faq_greet", type: "sendMessage", label: "Greet", message: "Hello! I'm here to answer your questions about our services. What's on your mind?", position: { x: 50, y: 150 } },
    { id: "faq_end_after_greet", type: "end", label: "End Initial Greeting", position: { x: 50, y: 250 } } 
  ],
  edges: [
    { id: "efaq_s_g", source: "faq_start", target: "faq_greet" },
    { id: "efaq_g_e", source: "faq_greet", target: "faq_end_after_greet" }
  ]
};

export const generalPurposeAssistantFlow: AgentFlowDefinition = {
  flowId: "general-assistant-flow",
  name: "Simple General Assistant",
  description: "Greets, asks for issue, uses AI to respond, then asks if resolved.",
  nodes: [
    { id: "gpa_start", type: "start", label: "Start", position: { x: 50, y: 50 } },
    { id: "gpa_greet", type: "sendMessage", label: "Greet User", message: "Hi there! I'm your AI Assistant. How can I help you today?", position: { x: 50, y: 150 } },
    { id: "gpa_get_issue", type: "getUserInput", label: "Get User Issue", prompt: "What can I do for you?", variableName: "userIssue", position: { x: 50, y: 250 } },
    { id: "gpa_ai_response", type: "callLLM", label: "AI Responds", llmPrompt: "The user's issue is: {{userIssue}}. Please provide a helpful and concise response. If you have relevant trained knowledge, use it. If you're unsure, politely say you cannot help with that specific request.", outputVariable: "aiGeneratedResponse", useKnowledge: true, position: { x: 50, y: 350 } },
    { id: "gpa_send_ai_response", type: "sendMessage", label: "Send AI Answer", message: "{{aiGeneratedResponse}}", position: { x: 50, y: 450 } },
    { id: "gpa_ask_resolved", type: "sendMessage", label: "Ask if Resolved", message: "Did that help resolve your issue? (Yes/No)", position: { x: 50, y: 550 } },
    { id: "gpa_get_resolution_status", type: "getUserInput", label: "Get Resolution Status", prompt: "Please type Yes or No.", variableName: "resolutionStatus", position: { x: 50, y: 650 } },
    { id: "gpa_check_resolution", type: "condition", label: "Check Resolution", conditionVariable: "resolutionStatus", useLLMForDecision: true, position: { x: 50, y: 750 } },
    { id: "gpa_resolved_yes_msg", type: "sendMessage", label: "Issue Resolved Message", message: "Great! I'm glad I could help. Have a wonderful day!", position: { x: 250, y: 850 } },
    { id: "gpa_end_yes", type: "end", label: "End (Resolved)", position: { x: 250, y: 950 } },
    { id: "gpa_resolved_no_msg", type: "sendMessage", label: "Issue Not Resolved Message", message: "I'm sorry to hear that. Please try rephrasing your issue, or you can ask for help on a different topic.", position: { x: -150, y: 850 } },
    { id: "gpa_end_no", type: "end", label: "End (Not Resolved)", position: { x: -150, y: 950 } }
  ],
  edges: [
    { id: "egpa_s_g", source: "gpa_start", target: "gpa_greet" },
    { id: "egpa_g_gi", source: "gpa_greet", target: "gpa_get_issue" },
    { id: "egpa_gi_ar", source: "gpa_get_issue", target: "gpa_ai_response" },
    { id: "egpa_ar_sar", source: "gpa_ai_response", target: "gpa_send_ai_response" },
    { id: "egpa_sar_askr", source: "gpa_send_ai_response", target: "gpa_ask_resolved" },
    { id: "egpa_askr_grs", source: "gpa_ask_resolved", target: "gpa_get_resolution_status" },
    { id: "egpa_grs_cr", source: "gpa_get_resolution_status", target: "gpa_check_resolution" },
    { id: "egpa_cr_yes", source: "gpa_check_resolution", target: "gpa_resolved_yes_msg", condition: "Yes", label: "Yes" },
    { id: "egpa_rym_endy", source: "gpa_resolved_yes_msg", target: "gpa_end_yes" },
    { id: "egpa_cr_no_default", source: "gpa_check_resolution", target: "gpa_resolved_no_msg", condition: "", label: "No/Other (Default)", edgeType: "default" },
    { id: "egpa_rnm_endn", source: "gpa_resolved_no_msg", target: "gpa_end_no" }
  ]
};


const sampleFlows: Record<string, { name: string; flow: AgentFlowDefinition }> = {
  minimal: { name: "Minimal (Start, Greet, End)", flow: minimalInitialFlow },
  support: { name: "Simple Customer Support", flow: customerSupportFlow },
  faq: { name: "FAQ Agent (Minimal Greeting)", flow: faqFlowMinimal },
  general: { name: "Simple General Assistant", flow: generalPurposeAssistantFlow },
};


export default function AgentStudioPage() {
  const params = useParams();
  const { toast } = useToast();
  const { getAgent, updateAgentFlow, isLoadingAgents } = useAppContext();

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const [currentAgent, setCurrentAgent] = useState<Agent | null | undefined>(undefined);
  const [agentType, setAgentType] = useState<AgentType | undefined>(undefined);
  const [agentDirection, setAgentDirection] = useState<AgentDirection | undefined>(undefined);


  const [nodes, setNodes] = useState<VisualNode[]>([]);
  const [edges, setEdges] = useState<VisualEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string>("");

  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContentRef = useRef<HTMLDivElement>(null);
  const [draggingNodeInfo, setDraggingNodeInfo] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  const [edgeDragInfo, setEdgeDragInfo] = useState<{
    sourceNodeId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStartCoords, setPanStartCoords] = useState<{ x: number; y: number } | null>(null);

  const [isToolsPanelOpen, setIsToolsPanelOpen] = useState(true);
  const [isPropsPanelOpen, setIsPropsPanelOpen] = useState(true);


  const loadFlowToVisual = useCallback((flowDef: AgentFlowDefinition | undefined) => {
    const flowToLoad = flowDef && flowDef.nodes && flowDef.nodes.length > 0 ? flowDef : minimalInitialFlow;

    const loadedNodes: VisualNode[] = flowToLoad.nodes.map((jsonNode: JsonFlowNode) => ({
      ...jsonNode,
      type: jsonNode.type as FlowNodeType,
      label: jsonNode.label || NODE_DEFINITIONS.find(def => def.type === jsonNode.type)?.defaultProperties?.label || jsonNode.id,
      x: jsonNode.position?.x || Math.random() * 400,
      y: jsonNode.position?.y || Math.random() * 300,
      content: jsonNode.message || jsonNode.prompt || jsonNode.llmPrompt,
    }));
    const loadedEdges: VisualEdge[] = (flowToLoad.edges || []).map((jsonEdge: JsonFlowEdge) => ({
      ...jsonEdge,
      label: jsonEdge.label || jsonEdge.condition,
    }));
    setNodes(loadedNodes);
    setEdges(loadedEdges);
    setCanvasOffset({ x: 0, y: 0 });
    setSelectedNodeId(null); 
  }, []);

  useEffect(() => {
    if (!isLoadingAgents && agentId) {
      const agent = getAgent(agentId as string);
      setCurrentAgent(agent);
      if (agent) {
        setAgentType(agent.agentType);
        setAgentDirection(agent.direction);
        loadFlowToVisual(agent.flow);
      } else {
        setAgentType(undefined);
        setAgentDirection(undefined);
        loadFlowToVisual(undefined);
      }
    } else if (!isLoadingAgents && !agentId) {
      setCurrentAgent(null); 
      setAgentType(undefined);
      setAgentDirection(undefined);
      loadFlowToVisual(undefined); 
    }
  }, [agentId, getAgent, loadFlowToVisual, isLoadingAgents]);

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
    const viewportX = event.clientX - canvasBounds.left;
    const viewportY = event.clientY - canvasBounds.top;

    const virtualX = viewportX + canvasOffset.x;
    const virtualY = viewportY + canvasOffset.y;

    const nodeDef = NODE_DEFINITIONS.find(w => w.type === nodeType);
    const defaultLabel = nodeDef?.defaultProperties?.label || nodeDef?.paletteLabel || 'Node'; // Use paletteLabel
    const newNodeId = generateId(nodeType.replace(/\s+/g, '_').toLowerCase() + '_');

    const newNode: VisualNode = {
      id: newNodeId,
      type: nodeType,
      label: defaultLabel,
      x: Math.max(0, virtualX - 75), 
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
    const targetIsPort = (event.target as HTMLElement).dataset.port === 'out' || (event.target as HTMLElement).dataset.port === 'in';
    if (targetIsPort) {
        event.stopPropagation();
        return;
    }

    const node = nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const nodeElement = event.currentTarget;
    const nodeRect = nodeElement.getBoundingClientRect();

    const offsetX_viewport = event.clientX - nodeRect.left;
    const offsetY_viewport = event.clientY - nodeRect.top;

    setDraggingNodeInfo({ id: nodeId, offsetX: offsetX_viewport, offsetY: offsetY_viewport });
    setEdgeDragInfo(null);
    setSelectedNodeId(nodeId);
    event.stopPropagation();
  };

  const nodeWidth = 160; 
  const nodeHeight = 60; 

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === canvasRef.current || event.target === canvasContentRef.current ) {
        setIsPanning(true);
        setPanStartCoords({ x: event.clientX, y: event.clientY });
        setSelectedNodeId(null);
        if (edgeDragInfo) {
            setEdgeDragInfo(null);
        }
        event.preventDefault();
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
    if (edgeDragInfo && !(event.target as HTMLElement).dataset.port?.includes('in')) {
        const targetElement = event.target as HTMLElement;
        const isTargetInputPort = targetElement.dataset.port === 'in';
        const parentNodeIsTarget = targetElement.closest('[data-node-id]')?.dataset.port === 'in';

        if (!isTargetInputPort && !parentNodeIsTarget) {
             setEdgeDragInfo(null);
        }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === canvasRef.current || e.target === canvasContentRef.current) {
        setSelectedNodeId(null);
      }
  };

  const handlePortMouseDown = (event: React.MouseEvent, nodeId: string, portType: 'out') => {
    event.stopPropagation();
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode || portType !== 'out' || sourceNode.type === 'end') {
        if (sourceNode && sourceNode.type === 'end') {
            toast({title: "Invalid Start", description: "Cannot drag an edge from an 'End Conversation' step.", variant: "destructive"});
        }
        return;
    }

    if (!canvasRef.current || !canvasContentRef.current) return;
    setDraggingNodeInfo(null);

    const startX_virtual = sourceNode.x + nodeWidth;
    const startY_virtual = sourceNode.y + nodeHeight / 2;

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
        toast({title: "Invalid Connection", description: "Cannot connect to a 'Start Conversation' step's input.", variant:"destructive"});
        setEdgeDragInfo(null);
        return;
    }

    if (edgeDragInfo.sourceNodeId === targetNodeId) {
        toast({title: "Invalid Connection", description: "Cannot connect a step to itself.", variant:"destructive"});
        setEdgeDragInfo(null);
        return;
    }

    const existingEdge = edges.find(e => e.source === edgeDragInfo.sourceNodeId && e.target === targetNodeId);
    if (existingEdge) {
        toast({title: "Connection Exists", description: "A connection already exists between these steps."});
        setEdgeDragInfo(null);
        return;
    }

    const sourceNode = nodes.find(n=>n.id===edgeDragInfo.sourceNodeId);
    let defaultEdgeLabel = "";
    let defaultEdgeType: JsonFlowEdge['edgeType'] = 'default';

    if (sourceNode?.type === 'condition') { defaultEdgeLabel = "Outcome"; }
    else if (sourceNode?.type === 'qnaLookup') { defaultEdgeLabel = "Found Answer"; defaultEdgeType = "found"; }
    else if (sourceNode?.type === 'getUserInput') { defaultEdgeLabel = "User Responded"; }


    const newEdge: VisualEdge = {
        id: generateId('edge_'),
        source: edgeDragInfo.sourceNodeId,
        target: targetNodeId,
        label: defaultEdgeLabel,
        condition: sourceNode?.type === 'condition' ? defaultEdgeLabel : "",
        edgeType: defaultEdgeType,
    };
    setEdges((eds) => eds.concat(newEdge));
    toast({ title: "Connection Created!", description: `Connected '${sourceNode?.label || 'source step'}' to '${targetNode.label}'. Configure connection details in the 'Step Settings' panel.`});
    setEdgeDragInfo(null);
  };

  const updateSelectedNodeProperties = (updatedProps: Partial<VisualNode>) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => {
        if (n.id === selectedNodeId) {
            const newProps = {...n, ...updatedProps};
            // Sync content for nodes that use a primary text field
            if (updatedProps.message !== undefined) newProps.content = updatedProps.message;
            else if (updatedProps.prompt !== undefined) newProps.content = updatedProps.prompt;
            else if (updatedProps.llmPrompt !== undefined) newProps.content = updatedProps.llmPrompt;
            return newProps;
        }
        return n;
    }));
  };


  const updateEdgeProperty = (edgeId: string, updatedProps: Partial<VisualEdge>) => {
    setEdges(eds => eds.map(e => {
      if (e.id === edgeId) {
        const newEdge = {...e, ...updatedProps};
        const sourceNode = nodes.find(n => n.id === newEdge.source);
        // For 'condition' nodes, the edge label IS the condition value
        if (sourceNode?.type === 'condition' && updatedProps.label !== undefined) {
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

      mermaidStr += `  ${mermaidId}${shapeStart}${displayLabel} (${nodeDef?.paletteLabel || node.type})${shapeEnd};\n`;
    });
    edges.forEach(edge => {
      const sourceMermaidId = edge.source.replace(/[^a-zA-Z0-9_]/g, '_');
      const targetMermaidId = edge.target.replace(/[^a-zA-Z0-9_]/g, '_');
      const edgeLabelText = edge.label || edge.edgeType || "";
      const edgeLabel = edgeLabelText && edgeLabelText !== 'default' ? `|${edgeLabelText.replace(/"/g, '#quot;')}|` : '';
      mermaidStr += `  ${sourceMermaidId} -->${edgeLabel} ${targetMermaidId};\n`;
    });
    return mermaidStr;
  }, [nodes, edges]);

  const convertToAgentFlowDefinition = useCallback((): AgentFlowDefinition | null => {
    const hasStartNode = nodes.some(n => n.type === 'start');
    const hasEndNode = nodes.some(n => n.type === 'end');

    if (!hasStartNode && nodes.length > 0) {
        toast({ title: "Invalid Conversation Design", description: "A conversation must have at least one 'Start Conversation' step.", variant: "destructive"});
        return null;
    }
     if (!hasEndNode && nodes.length > 0) { 
        toast({ title: "Incomplete Conversation", description: "Your conversation design should ideally have at least one 'End Conversation' step to properly conclude paths.", variant: "default"});
    }
    
    for (const node of nodes) {
        const nodeDef = NODE_DEFINITIONS.find(d => d.type === node.type);
        if (!nodeDef) {
             toast({ title: "Invalid Step Type", description: `Step '${node.label}' has an unrecognized type '${node.type}'.`, variant: "destructive"});
            return null;
        }
        // Basic validation for key fields based on the simplified set
        if (node.type === 'callLLM' && (!node.llmPrompt || !node.outputVariable)) {
            toast({ title: "Incomplete Step Config", description: `Ask AI / Smart Response step '${node.label}' is missing an 'Instruction for AI' or 'Save AI Response As' variable.`, variant: "destructive"});
            return null;
        }
        if (node.type === 'getUserInput' && (!node.prompt || !node.variableName)) {
            toast({ title: "Incomplete Step Config", description: `Ask User & Save Answer step '${node.label}' is missing a 'Chatbot's Question' or 'Save User's Answer as' variable.`, variant: "destructive"});
            return null;
        }
         if (node.type === 'condition' && !node.conditionVariable) {
             toast({ title: "Incomplete Step Config", description: `Make a Decision step '${node.label}' is missing a 'Variable to Base Decision On'.`, variant: "destructive"});
            return null;
        }
         if (node.type === 'qnaLookup' && (!node.qnaQueryVariable || !node.qnaOutputVariable)) {
             toast({ title: "Incomplete Step Config", description: `Answer from Knowledge step '${node.label}' is missing 'User's Question (Variable)' or 'Save Found Answer As (Variable)'.`, variant: "destructive"});
            return null;
        }
    }


    function sanitizeNode(visualNode: VisualNode): JsonFlowNode {
        const output: Partial<JsonFlowNode> = { 
            id: visualNode.id,
            type: visualNode.type,
            label: visualNode.label || NODE_DEFINITIONS.find(def => def.type === visualNode.type)?.defaultProperties?.label || visualNode.id,
            position: { x: visualNode.x, y: visualNode.y },
        };

        if (visualNode.message !== undefined) output.message = visualNode.message;
        if (visualNode.prompt !== undefined) output.prompt = visualNode.prompt;
        if (visualNode.variableName !== undefined) output.variableName = visualNode.variableName;
        if (visualNode.llmPrompt !== undefined) output.llmPrompt = visualNode.llmPrompt;
        if (visualNode.outputVariable !== undefined) output.outputVariable = visualNode.outputVariable;
        if (visualNode.useKnowledge !== undefined) output.useKnowledge = visualNode.useKnowledge;
        if (visualNode.conditionVariable !== undefined) output.conditionVariable = visualNode.conditionVariable;
        if (visualNode.useLLMForDecision !== undefined) output.useLLMForDecision = visualNode.useLLMForDecision;
        if (visualNode.qnaQueryVariable !== undefined) output.qnaQueryVariable = visualNode.qnaQueryVariable;
        if (visualNode.qnaOutputVariable !== undefined) output.qnaOutputVariable = visualNode.qnaOutputVariable;
        if (visualNode.qnaFallbackText !== undefined) output.qnaFallbackText = visualNode.qnaFallbackText;
        if (visualNode.waitDurationMs !== undefined) output.waitDurationMs = visualNode.waitDurationMs;
        if (visualNode.endOutputVariable !== undefined) output.endOutputVariable = visualNode.endOutputVariable;
        
        return output as JsonFlowNode; 
    }

    function sanitizeEdge(edge: VisualEdge): JsonFlowEdge {
        const output: any = {
            id: edge.id, source: edge.source, target: edge.target,
        };
        if (edge.label !== undefined && edge.label !== null && edge.label.trim() !== "") output.label = edge.label;
        if (edge.condition !== undefined && edge.condition !== null && edge.condition.trim() !== "") output.condition = edge.condition;
        if (edge.edgeType !== undefined && edge.edgeType !== null) output.edgeType = edge.edgeType;
        return output as JsonFlowEdge;
    }

    const jsonNodes: JsonFlowNode[] = nodes.map(sanitizeNode);
    const jsonEdges: JsonFlowEdge[] = edges.map(sanitizeEdge);

    const flowId = currentAgent?.flow?.flowId || generateId('flow_');
    const flowName = currentAgent?.flow?.name || "My Visual Flow";
    const flowDescription = currentAgent?.flow?.description || "A flow created with the visual editor.";

    return { flowId, name: flowName, description: flowDescription, nodes: jsonNodes, edges: jsonEdges };
  }, [nodes, edges, currentAgent, toast]);

  const handleSaveFlow = useCallback(() => {
    if (!currentAgent) {
      toast({ title: "Chatbot Not Found", description: "Cannot save conversation as current chatbot is not loaded.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    setMermaidCode(convertToMermaid());

    try {
      const agentFlowDef = convertToAgentFlowDefinition();
      if (!agentFlowDef) {
        setIsSaving(false); 
        return;
      }
      updateAgentFlow(currentAgent.id, agentFlowDef);
      toast({ title: "Conversation Saved!", description: `Conversation design for chatbot "${currentAgent.generatedName || currentAgent.name}" has been updated.` });
    } catch (error: any) {
      console.error("Error saving conversation:", error);
      toast({ title: "Save Error", description: error.message || "Could not save the conversation design due to an unexpected error.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [currentAgent, convertToMermaid, convertToAgentFlowDefinition, updateAgentFlow, toast]);

 const handleLoadSampleFlow = (flowKey: string) => {
    const selectedSample = sampleFlows[flowKey];
    if (selectedSample) {
      loadFlowToVisual(selectedSample.flow);
      toast({ title: "Sample Conversation Loaded", description: `"${selectedSample.name}" loaded. Adapt it for your client's needs!` });
    } else {
      toast({ title: "Error", description: "Could not load the selected sample conversation.", variant: "destructive" });
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

  if (isLoadingAgents || (currentAgent === undefined && agentId) ) {
    return (
        <Card>
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className={cn("font-headline text-xl sm:text-2xl", "text-gradient-dynamic")}>Design Chatbot Conversation</CardTitle>
                 <CardDescription className="text-sm">Loading conversation designer...</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] p-4 sm:p-6">
                <Logo className="mb-3 h-8" />
                <Loader2 className="h-8 w-8 sm:h-10 sm:h-10 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground mt-2">Initializing conversation studio...</p>
            </CardContent>
        </Card>
    );
  }
  if (!currentAgent && agentId) { 
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Chatbot Not Found</AlertTitle>
            <AlertDescription>The chatbot for studio (ID: {agentId}) could not be loaded. Please select a valid chatbot.</AlertDescription>
        </Alert>
    );
  }
  if (!currentAgent && !agentId) { 
     return (
        <Alert variant="default">
             <Info className="h-4 w-4" />
            <AlertTitle>No Chatbot Selected</AlertTitle>
            <AlertDescription>Please select a chatbot from the dashboard to design its conversation.</AlertDescription>
        </Alert>
    );
  }


  const portSize = 8; 

  return (
    <TooltipProvider>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-4 h-[calc(100vh-220px)] sm:h-[calc(100vh-200px)]">
      
      <Button 
        variant="outline" 
        size="icon" 
        className="lg:hidden fixed top-[calc(4rem+0.5rem)] left-2 z-20 h-8 w-8 sm:h-9 sm:w-9"
        onClick={() => setIsToolsPanelOpen(!isToolsPanelOpen)}
        aria-label={isToolsPanelOpen ? "Close Tools Panel" : "Open Tools Panel"}
      >
        {isToolsPanelOpen ? <PanelLeft size={18}/> : <PanelRight size={18}/>}
      </Button>

      <Button 
        variant="outline" 
        size="icon" 
        className="lg:hidden fixed top-[calc(4rem+0.5rem)] right-2 z-20 h-8 w-8 sm:h-9 sm:w-9"
        onClick={() => setIsPropsPanelOpen(!isPropsPanelOpen)}
        aria-label={isPropsPanelOpen ? "Close Properties Panel" : "Open Properties Panel"}
      >
        {isPropsPanelOpen ? <PanelRight size={18}/> : <PanelLeft size={18}/>}
      </Button>

      <Card className={cn(
          "h-full flex-col",
          "lg:col-span-2 lg:flex",
          isToolsPanelOpen ? "col-span-12 flex order-1 lg:order-none max-h-[40vh] lg:max-h-full" : "hidden"
      )}>
        <CardHeader className="pb-1 sm:pb-2 pt-3 sm:pt-4 px-2 sm:px-3">
          <CardTitle className={cn("text-base sm:text-lg", "text-gradient-dynamic")}>Chatbot Building Blocks</CardTitle>
          <CardDescription className="text-xs">Drag these onto the canvas. Current Agent: {agentType}, {agentDirection}</CardDescription>
        </CardHeader>
        <ScrollArea className="flex-grow">
        <CardContent className="space-y-1.5 sm:space-y-2 p-2 sm:p-3">
          {NODE_DEFINITIONS.map(def => (
            <Tooltip key={def.type}>
              <TooltipTrigger asChild>
                <div
                  draggable
                  onDragStart={(e) => handleDragStartWidget(e, def.type)}
                  className="p-1.5 sm:p-2 border rounded-md cursor-grab flex items-center gap-1.5 sm:gap-2 hover:bg-muted active:cursor-grabbing transition-colors"
                >
                  <def.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0"/>
                  <span className="text-xs sm:text-sm flex-1 min-w-0 break-words">{def.paletteLabel}</span> {/* Use paletteLabel */}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="start" className="max-w-xs z-[60]">
                <p className="font-semibold">{def.paletteLabel}</p> {/* Use paletteLabel */}
                <p className="text-xs text-muted-foreground">{def.docs.purpose}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </CardContent>
        </ScrollArea>
         <CardFooter className="p-2 sm:p-3 border-t mt-auto">
            <div className="w-full space-y-1.5">
                <Label htmlFor="sampleFlowSelect" className="text-xs text-muted-foreground">Load Sample Conversation Design:</Label>
                <Select onValueChange={handleLoadSampleFlow}>
                  <SelectTrigger id="sampleFlowSelect" className="h-8 sm:h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Select a sample..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(sampleFlows).map(([key, { name }]) => (
                      <SelectItem key={key} value={key} className="text-xs sm:text-sm">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
        </CardFooter>
      </Card>

      <Card
        className={cn(
            "h-full relative overflow-hidden bg-muted/20 border-dashed border-input cursor-grab",
            "lg:col-span-7",
            isToolsPanelOpen || isPropsPanelOpen ? "col-span-12 order-2 lg:order-none min-h-[250px] sm:min-h-[300px]" : "col-span-12 order-1 lg:order-none" 
        )}
        ref={canvasRef}
        onDrop={handleDropOnCanvas}
        onDragOver={handleDragOverCanvas}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onClick={handleCanvasClick}
      >
        <div
            ref={canvasContentRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none" 
            style={{ transform: `translate(${-canvasOffset.x}px, ${-canvasOffset.y}px)` }}
        >
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none"> 
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
                const arrowLength = 6; 
                const arrowPoint1X = x2 - arrowLength * Math.cos(angle - Math.PI / 6);
                const arrowPoint1Y = y2 - arrowLength * Math.sin(angle - Math.PI / 6);
                const arrowPoint2X = x2 - arrowLength * Math.cos(angle + Math.PI / 6);
                const arrowPoint2Y = y2 - arrowLength * Math.sin(angle + Math.PI / 6);

                return (
                <g key={edge.id} className="group/edge">
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--primary)/0.5)" strokeWidth="1.5" className="group-hover/edge:stroke-primary transition-colors" />
                    <polygon points={`${x2},${y2} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`} fill="hsl(var(--primary)/0.5)" className="group-hover/edge:fill-primary transition-colors"/>
                    {(edge.label || (edge.edgeType && edge.edgeType !== 'default')) && (
                    <text x={midX} y={midY - 4} fill="hsl(var(--foreground))" fontSize="9px" textAnchor="middle" className="pointer-events-none select-none bg-background/50 px-1 rounded">
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
                        strokeDasharray="3 1.5" 
                    />
                )}
            </svg>

            {nodes.map(node => (
            <div
                key={node.id}
                data-node-id={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                className="absolute p-1.5 border rounded bg-card shadow cursor-grab select-none flex flex-col justify-center group/node pointer-events-auto"
                style={{
                    left: node.x,
                    top: node.y,
                    width: `${nodeWidth}px`,
                    height: `${nodeHeight}px`,
                    borderColor: selectedNodeId === node.id ? 'hsl(var(--ring))' : 'hsl(var(--border))',
                    boxShadow: selectedNodeId === node.id ? '0 0 0 1.5px hsl(var(--ring))' : '0 1px 2px rgba(0,0,0,0.1)', 
                    zIndex: draggingNodeInfo?.id === node.id || edgeDragInfo?.sourceNodeId === node.id ? 10 : 1,
                }}
            >
                {node.type !== 'start' && (
                    <div
                        data-port="in"
                        onMouseUp={(e) => handlePortMouseUp(e, node.id, 'in')}
                        title={`Connect to ${node.label}`}
                        className="absolute -left-[5px] top-1/2 -translate-y-1/2 cursor-crosshair pointer-events-auto bg-background rounded-full" 
                        style={{width: `${portSize+2}px`, height: `${portSize+2}px`, display:'flex', alignItems:'center', justifyContent:'center'}}
                    >
                    <div className="w-1.5 h-1.5 bg-primary/70 rounded-full border border-background ring-1 ring-primary/70 group-hover/node:bg-primary group-hover/node:ring-primary transition-all"/> 
                    </div>
                )}

                <div className="flex items-center gap-1 mb-0.5 w-full">
                    {(() => {
                        const WidgetIcon = NODE_DEFINITIONS.find(w=>w.type === node.type)?.icon;
                        return WidgetIcon ? <WidgetIcon className="w-3 h-3 text-primary shrink-0" /> : <GripVertical className="w-3 h-3 text-muted-foreground shrink-0"/>;
                    })()}
                     <span className="text-[11px] font-medium flex-1 min-w-0 truncate" title={node.label}>{node.label}</span>
                </div>
                <p className="text-[9px] text-muted-foreground w-full truncate" title={node.content || node.variableName || node.type}>
                { node.type === 'sendMessage' ? (node.message || '...') :
                    node.type === 'getUserInput' ? (node.variableName ? `Var: ${node.variableName}`: '...') :
                    node.type === 'callLLM' ? (node.outputVariable ? `Out: ${node.outputVariable}`: '...') :
                    node.type === 'condition' ? (node.conditionVariable ? `If: ${node.conditionVariable}`: '...') :
                    node.type === 'qnaLookup' ? (node.qnaOutputVariable || 'Q&A') :
                    node.type === 'wait' ? `${node.waitDurationMs || 0}ms Wait` :
                    NODE_DEFINITIONS.find(d=>d.type === node.type)?.paletteLabel || node.type // Use paletteLabel
                }
                </p>

                {node.type !== 'end' && (
                    <div
                        data-port="out"
                        onMouseDown={(e) => handlePortMouseDown(e, node.id, 'out')}
                        title={`Connect from ${node.label}`}
                        className="absolute -right-[5px] top-1/2 -translate-y-1/2 cursor-crosshair pointer-events-auto bg-background rounded-full" 
                        style={{width: `${portSize+2}px`, height: `${portSize+2}px`, display:'flex', alignItems:'center', justifyContent:'center'}}
                    >
                        <div className="w-1.5 h-1.5 bg-primary/70 rounded-full border border-background ring-1 ring-primary/70 group-hover/node:bg-primary group-hover/node:ring-primary transition-all"/> 
                    </div>
                )}
            </div>
            ))}
        </div>
      </Card>

      <Card className={cn(
          "h-full flex-col",
          "lg:col-span-3 lg:flex",
          isPropsPanelOpen ? "col-span-12 flex order-3 lg:order-none max-h-[40vh] lg:max-h-full" : "hidden"
      )}>
        <CardHeader className="pb-1 sm:pb-2 pt-3 sm:pt-4 px-2 sm:px-3">
          <CardTitle className={cn("text-base sm:text-lg flex items-center gap-1.5 sm:gap-2", "text-gradient-dynamic")}>
            <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            {selectedNodeDetails ? `Configure Step: ${selectedNodeDetails.label}` : "Step Guide"}
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-grow">
        <CardContent className="p-2 sm:p-3 space-y-2 sm:space-y-3 text-xs sm:text-sm">
          {selectedNodeDetails ? (
            <>
              <div className="space-y-2 sm:space-y-3 p-1.5 sm:p-2 border rounded-md bg-background">
                <h3 className="font-semibold text-sm sm:text-base mb-1">Properties</h3>
                <div>
                  <Label htmlFor="nodeLabel" className="text-[10px] sm:text-xs">Step Label (ID: {selectedNodeDetails.id})</Label>
                  <Input id="nodeLabel" value={selectedNodeDetails.label} onChange={e => updateSelectedNodeProperties({ label: e.target.value })} className="h-7 sm:h-8 text-xs sm:text-sm"/>
                </div>

                { selectedNodeDetails.type === 'sendMessage' && (
                  <div>
                    <Label htmlFor="nodeMessage" className="text-[10px] sm:text-xs">Message Text (What the chatbot says)</Label>
                    <Textarea id="nodeMessage" value={selectedNodeDetails.message || ""} onChange={e => updateSelectedNodeProperties({ message: e.target.value })} rows={3} className="text-xs sm:text-sm" placeholder="e.g., Hello {{userName}}! Welcome."/>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Use `{{variableName}}` to insert saved answers.</p>
                  </div>
                )}
                 { selectedNodeDetails.type === 'getUserInput' && (
                  <>
                    <div>
                        <Label htmlFor="nodePrompt" className="text-[10px] sm:text-xs">Chatbot's Question for User</Label>
                        <Textarea id="nodePrompt" value={selectedNodeDetails.prompt || ""} onChange={e => updateSelectedNodeProperties({ prompt: e.target.value })} rows={3} className="text-xs sm:text-sm" placeholder="e.g., What is your email address?"/>
                    </div>
                    <div>
                        <Label htmlFor="nodeVariable" className="text-[10px] sm:text-xs">Save User's Answer as (Variable Name)</Label>
                        <Input id="nodeVariable" value={selectedNodeDetails.variableName || ""} onChange={e => updateSelectedNodeProperties({ variableName: e.target.value })}  className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., userEmail (no spaces)"/>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Use this name like `{{userEmail}}` in other steps.</p>
                    </div>
                  </>
                )}
                { selectedNodeDetails.type === 'callLLM' && (
                  <>
                    <div>
                        <Label htmlFor="llmPrompt" className="text-[10px] sm:text-xs">Instruction for AI (Prompt)</Label>
                        <Textarea id="llmPrompt" value={selectedNodeDetails.llmPrompt || ""} onChange={e => updateSelectedNodeProperties({ llmPrompt: e.target.value })} rows={4} className="text-xs sm:text-sm" placeholder="e.g., User said: {{userInputVar}}. Summarize it."/>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Use `{{variable}}` for context. E.g., `{{conversationHistory}}` for chat log.</p>
                    </div>
                    <div>
                        <Label htmlFor="llmOutputVar" className="text-[10px] sm:text-xs">Save AI's Response as (Variable Name)</Label>
                        <Input id="llmOutputVar" value={selectedNodeDetails.outputVariable || ""} onChange={e => updateSelectedNodeProperties({ outputVariable: e.target.value })}  className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., aiSummary (no spaces)"/>
                    </div>
                    <div className="flex items-center space-x-1.5 pt-1">
                        <Checkbox id="useKnowledge" checked={!!selectedNodeDetails.useKnowledge} onCheckedChange={(checked) => updateSelectedNodeProperties({ useKnowledge: !!checked })}/>
                        <Label htmlFor="useKnowledge" className="text-[10px] sm:text-xs font-normal cursor-pointer">Allow AI to use Trained Knowledge (from 'Knowledge' tab)</Label>
                    </div>
                  </>
                )}
                { selectedNodeDetails.type === 'condition' && (
                   <>
                    <div>
                        <Label htmlFor="conditionVar" className="text-[10px] sm:text-xs">Variable to Base Decision On</Label>
                        <Input id="conditionVar" value={selectedNodeDetails.conditionVariable || ""} onChange={e => updateSelectedNodeProperties({ conditionVariable: e.target.value })}  className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., userChoice (from 'Ask User')"/>
                        <p className="text-[10px] text-muted-foreground mt-0.5">This variable's value will be checked.</p>
                    </div>
                    <div className="flex items-center space-x-1.5 pt-1">
                        <Checkbox id="useLLMForDecision" checked={!!selectedNodeDetails.useLLMForDecision} onCheckedChange={(checked) => updateSelectedNodeProperties({ useLLMForDecision: !!checked })}/>
                        <Label htmlFor="useLLMForDecision" className="text-[10px] sm:text-xs font-normal cursor-pointer">Use AI to Match User Intent for Decision</Label>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Configure decision outcomes on the connecting arrows/edges.</p>
                   </>
                )}
                { selectedNodeDetails.type === 'qnaLookup' && (
                  <>
                    <div>
                        <Label htmlFor="qnaQueryVar" className="text-[10px] sm:text-xs">User's Question (Variable)</Label>
                        <Input id="qnaQueryVar" value={selectedNodeDetails.qnaQueryVariable || ""} onChange={e => updateSelectedNodeProperties({ qnaQueryVariable: e.target.value })} className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., {{lastUserMessage}} or {{userQuery}}"/>
                        <p className="text-[10px] text-muted-foreground mt-0.5">The variable containing text to search for.</p>
                    </div>
                    <div>
                        <Label htmlFor="qnaOutputVar" className="text-[10px] sm:text-xs">Save Found Answer as (Variable)</Label>
                        <Input id="qnaOutputVar" value={selectedNodeDetails.qnaOutputVariable || ""} onChange={e => updateSelectedNodeProperties({ qnaOutputVariable: e.target.value })} className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., knowledgeBaseAnswer"/>
                    </div>
                    <div>
                        <Label htmlFor="qnaFallback" className="text-[10px] sm:text-xs">Message if No Answer Found</Label>
                        <Textarea id="qnaFallback" value={selectedNodeDetails.qnaFallbackText || ""} onChange={e => updateSelectedNodeProperties({ qnaFallbackText: e.target.value })} rows={2} className="text-xs sm:text-sm" placeholder="e.g., Sorry, I don't have that information."/>
                    </div>
                     <p className="text-[10px] text-muted-foreground mt-0.5">Connect 'Found' and 'Not Found' paths using edge types.</p>
                  </>
                )}
                 { selectedNodeDetails.type === 'wait' && (
                  <div><Label htmlFor="waitDuration" className="text-[10px] sm:text-xs">Delay Duration (milliseconds)</Label><Input id="waitDuration" type="number" value={selectedNodeDetails.waitDurationMs || 1000} onChange={e => updateSelectedNodeProperties({ waitDurationMs: parseInt(e.target.value) || 0 })} className="h-7 sm:h-8 text-xs sm:text-sm"/><p className="text-[10px] text-muted-foreground mt-0.5">1000ms = 1 second.</p></div>
                )}
                 { selectedNodeDetails.type === 'end' && (
                  <div>
                    <Label htmlFor="endOutputVar" className="text-[10px] sm:text-xs">Final Message Variable (Optional)</Label>
                    <Input id="endOutputVar" value={selectedNodeDetails.endOutputVariable || ""} onChange={e => updateSelectedNodeProperties({ endOutputVariable: e.target.value })} className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., {{finalSummary}}"/>
                    <p className="text-[10px] text-muted-foreground mt-0.5">If set, the value of this variable will be sent as a final message.</p>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => deleteNode(selectedNodeDetails.id)} className="text-destructive border-destructive hover:bg-destructive/10 w-full mt-2 h-8 text-xs sm:text-sm">
                  <Trash2 className="mr-2 h-3 w-3" /> Delete Step
                </Button>
                <hr className="my-2 sm:my-3"/>
                <Label className="text-[10px] sm:text-xs text-muted-foreground block mb-1">Connections from this Step:</Label>
                {edges.filter(e => e.source === selectedNodeDetails.id).length === 0 && <p className="text-[10px] sm:text-xs text-muted-foreground italic">No outgoing connections. Drag from this step's right port to another step's left port.</p>}
                {edges.filter(e => e.source === selectedNodeDetails.id).map(edge => (
                  <div key={edge.id} className="text-[10px] sm:text-xs space-y-1 border p-1.5 rounded mb-1 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="truncate" title={`To: ${nodes.find(n=>n.id===edge.target)?.label || edge.target}`}>To: {nodes.find(n=>n.id===edge.target)?.label || edge.target}</span>
                      <Button variant="ghost" size="icon" onClick={() => deleteEdge(edge.id)} className="h-5 w-5 shrink-0"><Trash2 className="h-3 w-3 text-destructive"/></Button>
                    </div>
                    {(selectedNodeDetails.type === 'condition') && ( // Only show explicit condition input for 'condition' node edges
                        <div>
                            <Label htmlFor={`edgeLabel-${edge.id}`} className="text-[9px] sm:text-[10px]">{selectedNodeDetails.type === 'condition' ? 'Decision Outcome / User Input Value (or AI Intent Label)' : 'Connection Label (Optional)'}</Label>
                            <Input id={`edgeLabel-${edge.id}`} placeholder={ selectedNodeDetails.type === 'condition' ? "e.g., 'Yes', 'Product A', or Intent Name" : "e.g., Next step after XYZ"} value={edge.label || ""} onChange={e => updateEdgeProperty(edge.id, { label: e.target.value, condition: e.target.value })} className="h-6 sm:h-7 text-[10px] sm:text-xs mt-0.5"/>
                            {edge.label?.trim() === "" && selectedNodeDetails.type === 'condition' && <p className="text-[9px] text-muted-foreground mt-0.5">Empty value makes this the 'Default / Other' path.</p>}
                        </div>
                    )}
                     {(selectedNodeDetails.type === 'qnaLookup' || selectedNodeDetails.type === 'getUserInput' ) && ( // Edge types for qnaLookup and potentially future getUserInput validation paths
                        <div>
                          <Label htmlFor={`edgeType-${edge.id}`} className="text-[9px] sm:text-[10px]">Connection Type (Path Logic)</Label>
                           <Select value={edge.edgeType || 'default'} onValueChange={value => updateEdgeProperty(edge.id, { edgeType: value as JsonFlowEdge['edgeType'] })}>
                                <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default" className="text-xs sm:text-sm">Default / Next Step</SelectItem>
                                    {selectedNodeDetails.type === 'getUserInput' && <>
                                      {/* <SelectItem value="invalid" className="text-xs sm:text-sm">If User Input is Invalid (Future)</SelectItem> */}
                                    </>}
                                    {selectedNodeDetails.type === 'qnaLookup' && <>
                                       <SelectItem value="found" className="text-xs sm:text-sm">If Answer Found in Knowledge</SelectItem>
                                       <SelectItem value="notFound" className="text-xs sm:text-sm">If Answer Not Found</SelectItem>
                                    </>}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                  </div>
                ))}
              </div>
              {selectedNodeDefinition && (
                <Accordion type="single" collapsible className="w-full mt-3">
                  <AccordionItem value="docs">
                     <AccordionTrigger className="text-sm sm:text-base hover:no-underline py-2 sm:py-3">
                        <Tooltip>
                            <TooltipTrigger asChild><Info className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary"/></TooltipTrigger>
                            <TooltipContent side="top" className="z-[60] max-w-xs"><p>Guide for the <strong>{selectedNodeDefinition.paletteLabel}</strong> step.</p></TooltipContent>
                        </Tooltip>
                       How to use: {selectedNodeDefinition.paletteLabel}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1.5 text-[10px] sm:text-xs p-1.5 sm:p-2 border-t bg-muted/30 rounded-b-md">
                      <div><strong className="block text-primary">What it does:</strong> {selectedNodeDefinition.docs.purpose}</div>
                      <div><strong className="block text-primary">Key Settings:</strong> <span className="whitespace-pre-line">{selectedNodeDefinition.docs.keySettings}</span></div>
                      <div><strong className="block text-primary">Connecting it:</strong> {selectedNodeDefinition.docs.connectingIt}</div>
                      <div><strong className="block text-primary">Important Tips:</strong> {selectedNodeDefinition.docs.importantTips}</div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </>
          ) : (
            <div className="text-left py-2 space-y-3">
                <div className="flex items-center gap-2">
                   <MousePointer className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground"/>
                   <p className="text-xs sm:text-sm text-muted-foreground">Select a step on the canvas to configure it. Drag the canvas background to pan around.</p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="wiring-practices">
                     <AccordionTrigger className="text-sm sm:text-base hover:no-underline py-2 sm:py-3">
                       <Tooltip>
                        <TooltipTrigger asChild><Sigma className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary"/></TooltipTrigger>
                        <TooltipContent side="top" className="z-[60]"><p>General Conversation Design Guide</p></TooltipContent>
                      </Tooltip>
                      {WIRING_BEST_PRACTICES_DOCS.title}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1 text-[10px] sm:text-xs p-1.5 sm:p-2 border-t bg-muted/30 rounded-b-md">
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
         <CardFooter className="p-2 sm:p-3 border-t mt-auto space-y-1.5 sm:space-y-2 flex-col items-stretch">
             {mermaidCode && (
                <details className="w-full">
                  <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">View Technical Diagram (Mermaid Code)</summary>
                  <ScrollArea className="h-[80px] sm:h-[100px] bg-muted/50 p-1.5 rounded mt-1">
                    <pre className="text-[9px] sm:text-[10px] whitespace-pre-wrap">{mermaidCode}</pre>
                  </ScrollArea>
                </details>
              )}
          <Button onClick={handleSaveFlow} disabled={isSaving} className={cn("w-full h-8 sm:h-9 text-xs sm:text-sm", "btn-gradient-primary")}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Conversation Design
          </Button>
        </CardFooter>
      </Card>
    </div>
    </TooltipProvider>
  );
}

