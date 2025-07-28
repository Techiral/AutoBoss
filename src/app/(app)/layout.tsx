
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
import { Home, Bot, Settings, BookOpen, MessageSquare, Share2, Cog, LifeBuoy, Loader2, LogIn, LayoutGrid, Briefcase, MessageSquarePlus, Library, HelpCircleIcon } from 'lucide-react';
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
  writeBatch,
  getDoc,
} from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";


const LOCAL_STORAGE_THEME_KEY = 'autoBossTheme';
const AGENTS_COLLECTION = 'agents';
const CLIENTS_COLLECTION = 'clients';
const DEFAULT_CLIENT_ID = 'default_workspace';


type Theme = 'dark' | 'light';

interface AppContextType {
  clients: Client[];
  agents: Agent[];
  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'userId'>) => Promise<Client | null>;
  getClientById: (id: string) => Client | undefined;
  deleteClient: (clientId: string) => Promise<void>;
  addAgent: (agentData: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'userId' | 'clientId' | 'clientName'>, agentCreationResult: { agentName: string; agentPersona: string; agentGreeting: string; }) => Promise<Agent | null>;
  updateAgent: (agent: Agent) => Promise<void>;
  getAgent: (id: string) => Agent | undefined;
  addKnowledgeItem: (agentId: string, item: KnowledgeItem) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  theme: Theme;
  toggleTheme: () => void;
  clearAllFirebaseData: () => Promise<void>;
  isLoadingAgents: boolean;
  isLoadingClients: boolean;
  currentUserUidOnLoad: string | null; // For debugging
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
      if (item.uploadedAt && typeof item.uploadedAt === 'object' && item.uploadedAt._seconds) { // Handle already serialized-like structure if any
         return { ...item, uploadedAt: new Date(item.uploadedAt._seconds * 1000).toISOString() };
      }
      return item;
    });
  }
   if (newData.sharedAt && newData.sharedAt.toDate) {
    newData.sharedAt = newData.sharedAt.toDate().toISOString();
  }
  return newData;
};


