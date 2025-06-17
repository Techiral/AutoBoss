
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClientCard } from "@/components/client-card"; 
import { PlusCircle, Info, Briefcase, Loader2 } from "lucide-react";
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
  AlertDialogTrigger,
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
import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import type { Client } from "@/lib/types"; 
import { useToast } from "@/hooks/use-toast";

const addClientFormSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters.").max(100, "Client name too long."),
  website: z.string().url("Please enter a valid URL (e.g., https://example.com)").optional().or(z.literal("")),
  description: z.string().max(500, "Description cannot exceed 500 characters.").optional().or(z.literal("")),
});
type AddClientFormData = z.infer<typeof addClientFormSchema>;


export default function ClientDashboardPage() {
  const { clients, addClient, deleteClient, isLoadingClients, isLoadingAgents } = useAppContext();
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
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
      setIsAddClientDialogOpen(false);
    } else {
      toast({ title: "Error", description: "Failed to add client. Please try again.", variant: "destructive" });
    }
  };

  const handleDeleteConfirm = async () => {
    if (clientToDelete) {
      await deleteClient(clientToDelete);
      setClientToDelete(null);
    }
  };
  
  const isLoading = isLoadingClients || isLoadingAgents;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className={cn("font-headline text-2xl sm:text-3xl font-bold flex items-center gap-2", "text-gradient-dynamic")}>
          <Briefcase className="w-7 h-7 sm:w-8 sm:w-8" /> Your Client Workspace
        </h1>
        <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className={cn("w-full sm:w-auto", "btn-gradient-primary")}>
              <PlusCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add New Client
            </Button>
          </DialogTrigger>
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
                  <Button type="button" variant="outline" onClick={() => reset()}>Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isAddingClient}>
                  {isAddingClient && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Client
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading && (
         <div className="flex justify-center items-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary"/>
         </div>
      )}

      {!isLoading && clients.length === 0 ? (
        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Welcome to Your Workspace!</AlertTitle>
          <AlertDescription className="text-sm space-y-1">
            <p>It looks like you haven't added any clients yet. Clients are how you organize your AI agent projects.</p>
            <ol className="list-decimal list-inside pl-2 text-xs">
              <li>Click "Add New Client" to create your first client entry.</li>
              <li>Once a client is created, you can open their dashboard to build and manage their specific AI agents.</li>
            </ol>
          </AlertDescription>
        </Alert>
      ) : (
        !isLoading && clients.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} onDelete={() => setClientToDelete(client.id)} />
            ))}
          </div>
        )
      )}

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
