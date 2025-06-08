
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Trash2, Moon, Sun, InfoIcon, Loader2 } from "lucide-react";
import { useAppContext } from "../layout";
import { useToast } from "@/hooks/use-toast";
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

export default function SettingsPage() {
  const { theme, toggleTheme, clearAllFirebaseData, isLoadingAgents } = useAppContext();
  const { toast } = useToast();
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  const handleClearData = async () => {
    setIsClearingData(true);
    await clearAllFirebaseData(); // AppContext now handles toasting for success/failure
    setIsClearingData(false);
    setIsClearDataDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" /> Application Settings
          </CardTitle>
          <CardDescription>Manage your application preferences and data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="theme-switch" className="text-base font-medium">
                Interface Theme
              </Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark mode.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className={theme === 'light' ? 'text-primary' : 'text-muted-foreground'} />
              <Switch
                id="theme-switch"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                aria-label="Toggle theme"
              />
              <Moon className={theme === 'dark' ? 'text-primary' : 'text-muted-foreground'} />
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-muted/30">
             <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label className="text-base font-medium">
                        Manage Firestore Data
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Clear all agents and associated data stored in Firestore.
                    </p>
                </div>
                <AlertDialog open={isClearDataDialogOpen} onOpenChange={setIsClearDataDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isLoadingAgents || isClearingData}>
                          {isClearingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} 
                          {isClearingData ? "Clearing..." : "Clear All Agent Data"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all agent configurations,
                            knowledge bases, and flow definitions stored in Firestore for this project.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isClearingData}>
                            {isClearingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, delete all data" }
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
             </div>
          </div>
          
          <div className="p-4 border rounded-lg bg-muted/30">
            <Label className="text-base font-medium block mb-1">Application Information</Label>
             <div className="text-sm text-muted-foreground space-y-1">
                <p><InfoIcon className="inline h-4 w-4 mr-1" /><strong>Version:</strong> 1.1.0 (Firestore Integrated)</p>
                <p><InfoIcon className="inline h-4 w-4 mr-1" /><strong>Data Storage:</strong> Firebase Firestore</p>
                <p><InfoIcon className="inline h-4 w-4 mr-1" /><strong>AI Provider:</strong> Google Gemini via Genkit</p>
             </div>
          </div>

        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">Changes to settings are saved automatically.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
