
"use client";

import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Home, PlusCircle, Bot, Settings, BookOpen, MessageSquare, Share2, Cog, LifeBuoy, Loader2, LogIn } from 'lucide-react';
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
  where,
  writeBatch
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";


const LOCAL_STORAGE_THEME_KEY = 'autoBossTheme';
const AGENTS_COLLECTION = 'agents';

type Theme = 'dark' | 'light';

interface AppContextType {
  agents: Agent[];
  addAgent: (agentData: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'flow' | 'userId'>) => Promise<Agent | null>;
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

const convertTimestampsToISO = (agent: any): Agent => {
  const newAgent = { ...agent };
  if (newAgent.createdAt && newAgent.createdAt.toDate) {
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
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as Theme | null;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
      setTheme(storedTheme);
    } else {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
  }, [theme]);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        if (pathname !== '/login' && pathname !== '/signup' && !pathname.startsWith('/chat/')) {
          router.push('/login');
        } else {
          setIsLoadingAgents(false);
          setIsContextInitialized(true);
        }
      } else {
        const fetchAgents = async () => {
          if (!currentUser) return;
          setIsLoadingAgents(true);
          try {
            const q = query(collection(db, AGENTS_COLLECTION), where("userId", "==", currentUser.uid));
            const querySnapshot = await getDocs(q);
            const fetchedAgents: Agent[] = [];
            querySnapshot.forEach((doc) => {
              fetchedAgents.push(convertTimestampsToISO({ id: doc.id, ...doc.data() } as Agent));
            });
            setAgents(fetchedAgents);
          } catch (error) {
            console.error("Error fetching agents from Firestore:", error);
            toast({ title: "Error Loading Agents", description: "Could not load agent data.", variant: "destructive" });
          } finally {
            setIsLoadingAgents(false);
            setIsContextInitialized(true);
          }
        };
        fetchAgents();
      }
    }
  }, [currentUser, authLoading, router, toast, pathname]);


  const addAgent = useCallback(async (agentData: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'flow' | 'userId'>): Promise<Agent | null> => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to create an agent.", variant: "destructive" });
      return null;
    }
    try {
      const newAgentId = doc(collection(db, AGENTS_COLLECTION)).id;
      const newAgentWithUser: Agent = {
        ...agentData,
        id: newAgentId,
        userId: currentUser.uid,
        createdAt: Timestamp.now(),
        knowledgeItems: [],
        flow: minimalInitialFlow,
      };

      const { id, ...dataToSave } = newAgentWithUser;
      await setDoc(doc(db, AGENTS_COLLECTION, newAgentWithUser.id), dataToSave);

      const agentForState = convertTimestampsToISO(newAgentWithUser);
      setAgents((prevAgents) => [...prevAgents, agentForState]);
      return agentForState;
    } catch (error) {
      console.error("Error adding agent to Firestore:", error);
      toast({ title: "Error Creating Agent", description: "Could not save the new agent.", variant: "destructive" });
      return null;
    }
  }, [currentUser, toast]);

  const updateAgent = useCallback(async (updatedAgent: Agent) => {
    if (!currentUser || currentUser.uid !== updatedAgent.userId) {
      toast({ title: "Unauthorized", description: "You cannot update this agent.", variant: "destructive" });
      return;
    }
    try {
      const agentRef = doc(db, AGENTS_COLLECTION, updatedAgent.id);
      const dataToUpdate: any = { ...updatedAgent };
      delete dataToUpdate.id;

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

      await setDoc(agentRef, dataToUpdate, { merge: true });

      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent.id === updatedAgent.id ? convertTimestampsToISO(updatedAgent) : agent
        )
      );
    } catch (error) {
      console.error("Error updating agent in Firestore:", error);
      toast({ title: "Error Updating Agent", description: "Could not save agent updates.", variant: "destructive" });
    }
  }, [currentUser, toast]);

  const getAgent = useCallback((id: string) => {
    const agent = agents.find(agent => agent.id === id);
    if (agent && currentUser && agent.userId === currentUser.uid) {
        return agent;
    }
    return undefined;
  }, [agents, currentUser]);

  const addKnowledgeItem = useCallback(async (agentId: string, item: KnowledgeItem) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent || !currentUser || currentUser.uid !== agent.userId) {
        toast({ title: "Unauthorized or Agent Not Found", description: "Cannot add knowledge item.", variant: "destructive" });
        return;
    }
    try {
      const agentRef = doc(db, AGENTS_COLLECTION, agentId);

      const existingKnowledgeItemsFirestore = (agent.knowledgeItems || []).map(ki => ({
        ...ki,
        uploadedAt: typeof ki.uploadedAt === 'string' ? Timestamp.fromDate(new Date(ki.uploadedAt)) : ki.uploadedAt,
      }));

      const newKnowledgeItemFirestore = {
        ...item,
        uploadedAt: typeof item.uploadedAt === 'string' ? Timestamp.fromDate(new Date(item.uploadedAt)) : item.uploadedAt,
      };

      await updateDoc(agentRef, {
        knowledgeItems: [...existingKnowledgeItemsFirestore, newKnowledgeItemFirestore]
      });

      setAgents(prevAgents =>
        prevAgents.map(a => {
          if (a.id === agentId) {
            const updatedKnowledgeItems = [...(a.knowledgeItems || []), item];
            return { ...a, knowledgeItems: updatedKnowledgeItems };
          }
          return a;
        })
      );
    } catch (error) {
      console.error("Error adding knowledge item to Firestore:", error);
      toast({ title: "Error Adding Knowledge", description: "Could not save knowledge item.", variant: "destructive" });
    }
  }, [agents, currentUser, toast]);

  const updateAgentFlow = useCallback(async (agentId: string, flow: AgentFlowDefinition) => {
     const agent = agents.find(a => a.id === agentId);
    if (!agent || !currentUser || currentUser.uid !== agent.userId) {
        toast({ title: "Unauthorized or Agent Not Found", description: "Cannot update flow.", variant: "destructive" });
        return;
    }
    try {
      const agentRef = doc(db, AGENTS_COLLECTION, agentId);
      await updateDoc(agentRef, { flow });

      setAgents(prevAgents =>
        prevAgents.map(prevAgent => {
          if (prevAgent.id === agentId) {
            return { ...prevAgent, flow: flow };
          }
          return prevAgent;
        })
      );
    } catch (error) {
      console.error("Error updating agent flow in Firestore:", error);
      toast({ title: "Error Saving Flow", description: "Could not save flow changes.", variant: "destructive" });
    }
  }, [agents, currentUser, toast]);

  const getAgentFlow = useCallback((agentId: string): AgentFlowDefinition | undefined => {
    const agent = agents.find(a => a.id === agentId);
    if (agent && currentUser && agent.userId === currentUser.uid) {
        return agent.flow;
    }
    return undefined;
  }, [agents, currentUser]);

  const deleteAgent = useCallback(async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent || !currentUser || currentUser.uid !== agent.userId) {
        toast({ title: "Unauthorized or Agent Not Found", description: "Cannot delete agent.", variant: "destructive" });
        return;
    }
    try {
      const agentRef = doc(db, AGENTS_COLLECTION, agentId);
      await deleteDoc(agentRef);
      setAgents(prevAgents => prevAgents.filter(prevAgent => prevAgent.id !== agentId));
      toast({ title: "Agent Deleted", description: "The agent has been successfully deleted." });
    } catch (error) {
      console.error("Error deleting agent from Firestore:", error);
      toast({ title: "Error Deleting Agent", description: "Could not delete the agent.", variant: "destructive" });
    }
  }, [agents, currentUser, toast]);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => {
        const newTheme = prevTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
        return newTheme;
    });
  }, []);

  const clearAllFirebaseData = useCallback(async () => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to clear data.", variant: "destructive" });
      return;
    }
    setIsLoadingAgents(true);
    try {
      const q = query(collection(db, AGENTS_COLLECTION), where("userId", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setAgents([]);
      toast({ title: "Your Data Cleared", description: "All your agent data has been removed from Firestore." });
    } catch (error) {
      console.error("Error clearing Firestore data:", error);
      toast({ title: "Error Clearing Data", description: "Could not clear your agent data.", variant: "destructive" });
    } finally {
      setIsLoadingAgents(false);
    }
  }, [currentUser, toast]);

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
              {authLoading || (!isContextInitialized && currentUser) ? (
                 <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
                 </div>
              ) : !currentUser && !(pathname === '/login' || pathname === '/signup' || pathname.startsWith('/chat/')) ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <LogIn className="h-12 w-12 sm:h-16 sm:w-16 text-primary mb-3 sm:mb-4" />
                    <p className="text-md sm:text-lg">Redirecting to login...</p>
                </div>
              ) : (
                children
              )}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AppContext.Provider>
  );
}

