
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Info, Briefcase, Loader2, Bot, BookOpen, Library, LifeBuoy, ArrowRight, UserPlus } from "lucide-react";
import { useAppContext } from "../layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";

function WelcomeDashboard() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">Welcome to Your AI Agency HQ</CardTitle>
                    <CardDescription className="text-foreground/80">This is your starting point. Follow these steps to launch your first AI agent for a client.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4 rounded-lg border p-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-foreground text-lg font-bold">1</span>
                            <h3 className="font-headline text-xl">Create Your First AI Agent</h3>
                        </div>
                        <p className="text-sm text-foreground/80">Go to the Agent Builder, describe the agent you want, and let our AI do the heavy lifting to get you started.</p>
                        <Button className="w-full" asChild>
                            <Link href="/">
                                <UserPlus className="mr-2 h-4 w-4" /> Go to Agent Builder
                            </Link>
                        </Button>
                    </div>
                     <div className="space-y-4 rounded-lg border p-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-foreground text-lg font-bold">2</span>
                            <h3 className="font-headline text-xl">Browse Agent Templates</h3>
                        </div>
                        <p className="text-sm text-foreground/80">Need inspiration? Use a template to quickly create a support bot, a lead qualifier, or a custom AI assistant.</p>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/app/templates-gallery">
                                <Bot className="mr-2 h-4 w-4" /> Browse Agent Templates
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Resources & Guidance</CardTitle>
                    <CardDescription className="text-foreground/80">Everything you need to succeed is right here. No need to get lost.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                    <ResourceCard
                        href="/playbook"
                        icon={<BookOpen />}
                        title="Client Playbook"
                        description="Your step-by-step guide to finding clients and selling your AI services."
                    />
                    <ResourceCard
                        href="/app/user-support"
                        icon={<LifeBuoy />}
                        title="Help & FAQ"
                        description="Find answers to common questions about using the platform."
                    />
                    <ResourceCard
                        href="/app/templates-gallery"
                        icon={<Library />}
                        title="Agent Templates"
                        description="Kickstart projects with pre-built agents for common use-cases."
                    />
                </CardContent>
            </Card>
        </div>
    );
}

function ResourceCard({ href, icon, title, description }: { href: string, icon: React.ReactNode, title: string, description: string }) {
    return (
        <Link href={href} className="block group">
            <div className="p-4 rounded-lg border h-full flex flex-col items-start transition-colors group-hover:bg-secondary">
                <div className="p-2 bg-secondary rounded-md mb-3 text-foreground">
                    {icon}
                </div>
                <h4 className="font-semibold text-foreground">{title}</h4>
                <p className="text-sm text-foreground/80 flex-grow">{description}</p>
                <div className="mt-3 text-sm font-medium text-foreground flex items-center">
                    Go to {title} <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </Link>
    );
}


export default function ClientDashboardPage() {
  const { clients, isLoadingClients, isLoadingAgents } = useAppContext();
  const { currentUser } = useAuth();
  
  const isLoading = isLoadingClients || isLoadingAgents;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin"/>
      </div>
    );
  }
  
  if (!currentUser) return null;

  return <WelcomeDashboard />;
}
