
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "../../../layout";
import type { Agent, AgentFlowDefinition, FlowNode as JsonFlowNode, FlowEdge as JsonFlowEdge } from "@/lib/types";
import { Loader2, Save, AlertTriangle, Trash2, MousePointer, ArrowRight, MessageSquare, Zap, HelpCircle, Play, ChevronsUpDown, Settings2, Link2, Cog, BookOpen, Bot as BotIcon, Share2, Network, SlidersHorizontal, FileCode, MessageCircleQuestion, Timer, ArrowRightLeft, Users, BrainCircuit, StopCircle, Info, Sigma, GripVertical, Library, PanelLeft, PanelRight, FileQuestion } from "lucide-react";
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

interface VisualNode extends Omit<JsonFlowNode, 'type' | 'position' | 'message' | 'prompt' | 'llmPrompt' | 'outputVariable' | 'conditionVariable' | 'actionInputArgs' | 'transitionVariablesToPass' | 'codeReturnVarMap' | 'qnaKnowledgeBaseId' | 'qnaThreshold' | 'waitDurationMs' | 'transitionTargetNodeId' | 'agentContextWindow'> {
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
  conditionVariable?: string;
  useLLMForDecision?: boolean;
  useKnowledge?: boolean;
  actionName?: string;
  actionInputArgs?: Record<string, any> | string;
  actionOutputVarMap?: Record<string, string> | string;
  apiUrl?: string;
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  apiHeaders?: Record<string, string> | string;
  apiBodyVariable?: string;
  apiOutputVariable?: string;
  codeScript?: string;
  codeReturnVarMap?: Record<string, string> | string;
  qnaKnowledgeBaseId?: string;
  qnaQueryVariable?: string;
  qnaFallbackText?: string;
  qnaOutputVariable?: string;
  qnaThreshold?: number;
  waitDurationMs?: number;
  transitionTargetFlowId?: string;
  transitionVariablesToPass?: Record<string, any> | string;
  agentSkillId?: string;
  agentSkillsList?: string[];
  endOutputVariable?: string;
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
  { type: 'start', label: 'Start Conversation', icon: Play, defaultProperties: { label: "Start" }, docs: { purpose: "Marks the beginning of the chatbot's conversation path.", settings: "No settings for this step.", edges: "Connect this to the first step your chatbot should take (e.g., 'Send a Message').", rules: "Every conversation design needs one 'Start Conversation' step."} },
  { type: 'sendMessage', label: 'Send a Message', icon: MessageSquare, defaultProperties: { label: "Send Message", message: "Hello! How can I help you today?" }, docs: { purpose: "Makes the chatbot send a specific message to the user.", settings: "Write the chatbot's message in 'Message Text'. You can use {{variables}} from user inputs or AI responses (e.g., {{userName}}).", edges: "Connects to the next step after the message is sent.", rules: "Keep messages clear, concise, and helpful for the user." } },
  { type: 'getUserInput', label: 'Ask a Question', icon: HelpCircle, defaultProperties: { label: "Ask Question", prompt: "What's your name?", variableName: "userName" }, docs: { purpose: "Asks the user a question and saves their answer to use later.", settings: "Write the chatbot's question in 'Chatbot's Question'. Choose a 'Save User's Answer as (Variable Name)' (e.g., 'userName' or 'userEmail'). This name is how you'll refer to the user's answer in other steps.", edges: "Connects to what happens after the user answers. You can optionally define a separate path if the user's input is considered 'invalid' (not yet implemented).", rules: "Make variable names unique and descriptive (e.g., 'customerOrderNumber' instead of just 'order')." } },
  { type: 'callLLM', label: 'Smart Response (AI)', icon: Zap, defaultProperties: { label: "Smart Response", llmPrompt: "User said: {{userInputVar}}. Respond intelligently to help them.", outputVariable: "aiResponse", useKnowledge: false }, docs: { purpose: "Uses AI (like Gemini) to understand context and generate human-like responses or make decisions. This is where the 'magic' happens!", settings: "Write a clear 'Instruction for AI' in the prompt field (e.g., 'Based on {{userInquiry}}, what product would you recommend?'). Check 'Allow AI to use Trained Knowledge' to let the AI access data you've uploaded from documents or websites. Save the AI's answer in 'Save AI Response As (Variable Name)' (e.g., 'aiRecommendation'). Tip: Tell the AI how to respond if it's unsure, e.g., 'If you don't know, say: I can't find that specific information.'", edges: "Connects to the next step after the AI generates its response.", rules: "Clear, specific instructions result in better AI responses. Using AI will consume processing credits (if applicable in the future)." } },
  { type: 'condition', label: 'Make a Decision', icon: ChevronsUpDown, defaultProperties: { label: "Decision Point", conditionVariable: "userChoice", useLLMForDecision: false }, docs: { purpose: "Changes the conversation path based on a user's answer or a previously saved variable.", settings: "In 'Variable to Base Decision On', enter the variable name (e.g., 'userChoice'). Then, for each outgoing connection (edge) from this step, set its 'Decision Outcome / User Input Value' to match a possible value of that variable (e.g., 'Yes', 'No', 'Option A'). If 'Use AI to Understand User's Intent' is checked, the AI will try to match the variable's value to the edge labels even if it's not an exact match.", edges: "Create one connection for each possible choice or outcome. Always have a 'Default / Other' connection for unexpected values.", rules: "Ensure all decision paths lead to another step or end the conversation appropriately." } },
  { type: 'qnaLookup', label: 'Answer from Knowledge', icon: FileQuestion, defaultProperties: { label: "Answer from Knowledge", qnaQueryVariable: "userQuery", qnaOutputVariable: "knowledgeAnswer", qnaFallbackText: "I'm not sure about that based on my current training. Could you ask in a different way?" }, docs: { purpose: "Searches the chatbot's 'Trained Knowledge' (from your uploaded documents/websites) to directly answer user questions.", settings: "In 'User's Question (Variable)', specify where to get the user's query (e.g., `{{lastUserMessage}}` or a variable where you stored their question). The found answer is saved in 'Save Found Answer As (Variable)'. 'Message if No Answer Found' is shown if the trained data doesn't have a good match.", edges: "Connect one path for 'If Answer Found' and another for 'If Answer Not Found'.", rules: "Ensure your chatbot is trained with relevant business data on the 'Knowledge' page for this step to be effective." } },
  { type: 'end', label: 'End Conversation', icon: StopCircle, defaultProperties: { label: "End"}, docs: { purpose: "Marks the end of this particular path or the entire conversation.", settings: "No specific settings, unless you want to output a final variable from the context (advanced).", edges: "This step should not have any outgoing connections.", rules: "Ensure all conversation paths can eventually reach an 'End Conversation' step or loop back appropriately." } },
  { type: 'action', label: 'Run Action (Advanced)', icon: SlidersHorizontal, defaultProperties: { label: "Custom Action", actionName: "myCustomAction" }, docs: { purpose: "(Advanced) Triggers a pre-defined custom action or function (e.g., update a database, send an email). Requires developer setup outside of AutoBoss.", settings: "Define the 'Action Name' and any 'Input Arguments' it needs (as JSON).", edges: "Connects to the next step after the action is (conceptually) run.", rules: "Actions are placeholders in this visual builder and need separate coding by a developer to actually function." } },
  { type: 'apiCall', label: 'Connect to External Tool (Advanced)', icon: Network, defaultProperties: { label: "HTTP Request", apiUrl: "https://api.example.com/data", apiMethod: 'GET' }, docs: { purpose: "(Advanced) Connects to external services or databases via API (e.g., get weather, stock prices, client CRM data). Requires technical understanding of APIs.", settings: "Provide the 'API URL', choose the 'Method' (GET/POST etc.), and add 'Headers' (as JSON, e.g. for authentication tokens).", edges: "Typically has paths for 'On Success' and 'On Error'.", rules: "APIs can be complex. This step simulates an API call during testing; actual integration may need developer assistance." } },
  { type: 'code', label: 'Custom Code (Advanced)', icon: FileCode, defaultProperties: { label: "JS Code", codeScript: "// Your JavaScript code here\n// return { myResult: 'value' };" }, docs: { purpose: "(Advanced) Executes a small piece of JavaScript code for custom logic or data manipulation. Use with extreme caution.", settings: "Write your JavaScript in 'JavaScript Code'. You can map returned object keys to context variables.", edges: "Connects to the next step.", rules: "This step simulates code execution during testing. Incorrect code can break the flow. Requires JavaScript knowledge." } },
  { type: 'wait', label: 'Add Delay', icon: Timer, defaultProperties: { label: "Wait", waitDurationMs: 1000 }, docs: { purpose: "Pauses the conversation for a short time, for example, to simulate the chatbot 'thinking' or 'typing'.", settings: "Set the 'Delay Duration (ms)' (1000ms = 1 second).", edges: "Connects to the next step after the delay.", rules: "Use short delays to avoid making the user wait too long." } },
  { type: 'transition', label: 'Go to Another Flow (Advanced)', icon: ArrowRightLeft, defaultProperties: { label: "Transition", transitionTargetFlowId: "another_flow_id" }, docs: { purpose: "(Advanced) Jumps to a different conversation flow design. Useful for creating modular and reusable conversation parts.", settings: "Specify the 'Target Flow ID' of the conversation design to jump to.", edges: "One outgoing connection.", rules: "This is a placeholder for flow transition logic; actual multi-flow execution is not fully implemented in this version." } },
  { type: 'agentSkill', label: 'Use AI Skill (Advanced)', icon: BrainCircuit, defaultProperties: { label: "Agent Skill", agentSkillId: "booking_skill" }, docs: { purpose: "(Advanced) Activates a specialized AI capability, function, or even a sub-agent designed for a specific task (e.g., appointment booking, complex calculations).", settings: "Specify the 'Skill ID'.", edges: "Connects to the next step.", rules: "This is a placeholder for future advanced skill integration." } },
];