function AppHeader() {
  const { state: sidebarState } = useSidebar();
  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b bg-card px-3 sm:px-4 md:px-6",
      sidebarState === "collapsed" ? "md:pl-[calc(var(--sidebar-width-icon)_+_1rem)]" : "md:pl-[calc(var(--sidebar-width)_+_1rem)]",
      "transition-all duration-300 ease-in-out"
    )}>
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <div className="hidden md:block">
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
  const { state: sidebarState, isMobile, setOpenMobile } = useSidebar(); 
  const collapsed = !isMobile && sidebarState === 'collapsed'; 
  const { currentUser } = useAuth();

  const handleMobileLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const agentIdMatch = pathname.match(/^\/agents\/([a-zA-Z0-9_-]+)/);
  const currentAgentId = agentIdMatch ? agentIdMatch[1] : null;

  const agentNavItems = currentAgentId ? [
    { href: `/agents/${currentAgentId}/studio`, label: 'Studio', icon: Cog },
    { href: `/agents/${currentAgentId}/knowledge`, label: 'Knowledge', icon: BookOpen },
    { href: `/agents/${currentAgentId}/personality`, label: 'Personality', icon: Bot },
    { href: `/agents/${currentAgentId}/test`, label: 'Test Agent', icon: MessageSquare },
    { href: `/agents/${currentAgentId}/export`, label: 'Export', icon: Share2 },
  ] : [];

  if (!currentUser && !(pathname.startsWith('/chat/'))) { 
    return <Sidebar><SidebarHeader className="p-3 sm:p-4"><Link href="/" aria-label="AutoBoss Homepage" className="hover:opacity-80 transition-opacity"><Logo collapsed={collapsed} className="h-7 sm:h-8 px-1 sm:px-2 py-1"/></Link></SidebarHeader></Sidebar>;
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-3 sm:p-4">
        <Link href="/dashboard" className="hover:opacity-80 transition-opacity" aria-label="AutoBoss Homepage" onClick={handleMobileLinkClick}>
            <Logo collapsed={collapsed} className="h-7 sm:h-8 px-1 sm:px-2 py-1"/>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" onClick={handleMobileLinkClick}>
              <SidebarMenuButton isActive={pathname === '/dashboard'} tooltip={collapsed ? 'Dashboard' : undefined}>
                <Home />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/agents/create" onClick={handleMobileLinkClick}>
              <SidebarMenuButton isActive={pathname === '/agents/create'} tooltip={collapsed ? 'Create Agent' : undefined}>
                <PlusCircle />
                <span>Create Agent</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          {currentAgentId && (
            <>
              <SidebarMenuItem className="mt-3 sm:mt-4 mb-1 px-2 sm:px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className={collapsed ? 'hidden' : ''}>Agent Menu</span>
              </SidebarMenuItem>
              {agentNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} onClick={handleMobileLinkClick}>
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
      <SidebarFooter className="p-3 sm:p-4 space-y-1 sm:space-y-2">
        <Link href="/support" onClick={handleMobileLinkClick}>
          <SidebarMenuButton tooltip={collapsed ? 'Support' : undefined} isActive={pathname === '/support'}>
            <LifeBuoy />
            <span>Support</span>
          </SidebarMenuButton>
        </Link>
        <Link href="/settings" onClick={handleMobileLinkClick}>
          <SidebarMenuButton tooltip={collapsed ? 'Settings' : undefined} isActive={pathname === '/settings'}>
            <Settings />
            <span>Settings</span>
          </SidebarMenuButton>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
