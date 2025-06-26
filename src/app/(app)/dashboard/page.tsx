
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientCard } from "@/components/client-card"; 
import { PlusCircle, Info, Briefcase, Loader2, Bot, BookOpen, Library, LifeBuoy, ArrowRight } from "lucide-react";
import { useAppContext } from "../layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";

const addClientFormSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters.").max(100, "Client name too long."),
  website: z.string().url("Please enter a valid URL (e.g., https://example.com)").optional().or(z.literal("")),
  description: z.string().max(500, "Description cannot exceed 500 characters.").optional().or(z.literal("")),
});
type AddClientFormData = z.infer<typeof addClientFormSchema>;

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
                            <h3 className="font-headline text-xl">Add Your First Client</h3>
                        </div>
                        <p className="text-sm text-foreground/80">Create a workspace for your client. All their agents and knowledge will be organized here.</p>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Client
                                </Button>
                            </DialogTrigger>
                            <AddClientDialogContent />
                        </Dialog>
                    </div>
                    <div className="space-y-4 rounded-lg border p-6">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-foreground text-lg font-bold">2</span>
                            <h3 className="font-headline text-xl">Build an AI Agent</h3>
                        </div>
                        <p className="text-sm text-foreground/80">Use a template to quickly create a support bot, a lead qualifier, or a custom AI assistant for the client you just added.</p>
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

function AddClientDialogContent() {
  const { addClient } = useAppContext();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: isAddingClient },
  } = useForm<AddClientFormData>({
    resolver: zodResolver(addClientFormSchema),
  });

  const handleAddClientSubmit: SubmitHandler<AddClientFormData> = async (data) => {
    const newClient = await addClient({
      name: data.name,
      website: data.website || undefined,
      description: data.description || undefined,
    });
    if (newClient) {
      toast({ title: "Client Added!", description: `Client "${newClient.name}" has been successfully created.` });
      reset();
      // The dialog will close automatically if this component is unmounted.
      // We can't control the Dialog's open state from here easily without prop drilling.
    } else {
      toast({ title: "Error", description: "Failed to add client. Please try again.", variant: "destructive" });
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(handleAddClientSubmit)}>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the details for your new client. You can add AI agents to them later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" placeholder="Acme Corp" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientWebsite">Client Website (Optional)</Label>
              <Input id="clientWebsite" placeholder="https://acme.com" {...register("website")} />
              {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="clientDescription">Client Description (Optional)</Label>
              <Textarea id="clientDescription" placeholder="Briefly describe the client or project..." {...register("description")} rows={3}/>
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" onClick={() => reset()}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isAddingClient}>
              {isAddingClient && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Client
            </Button>
          </DialogFooter>
        </form>
    </DialogContent>
  );
}


export default function ClientDashboardPage() {
  const { clients, deleteClient, isLoadingClients, isLoadingAgents } = useAppContext();
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const handleDeleteConfirm = async () => {
    if (clientToDelete) {
      await deleteClient(clientToDelete);
      setClientToDelete(null);
    }
  };
  
  const isLoading = isLoadingClients || isLoadingAgents;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin"/>
      </div>
    );
  }

  if (clients.length === 0) {
    return <WelcomeDashboard />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Briefcase className="w-7 h-7 sm:w-8 sm:w-8" /> Your Client Workspace
        </h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add New Client
            </Button>
          </DialogTrigger>
          <AddClientDialogContent />
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} onDelete={() => setClientToDelete(client.id)} />
        ))}
      </div>

      {clientToDelete && (
        <AlertDialog open={!!clientToDelete} onOpenChange={(isOpen) => !isOpen && setClientToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the client "{clients.find(c => c.id === clientToDelete)?.name}" and ALL of their associated AI agents.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Client
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
