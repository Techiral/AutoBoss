
"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, ArrowRight, Trash2, Globe } from "lucide-react";
import type { Client } from "@/lib/types";
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";

interface ClientCardProps {
  client: Client;
  onDelete: (clientId: string) => void;
}

export function ClientCard({ client, onDelete }: ClientCardProps) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    if (client.createdAt) {
      const dateToFormat = typeof client.createdAt === 'string' ? new Date(client.createdAt) : client.createdAt.toDate();
      setFormattedDate(dateToFormat.toLocaleDateString());
    }
  }, [client.createdAt]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-1.5 sm:mb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Briefcase className="w-7 h-7 sm:w-8 sm:w-8 text-primary shrink-0" />
            <CardTitle className="font-headline text-lg sm:text-xl break-all">{client.name}</CardTitle>
          </div>
          {/* Future: Could add a badge for number of agents or status */}
        </div>
        <CardDescription className="line-clamp-2 h-10 text-xs sm:text-sm">{client.description || "No description provided."}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow p-4 sm:p-5 pt-0 space-y-1">
        {client.website && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="w-3 h-3 text-primary"/>
            <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
              {client.website}
            </a>
          </div>
        )}
        {formattedDate && (
          <p className="text-xs text-muted-foreground">
            Added: {formattedDate}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 sm:p-5 pt-2 sm:pt-3 border-t">
        <Button variant="ghost" size="sm" onClick={() => onDelete(client.id)} aria-label="Delete client" className="text-xs px-2 py-1 h-auto text-destructive hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5 mr-1 sm:mr-1.5" /> Delete
        </Button>
        <Button asChild size="sm" className="text-xs px-2 py-1 h-auto">
          <Link href={`/clients/${client.id}/dashboard`}>
            Manage Agents
            <ArrowRight className="ml-1 sm:ml-1.5 w-3.5 h-3.5" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
