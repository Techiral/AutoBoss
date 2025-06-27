
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import type { Conversation, ChatMessage, Agent } from "@/lib/types";
import { useAppContext } from "../../../layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Bot, User, MessageCircle, ChevronsRight, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const convertFirestoreTimestamp = (data: any): Conversation => {
  const newData: any = { ...data };
  if (newData.createdAt && newData.createdAt.toDate) {
    newData.createdAt = newData.createdAt.toDate().toISOString();
  }
  if (newData.updatedAt && newData.updatedAt.toDate) {
    newData.updatedAt = newData.updatedAt.toDate().toISOString();
  }
  return newData as Conversation;
};

function AnalyticsKPICard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const params = useParams();
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const { getAgent, isLoadingAgents } = useAppContext();
  const { currentUser, loading: authLoading } = useAuth();
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoadingAgents || authLoading) {
      return; // Wait until dependencies are ready
    }

    if (!agentId) {
      setError("Agent ID is missing.");
      setIsLoading(false);
      return;
    }

    if (!currentUser) {
      setError("User not authenticated.");
      setIsLoading(false);
      return;
    }

    const currentAgent = getAgent(agentId);
    setAgent(currentAgent || null);

    if (!currentAgent) {
      setError("Agent not found.");
      setIsLoading(false);
      return;
    }

    const fetchConversations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, "conversations"),
          where("agentId", "==", agentId),
          where("userId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedConversations = querySnapshot.docs.map(doc => convertFirestoreTimestamp({ id: doc.id, ...doc.data() }));
        
        fetchedConversations.sort((a, b) => {
            const dateA = new Date(a.createdAt as string).getTime();
            const dateB = new Date(b.createdAt as string).getTime();
            return dateB - dateA;
        });

        setConversations(fetchedConversations);
        if (fetchedConversations.length > 0) {
          setSelectedConversation(fetchedConversations[0]);
        }
      } catch (e: any) {
        console.error("Error fetching conversations:", e);
        let errorMessage = `Failed to load conversations: ${e.message}.`;
        if (e.code === 'failed-precondition') {
          errorMessage += " This is likely because a database index is required. Please check the browser's developer console for a link to create it automatically.";
        } else if (e.code === 'permission-denied') {
           errorMessage += " You do not have permission to view this data.";
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [agentId, getAgent, isLoadingAgents, currentUser, authLoading]);

  const totalConversations = agent?.analytics?.totalConversations ?? conversations.length;
  const totalMessages = agent?.analytics?.totalMessages ?? conversations.reduce((acc, curr) => acc + (curr.messageCount || curr.messages.length), 0);

  if (isLoadingAgents || authLoading) {
    return <Card className="p-6"><Loader2 className="animate-spin" /> Loading agent details...</Card>;
  }

  if (!agent) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Agent Not Found</AlertTitle>
        <AlertDescription>The agent with this ID could not be loaded.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsKPICard title="Total Conversations" value={totalConversations} icon={MessageCircle} />
        <AnalyticsKPICard title="Total Messages" value={totalMessages} icon={ChevronsRight} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-280px)]">
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>Select a conversation to view the transcript.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-2">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <FileText className="w-10 h-10 mb-2"/>
                <p className="text-sm font-medium">No Conversations Found</p>
                <p className="text-xs">This agent hasn't had any conversations yet. Test it out!</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-1 p-1">
                  {conversations.map(convo => (
                    <Button
                      key={convo.id}
                      variant="ghost"
                      onClick={() => setSelectedConversation(convo)}
                      className={cn(
                        "w-full h-auto justify-start text-left p-2 space-y-1 flex-col items-start",
                        selectedConversation?.id === convo.id && "bg-secondary"
                      )}
                    >
                      <p className="text-xs font-semibold">{format(new Date(convo.createdAt as string), "MMM d, yyyy - h:mm a")}</p>
                      <p className="text-xs text-muted-foreground truncate w-full">
                        {convo.messages[0]?.text || "Conversation started..."}
                      </p>
                      <p className="text-xs text-muted-foreground">{convo.messages.length} messages</p>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>
                {selectedConversation ? `Conversation from ${format(new Date(selectedConversation.createdAt as string), "PPP p")}` : "No conversation selected."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
             <ScrollArea className="h-full pr-4">
               {selectedConversation ? (
                  <div className="space-y-4">
                    {selectedConversation.messages.map(message => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex items-end gap-2",
                          message.sender === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {message.sender === "agent" && (
                          <Avatar className="h-8 w-8"><AvatarFallback><Bot size={18} /></AvatarFallback></Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[75%] rounded-lg p-3 text-sm",
                            message.sender === "user" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.text}</p>
                           <p className="text-xs opacity-70 mt-1.5">{format(new Date(message.timestamp), "h:mm:ss a")}</p>
                        </div>
                        {message.sender === "user" && (
                           <Avatar className="h-8 w-8"><AvatarFallback><User size={18} /></AvatarFallback></Avatar>
                        )}
                      </div>
                    ))}
                  </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <p className="text-sm">Select a conversation from the left to see the details.</p>
                </div>
               )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
