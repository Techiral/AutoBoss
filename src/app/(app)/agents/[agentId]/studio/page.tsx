
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "../../../layout";
import type { Agent, AgentFlowDefinition, FlowNode as JsonFlowNode, FlowEdge as JsonFlowEdge } from "@/lib/types";
import { Loader2, Save, AlertTriangle, Trash2, MousePointer, ArrowRight, MessageSquare, Zap, HelpCircle, Play, ChevronsUpDown, Settings2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Helper for unique IDs
const generateId = (prefix = "node_") => `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface VisualNode {
  id: string;
  type: FlowNodeType; 
  label: string; 
  x: number;
  y: number;
  content?: string; 
  variableName?: string; 
  useKnowledge?: boolean; 
  useLLMForDecision?: boolean; 
}

interface VisualEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string; 
}

type FlowNodeType = 'start' | 'sendMessage' | 'getUserInput' | 'callLLM' | 'condition' | 'end';

const NODE_WIDGETS: { type: FlowNodeType; label: string; icon: React.ElementType }[] = [
  { type: 'start', label: 'Start', icon: Play },
  { type: 'sendMessage', label: 'Message', icon: MessageSquare },
  { type: 'getUserInput', label: 'User Input', icon: HelpCircle },
  { type: 'callLLM', label: 'LLM Call', icon: Zap },
  { type: 'condition', label: 'Condition', icon: ChevronsUpDown },
  { type: 'end', label: 'End', icon: ArrowRight },
];

const initialNodes: VisualNode[] = [
    { id: generateId('start_'), type: 'start', label: 'Start', x: 50, y: 50 },
    { id: generateId('end_'), type: 'end', label: 'End', x: 400, y: 50 },
];
const initialEdges: VisualEdge[] = [];


export default function AgentStudioPage() {
  const params = useParams();
  const { toast } = useToast();
  const { getAgent, updateAgentFlow } = useAppContext();
  
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const [currentAgent, setCurrentAgent] = useState<Agent | null | undefined>(undefined);
  
  const [nodes, setNodes] = useState<VisualNode[]>(initialNodes);
  const [edges, setEdges] = useState<VisualEdge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string>("");
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingNodeInfo, setDraggingNodeInfo] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [connectingInfo, setConnectingInfo] = useState<{ sourceId: string } | null>(null);


  useEffect(() => {
    if (agentId) {
      const agent = getAgent(agentId as string);
      setCurrentAgent(agent);
      if (agent?.flow && agent.flow.nodes && agent.flow.edges) {
        const loadedNodes: VisualNode[] = agent.flow.nodes.map((jsonNode: JsonFlowNode) => ({
          id: jsonNode.id,
          type: jsonNode.type as FlowNodeType,
          label: jsonNode.id, 
          x: jsonNode.position?.x || Math.random() * 400,
          y: jsonNode.position?.y || Math.random() * 300,
          content: jsonNode.message || jsonNode.prompt || jsonNode.llmPrompt,
          variableName: jsonNode.variableName || jsonNode.outputVariable || jsonNode.conditionVariable,
          useKnowledge: jsonNode.useKnowledge,
          useLLMForDecision: jsonNode.useLLMForDecision,
        }));
        const loadedEdges: VisualEdge[] = agent.flow.edges.map((jsonEdge: JsonFlowEdge) => ({
          id: jsonEdge.id,
          sourceId: jsonEdge.source,
          targetId: jsonEdge.target,
          label: jsonEdge.condition || jsonEdge.label, 
        }));
        setNodes(loadedNodes.length > 0 ? loadedNodes : initialNodes);
        setEdges(loadedEdges);
      } else {
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    }
  }, [agentId, getAgent]);

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
    // Adjust for canvas scroll position if any (not implemented here but important for real apps)
    const x = event.clientX - canvasBounds.left;
    const y = event.clientY - canvasBounds.top;
    
    const defaultLabel = NODE_WIDGETS.find(w => w.type === nodeType)?.label || 'Node';
    const newNodeId = generateId(nodeType + '_');
    const newNode: VisualNode = {
      id: newNodeId,
      type: nodeType,
      label: `${defaultLabel} ${nodes.filter(n => n.type === nodeType).length + 1}`,
      x: Math.max(0, x - 75), // Adjust for typical node width/2
      y: Math.max(0, y - 25), // Adjust for typical node height/2
      ...(nodeType === 'sendMessage' && { content: 'New message' }),
      ...(nodeType === 'getUserInput' && { content: 'Ask something...', variableName: 'userInput' }),
      ...(nodeType === 'callLLM' && { content: 'Your LLM prompt for {{variable}}', variableName: 'llmOutput', useKnowledge: false }),
      ...(nodeType === 'condition' && { variableName: 'conditionVariable', useLLMForDecision: false }),
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNodeId); // Auto-select new node
  };

  const handleDragOverCanvas = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleNodeMouseDown = (event: React.MouseEvent<HTMLDivElement>, nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current) return;
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const offsetX = event.clientX - canvasBounds.left - node.x;
    const offsetY = event.clientY - canvasBounds.top - node.y;
    setDraggingNodeInfo({ id: nodeId, offsetX, offsetY });
    if (event.ctrlKey || event.metaKey) { // Allow selecting multiple nodes in future
        // For now, just set as selected
    } else {
        setSelectedNodeId(nodeId);
    }
    event.stopPropagation(); // Prevent canvas click/deselect
  };
  
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingNodeInfo || !canvasRef.current) return;
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    let x = event.clientX - canvasBounds.left - draggingNodeInfo.offsetX;
    let y = event.clientY - canvasBounds.top - draggingNodeInfo.offsetY;

    // Ensure node stays within canvas bounds (approx)
    x = Math.max(0, Math.min(x, canvasBounds.width - 150)); // 150 is approx node width
    y = Math.max(0, Math.min(y, canvasBounds.height - 50)); // 50 is approx node height
    
    setNodes((nds) =>
      nds.map((n) => (n.id === draggingNodeInfo.id ? { ...n, x, y } : n))
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeInfo(null);
  };
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === canvasRef.current) { // Clicked on canvas background
        setSelectedNodeId(null);
        setConnectingInfo(null); // Cancel connection attempt
      }
  };

  const handleNodePortClick = (nodeId: string, portType: 'in' | 'out', event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent node selection when clicking port
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (portType === 'out') {
      if (node.type === 'end') {
        toast({title: "Invalid Connection", description: "Cannot connect from an 'End' node's output.", variant:"destructive"});
        return;
      }
      setConnectingInfo({ sourceId: nodeId });
      toast({ title: "Connecting...", description: `Source: ${node.label}. Click an input port on another node.`});
    } else if (portType === 'in' && connectingInfo) {
      if (node.type === 'start') {
         toast({title: "Invalid Connection", description: "Cannot connect to a 'Start' node's input.", variant:"destructive"});
         setConnectingInfo(null);
         return;
      }
      if (connectingInfo.sourceId === nodeId) { // Cannot connect node to itself
        toast({title: "Invalid Connection", description: "Cannot connect a node to itself.", variant:"destructive"});
        setConnectingInfo(null);
        return;
      }
      // Check for existing edge (simple check, could be more robust)
      const existingEdge = edges.find(e => e.sourceId === connectingInfo.sourceId && e.targetId === nodeId);
      if (existingEdge) {
        toast({title: "Connection Exists", description: "An edge already exists between these nodes.", variant:"default"});
        setConnectingInfo(null);
        return;
      }

      const newEdge: VisualEdge = {
        id: generateId('edge_'),
        sourceId: connectingInfo.sourceId,
        targetId: nodeId,
        label: '', 
      };
      setEdges((eds) => eds.concat(newEdge));
      const sourceNode = nodes.find(n=>n.id===connectingInfo.sourceId);
      toast({ title: "Edge Created!", description: `Connected ${sourceNode?.label} to ${node.label}.`});
      setConnectingInfo(null);
    }
  };
  
  const updateSelectedNodeProperties = (updatedProps: Partial<VisualNode>) => {
    if (!selectedNodeId) return;
    setNodes(nds => nds.map(n => n.id === selectedNodeId ? {...n, ...updatedProps} : n));
  };

  const updateEdgeLabel = (edgeId: string, label: string) => {
    setEdges(eds => eds.map(e => e.id === edgeId ? {...e, label} : e));
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
      let shapeStart = '["';
      let shapeEnd = '"]';
      if (node.type === 'start' || node.type === 'end') { shapeStart = '(("'; shapeEnd = '"))'; } // Circle for start/end
      else if (node.type === 'condition') { shapeStart = '{{"'; shapeEnd = '"}}'; } // Rhombus for condition
      
      mermaidStr += `  ${mermaidId}${shapeStart}${displayLabel} (${node.type})${shapeEnd};\n`;
    });
    edges.forEach(edge => {
      const sourceMermaidId = edge.sourceId.replace(/[^a-zA-Z0-9_]/g, '_');
      const targetMermaidId = edge.targetId.replace(/[^a-zA-Z0-9_]/g, '_');
      const edgeLabel = edge.label ? `|${edge.label.replace(/"/g, '#quot;')}|` : '';
      mermaidStr += `  ${sourceMermaidId} -->${edgeLabel} ${targetMermaidId};\n`;
    });
    return mermaidStr;
  }, [nodes, edges]);

  const convertToAgentFlowDefinition = useCallback((): AgentFlowDefinition => {
    const jsonNodes: JsonFlowNode[] = nodes.map(node => {
      const baseJsonNode: Omit<JsonFlowNode, 'type'> & {type: string} = { 
        id: node.id,
        type: node.type, // Will be narrowed down
        position: { x: node.x, y: node.y },
      };
      switch (node.type) {
        case 'sendMessage':
          return { ...baseJsonNode, type: 'sendMessage', message: node.content || "" };
        case 'getUserInput':
          return { ...baseJsonNode, type: 'getUserInput', prompt: node.content || "", variableName: node.variableName || "" };
        case 'callLLM':
          return { ...baseJsonNode, type: 'callLLM', llmPrompt: node.content || "", outputVariable: node.variableName || "", useKnowledge: !!node.useKnowledge };
        case 'condition':
          return { ...baseJsonNode, type: 'condition', conditionVariable: node.variableName || "", useLLMForDecision: !!node.useLLMForDecision };
        case 'start':
           return { ...baseJsonNode, type: 'start'};
        case 'end':
            return { ...baseJsonNode, type: 'end'};
        default: // Should not happen with FlowNodeType
          throw new Error(`Unknown node type during JSON conversion: ${node.type}`);
      }
    });

    const jsonEdges: JsonFlowEdge[] = edges.map(edge => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      label: edge.label, 
      condition: edge.label, 
    }));
    
    const flowId = currentAgent?.flow?.flowId || generateId('flow_');
    const flowName = currentAgent?.flow?.name || "My Visual Flow";
    const flowDescription = currentAgent?.flow?.description || "A flow created with the visual editor.";
    
    // Validate: Ensure there's at least one start and one end node if nodes exist
    const hasStartNode = nodes.some(n => n.type === 'start');
    const hasEndNode = nodes.some(n => n.type === 'end');

    if (nodes.length > 0 && (!hasStartNode || !hasEndNode)) {
        toast({
            title: "Invalid Flow Structure",
            description: "A flow must have at least one 'Start' and one 'End' node.",
            variant: "destructive"
        });
        // Potentially throw error to prevent saving invalid flow
    }


    return {
      flowId: flowId,
      name: flowName,
      description: flowDescription,
      nodes: jsonNodes,
      edges: jsonEdges,
    };
  }, [nodes, edges, currentAgent, toast]);

  const handleSaveFlow = useCallback(() => {
    if (!currentAgent) {
      toast({ title: "Agent Not Found", description: "Cannot save flow.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    const mermaid = convertToMermaid();
    setMermaidCode(mermaid); // For display
    
    try {
      const agentFlowDef = convertToAgentFlowDefinition();
      updateAgentFlow(currentAgent.id, agentFlowDef);
      toast({
        title: "Flow Saved!",
        description: `Flow "${agentFlowDef.name}" visually designed and updated.`,
      });
    } catch (error: any) {
      console.error("Error saving flow:", error);
      toast({ title: "Save Error", description: error.message || "Could not save the flow.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [currentAgent, convertToMermaid, convertToAgentFlowDefinition, updateAgentFlow, toast]);
  
  const clearFlow = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId(null);
    setMermaidCode("");
     if (currentAgent) {
      updateAgentFlow(currentAgent.id, {
        flowId: generateId('flow_'),
        name: "Cleared Flow",
        description: "Flow has been cleared.",
        nodes: initialNodes.map(n => ({id: n.id, type: n.type as 'start'|'end', position: {x:n.x, y:n.y}})),
        edges: [],
      }); 
      toast({ title: "Flow Cleared", description: "Visual flow editor and agent's flow data have been cleared."});
    }
  };

  const selectedNodeDetails = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  useEffect(() => {
    // Generate mermaid code for display whenever nodes or edges change
    if(nodes.length > 0 || edges.length > 0) {
        setMermaidCode(convertToMermaid());
    } else {
        setMermaidCode("");
    }
  }, [nodes, edges, convertToMermaid]);


  if (currentAgent === undefined) return <Card><CardHeader><CardTitle>Loading Studio...</CardTitle></CardHeader><CardContent><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" /></CardContent></Card>;
  if (!currentAgent) return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Agent Not Found</AlertTitle></Alert>;

  const nodeWidth = 150;
  const nodeHeight = 60; // Increased height for better label visibility
  const portSize = 8; // Diameter of port circles


  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
      {/* Sidebar for Node Widgets */}
      <Card className="col-span-2 h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Node Tools</CardTitle>
        </CardHeader>
        <ScrollArea className="flex-grow">
        <CardContent className="space-y-2 p-2">
          {NODE_WIDGETS.map(widget => (
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
            <Button onClick={clearFlow} variant="outline" size="sm" className="w-full"><Trash2 className="mr-2 h-4 w-4" />Clear Canvas</Button>
        </CardFooter>
      </Card>

      {/* Canvas Area */}
      <Card 
        className="col-span-7 h-full relative overflow-auto bg-muted/20 border-dashed border-input"
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

            // Arrowhead
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const arrowLength = 8;
            const arrowPoint1X = x2 - arrowLength * Math.cos(angle - Math.PI / 6);
            const arrowPoint1Y = y2 - arrowLength * Math.sin(angle - Math.PI / 6);
            const arrowPoint2X = x2 - arrowLength * Math.cos(angle + Math.PI / 6);
            const arrowPoint2Y = y2 - arrowLength * Math.sin(angle + Math.PI / 6);


            return (
              <g key={edge.id} className="cursor-pointer" onClick={() => {/*Future: select edge*/}}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--primary)/0.7)" strokeWidth="1.5" />
                <polygon points={`${x2},${y2} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`} fill="hsl(var(--primary)/0.7)" />
                {edge.label && (
                  <text x={midX} y={midY - 5} fill="hsl(var(--foreground))" fontSize="10px" textAnchor="middle" className="pointer-events-none select-none">
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
           {connectingInfo && ( // Visual feedback for connecting line
                <line
                    x1={nodes.find(n => n.id === connectingInfo.sourceId)!.x + nodeWidth}
                    y1={nodes.find(n => n.id === connectingInfo.sourceId)!.y + nodeHeight/2}
                    x2={draggingNodeInfo ? draggingNodeInfo.offsetX : (canvasRef.current?.getBoundingClientRect().width || 0) / 2} // Temporary endpoint
                    y2={draggingNodeInfo ? draggingNodeInfo.offsetY : (canvasRef.current?.getBoundingClientRect().height || 0) / 2}
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
            // onClick={(e) => { e.stopPropagation(); setSelectedNodeId(node.id);}} // Already handled by mousedown
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
             {/* Input Port */}
             {node.type !== 'start' && (
                <div 
                    onClick={(e) => handleNodePortClick(node.id, 'in', e)}
                    title={`Connect to ${node.label}`}
                    className="absolute -left-[5px] top-1/2 -translate-y-1/2 cursor-crosshair"
                    style={{width: `${portSize+4}px`, height: `${portSize+4}px`, display:'flex', alignItems:'center', justifyContent:'center'}}
                >
                   <div className="w-2 h-2 bg-primary/70 rounded-full border border-background ring-1 ring-primary/70 hover:bg-primary hover:ring-primary transition-all"/>
                </div>
             )}

            <div className="flex items-center gap-1 mb-0.5 overflow-hidden">
              {NODE_WIDGETS.find(w=>w.type === node.type)?.icon({className: "w-3 h-3 text-primary shrink-0"})}
              <span className="text-xs font-medium truncate" title={node.label}>{node.label}</span>
            </div>
            <p className="text-[10px] text-muted-foreground truncate" title={node.content || node.variableName || node.type}>
              {node.type === 'sendMessage' ? (node.content || '...') :
               node.type === 'getUserInput' ? (node.variableName ? `Var: ${node.variableName}`: '...') :
               node.type === 'callLLM' ? (node.variableName ? `Out: ${node.variableName}`: '...') :
               node.type === 'condition' ? (node.variableName ? `If: ${node.variableName}`: '...') :
               node.type
              }
            </p>
            
            {/* Output Port */}
            {node.type !== 'end' && (
                 <div 
                    onClick={(e) => handleNodePortClick(node.id, 'out', e)}
                    title={`Connect from ${node.label}`}
                    className="absolute -right-[5px] top-1/2 -translate-y-1/2 cursor-crosshair"
                     style={{width: `${portSize+4}px`, height: `${portSize+4}px`, display:'flex', alignItems:'center', justifyContent:'center'}}
                 >
                    <div className="w-2 h-2 bg-primary/70 rounded-full border border-background ring-1 ring-primary/70 hover:bg-primary hover:ring-primary transition-all"/>
                 </div>
            )}
          </div>
        ))}
      </Card>

      {/* Properties Panel */}
      <Card className="col-span-3 h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="w-5 h-5" />
            {selectedNodeDetails ? `Edit: ${selectedNodeDetails.label}` : "Properties / Output"}
          </CardTitle>
        </CardHeader>
        <ScrollArea className="flex-grow">
        <CardContent className="p-3 space-y-3 text-sm">
          {selectedNodeDetails ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="nodeLabel" className="text-xs">Node Label (ID)</Label>
                <Input id="nodeLabel" value={selectedNodeDetails.label} onChange={e => updateSelectedNodeProperties({ label: e.target.value })} className="h-8 text-sm"/>
              </div>
              { (selectedNodeDetails.type === 'sendMessage' || selectedNodeDetails.type === 'getUserInput' || selectedNodeDetails.type === 'callLLM') && (
                <div>
                  <Label htmlFor="nodeContent" className="text-xs">{selectedNodeDetails.type === 'sendMessage' ? 'Message Text' : selectedNodeDetails.type === 'getUserInput' ? 'Prompt Text' : 'LLM Prompt'}</Label>
                  <Textarea id="nodeContent" value={selectedNodeDetails.content || ""} onChange={e => updateSelectedNodeProperties({ content: e.target.value })} rows={3} className="text-sm"/>
                </div>
              )}
              { (selectedNodeDetails.type === 'getUserInput' || selectedNodeDetails.type === 'callLLM' || selectedNodeDetails.type === 'condition') && (
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
                  {selectedNodeDetails.type === 'condition' && (
                    <Input placeholder="Edge Condition Label" value={edge.label || ""} onChange={e => updateEdgeLabel(edge.id, e.target.value)} className="h-7 text-xs mt-1"/>
                  )}
                </div>
              ))}

            </div>
          ) : (
            <div className="text-center py-10">
                <MousePointer className="mx-auto w-10 h-10 text-muted-foreground mb-2"/>
                <p className="text-sm text-muted-foreground">
                    Select a node on the canvas to view and edit its properties here.
                    <br/>Drag tools from the left panel to add new nodes.
                    <br/>Click node ports to connect them.
                </p>
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

