
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
import { Home, PlusCircle, Bot, Settings, BookOpen, MessageSquare, Share2, Cog, LifeBuoy } from 'lucide-react';
import type { Agent, KnowledgeItem, AgentFlowDefinition } from '@/lib/types';
import { minimalInitialFlow } from '@/app/(app)/agents/[agentId]/studio/page';

const LOCAL_STORAGE_AGENTS_KEY = 'agentVerseAgents';
const LOCAL_STORAGE_THEME_KEY = 'agentVerseTheme';

type Theme = 'dark' | 'light';

interface AppContextType {
  agents: Agent[];
  addAgent: (agent: Agent) => void;
  updateAgent: (agent: Agent) => void;
  getAgent: (id: string) => Agent | undefined;
  addKnowledgeItem: (agentId: string, item: KnowledgeItem) => void;
  updateAgentFlow: (agentId: string, flow: AgentFlowDefinition) => void;
  getAgentFlow: (agentId: string) => AgentFlowDefinition | undefined;
  deleteAgent: (agentId: string) => void;
  theme: Theme;
  toggleTheme: () => void;
  clearAllLocalData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark
  const [isContextInitialized, setIsContextInitialized] = useState(false);

  useEffect(() => {
    // Load agents from localStorage
    try {
      const storedAgents = localStorage.getItem(LOCAL_STORAGE_AGENTS_KEY);
      if (storedAgents) {
        setAgents(JSON.parse(storedAgents));
      }
    } catch (error) {
      console.error("Failed to load agents from localStorage:", error);
    }

    // Load theme from localStorage
    const storedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as Theme | null;
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
      setTheme(storedTheme);
    }
    
    setIsContextInitialized(true);
  }, []);

  useEffect(() => {
    if (isContextInitialized) {
        try {
            localStorage.setItem(LOCAL_STORAGE_AGENTS_KEY, JSON.stringify(agents));
        } catch (error) {
            console.error("Failed to save agents to localStorage:", error);
        }
    }
  }, [agents, isContextInitialized]);

  useEffect(() => {
    if (isContextInitialized) {
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme, isContextInitialized]);


  const addAgent = useCallback((agent: Agent) => {
    const agentWithExtras: Agent = { 
      ...agent, 
      knowledgeItems: agent.knowledgeItems || [], 
      flow: agent.flow || minimalInitialFlow,
      createdAt: agent.createdAt || new Date().toISOString()
    };
    setAgents((prevAgents) => [...prevAgents, agentWithExtras]);
  }, []);

  const updateAgent = useCallback((updatedAgent: Agent) => {
    setAgents((prevAgents) =>
      prevAgents.map((agent) => {
        if (agent.id === updatedAgent.id) {
          return { 
            ...agent, 
            ...updatedAgent, 
            knowledgeItems: updatedAgent.knowledgeItems || agent.knowledgeItems || [],
            flow: updatedAgent.flow || agent.flow 
          };
        }
        return agent;
      })
    );
  }, []);
  
  const getAgent = useCallback((id: string) => {
    return agents.find(agent => agent.id === id);
  }, [agents]);

  const addKnowledgeItem = useCallback((agentId: string, item: KnowledgeItem) => {
    setAgents(prevAgents =>
      prevAgents.map(agent => {
        if (agent.id === agentId) {
          const updatedKnowledgeItems = [...(agent.knowledgeItems || []), item];
          return { ...agent, knowledgeItems: updatedKnowledgeItems };
        }
        return agent;
      })
    );
  }, []);

  const updateAgentFlow = useCallback((agentId: string, flow: AgentFlowDefinition) => {
    setAgents(prevAgents => 
      prevAgents.map(agent => {
        if (agent.id === agentId) {
          return { ...agent, flow: flow };
        }
        return agent;
      })
    );
  }, []);

  const getAgentFlow = useCallback((agentId: string): AgentFlowDefinition | undefined => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.flow;
  }, [agents]);

  const deleteAgent = useCallback((agentId: string) => {
    setAgents(prevAgents => prevAgents.filter(agent => agent.id !== agentId));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const clearAllLocalData = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_AGENTS_KEY);
    setAgents([]);
    // Optionally, could also reset theme to default if desired
    // localStorage.removeItem(LOCAL_STORAGE_THEME_KEY);
    // setTheme('dark'); 
  }, []);

  if (!isContextInitialized) {
    return null; 
  }

  return (
    <AppContext.Provider value={{ agents, addAgent, updateAgent, getAgent, addKnowledgeItem, updateAgentFlow, getAgentFlow, deleteAgent, theme, toggleTheme, clearAllLocalData }}>
      <SidebarProvider defaultOpen={true}> 
        <AppSidebar />
        <div className="flex flex-col flex-1 min-h-screen">
          <AppHeader />
          <SidebarInset>
            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background text-foreground">
              {children}
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
  // const { state, open, setOpen, isMobile, useSidebar } = useSidebar(); // open, setOpen, isMobile not directly needed here
  const { state } = useAppContext().theme === 'dark' ? { state: 'expanded' } : { state: 'expanded' }; // Simplified, assuming sidebar logic is mostly CSS driven based on 'collapsed'
  const collapsed = state === 'collapsed'; // This will be false if using above simplification for now.
  
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
