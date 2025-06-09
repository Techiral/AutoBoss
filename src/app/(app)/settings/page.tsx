
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Trash2, Moon, Sun, InfoIcon, Loader2 } from "lucide-react";
import { useAppContext } from "../layout";
// import { useToast } from "@/hooks/use-toast"; // No longer directly used for toast here
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
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, toggleTheme, clearAllFirebaseData, isLoadingAgents } = useAppContext();
  // const { toast } = useToast(); // Context now handles toasts for clearAllFirebaseData
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  const handleClearData = async () => {
    setIsClearingData(true);
    await clearAllFirebaseData(); 
    setIsClearingData(false);
    setIsClearDataDialogOpen(false); // Close dialog after action
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}>
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Application Settings
          </CardTitle>
          <CardDescription className="text-sm">Manage your application preferences and data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg bg-muted/30 gap-3 sm:gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="theme-switch" className="text-sm sm:text-base font-medium">
                Interface Theme
              </Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Switch between light and dark mode.
              </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <Sun className={theme === 'light' ? 'text-primary h-4 w-4 sm:h-5 sm:w-5' : 'text-muted-foreground h-4 w-4 sm:h-5 sm:w-5'} />
              <Switch
                id="theme-switch"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
                aria-label="Toggle theme"
              />
              <Moon className={theme === 'dark' ? 'text-primary h-4 w-4 sm:h-5 sm:w-5' : 'text-muted-foreground h-4 w-4 sm:h-5 sm:w-5'} />
            </div>
          </div>

          <div className="p-3 sm:p-4 border rounded-lg bg-muted/30">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-0.5">
                    <Label className="text-sm sm:text-base font-medium">
                        Manage Firestore Data
                    </Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Clear all agents and associated data from Firestore.
                    </p>
                </div>
                <AlertDialog open={isClearDataDialogOpen} onOpenChange={setIsClearDataDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isLoadingAgents || isClearingData} className="w-full sm:w-auto text-xs sm:text-sm">
                          {isClearingData ? <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />} 
                          {isClearingData ? "Clearing..." : "Clear All Agent Data"}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all agent configurations,
                            knowledge bases, and flow definitions stored in Firestore for your account.
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
          
          <div className="p-3 sm:p-4 border rounded-lg bg-muted/30">
            <Label className="text-sm sm:text-base font-medium block mb-1">Application Information</Label>
             <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <p><InfoIcon className="inline h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-primary" /><strong>Version:</strong> 1.1.0 (Firestore Integrated)</p>
                <p><InfoIcon className="inline h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-primary" /><strong>Data Storage:</strong> Firebase Firestore</p>
                <p><InfoIcon className="inline h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-primary" /><strong>AI Provider:</strong> Google Gemini via Genkit</p>
             </div>
          </div>

        </CardContent>
        <CardFooter className="p-4 sm:p-6">
            <p className="text-xs text-muted-foreground">Changes to settings are saved automatically.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