const WIRING_BEST_PRACTICES_DOCS = {
  title: "Conversation Design Tips",
  points: [
    "Every step (except 'End Conversation') should lead to another step.",
    "'Make a Decision' nodes need paths for each choice and a 'Default / Other' path.",
    "Use 'Answer from Knowledge' for questions best answered by your trained business data.",
    "Make sure variables are defined (e.g., in 'Ask a Question') before you use them in messages or decisions.",
    "Test all conversation paths thoroughly in the 'Test Chatbot' tab.",
  ]
};

export const minimalInitialFlow: AgentFlowDefinition = {
  flowId: "new-agent-flow",
  name: "New Agent Flow",
  description: "A minimal flow to get started.",
  nodes: [
    { id: "start_minimal", type: "start", label: "Start", position: { x: 50, y: 100 } },
    { id: "end_minimal", type: "end", label: "End", position: { x: 300, y: 100 } },
  ],
  edges: [
    { id: "e_minimal_start_end", source: "start_minimal", target: "end_minimal", label: "" },
  ]
};

export const customerSupportFlow: AgentFlowDefinition = {
  flowId: "customer-support-flow",
  name: "Customer Support",
  description: "Handles customer inquiries, routes to product info or tech support.",
  nodes: [
    { id: "cs_start", type: "start", label: "Start", position: { x: 50, y: 50 } },
    { id: "cs_greet", type: "sendMessage", label: "Greet & Ask Category", message: "Welcome to support! Are you looking for (1) Product Information, (2) Technical Support, or (3) Billing help?", position: { x: 50, y: 150 } },
    { id: "cs_get_category", type: "getUserInput", label: "Get Category Choice", prompt: "Please enter 1, 2, or 3.", variableName: "supportCategory", position: { x: 50, y: 250 } },
    { id: "cs_check_category", type: "condition", label: "Route by Category", conditionVariable: "supportCategory", useLLMForDecision: false, position: { x: 50, y: 350 } },
    { id: "cs_prod_info_prompt", type: "getUserInput", label: "Ask Product Name", prompt: "Sure, which product are you interested in?", variableName: "productName", position: { x: 250, y: 450 } },
    { id: "cs_prod_lookup", type: "qnaLookup", label: "Lookup Product in KB", qnaQueryVariable: "productName", qnaOutputVariable: "productInfo", qnaFallbackText: "I couldn't find specific details for that product in my knowledge base.", position: { x: 250, y: 550 } },
    { id: "cs_send_prod_info", type: "sendMessage", label: "Send Product Info", message: "{{productInfo}} \n\nIs there anything else I can help with regarding products?", position: { x: 250, y: 650 } },
    { id: "cs_tech_prompt", type: "getUserInput", label: "Ask Tech Issue", prompt: "Okay, technical support. Please describe the problem you're facing.", variableName: "techIssue", position: { x: -150, y: 450 } },
    { id: "cs_tech_llm", type: "callLLM", label: "LLM Troubleshoot", llmPrompt: "User has a technical issue: {{techIssue}}. Provide troubleshooting steps based on available knowledge.", outputVariable: "techSolution", useKnowledge: true, position: { x: -150, y: 550 } },
    { id: "cs_send_tech_solution", type: "sendMessage", label: "Send Tech Solution", message: "{{techSolution}}\n\nDid these steps help?", position: { x: -150, y: 650 } },
    { id: "cs_billing_prompt", type: "sendMessage", label: "Billing Info", message: "For billing issues, please contact our billing department at billing@example.com or call 1-800-555-BILL.", position: { x: 50, y: 450 } },
    { id: "cs_further_help_q", type: "getUserInput", label: "Further Assistance?", prompt: "(Type 'yes' or 'no')", variableName: "furtherProductHelp", position: { x: 250, y: 750 } },
    { id: "cs_check_further_help", type: "condition", label: "Check Further Help", conditionVariable: "furtherProductHelp", useLLMForDecision: false, position: { x: 250, y: 850 } },
    { id: "cs_end_happy", type: "end", label: "End Support", position: { x: 50, y: 950 } },
    { id: "cs_end_billing", type: "end", label: "End Billing", position: { x: 50, y: 550 } },
  ],
  edges: [
    { id: "ecs_s_g", source: "cs_start", target: "cs_greet" },
    { id: "ecs_g_gc", source: "cs_greet", target: "cs_get_category" },
    { id: "ecs_gc_cc", source: "cs_get_category", target: "cs_check_category" },
    { id: "ecs_cc_pi", source: "cs_check_category", target: "cs_prod_info_prompt", condition: "1", label: "Product Info (1)" },
    { id: "ecs_pi_pl", source: "cs_prod_info_prompt", target: "cs_prod_lookup" },
    { id: "ecs_pl_spi", source: "cs_prod_lookup", target: "cs_send_prod_info", edgeType: "found" },
    { id: "ecs_pl_spi_nf", source: "cs_prod_lookup", target: "cs_send_prod_info", edgeType: "notFound" }, 
    { id: "ecs_spi_fh", source: "cs_send_prod_info", target: "cs_further_help_q" },
    { id: "ecs_fh_cfh", source: "cs_further_help_q", target: "cs_check_further_help" },
    { id: "ecs_cfh_pi_loop", source: "cs_check_further_help", target: "cs_prod_info_prompt", condition: "yes", label: "Yes (more product help)" },
    { id: "ecs_cfh_end", source: "cs_check_further_help", target: "cs_end_happy", condition: "no", label: "No (end)" },
    { id: "ecs_cc_ts", source: "cs_check_category", target: "cs_tech_prompt", condition: "2", label: "Tech Support (2)" },
    { id: "ecs_tp_tl", source: "cs_tech_prompt", target: "cs_tech_llm" },
    { id: "ecs_tl_sts", source: "cs_tech_llm", target: "cs_send_tech_solution" },
    { id: "ecs_sts_end", source: "cs_send_tech_solution", target: "cs_end_happy" }, 
    { id: "ecs_cc_b", source: "cs_check_category", target: "cs_billing_prompt", condition: "3", label: "Billing (3)" },
    { id: "ecs_bp_end", source: "cs_billing_prompt", target: "cs_end_billing"},
    { id: "ecs_cc_default_end", source: "cs_check_category", target: "cs_end_happy", condition: "", label: "Default/Other" }, 
  ]
};

