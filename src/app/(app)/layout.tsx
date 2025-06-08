
"use client";

import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Home, PlusCircle, Bot, Settings, BookOpen, MessageSquare, Share2, Cog, LifeBuoy, Loader2 } from 'lucide-react';
import type { Agent, KnowledgeItem, AgentFlowDefinition } from '@/lib/types';
import { minimalInitialFlow } from '@/app/(app)/agents/[agentId]/studio/page';
import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  Timestamp, 
  query,
  writeBatch 
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";


const LOCAL_STORAGE_THEME_KEY = 'agentVerseTheme';
const AGENTS_COLLECTION = 'agents'; // Top-level collection for agents

type Theme = 'dark' | 'light';

interface AppContextType {
  agents: Agent[];
  addAgent: (agentData: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'flow'>) => Promise<Agent | null>;
  updateAgent: (agent: Agent) => Promise<void>;
  getAgent: (id: string) => Agent | undefined;
  addKnowledgeItem: (agentId: string, item: KnowledgeItem) => Promise<void>;
  updateAgentFlow: (agentId: string, flow: AgentFlowDefinition) => Promise<void>;
  getAgentFlow: (agentId: string) => AgentFlowDefinition | undefined;
  deleteAgent: (agentId: string) => Promise<void>;
  theme: Theme;
  toggleTheme: () => void;
  clearAllFirebaseData: () => Promise<void>;
  isLoadingAgents: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Helper to convert Firestore Timestamps in agent data to ISO strings for client-side state
const convertTimestampsToISO = (agent: any): Agent => {
  const newAgent = { ...agent };
  if (newAgent.createdAt && newAgent.createdAt.toDate) { // Check if it's a Firestore Timestamp
    newAgent.createdAt = newAgent.createdAt.toDate().toISOString();
  }
  if (newAgent.knowledgeItems) {
    newAgent.knowledgeItems = newAgent.knowledgeItems.map((item: any) => {
      if (item.uploadedAt && item.uploadedAt.toDate) {
        return { ...item, uploadedAt: item.uploadedAt.toDate().toISOString() };
      }
      return item;
    });
  }
  return newAgent as Agent;
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [isContextInitialized, setIsContextInitialized] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const { toast } = useToast();

  // Load theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as Theme | null;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
      setTheme(storedTheme);
    }
    if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, []);

  // Save theme to localStorage and apply to HTML tag
  useEffect(() => {
    if (isContextInitialized) { // Only run after initial theme load
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, isContextInitialized]);

  // Fetch agents from Firestore on initial load
  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoadingAgents(true);
      try {
        const q = query(collection(db, AGENTS_COLLECTION));
        const querySnapshot = await getDocs(q);
        const fetchedAgents: Agent[] = [];
        querySnapshot.forEach((doc) => {
          fetchedAgents.push(convertTimestampsToISO({ id: doc.id, ...doc.data() } as Agent));
        });
        setAgents(fetchedAgents);
      } catch (error) {
        console.error("Error fetching agents from Firestore:", error);
        toast({ title: "Error Loading Agents", description: "Could not load agent data from the database.", variant: "destructive" });
      } finally {
        setIsLoadingAgents(false);
        setIsContextInitialized(true); 
      }
    };
    fetchAgents();
  }, [toast]);


  const addAgent = useCallback(async (agentData: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'flow'>): Promise<Agent | null> => {
    try {
      const newAgentId = doc(collection(db, AGENTS_COLLECTION)).id; // Generate ID client-side for immediate use
      const newAgent: Agent = {
        ...agentData,
        id: newAgentId,
        createdAt: Timestamp.now(), // Use Firestore Timestamp
        knowledgeItems: [],
        flow: minimalInitialFlow,
      };
      
      await setDoc(doc(db, AGENTS_COLLECTION, newAgent.id), {
        ...agentData, // exclude id from data being set
        createdAt: newAgent.createdAt, // ensure it's the Timestamp object
        knowledgeItems: newAgent.knowledgeItems,
        flow: newAgent.flow
      });

      const agentForState = convertTimestampsToISO(newAgent);
      setAgents((prevAgents) => [...prevAgents, agentForState]);
      return agentForState;
    } catch (error) {
      console.error("Error adding agent to Firestore:", error);
      toast({ title: "Error Creating Agent", description: "Could not save the new agent.", variant: "destructive" });
      return null;
    }
  }, [toast]);

  const updateAgent = useCallback(async (updatedAgent: Agent) => {
    try {
      const agentRef = doc(db, AGENTS_COLLECTION, updatedAgent.id);
      // Ensure createdAt and uploadedAt are converted back to Timestamps if they are strings
      const dataToUpdate: any = { ...updatedAgent };
      delete dataToUpdate.id; // Don't store id in the document data itself

      if (typeof dataToUpdate.createdAt === 'string') {
        dataToUpdate.createdAt = Timestamp.fromDate(new Date(dataToUpdate.createdAt));
      }
      if (dataToUpdate.knowledgeItems) {
        dataToUpdate.knowledgeItems = dataToUpdate.knowledgeItems.map((item: any) => {
          if (typeof item.uploadedAt === 'string') {
            return { ...item, uploadedAt: Timestamp.fromDate(new Date(item.uploadedAt)) };
          }
          return item;
        });
      }

      await setDoc(agentRef, dataToUpdate, { merge: true }); // Use setDoc with merge for full update semantics
      
      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent.id === updatedAgent.id ? convertTimestampsToISO(updatedAgent) : agent
        )
      );
    } catch (error) {
      console.error("Error updating agent in Firestore:", error);
      toast({ title: "Error Updating Agent", description: "Could not save agent updates.", variant: "destructive" });
    }
  }, [toast]);
  
  const getAgent = useCallback((id: string) => {
    return agents.find(agent => agent.id === id);
  }, [agents]);

  const addKnowledgeItem = useCallback(async (agentId: string, item: KnowledgeItem) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) {
        toast({ title: "Agent Not Found", description: "Cannot add knowledge item.", variant: "destructive" });
        return;
    }
    try {
      const agentRef = doc(db, AGENTS_COLLECTION, agentId);
      const knowledgeItemsWithTimestamp = {
        ...item,
        uploadedAt: typeof item.uploadedAt === 'string' ? Timestamp.fromDate(new Date(item.uploadedAt)) : item.uploadedAt,
      };

      await updateDoc(agentRef, {
        knowledgeItems: [...(agent.knowledgeItems || []).map(ki => ({...ki, uploadedAt: typeof ki.uploadedAt === 'string' ? Timestamp.fromDate(new Date(ki.uploadedAt)) : ki.uploadedAt })), knowledgeItemsWithTimestamp]
      });
      
      setAgents(prevAgents =>
        prevAgents.map(a => {
          if (a.id === agentId) {
            const updatedKnowledgeItems = [...(a.knowledgeItems || []), item]; // item already has string date for state
            return { ...a, knowledgeItems: updatedKnowledgeItems };
          }
          return a;
        })
      );
    } catch (error) {
      console.error("Error adding knowledge item to Firestore:", error);
      toast({ title: "Error Adding Knowledge", description: "Could not save knowledge item.", variant: "destructive" });
    }
  }, [agents, toast]);

  const updateAgentFlow = useCallback(async (agentId: string, flow: AgentFlowDefinition) => {
    try {
      const agentRef = doc(db, AGENTS_COLLECTION, agentId);
      await updateDoc(agentRef, { flow });
      
      setAgents(prevAgents => 
        prevAgents.map(agent => {
          if (agent.id === agentId) {
            return { ...agent, flow: flow };
          }
          return agent;
        })
      );
    } catch (error) {
      console.error("Error updating agent flow in Firestore:", error);
      toast({ title: "Error Saving Flow", description: "Could not save flow changes.", variant: "destructive" });
    }
  }, [toast]);

  const getAgentFlow = useCallback((agentId: string): AgentFlowDefinition | undefined => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.flow;
  }, [agents]);

  const deleteAgent = useCallback(async (agentId: string) => {
    try {
      const agentRef = doc(db, AGENTS_COLLECTION, agentId);
      await deleteDoc(agentRef);
      setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentId));
      toast({ title: "Agent Deleted", description: "The agent has been successfully deleted." });
    } catch (error) {
      console.error("Error deleting agent from Firestore:", error);
      toast({ title: "Error Deleting Agent", description: "Could not delete the agent.", variant: "destructive" });
    }
  }, [toast]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const clearAllFirebaseData = useCallback(async () => {
    setIsLoadingAgents(true);
    try {
      const agentsCollectionRef = collection(db, AGENTS_COLLECTION);
      const querySnapshot = await getDocs(agentsCollectionRef);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setAgents([]);
      toast({ title: "Data Cleared", description: "All agent data has been removed from Firestore." });
    } catch (error) {
      console.error("Error clearing Firestore data:", error);
      toast({ title: "Error Clearing Data", description: "Could not clear all agent data.", variant: "destructive" });
    } finally {
      setIsLoadingAgents(false);
    }
  }, [toast]);


  if (!isContextInitialized && isLoadingAgents) { // Show loader until initial fetch is done
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <AppContext.Provider value={{ 
        agents, 
        addAgent, 
        updateAgent, 
        getAgent, 
        addKnowledgeItem, 
        updateAgentFlow, 
        getAgentFlow, 
        deleteAgent, 
        theme, 
        toggleTheme, 
        clearAllFirebaseData,
        isLoadingAgents 
    }}>
      <SidebarProvider defaultOpen={true}> 
        <AppSidebar />
        <div className="flex flex-col flex-1 min-h-screen">
          <AppHeader />
          <SidebarInset>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background text-foreground">
              {isLoadingAgents && !isContextInitialized ? ( // Still show loader if initial load isn't complete even if context thinks it's init
                 <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                 </div>
              ) : children }
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppContext.Provider>
  );
}

function AppHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div>
        <SidebarTrigger />
      </div>
      <div className="flex-grow" />
      <div>
         <UserNav />
      </div>
    </header>
  );
}

function AppSidebar() {
  const pathname = usePathname();
  const { theme } = useAppContext();
  const collapsed = false; // Sidebar state is now primarily managed by SidebarProvider, keeping this simple
  
  const agentIdMatch = pathname.match(/^\/agents\/([a-zA-Z0-9_-]+)/);
  const currentAgentId = agentIdMatch ? agentIdMatch[1] : null;

  const agentNavItems = currentAgentId ? [
    { href: `/agents/${currentAgentId}/studio`, label: 'Studio', icon: Cog },
    { href: `/agents/${currentAgentId}/knowledge`, label: 'Knowledge', icon: BookOpen },
    { href: `/agents/${currentAgentId}/personality`, label: 'Personality', icon: Bot },
    { href: `/agents/${currentAgentId}/test`, label: 'Test Agent', icon: MessageSquare },
    { href: `/agents/${currentAgentId}/export`, label: 'Export', icon: Share2 },
  ] : [];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Logo collapsed={collapsed} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard">
              <SidebarMenuButton isActive={pathname === '/dashboard'} tooltip={collapsed ? 'Dashboard' : undefined}>
                <Home />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/agents/create">
              <SidebarMenuButton isActive={pathname === '/agents/create'} tooltip={collapsed ? 'Create Agent' : undefined}>
                <PlusCircle />
                <span>Create Agent</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          {currentAgentId && (
            <>
              <SidebarMenuItem className="mt-4 mb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className={collapsed ? 'hidden' : ''}>Agent Menu</span>
              </SidebarMenuItem>
              {agentNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={collapsed ? item.label : undefined}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ))}
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 space-y-2">
        <Link href="/support">
          <SidebarMenuButton tooltip={collapsed ? 'Support' : undefined} isActive={pathname === '/support'}>
            <LifeBuoy />
            <span>Support</span>
          </SidebarMenuButton>
        </Link>
        <Link href="/settings">
          <SidebarMenuButton tooltip={collapsed ? 'Settings' : undefined} isActive={pathname === '/settings'}>
            <Settings />
            <span>Settings</span>
          </SidebarMenuButton>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
