
"use client";

import React, { useState, createContext, useContext, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
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
import { Home, PlusCircle, Bot, Settings, BookOpen, MessageSquare, Share2, Cog } from 'lucide-react';
import type { Agent, KnowledgeItem, AgentFlowDefinition } from '@/lib/types';

// Mock initial agents data with static dates and empty knowledgeItems
const initialAgents: Agent[] = [
  { id: '1', name: 'Support Bot Alpha', description: 'Handles customer support queries.', createdAt: '2024-01-15T10:00:00.000Z', generatedName: 'Support Bot Alpha', knowledgeItems: [], flow: undefined },
  { id: '2', name: 'Sales Assistant Beta', description: 'Assists with sales questions.', createdAt: '2024-01-16T11:30:00.000Z', generatedName: 'Sales Assistant Beta', knowledgeItems: [], flow: undefined },
];

interface AppContextType {
  agents: Agent[];
  addAgent: (agent: Agent) => void;
  updateAgent: (agent: Agent) => void;
  getAgent: (id: string) => Agent | undefined;
  addKnowledgeItem: (agentId: string, item: KnowledgeItem) => void;
  updateAgentFlow: (agentId: string, flow: AgentFlowDefinition) => void;
  getAgentFlow: (agentId: string) => AgentFlowDefinition | undefined;
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
  const [agents, setAgents] = useState<Agent[]>(initialAgents);

  const addAgent = useCallback((agent: Agent) => {
    const agentWithExtras = { ...agent, knowledgeItems: agent.knowledgeItems || [], flow: agent.flow || undefined };
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
            flow: updatedAgent.flow || agent.flow // Preserve or update flow
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

  return (
    <AppContext.Provider value={{ agents, addAgent, updateAgent, getAgent, addKnowledgeItem, updateAgentFlow, getAgentFlow }}>
      <SidebarProvider defaultOpen>
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
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 justify-between md:justify-end">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <UserNav />
    </header>
  );
}

function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
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
      <SidebarFooter className="p-4">
        <Link href="/settings">
          <SidebarMenuButton tooltip={collapsed ? 'Settings' : undefined}>
            <Settings />
            <span>Settings</span>
          </SidebarMenuButton>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