export function AppProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [theme, setTheme] = useState<Theme>('dark');
  const [isContextInitialized, setIsContextInitialized] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [currentUserUidOnLoad, setCurrentUserUidOnLoad] = useState<string | null>(null);
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

  const isPublicPage = (path: string) => {
    const publicPaths = ['/login', '/signup', '/playbook', '/templates', '/support', '/'];
    const publicPrefixes = ['/chat/', '/showcase'];
    return publicPaths.includes(path) || publicPrefixes.some(prefix => path.startsWith(prefix));
  };


  useEffect(() => {
    if (authLoading) {
      // Don't set loading to false here, let the auth state change handle it
      console.log("AppLayout: Auth loading, waiting...");
      setIsContextInitialized(false);
      return;
    }
    if (!currentUser) {
       console.log("AppLayout: No current user, authLoading is false.");
      if (!isPublicPage(pathname)) {
        console.log("AppLayout: Redirecting to login from", pathname);
        router.push('/login');
      } else {
        setIsLoadingAgents(false);
        setIsLoadingClients(false);
        setIsContextInitialized(true);
      }
    } else {
      console.log("AppLayout: Current user found (UID:", currentUser.uid, "), fetching data.");
      setCurrentUserUidOnLoad(currentUser.uid); // Store UID for logging
      const fetchData = async () => {
        if (!currentUser || !currentUser.uid) { // Explicitly check currentUser.uid
          console.error("AppLayout: fetchData called but currentUser or currentUser.uid is null/undefined. UID:", currentUser?.uid);
          setIsLoadingAgents(false);
          setIsLoadingClients(false);
          setIsContextInitialized(true); // Mark as initialized to prevent infinite loading screen
          toast({ title: "Authentication Error", description: "Could not verify user. Please try logging in again.", variant: "destructive" });
          router.push('/login'); // Redirect to login if critical auth info is missing
          return;
        }
        
        console.log("AppLayout: Fetching data for user:", currentUser.uid);
        setIsLoadingAgents(true);
        setIsLoadingClients(true);
        try {
          // Fetch Clients
          console.log("AppLayout: Querying clients for userId:", currentUser.uid);
          const clientQuery = query(collection(db, CLIENTS_COLLECTION), where("userId", "==", currentUser.uid));
          const clientSnapshot = await getDocs(clientQuery);
          const fetchedClients: Client[] = [];
          clientSnapshot.forEach((doc) => {
            fetchedClients.push(convertFirestoreTimestampToISO({ id: doc.id, ...doc.data() }, ['createdAt']) as Client);
          });
          setClients(fetchedClients);
          console.log("AppLayout: Fetched clients:", fetchedClients.length);
          setIsLoadingClients(false);

          // Fetch Agents
          console.log("AppLayout: Querying agents for userId:", currentUser.uid);
          const agentQuery = query(collection(db, AGENTS_COLLECTION), where("userId", "==", currentUser.uid));
          const agentSnapshot = await getDocs(agentQuery);
          const fetchedAgents: Agent[] = [];
          agentSnapshot.forEach((doc) => {
            const agentData = { id: doc.id, ...doc.data() } as Agent;
            if ('flow' in agentData) {
              delete (agentData as any).flow;
            }
            fetchedAgents.push(convertFirestoreTimestampToISO(agentData, ['createdAt', 'sharedAt']) as Agent);
          });
          setAgents(fetchedAgents);
          console.log("AppLayout: Fetched agents:", fetchedAgents.length);
          setIsLoadingAgents(false);

        } catch (error: any) {
          console.error("AppLayout: Error fetching data from Firestore:", error.message, error.code, error.stack);
          toast({ title: "Error Loading Workspace", description: `Could not load your data: ${error.message}. Please check console for details.`, variant: "destructive" });
          setIsLoadingAgents(false);
          setIsLoadingClients(false);
        } finally {
          setIsContextInitialized(true);
           console.log("AppLayout: Data fetching process complete. isContextInitialized:", true);
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
      const newClientTimestamp = Timestamp.now();

      const dataToSave: Client = {
        id: newClientId,
        userId: currentUser.uid,
        name: clientData.name,
        website: clientData.website || "",
        description: clientData.description || "",
        createdAt: newClientTimestamp,
      };

      await setDoc(doc(db, CLIENTS_COLLECTION, newClientId), dataToSave);
      
      const clientForState = convertFirestoreTimestampToISO(dataToSave, ['createdAt']) as Client;
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
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
    try {
        const clientSnap = await getDoc(clientRef);
        if (!clientSnap.exists() || clientSnap.data().userId !== currentUser.uid) {
            toast({ title: "Unauthorized or Client Not Found", description: "Cannot delete client.", variant: "destructive" });
            return;
        }
        const clientName = clientSnap.data().name;

        const batch = writeBatch(db);
        const agentsQuery = query(collection(db, AGENTS_COLLECTION), where("clientId", "==", clientId), where("userId", "==", currentUser.uid));
        const agentsSnapshot = await getDocs(agentsQuery);
        
        const agentIdsToDelete: string[] = [];
        agentsSnapshot.forEach(agentDoc => {
            batch.delete(agentDoc.ref);
            agentIdsToDelete.push(agentDoc.id);
        });

        batch.delete(clientRef);
        await batch.commit();

        setClients(prev => prev.filter(c => c.id !== clientId));
        setAgents(prevAgents => prevAgents.filter(a => !agentIdsToDelete.includes(a.id)));
        
        toast({ title: "Client & Agents Deleted", description: `Client "${clientName}" and all associated agents have been deleted.` });
    } catch (error) {
        console.error("Error deleting client and agents from Firestore:", error);
        toast({ title: "Error Deleting Client", description: "Could not complete the deletion process.", variant: "destructive" });
    }
  }, [currentUser, toast]);


  const addAgent = useCallback(async (
    agentData: Omit<Agent, 'id' | 'createdAt' | 'knowledgeItems' | 'userId' | 'clientId' | 'clientName'>,
    agentCreationResult: { agentName: string; agentPersona: string; agentGreeting: string; },
    clientId?: string,
  ): Promise<Agent | null> => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to create an agent.", variant: "destructive" });
      return null;
    }

    let finalClientId = clientId;
    let finalClientName = "";

    // If no client ID is provided, create/use the default workspace.
    if (!finalClientId) {
        const defaultClientRef = doc(db, CLIENTS_COLLECTION, `${currentUser.uid}_${DEFAULT_CLIENT_ID}`);
        const defaultClientSnap = await getDoc(defaultClientRef);

        if (!defaultClientSnap.exists()) {
            finalClientId = defaultClientRef.id;
            finalClientName = 'My Workspace';
            const newClientData = {
                id: finalClientId,
                userId: currentUser.uid,
                name: finalClientName,
                description: 'Default workspace for your agents.',
                createdAt: Timestamp.now(),
            };
            await setDoc(defaultClientRef, newClientData);
            const clientForState = convertFirestoreTimestampToISO(newClientData, ['createdAt']) as Client;
            setClients(prev => [...prev, clientForState]);
        } else {
            finalClientId = defaultClientSnap.id;
            finalClientName = defaultClientSnap.data().name;
        }
    } else {
        const client = getClientById(finalClientId);
        if (client) {
            finalClientName = client.name;
        } else {
            toast({ title: "Client Error", description: `Client with ID ${finalClientId} not found.`, variant: "destructive" });
            return null;
        }
    }
    
    if (!finalClientId) {
        toast({ title: "Client Error", description: "Could not determine a client for the agent.", variant: "destructive" });
        return null;
    }

    try {
      const newAgentId = doc(collection(db, AGENTS_COLLECTION)).id;
      
      const newAgent: Agent = {
        ...agentData,
        id: newAgentId,
        userId: currentUser.uid, // CRITICAL: Ensure userId is set
        clientId: finalClientId,
        clientName: finalClientName,
        createdAt: Timestamp.now() as any,
        knowledgeItems: [],
        generatedName: agentCreationResult.agentName,
        generatedPersona: agentCreationResult.agentPersona,
        generatedGreeting: agentCreationResult.agentGreeting,
        agentTone: agentData.agentTone || "neutral",
        voiceName: agentData.voiceName === 'default' ? null : (agentData.voiceName || null),
        isPubliclyShared: agentData.isPubliclyShared || false,
        sharedAt: agentData.isPubliclyShared ? Timestamp.now() : null,
      };
      
      const { id, ...dataToSave } = newAgent;
      
      const saveDataForFirestore = {
        ...dataToSave,
        createdAt: newAgent.createdAt, // This is already a Timestamp
        sharedAt: newAgent.sharedAt,   // This is already a Timestamp or null
      };

      await setDoc(doc(db, AGENTS_COLLECTION, newAgentId), saveDataForFirestore);

      const agentForState = convertFirestoreTimestampToISO(newAgent, ['createdAt', 'sharedAt']) as Agent;
      setAgents((prevAgents) => [...prevAgents, agentForState]);
      return agentForState;
    } catch (error) {
      console.error("Error adding agent to Firestore:", error);
      toast({ title: "Error Creating Agent", description: `Could not save the new agent. Error: ${(error as Error).message}`, variant: "destructive" });
      return null;
    }
  }, [currentUser, toast, getClientById]);


  const updateAgent = useCallback(async (agentToUpdate: Agent) => {
    if (!currentUser || currentUser.uid !== agentToUpdate.userId) {
      toast({ title: "Unauthorized", description: "You cannot update this agent.", variant: "destructive" });
      throw new Error("Unauthorized");
    }
    
    try {
      const agentRef = doc(db, AGENTS_COLLECTION, agentToUpdate.id);
      
      const { id, ...dataToSave } = agentToUpdate;

      const saveData: {[key:string]: any} = { ...dataToSave };
      
      // Convert date strings back to Timestamps for Firestore
      if (typeof saveData.createdAt === 'string') {
        saveData.createdAt = Timestamp.fromDate(new Date(saveData.createdAt));
      }
      if (saveData.sharedAt && typeof saveData.sharedAt === 'string') {
         saveData.sharedAt = Timestamp.fromDate(new Date(saveData.sharedAt));
      }
      if (saveData.knowledgeItems) {
        saveData.knowledgeItems = saveData.knowledgeItems.map((item: any) => ({
          ...item,
          uploadedAt: typeof item.uploadedAt === 'string' ? Timestamp.fromDate(new Date(item.uploadedAt)) : item.uploadedAt,
        }));
      }
      
      // Ensure voiceName is not undefined
      if (saveData.voiceName === undefined) {
          saveData.voiceName = null;
      }

      await setDoc(agentRef, saveData, { merge: true });

      setAgents((prevAgents) =>
        prevAgents.map((agent) =>
          agent.id === agentToUpdate.id ? convertFirestoreTimestampToISO(agentToUpdate, ['createdAt', 'sharedAt']) as Agent : agent
        )
      );

    } catch (error: any) {
      console.error("Error updating agent:", error);
      let errorMessage = error.message || "Could not save agent updates.";
      if (error.code === 'resource-exhausted') {
        errorMessage = "The image is too large to save. Please use an image under 100KB.";
      }
      toast({ title: "Error Updating Agent", description: errorMessage, variant: "destructive" });
      throw error;
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
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to delete an agent.", variant: "destructive" });
      return;
    }

    const agentRef = doc(db, AGENTS_COLLECTION, agentId);

    try {
      const agentSnap = await getDoc(agentRef);

      if (!agentSnap.exists()) {
        toast({ title: "Agent Not Found", description: "The agent may have already been deleted.", variant: "destructive" });
        setAgents(prevAgents => prevAgents.filter(prevAgent => prevAgent.id !== agentId));
        return;
      }

      const agentData = agentSnap.data();
      if (agentData.userId !== currentUser.uid) {
        toast({ title: "Unauthorized", description: "You do not have permission to delete this agent.", variant: "destructive" });
        return;
      }

      await deleteDoc(agentRef);

      setAgents(prevAgents => prevAgents.filter(prevAgent => prevAgent.id !== agentId));
      
      toast({ title: "Agent Deleted", description: `Agent "${agentData.name || agentId}" has been successfully deleted.` });

    } catch (error) {
      console.error("Error deleting agent from Firestore:", error);
      toast({ title: "Error Deleting Agent", description: "Could not delete the agent from the database.", variant: "destructive" });
    }
  }, [currentUser, toast]);

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
    if (authLoading || (!isContextInitialized && currentUser)) {
      console.log("AppLayout: Render condition - Auth loading or context not initialized with user. AuthLoading:", authLoading, "IsContextInitialized:", isContextInitialized, "CurrentUser:", !!currentUser);
      return (
        <div className="flex flex-col items-center justify-center flex-1 p-4">
          <Logo className="mb-4 h-8 sm:h-10" />
          <Loader2 className="h-8 w-8 sm:h-10 sm:h-10 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      );
    }
    if (!authLoading && !currentUser && !isPublicPage(pathname)) {
        console.log("AppLayout: Render condition - Not auth loading, no current user, not public page. Pathname:", pathname);
      return (
        <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
            <LogIn className="h-10 w-10 sm:h-12 sm:h-12 text-primary mb-3" />
            <p className="text-md sm:text-lg">Redirecting to login...</p>
        </div>
      );
    }
    // If context is initialized OR it's a public page and auth is done (even if no user)
    if (isContextInitialized || (!authLoading && isPublicPage(pathname))) {
      console.log("AppLayout: Render condition - Context initialized or public page. Children will be rendered.");
      return children;
    }
    // Fallback loading for edge cases
    console.log("AppLayout: Render condition - Fallback loading state.");
    return (
       <div className="flex items-center justify-center flex-1">
          <Loader2 className="h-10 w-10 sm:h-12 sm:h-12 animate-spin text-primary" />
       </div>
    );
  };

  const showSidebar = !isPublicPage(pathname);


  const contextValue: AppContextType = {
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
        currentUserUidOnLoad,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = (path: string) => {
    const publicPaths = ['/login', '/signup', '/playbook', '/templates', '/support', '/'];
    const publicPrefixes = ['/chat/', '/showcase'];
    return publicPaths.includes(path) || publicPrefixes.some(prefix => path.startsWith(prefix));
  };
  const showSidebar = !isPublicPage(pathname);

  return (
    <SidebarProvider defaultOpen={true}>
      {showSidebar && <AppSidebar />}
      <div className="flex flex-col flex-1 min-h-screen">
        {showSidebar && <AppHeader />}
        {showSidebar ? (
          <SidebarInset>
              <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background text-foreground">
              {children}
              </main>
          </SidebarInset>
          ) : (
            <main className="flex-1 bg-background text-foreground">
              {children}
            </main>
          )
        }
      </div>
    </SidebarProvider>
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

  if (!currentUser) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-3 sm:p-4">
        <Link href="/dashboard" className="hover:opacity-80 transition-opacity" aria-label="Dashboard" onClick={handleMobileLinkClick}>
            <Logo collapsed={collapsed} className="h-6 sm:h-7 px-1 sm:px-2 py-1"/>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" onClick={handleMobileLinkClick}>
              <SidebarMenuButton isActive={pathname.startsWith('/dashboard') || pathname.startsWith('/clients/')} tooltip={collapsed ? 'Client Dashboard' : undefined}>
                <Briefcase />
                <span>Client Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/app/templates-gallery" onClick={handleMobileLinkClick}>
              <SidebarMenuButton isActive={pathname === '/app/templates-gallery'} tooltip={collapsed ? 'Agent Templates' : undefined}>
                <Library />
                <span>Agent Templates</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <Link href="/app/user-support" onClick={handleMobileLinkClick}>
              <SidebarMenuButton isActive={pathname === '/app/user-support'} tooltip={collapsed ? 'Help & Support' : undefined}>
                <HelpCircleIcon />
                <span>Help & Support</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-3 sm:p-4 space-y-1 sm:space-y-2">
        <Link href="/settings" onClick={handleMobileLinkClick}>
          <SidebarMenuButton tooltip={collapsed ? 'Settings' : undefined} isActive={pathname === '/settings'}>
            <Settings />
            <span>Settings</span>
          </SidebarMenuButton>
        </Link>
        <SidebarMenuItem>
          <Link href="mailto:feedback@YOUR_AUTOBOSS_DOMAIN.com?subject=AutoBoss%20Platform%20Feedback" target="_blank" onClick={handleMobileLinkClick}>
            <SidebarMenuButton tooltip={collapsed ? 'Send Feedback' : undefined}>
              <MessageSquarePlus />
              <span>Send Feedback</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  );
}
