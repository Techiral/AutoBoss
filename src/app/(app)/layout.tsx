
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
import { Home, PlusCircle, Bot, Settings, BookOpen, MessageSquare, Share2, Cog, LifeBuoy, Loader2, LogIn, LayoutGrid, Briefcase } from 'lucide-react';
import type { Agent, KnowledgeItem, AgentToneType, Client } from '@/lib/types';
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
const CLIENTS_COLLECTION = 'clients';


type Theme = 'dark' | 'light';

interface AppContextType {
  clients: Client[];
  agents: Agent[];
  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'userId'>) => Promise<Client | null>;
  getClientById: (id: string) => Client | undefined;
  deleteClient: (clientId: string) => Promise<void>; // TODO: Consider if this should delete associated agents
  addAgent: (agentData: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'userId' | 'clientId' | 'clientName'>, clientId: string, clientName: string) => Promise<Agent | null>;
  updateAgent: (agent: Agent) => Promise<void>;
  getAgent: (id: string) => Agent | undefined;
  addKnowledgeItem: (agentId: string, item: KnowledgeItem) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  theme: Theme;
  toggleTheme: () => void;
  clearAllFirebaseData: () => Promise<void>;
  isLoadingAgents: boolean;
  isLoadingClients: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

const convertFirestoreTimestampToISO = (data: any, fields: string[]): any => {
  const newData = { ...data };
  fields.forEach(field => {
    if (newData[field] && newData[field].toDate) {
      newData[field] = newData[field].toDate().toISOString();
    }
  });
  if (newData.knowledgeItems) {
    newData.knowledgeItems = newData.knowledgeItems.map((item: any) => {
      if (item.uploadedAt && item.uploadedAt.toDate) {
        return { ...item, uploadedAt: item.uploadedAt.toDate().toISOString() };
      }
      return item;
    });
  }
  return newData;
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [isContextInitialized, setIsContextInitialized] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
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
    if (authLoading) {
      setIsLoadingAgents(false);
      setIsLoadingClients(false);
      setIsContextInitialized(false);
      return;
    }
    if (!currentUser) {
      if (pathname !== '/login' && pathname !== '/signup' && !pathname.startsWith('/chat/')) {
        router.push('/login');
      } else {
        setIsLoadingAgents(false);
        setIsLoadingClients(false);
        setIsContextInitialized(true);
      }
    } else {
      const fetchData = async () => {
        if (!currentUser) return;
        setIsLoadingAgents(true);
        setIsLoadingClients(true);
        try {
          // Fetch Clients
          const clientQuery = query(collection(db, CLIENTS_COLLECTION), where("userId", "==", currentUser.uid));
          const clientSnapshot = await getDocs(clientQuery);
          const fetchedClients: Client[] = [];
          clientSnapshot.forEach((doc) => {
            fetchedClients.push(convertFirestoreTimestampToISO({ id: doc.id, ...doc.data() }, ['createdAt']) as Client);
          });
          setClients(fetchedClients);
          setIsLoadingClients(false);

          // Fetch Agents
          const agentQuery = query(collection(db, AGENTS_COLLECTION), where("userId", "==", currentUser.uid));
          const agentSnapshot = await getDocs(agentQuery);
          const fetchedAgents: Agent[] = [];
          agentSnapshot.forEach((doc) => {
            const agentData = { id: doc.id, ...doc.data() } as Agent;
            if ('flow' in agentData) {
              delete (agentData as any).flow;
            }
            fetchedAgents.push(convertFirestoreTimestampToISO(agentData, ['createdAt']) as Agent);
          });
          setAgents(fetchedAgents);
          setIsLoadingAgents(false);

        } catch (error) {
          console.error("Error fetching data from Firestore:", error);
          toast({ title: "Error Loading Data", description: "Could not load your workspace data.", variant: "destructive" });
          setIsLoadingAgents(false);
          setIsLoadingClients(false);
        } finally {
          setIsContextInitialized(true);
        }
      };
      fetchData();
    }
  }, [currentUser, authLoading, router, toast, pathname]);

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'userId'>): Promise<Client | null> => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to add a client.", variant: "destructive" });
      return null;
    }
    try {
      const newClientId = doc(collection(db, CLIENTS_COLLECTION)).id;
      const newClientWithUser: Client = {
        ...clientData,
        id: newClientId,
        userId: currentUser.uid,
        createdAt: Timestamp.now() as any, // Firestore Timestamp
      };
      const { id, ...dataToSave } = newClientWithUser;
      await setDoc(doc(db, CLIENTS_COLLECTION, newClientId), dataToSave);
      const clientForState = convertFirestoreTimestampToISO(newClientWithUser, ['createdAt']) as Client;
      setClients((prevClients) => [...prevClients, clientForState]);
      return clientForState;
    } catch (error) {
      console.error("Error adding client to Firestore:", error);
      toast({ title: "Error Adding Client", description: "Could not save the new client.", variant: "destructive" });
      return null;
    }
  }, [currentUser, toast]);

  const getClientById = useCallback((id: string) => {
    return clients.find(client => client.id === id && client.userId === currentUser?.uid);
  }, [clients, currentUser]);

  const deleteClient = useCallback(async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || !currentUser || currentUser.uid !== client.userId) {
      toast({ title: "Unauthorized or Client Not Found", description: "Cannot delete client.", variant: "destructive" });
      return;
    }
    try {
      await deleteDoc(doc(db, CLIENTS_COLLECTION, clientId));
      setClients(prev => prev.filter(c => c.id !== clientId));
      // Optionally, delete associated agents here or handle it via a separate mechanism/prompt
      toast({ title: "Client Deleted", description: "The client has been successfully deleted." });
    } catch (error) {
      console.error("Error deleting client from Firestore:", error);
      toast({ title: "Error Deleting Client", variant: "destructive" });
    }
  }, [clients, currentUser, toast]);


  const addAgent = useCallback(async (
    agentData: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'userId' | 'clientId' | 'clientName'>,
    clientId: string,
    clientName: string
  ): Promise<Agent | null> => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to create an agent.", variant: "destructive" });
      return null;
    }
    try {
      const newAgentId = doc(collection(db, AGENTS_COLLECTION)).id;
      const newAgentWithDetails: Agent = {
        ...agentData,
        id: newAgentId,
        userId: currentUser.uid,
        clientId: clientId,
        clientName: clientName,
        createdAt: Timestamp.now() as any, // Firestore Timestamp
        knowledgeItems: [],
        agentTone: agentData.agentTone || "neutral",
      };

      const { id, ...dataToSave } = newAgentWithDetails;
      const saveData = {
        ...dataToSave,
        createdAt: dataToSave.createdAt instanceof Timestamp ? dataToSave.createdAt : Timestamp.fromDate(new Date(dataToSave.createdAt as string))
      };

      await setDoc(doc(db, AGENTS_COLLECTION, newAgentId), saveData);
      const agentForState = convertFirestoreTimestampToISO(newAgentWithDetails, ['createdAt']) as Agent;
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
      const { id, ...dataToUpdate } = updatedAgent;

      const finalDataToUpdate: any = { ...dataToUpdate };
      if (typeof finalDataToUpdate.createdAt === 'string') {
        finalDataToUpdate.createdAt = Timestamp.fromDate(new Date(finalDataToUpdate.createdAt));
      }
      if (finalDataToUpdate.knowledgeItems) {
        finalDataToUpdate.knowledgeItems = finalDataToUpdate.knowledgeItems.map((item: any) => {
          if (typeof item.uploadedAt === 'string') {
            return { ...item, uploadedAt: Timestamp.fromDate(new Date(item.uploadedAt)) };
          }
          return item;
        });
      }
      finalDataToUpdate.agentTone = finalDataToUpdate.agentTone || "neutral";
      if ('flow' in finalDataToUpdate) delete finalDataToUpdate.flow;

      await setDoc(agentRef, finalDataToUpdate, { merge: true });
      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent.id === updatedAgent.id ? convertFirestoreTimestampToISO(updatedAgent, ['createdAt']) as Agent : agent
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

  const deleteAgent = useCallback(async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent || !currentUser || currentUser.uid !== agent.userId) {
        toast({ title: "Unauthorized or Agent Not Found", description: "Cannot delete agent.", variant: "destructive" });
        return;
    }
    try {
      await deleteDoc(doc(db, AGENTS_COLLECTION, agentId));
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
    setIsLoadingClients(true);
    try {
      const batch = writeBatch(db);
      const agentQuery = query(collection(db, AGENTS_COLLECTION), where("userId", "==", currentUser.uid));
      const agentSnapshot = await getDocs(agentQuery);
      agentSnapshot.forEach((doc) => batch.delete(doc.ref));

      const clientQuery = query(collection(db, CLIENTS_COLLECTION), where("userId", "==", currentUser.uid));
      const clientSnapshot = await getDocs(clientQuery);
      clientSnapshot.forEach((doc) => batch.delete(doc.ref));
      
      await batch.commit();
      setAgents([]);
      setClients([]);
      toast({ title: "Your Data Cleared", description: "All your client and agent data has been removed from Firestore." });
    } catch (error) {
      console.error("Error clearing Firestore data:", error);
      toast({ title: "Error Clearing Data", description: "Could not clear your data.", variant: "destructive" });
    } finally {
      setIsLoadingAgents(false);
      setIsLoadingClients(false);
    }
  }, [currentUser, toast]);

  const renderContent = () => {
    if (authLoading || (isLoadingAgents && isLoadingClients && currentUser) ) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <Logo className="mb-4 h-8 sm:h-10" />
          <Loader2 className="h-8 w-8 sm:h-10 sm:h-10 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      );
    }
    if (!authLoading && !currentUser && !(pathname === '/login' || pathname === '/signup' || pathname.startsWith('/chat/'))) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
            <LogIn className="h-10 w-10 sm:h-12 sm:h-12 text-primary mb-3" />
            <p className="text-md sm:text-lg">Redirecting to login...</p>
        </div>
      );
    }
    if (isContextInitialized || ( (!authLoading && !currentUser) && (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/chat/')) ) ) {
      return children;
    }
    return (
       <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-10 w-10 sm:h-12 sm:h-12 animate-spin text-primary" />
       </div>
    );
  };


  return (
    <AppContext.Provider value={{
        clients,
        agents,
        addClient,
        getClientById,
        deleteClient,
        addAgent,
        updateAgent,
        getAgent,
        addKnowledgeItem,
        deleteAgent,
        theme,
        toggleTheme,
        clearAllFirebaseData,
        isLoadingAgents,
        isLoadingClients,
    }}>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <div className="flex flex-col flex-1 min-h-screen">
          <AppHeader />
          <SidebarInset>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background text-foreground">
              {renderContent()}
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
  const { currentUser, loading: authLoading } = useAuth();
  const { getAgent, isLoadingAgents: isAppContextLoading, getClientById, isLoadingClients } = useAppContext();

  const handleMobileLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const agentIdMatch = pathname.match(/^\/agents\/([a-zA-Z0-9_-]+)/);
  const currentAgentId = agentIdMatch ? agentIdMatch[1] : null;
  const clientIdMatch = pathname.match(/^\/clients\/([a-zA-Z0-9_-]+)/);
  const currentClientId = clientIdMatch ? clientIdMatch[1] : null;


  const [currentAgent, setCurrentAgent] = useState<Agent | undefined>(undefined);
  const [currentClient, setCurrentClient] = useState<Client | undefined>(undefined);


  useEffect(() => {
    if (currentAgentId && !isAppContextLoading) {
      setCurrentAgent(getAgent(currentAgentId));
    } else if (!currentAgentId) {
      setCurrentAgent(undefined);
    }
  }, [currentAgentId, getAgent, isAppContextLoading]);

  useEffect(() => {
    if (currentClientId && !isLoadingClients) {
      setCurrentClient(getClientById(currentClientId));
    } else if (!currentClientId) {
      setCurrentClient(undefined);
    }
  }, [currentClientId, getClientById, isLoadingClients]);


  let agentNavItems: { href: string; label: string; icon: React.ElementType }[] = [];
  if (currentAgentId && currentAgent) {
    agentNavItems = [
      { href: `/agents/${currentAgentId}/personality`, label: 'Personality', icon: Bot },
      { href: `/agents/${currentAgentId}/knowledge`, label: 'Knowledge', icon: BookOpen },
      { href: `/agents/${currentAgentId}/test`, label: 'Test Agent', icon: MessageSquare },
      { href: `/agents/${currentAgentId}/export`, label: 'Export', icon: Share2 },
    ];
  }

  if (!currentUser && !(pathname.startsWith('/chat/'))) {
    return <Sidebar><SidebarHeader className="p-3 sm:p-4"><Link href="/" aria-label="AutoBoss Homepage" className="hover:opacity-80 transition-opacity"><Logo collapsed={collapsed} className="h-7 sm:h-8 px-1 sm:px-2 py-1"/></Link></SidebarHeader></Sidebar>;
  }

  const isDataLoading = authLoading || (currentAgentId && isAppContextLoading) || (currentClientId && isLoadingClients);

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
              <SidebarMenuButton isActive={pathname === '/dashboard'} tooltip={collapsed ? 'Client Dashboard' : undefined}>
                <Home />
                <span>Client Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <Link href="/templates" onClick={handleMobileLinkClick}>
              <SidebarMenuButton isActive={pathname === '/templates'} tooltip={collapsed ? 'Agent Templates' : undefined}>
                <LayoutGrid />
                <span>Templates</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          {/* Remove direct "Create Agent" link from main sidebar, it's now context-dependent */}

          {isDataLoading && currentClientId && (
            <>
              <SidebarMenuItem className="mt-3 sm:mt-4 mb-1 px-2 sm:px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className={collapsed ? 'hidden' : ''}>Client Menu</span>
              </SidebarMenuItem>
               <SidebarMenuItem className="px-2">
                  <div className="h-8 w-full bg-muted/50 animate-pulse rounded-md my-0.5"></div>
              </SidebarMenuItem>
            </>
          )}

          {!isDataLoading && currentClient && (
             <>
              <SidebarMenuItem className="mt-3 sm:mt-4 mb-1 px-2 sm:px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className={collapsed ? 'hidden' : ''}>{currentClient.name}</span>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href={`/clients/${currentClient.id}/dashboard`} onClick={handleMobileLinkClick}>
                  <SidebarMenuButton isActive={pathname === `/clients/${currentClient.id}/dashboard`} tooltip={collapsed ? 'Client Agents' : undefined}>
                    <Briefcase />
                    <span>Agents for Client</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              {/* Future: Add client settings link here */}
            </>
          )}


          {isDataLoading && currentAgentId && (
             <>
              <SidebarMenuItem className="mt-3 sm:mt-4 mb-1 px-2 sm:px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className={collapsed ? 'hidden' : ''}>Agent Menu</span>
              </SidebarMenuItem>
              {[...Array(3)].map((_, i) => (
                <SidebarMenuItem key={`skeleton-agent-${i}`} className="px-2">
                    <div className="h-8 w-full bg-muted/50 animate-pulse rounded-md my-0.5"></div>
                </SidebarMenuItem>
              ))}
            </>
          )}

          {!isDataLoading && currentAgentId && agentNavItems.length > 0 && (
            <>
              <SidebarMenuItem className="mt-3 sm:mt-4 mb-1 px-2 sm:px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span className={collapsed ? 'hidden' : ''}>Configure Agent</span>
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