export const refundProcessingFlow: AgentFlowDefinition = {
  flowId: "refund-processing-flow",
  name: "Refund Processing",
  description: "Guides users through the refund process, including verification.",
  nodes: [
    { id: "rf_start", type: "start", label: "Start Refund", position: { x: 50, y: 50 } },
    { id: "rf_policy", type: "sendMessage", label: "Policy & Proceed?", message: "Refunds are typically processed within 5-7 business days for eligible items returned within 30 days. Would you like to start a refund request?", position: { x: 50, y: 150 } },
    { id: "rf_get_proceed", type: "getUserInput", label: "Ask to Proceed", prompt: "Yes or No?", variableName: "proceedRefund", position: { x: 50, y: 250 } },
    { id: "rf_check_proceed", type: "condition", label: "Check Proceed", conditionVariable: "proceedRefund", useLLMForDecision: true, position: { x: 50, y: 350 } }, 
    { id: "rf_ask_order_id", type: "getUserInput", label: "Ask Order ID", prompt: "Please enter your Order ID.", variableName: "orderId", position: { x: 250, y: 450 } },
    { id: "rf_verify_order_api", type: "apiCall", label: "Verify Order (API)", apiUrl: "https://api.example.com/orders/{{orderId}}/verify", apiMethod: "GET", apiOutputVariable: "orderStatus", position: { x: 250, y: 550 } },
    { id: "rf_check_order_status", type: "condition", label: "Check Order Status", conditionVariable: "orderStatus", position: { x: 250, y: 650 } }, 
    { id: "rf_ask_reason", type: "getUserInput", label: "Ask Refund Reason", prompt: "What is the reason for your refund request?", variableName: "refundReason", position: { x: 450, y: 750 } },
    { id: "rf_process_refund_llm", type: "callLLM", label: "Process Refund (LLM)", llmPrompt: "User (Order ID: {{orderId}}) requests refund for reason: {{refundReason}}. Based on policy (30 day return, eligible items), decide if refund is approved and state amount or reason for denial.", outputVariable: "refundDecisionMsg", useKnowledge: true, position: { x: 450, y: 850 } },
    { id: "rf_send_decision", type: "sendMessage", label: "Send Refund Decision", message: "{{refundDecisionMsg}}", position: { x: 450, y: 950 } },
    { id: "rf_send_not_proceed", type: "sendMessage", label: "Not Proceeding", message: "Okay, if you change your mind, feel free to start a new request.", position: { x: -150, y: 450 } },
    { id: "rf_order_invalid", type: "sendMessage", label: "Order Invalid/Error", message: "Sorry, I couldn't validate your order ID ({{orderId}}). Please check the ID or contact support if the issue persists. Response: {{orderStatus}}", position: { x: 50, y: 750 } },
    { id: "rf_end", type: "end", label: "End Refund", position: { x: 250, y: 1050 } },
  ],
  edges: [
    { id: "erf_s_p", source: "rf_start", target: "rf_policy" },
    { id: "erf_p_gp", source: "rf_policy", target: "rf_get_proceed" },
    { id: "erf_gp_cp", source: "rf_get_proceed", target: "rf_check_proceed" },
    { id: "erf_cp_yes", source: "rf_check_proceed", target: "rf_ask_order_id", condition: "User wants to proceed with the refund.", label: "Yes" },
    { id: "erf_aoi_voa", source: "rf_ask_order_id", target: "rf_verify_order_api" },
    { id: "erf_voa_cos", source: "rf_verify_order_api", target: "rf_check_order_status", edgeType: "success" },
    { id: "erf_voa_oi_err", source: "rf_verify_order_api", target: "rf_order_invalid", edgeType: "error" }, 
    { id: "erf_cos_valid", source: "rf_check_order_status", target: "rf_ask_reason", condition: "valid", label: "Order Valid" },
    { id: "erf_ar_prl", source: "rf_ask_reason", target: "rf_process_refund_llm" },
    { id: "erf_prl_sd", source: "rf_process_refund_llm", target: "rf_send_decision" },
    { id: "erf_sd_end", source: "rf_send_decision", target: "rf_end" },
    { id: "erf_cos_invalid", source: "rf_check_order_status", target: "rf_order_invalid", condition: "invalid", label: "Order Invalid" },
    { id: "erf_cos_default_invalid", source: "rf_check_order_status", target: "rf_order_invalid", condition: "", label: "Default/Error" },
    { id: "erf_oi_end", source: "rf_order_invalid", target: "rf_end" },
    { id: "erf_cp_no", source: "rf_check_proceed", target: "rf_send_not_proceed", condition: "User does not want to proceed.", label: "No" },
    { id: "erf_snp_end", source: "rf_send_not_proceed", target: "rf_end" },
  ]
};

