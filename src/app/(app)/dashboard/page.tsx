
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientCard } from "@/components/client-card"; 
import { PlusCircle, Info, Briefcase, Loader2, Bot, BookOpen } from "lucide-react";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const addClientFormSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters.").max(100, "Client name too long."),
  website: z.string().url("Please enter a valid URL (e.g., https://example.com)").optional().or(z.literal("")),
  description: z.string().max(500, "Description cannot exceed 500 characters.").optional().or(z.literal("")),
});
type AddClientFormData = z.infer<typeof addClientFormSchema>;

function WelcomeDashboard() {
    return (
        <Card className="bg-card/50">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-primary text-center">Welcome to Your AI Agency HQ!</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
                <p className="text-muted-foreground max-w-lg mx-auto">
                    This is where you'll manage all your clients and their AI agents. Let's get your first client set up.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span> Add a Client</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Create a workspace for your first client. All their agents and knowledge will be organized here.</p>
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="w-full">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Client
                                    </Button>
                                </DialogTrigger>
                                <AddClientDialogContent />
                            </Dialog>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><span className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-primary text-primary text-sm font-bold">2</span> Build an AI Agent</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Use a template to quickly create a support bot, a lead qualifier, or a custom AI assistant.</p>
                            <Button variant="secondary" className="w-full" asChild>
                                <Link href="/app/templates-gallery">
                                    <Bot className="mr-2 h-4 w-4" /> Browse Agent Templates
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <Alert className="max-w-2xl mx-auto mt-6">
                    <BookOpen className="h-4 w-4" />
                    <AlertTitle>Pro Tip:</AlertTitle>
                    <AlertDescription>
                        Check out the <Link href="/playbook" className="font-semibold underline hover:text-primary">Client Playbook</Link> for strategies on finding clients and selling your new AI services.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
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
          <Loader2 className="h-10 w-10 animate-spin text-primary"/>
      </div>
    );
  }

  if (clients.length === 0) {
    return <WelcomeDashboard />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="font-headline text-foreground text-2xl sm:text-3xl font-bold flex items-center gap-2">
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
                This will delete the client "{clients.find(c => c.id === clientToDelete)?.name}". 
                Associated agents will NOT be deleted automatically by this action but will become orphaned.
                Are you sure you want to delete this client?
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