export const faqFlowMinimal: AgentFlowDefinition = {
  flowId: "faq-flow-minimal",
  name: "FAQ Agent",
  description: "A minimal flow that greets and then defers to autonomous reasoning for Q&A.",
  nodes: [
    { id: "faq_start", type: "start", label: "Start FAQ", position: { x: 50, y: 50 } },
    { id: "faq_greet", type: "sendMessage", label: "Greet", message: "Hello! I can answer your questions. What's on your mind?", position: { x: 50, y: 150 } },
    { id: "faq_end_after_greet", type: "end", label: "End Initial Greeting", position: { x: 50, y: 250 } } 
  ],
  edges: [
    { id: "efaq_s_g", source: "faq_start", target: "faq_greet" },
    { id: "efaq_g_e", source: "faq_greet", target: "faq_end_after_greet" }
  ]
};

export const generalPurposeAssistantFlow: AgentFlowDefinition = {
  flowId: "general-purpose-assistant-flow",
  name: "General Purpose Assistant",
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
    { id: "e_check_invalid_category_default", source: "check_category_node_3", target: "invalid_category_node_19", condition: "" , edgeType: "default", label: "Default/Invalid"},
    { id: "e_invalid_cat_to_get_category", source: "invalid_category_node_19", target: "get_issue_category_node_2"},
  ]
};

const sampleFlows: Record<string, { name: string; flow: AgentFlowDefinition }> = {
  minimal: { name: "Minimal (Start & End)", flow: minimalInitialFlow },
  support: { name: "Customer Support Example", flow: customerSupportFlow },
  refund: { name: "Refund Process Example", flow: refundProcessingFlow },
  faq: { name: "FAQ Agent (Minimal Greeting)", flow: faqFlowMinimal },
  general: { name: "General Purpose Assistant", flow: generalPurposeAssistantFlow },
};


export default function AgentStudioPage() {
  const params = useParams();
  const { toast } = useToast();
  const { getAgent, updateAgentFlow, isLoadingAgents } = useAppContext();

  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const [currentAgent, setCurrentAgent] = useState<Agent | null | undefined>(undefined);

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
      content: jsonNode.message || jsonNode.prompt || jsonNode.llmPrompt || jsonNode.codeScript,
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
      loadFlowToVisual(agent?.flow);
    } else if (!isLoadingAgents && !agentId) {
      setCurrentAgent(null); 
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
    const defaultLabel = nodeDef?.defaultProperties?.label || nodeDef?.label || 'Node';
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
    else if (sourceNode?.type === 'apiCall') { defaultEdgeLabel = "Successful Call"; defaultEdgeType = "success"; }
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

      mermaidStr += `  ${mermaidId}${shapeStart}${displayLabel} (${nodeDef?.label || node.type})${shapeEnd};\n`;
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
     if (!hasEndNode && nodes.length > 0) { // Warn but allow saving if it's a work-in-progress
        toast({ title: "Incomplete Conversation", description: "Your conversation design should ideally have at least one 'End Conversation' step to properly conclude paths.", variant: "default"});
    }
    
    for (const node of nodes) {
        const nodeDef = NODE_DEFINITIONS.find(d => d.type === node.type);
        if (!nodeDef) {
             toast({ title: "Invalid Step Type", description: `Step '${node.label}' has an unrecognized type '${node.type}'.`, variant: "destructive"});
            return null;
        }
        // Basic validation for key fields
        if (node.type === 'callLLM' && (!node.llmPrompt || !node.outputVariable)) {
            toast({ title: "Incomplete Step Config", description: `Smart Response step '${node.label}' is missing an 'Instruction for AI' or 'Save AI Response As' variable.`, variant: "destructive"});
            return null;
        }
        if (node.type === 'getUserInput' && (!node.prompt || !node.variableName)) {
            toast({ title: "Incomplete Step Config", description: `Ask Question step '${node.label}' is missing a 'Chatbot's Question' or 'Save User's Answer as' variable.`, variant: "destructive"});
            return null;
        }
         if (node.type === 'condition' && !node.conditionVariable) {
             toast({ title: "Incomplete Step Config", description: `Make a Decision step '${node.label}' is missing a 'Variable to Base Decision On'.`, variant: "destructive"});
            return null;
        }
    }

    function recursivelyStripUndefined(obj: any): any {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }
    
      if (Array.isArray(obj)) {
        const newArray = obj
          .map(item => recursivelyStripUndefined(item))
          .filter(item => item !== undefined);
        return newArray.length > 0 ? newArray : undefined; 
      }
    
      const newObj: { [key: string]: any } = {};
      let hasKeys = false;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = recursivelyStripUndefined(obj[key]);
          if (value !== undefined) {
            newObj[key] = value;
            hasKeys = true;
          }
        }
      }
      return hasKeys ? newObj : undefined; 
    }

    function sanitizeNode(visualNode: VisualNode): JsonFlowNode {
        const output: any = {
            id: visualNode.id,
            type: visualNode.type,
            label: visualNode.label || NODE_DEFINITIONS.find(def => def.type === visualNode.type)?.defaultProperties?.label || visualNode.id,
            position: { x: visualNode.x, y: visualNode.y },
        };

        const allProps: (keyof VisualNode)[] = [
            'message', 'prompt', 'variableName', 'inputType', 'validationRules', 'llmPrompt', 
            'outputVariable', 'useKnowledge', 'conditionVariable', 'useLLMForDecision', 
            'conditionExpressions', 'apiUrl', 'apiMethod', 'apiHeaders', 'apiBodyVariable', 
            'apiTimeout', 'apiRetryAttempts', 'apiOutputVariable', 'endOutputVariable', 
            'actionName', 'actionInputArgs', 'actionOutputVarMap', 'codeScript', 'codeReturnVarMap', 
            'qnaKnowledgeBaseId', 'qnaQueryVariable', 'qnaThreshold', 'qnaOutputVariable', 
            'qnaFallbackText', 'waitDurationMs', 'transitionTargetFlowId', 'transitionTargetNodeId', 
            'transitionVariablesToPass', 'agentSkillId', 'agentSkillsList', 'agentContextWindow'
        ];

        allProps.forEach(propKey => {
            const visualValue = visualNode[propKey as keyof VisualNode];

            if (visualValue === undefined || visualValue === null) {
                return; 
            }

            let valueToSet: any;
            const jsonStringOrObjectProps: (keyof VisualNode)[] = [
                'apiHeaders', 'actionInputArgs', 'actionOutputVarMap', 
                'codeReturnVarMap', 'transitionVariablesToPass'
            ];

            if (jsonStringOrObjectProps.includes(propKey)) {
                let objectToSanitize: any;
                if (typeof visualValue === 'string') {
                    if (visualValue.trim() === '') {
                        objectToSanitize = {}; 
                    } else {
                        try {
                            objectToSanitize = JSON.parse(visualValue);
                        } catch (e) {
                            console.warn(`Invalid JSON string in ${String(propKey)} for step ${visualNode.label}: "${visualValue}". Skipping.`);
                            return;
                        }
                    }
                } else if (typeof visualValue === 'object') {
                    objectToSanitize = visualValue;
                } else {
                    console.warn(`Unexpected type for ${String(propKey)} in step ${visualNode.label}. Expected string or object, got ${typeof visualValue}. Skipping.`);
                    return;
                }
                
                if (typeof objectToSanitize === 'object' && objectToSanitize !== null) {
                    valueToSet = recursivelyStripUndefined(objectToSanitize);
                } else {
                    if (!(typeof visualValue === 'string' && visualValue.trim() === '')) { // Only warn if original visualValue was not an empty string
                         console.warn(`Value for ${String(propKey)} in step ${visualNode.label} parsed to non-object:`, objectToSanitize, `. Original visual value:`, visualValue, `. Skipping.`);
                         return;
                    }
                    valueToSet = {}; // Default to empty object if parsing failed from empty string
                }

            } else if (Array.isArray(visualValue)) {
                const sanitizedArray = visualValue
                    .map(item => recursivelyStripUndefined(item))
                    .filter(item => item !== undefined);
                if (sanitizedArray.length > 0) {
                    valueToSet = sanitizedArray;
                } else {
                    valueToSet = []; // Store empty array if all items were undefined
                }
            } else if (typeof visualValue === 'object') {
                 valueToSet = recursivelyStripUndefined(visualValue);
            }
            else {
                valueToSet = visualValue; 
            }

            // Ensure only non-undefined values are set (boolean false is okay, empty string is okay)
            if (valueToSet !== undefined) {
                // Booleans are fine, non-null objects are fine, other non-null/non-undefined primitives are fine
                if (typeof valueToSet === 'boolean' || (typeof valueToSet === 'object' && valueToSet !== null) || (typeof valueToSet !== 'object' && valueToSet !== null && valueToSet !== undefined ) ) {
                    output[propKey as keyof JsonFlowNode] = valueToSet;
                }
            }
        });
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
          <CardDescription className="text-xs">Drag these onto the canvas to build your chatbot's conversation steps.</CardDescription>
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
                  <span className="text-xs sm:text-sm flex-1 min-w-0 break-words">{def.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="start" className="max-w-xs z-[60]">
                <p className="font-semibold">{def.label}</p>
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
                    node.type === 'action' ? (node.actionName || 'Action') :
                    node.type === 'apiCall' ? (node.apiUrl ? node.apiUrl.substring(0,15)+'...' : 'HTTP Req') : 
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
                  <div><Label htmlFor="nodeMessage" className="text-[10px] sm:text-xs">Message Text (What the chatbot says)</Label><Textarea id="nodeMessage" value={selectedNodeDetails.message || ""} onChange={e => updateSelectedNodeProperties({ message: e.target.value })} rows={2} className="text-xs sm:text-sm"/></div>
                )}
                 { selectedNodeDetails.type === 'getUserInput' && (
                  <>
                    <div><Label htmlFor="nodePrompt" className="text-[10px] sm:text-xs">Chatbot's Question for User</Label><Textarea id="nodePrompt" value={selectedNodeDetails.prompt || ""} onChange={e => updateSelectedNodeProperties({ prompt: e.target.value })} rows={2} className="text-xs sm:text-sm"/></div>
                    <div><Label htmlFor="nodeVariable" className="text-[10px] sm:text-xs">Save User's Answer as (Variable Name)</Label><Input id="nodeVariable" value={selectedNodeDetails.variableName || ""} onChange={e => updateSelectedNodeProperties({ variableName: e.target.value })}  className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., customerEmail"/></div>
                    <div><Label htmlFor="nodeInputType" className="text-[10px] sm:text-xs">Input Type (e.g. text, number - for future validation)</Label><Input id="nodeInputType" value={selectedNodeDetails.inputType || ""} onChange={e => updateSelectedNodeProperties({ inputType: e.target.value })}  className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., text, number"/></div>
                    <div><Label htmlFor="nodeValidation" className="text-[10px] sm:text-xs">Validation Rules (e.g. must be email - for future use)</Label><Input id="nodeValidation" value={selectedNodeDetails.validationRules || ""} onChange={e => updateSelectedNodeProperties({ validationRules: e.target.value })}  className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., regex for email"/></div>
                  </>
                )}
                { selectedNodeDetails.type === 'callLLM' && (
                  <>
                    <div><Label htmlFor="llmPrompt" className="text-[10px] sm:text-xs">Instruction for AI (Use {{variableName}} for user data)</Label><Textarea id="llmPrompt" value={selectedNodeDetails.llmPrompt || ""} onChange={e => updateSelectedNodeProperties({ llmPrompt: e.target.value })} rows={3} className="text-xs sm:text-sm"/><p className="text-[10px] text-muted-foreground mt-0.5">Tip: Tell the AI how to respond if it's unsure, e.g., "If you don't know, say: I can't find that specific information."</p></div>
                    <div><Label htmlFor="llmOutputVar" className="text-[10px] sm:text-xs">Save AI's Response as (Variable Name)</Label><Input id="llmOutputVar" value={selectedNodeDetails.outputVariable || ""} onChange={e => updateSelectedNodeProperties({ outputVariable: e.target.value })}  className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., aiGeneratedSummary"/></div>
                    <div className="flex items-center space-x-1.5 pt-1"><Checkbox id="useKnowledge" checked={!!selectedNodeDetails.useKnowledge} onCheckedChange={(checked) => updateSelectedNodeProperties({ useKnowledge: !!checked })}/><Label htmlFor="useKnowledge" className="text-[10px] sm:text-xs font-normal cursor-pointer">Allow AI to use Trained Knowledge</Label></div>
                  </>
                )}
                { selectedNodeDetails.type === 'condition' && (
                   <>
                    <div><Label htmlFor="conditionVar" className="text-[10px] sm:text-xs">Variable to Base Decision On</Label><Input id="conditionVar" value={selectedNodeDetails.conditionVariable || ""} onChange={e => updateSelectedNodeProperties({ conditionVariable: e.target.value })}  className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., userChoice"/></div>
                    <div className="flex items-center space-x-1.5 pt-1"><Checkbox id="useLLMForDecision" checked={!!selectedNodeDetails.useLLMForDecision} onCheckedChange={(checked) => updateSelectedNodeProperties({ useLLMForDecision: !!checked })}/><Label htmlFor="useLLMForDecision" className="text-[10px] sm:text-xs font-normal cursor-pointer">Use AI to Understand User's Intent for Decision</Label></div>
                   </>
                )}
                 { selectedNodeDetails.type === 'apiCall' && (
                    <>
                        <div><Label htmlFor="apiUrl" className="text-[10px] sm:text-xs">API URL</Label><Input id="apiUrl" value={selectedNodeDetails.apiUrl || ""} onChange={e => updateSelectedNodeProperties({ apiUrl: e.target.value })} className="h-7 sm:h-8 text-xs sm:text-sm"/></div>
                        <div><Label htmlFor="apiMethod" className="text-[10px] sm:text-xs">Method</Label>
                            <Select value={selectedNodeDetails.apiMethod || 'GET'} onValueChange={value => updateSelectedNodeProperties({ apiMethod: value as JsonFlowNode['apiMethod'] })}>
                                <SelectTrigger className="h-7 sm:h-8 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <SelectItem key={m} value={m} className="text-xs sm:text-sm">{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div><Label htmlFor="apiHeaders" className="text-[10px] sm:text-xs">Headers (JSON String, e.g., {"{\"Auth\":\"Bearer {{token}}\"} "})</Label><Textarea id="apiHeaders" placeholder='{ "Content-Type": "application/json" }' value={typeof selectedNodeDetails.apiHeaders === 'string' ? selectedNodeDetails.apiHeaders : JSON.stringify(selectedNodeDetails.apiHeaders || {})} onChange={e => updateSelectedNodeProperties({ apiHeaders: e.target.value })} rows={2} className="text-xs sm:text-sm font-code"/></div>
                        <div><Label htmlFor="apiBodyVar" className="text-[10px] sm:text-xs">Body Variable (from context, for POST/PUT)</Label><Input id="apiBodyVar" value={selectedNodeDetails.apiBodyVariable || ""} onChange={e => updateSelectedNodeProperties({ apiBodyVariable: e.target.value })} className="h-7 sm:h-8 text-xs sm:text-sm"/></div>
                        <div><Label htmlFor="apiOutputVar" className="text-[10px] sm:text-xs">Save API Response As (Variable Name)</Label><Input id="apiOutputVar" value={selectedNodeDetails.apiOutputVariable || selectedNodeDetails.outputVariable || ""} onChange={e => updateSelectedNodeProperties({ apiOutputVariable: e.target.value, outputVariable: e.target.value })} className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., apiData"/></div>
                    </>
                )}
                { selectedNodeDetails.type === 'qnaLookup' && (
                  <>
                    <div><Label htmlFor="qnaQueryVar" className="text-[10px] sm:text-xs">User's Question (Variable Name, e.g. {{userInput}})</Label><Input id="qnaQueryVar" value={selectedNodeDetails.qnaQueryVariable || ""} onChange={e => updateSelectedNodeProperties({ qnaQueryVariable: e.target.value })} className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., lastUserMessage"/></div>
                    <div><Label htmlFor="qnaOutputVar" className="text-[10px] sm:text-xs">Save Found Answer as (Variable Name)</Label><Input id="qnaOutputVar" value={selectedNodeDetails.qnaOutputVariable || ""} onChange={e => updateSelectedNodeProperties({ qnaOutputVariable: e.target.value })} className="h-7 sm:h-8 text-xs sm:text-sm" placeholder="e.g., knowledgeBaseAnswer"/></div>
                    <div><Label htmlFor="qnaFallback" className="text-[10px] sm:text-xs">Message if No Answer Found in Knowledge</Label><Textarea id="qnaFallback" value={selectedNodeDetails.qnaFallbackText || ""} onChange={e => updateSelectedNodeProperties({ qnaFallbackText: e.target.value })} rows={2} className="text-xs sm:text-sm" placeholder="e.g., Sorry, I don't have that info."/></div>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => deleteNode(selectedNodeDetails.id)} className="text-destructive border-destructive hover:bg-destructive/10 w-full mt-2 h-8 text-xs sm:text-sm">
                  <Trash2 className="mr-2 h-3 w-3" /> Delete Step
                </Button>
                <hr className="my-2 sm:my-3"/>
                <Label className="text-[10px] sm:text-xs text-muted-foreground block mb-1">Connections from this Step:</Label>
                {edges.filter(e => e.source === selectedNodeDetails.id).length === 0 && <p className="text-[10px] sm:text-xs text-muted-foreground italic">No outgoing connections. Drag from the right port of this step to another step's left port.</p>}
                {edges.filter(e => e.source === selectedNodeDetails.id).map(edge => (
                  <div key={edge.id} className="text-[10px] sm:text-xs space-y-1 border p-1.5 rounded mb-1 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="truncate" title={`To: ${nodes.find(n=>n.id===edge.target)?.label || edge.target}`}>To: {nodes.find(n=>n.id===edge.target)?.label || edge.target}</span>
                      <Button variant="ghost" size="icon" onClick={() => deleteEdge(edge.id)} className="h-5 w-5 shrink-0"><Trash2 className="h-3 w-3 text-destructive"/></Button>
                    </div>
                    {(selectedNodeDetails.type === 'condition' || selectedNodeDetails.type === 'apiCall' || selectedNodeDetails.type === 'qnaLookup' || selectedNodeDetails.type === 'getUserInput') && (
                        <div>
                            <Label htmlFor={`edgeLabel-${edge.id}`} className="text-[9px] sm:text-[10px]">{selectedNodeDetails.type === 'condition' ? 'Decision Outcome / User Input Value' : 'Connection Label (Optional)'}</Label>
                            <Input id={`edgeLabel-${edge.id}`} placeholder={ selectedNodeDetails.type === 'condition' ? "e.g., 'Yes', 'Product A', 'Invalid'" : "e.g., Next step after XYZ"} value={edge.label || ""} onChange={e => updateEdgeProperty(edge.id, { label: e.target.value })} className="h-6 sm:h-7 text-[10px] sm:text-xs mt-0.5"/>
                        </div>
                    )}
                     {(selectedNodeDetails.type === 'apiCall' || selectedNodeDetails.type === 'qnaLookup' || selectedNodeDetails.type === 'getUserInput' ) && (
                        <div>
                          <Label htmlFor={`edgeType-${edge.id}`} className="text-[9px] sm:text-[10px]">Connection Type (Path Logic)</Label>
                           <Select value={edge.edgeType || 'default'} onValueChange={value => updateEdgeProperty(edge.id, { edgeType: value as JsonFlowEdge['edgeType'] })}>
                                <SelectTrigger className="h-6 sm:h-7 text-[10px] sm:text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default" className="text-xs sm:text-sm">Default / Next Step</SelectItem>
                                    {selectedNodeDetails.type === 'apiCall' && <>
                                      <SelectItem value="success" className="text-xs sm:text-sm">On Successful API Call</SelectItem>
                                      <SelectItem value="error" className="text-xs sm:text-sm">On API Call Error</SelectItem>
                                    </>}
                                    {selectedNodeDetails.type === 'getUserInput' && <>
                                      <SelectItem value="invalid" className="text-xs sm:text-sm">If User Input is Invalid (Future)</SelectItem>
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
                            <TooltipContent side="top" className="z-[60] max-w-xs"><p>Guide for the <strong>{selectedNodeDefinition.label}</strong> step.</p></TooltipContent>
                        </Tooltip>
                       How to use: {selectedNodeDefinition.label}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-1.5 text-[10px] sm:text-xs p-1.5 sm:p-2 border-t bg-muted/30 rounded-b-md">
                      <div><strong className="block text-primary">What it does:</strong> {selectedNodeDefinition.docs.purpose}</div>
                      <div><strong className="block text-primary">Key Settings:</strong> {selectedNodeDefinition.docs.settings}</div>
                      <div><strong className="block text-primary">Connecting it:</strong> {selectedNodeDefinition.docs.edges}</div>
                      <div><strong className="block text-primary">Important Tips:</strong> {selectedNodeDefinition.docs.rules}</div>
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
