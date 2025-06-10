
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Settings as SettingsIcon, Trash2, Moon, Sun, InfoIcon, Loader2, Mail, KeyRound, ShieldAlert } from "lucide-react";
import { useAppContext } from "../layout";
import { useAuth } from "@/contexts/AuthContext";
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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription} from "@/components/ui/alert";

const sendGridFormSchema = z.object({
  sendGridApiKey: z.string().optional(), // Optional: user might want to clear it
  userDefaultFromEmail: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')), // Optional, allow empty string to clear
});
type SendGridFormData = z.infer<typeof sendGridFormSchema>;

export default function SettingsPage() {
  const { theme, toggleTheme, clearAllFirebaseData, isLoadingAgents: isAppLoading } = useAppContext();
  const { currentUser, updateUserSendGridConfig, getUserSendGridConfig, loading: authLoading } = useAuth();
  
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [isSavingSendGrid, setIsSavingSendGrid] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SendGridFormData>({
    resolver: zodResolver(sendGridFormSchema),
    defaultValues: {
      sendGridApiKey: "",
      userDefaultFromEmail: "",
    }
  });

  useEffect(() => {
    if (currentUser && !authLoading) {
      const fetchConfig = async () => {
        const config = await getUserSendGridConfig();
        if (config) {
          // Don't set API key back to form for security, only 'from' email
          setValue("userDefaultFromEmail", config.fromEmail || "");
        }
      };
      fetchConfig();
    }
  }, [currentUser, authLoading, setValue, getUserSendGridConfig]);

  const handleClearData = async () => {
    setIsClearingData(true);
    await clearAllFirebaseData(); 
    setIsClearingData(false);
    setIsClearDataDialogOpen(false);
  };

  const onSendGridSubmit: SubmitHandler<SendGridFormData> = async (data) => {
    setIsSavingSendGrid(true);
    await updateUserSendGridConfig({ 
      apiKey: data.sendGridApiKey, // Send the API key from the form only on submit
      fromEmail: data.userDefaultFromEmail 
    });
    setIsSavingSendGrid(false);
    // Optionally clear the API key field after submission for security
    setValue("sendGridApiKey", ""); 
  };
  
  const isLoading = isAppLoading || authLoading;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}>
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" /> Application Settings
          </CardTitle>
          <CardDescription className="text-sm">Manage your application preferences, integrations, and data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8 p-4 sm:p-6">
          {/* Theme Settings */}
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
                disabled={isLoading}
              />
              <Moon className={theme === 'dark' ? 'text-primary h-4 w-4 sm:h-5 sm:w-5' : 'text-muted-foreground h-4 w-4 sm:h-5 sm:w-5'} />
            </div>
          </div>

          <Separator />

          {/* SendGrid Configuration */}
          <Card className="bg-card">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Mail className="w-4 h-4 sm:w-5 sm:w-5 text-primary" /> Email Sending (SendGrid)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure your own SendGrid account for sending emails via agents. This is optional.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-2">
              <form onSubmit={handleSubmit(onSendGridSubmit)} className="space-y-3 sm:space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="sendGridApiKey" className="text-xs font-medium">Your SendGrid API Key</Label>
                  <Input 
                    id="sendGridApiKey" 
                    type="password" 
                    placeholder="Enter your SendGrid API Key" 
                    {...register("sendGridApiKey")} 
                    className="text-xs sm:text-sm"
                    disabled={isLoading || isSavingSendGrid}
                  />
                  {errors.sendGridApiKey && <p className="text-xs text-destructive">{errors.sendGridApiKey.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="userDefaultFromEmail" className="text-xs font-medium">Your Default "From" Email Address</Label>
                  <Input 
                    id="userDefaultFromEmail" 
                    type="email" 
                    placeholder="e.g., support@myagency.com" 
                    {...register("userDefaultFromEmail")} 
                    className="text-xs sm:text-sm"
                    disabled={isLoading || isSavingSendGrid}
                  />
                  {errors.userDefaultFromEmail && <p className="text-xs text-destructive">{errors.userDefaultFromEmail.message}</p>}
                </div>
                 <Alert variant="default" className="p-2 text-xs bg-accent/10 dark:bg-accent/20 border-accent/30">
                    <ShieldAlert className="h-3.5 w-3.5 text-accent" />
                    <AlertTitle className="text-accent text-xs font-medium">Security Note</AlertTitle>
                    <AlertDescription className="text-accent/80 dark:text-accent/90 text-[10px] sm:text-[11px]">
                     API keys are sensitive. Ensure you trust this platform. This key will be stored in your user profile in Firestore. Consider using restricted API keys from SendGrid if possible.
                    </AlertDescription>
                </Alert>
                <Button type="submit" size="sm" className="text-xs sm:text-sm" disabled={isLoading || isSavingSendGrid}>
                  {isSavingSendGrid ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <KeyRound className="mr-2 h-3.5 w-3.5" />}
                  {isSavingSendGrid ? "Saving..." : "Save SendGrid Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />
          
          {/* Data Management */}
          <div className="p-3 sm:p-4 border rounded-lg bg-muted/30">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="space-y-0.5">
                    <Label className="text-sm sm:text-base font-medium">
                        Manage Your Data
                    </Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Clear all your agents and associated data from AutoBoss.
                    </p>
                </div>
                <AlertDialog open={isClearDataDialogOpen} onOpenChange={setIsClearDataDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isLoading || isClearingData} className="w-full sm:w-auto text-xs sm:text-sm">
                          {isClearingData || isLoading ? <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />} 
                          {isClearingData ? "Clearing..." : (isLoading && !isClearingData ? "Loading..." : "Clear All My Agent Data")}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all agent configurations,
                            knowledge bases, and other data associated with your account from Firestore.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel disabled={isClearingData}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isClearingData}>
                            {isClearingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, delete all my data" }
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
             </div>
          </div>
          
          <div className="p-3 sm:p-4 border rounded-lg bg-muted/30">
            <Label className="text-sm sm:text-base font-medium block mb-1">Application Information</Label>
             <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                <p><InfoIcon className="inline h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-primary" /><strong>Version:</strong> 1.2.0 (User Integrations)</p>
                <p><InfoIcon className="inline h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-primary" /><strong>Data Storage:</strong> Firebase Firestore</p>
                <p><InfoIcon className="inline h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-primary" /><strong>AI Provider:</strong> Google Gemini via Genkit</p>
             </div>
          </div>

        </CardContent>
        <CardFooter className="p-4 sm:p-6">
            <p className="text-xs text-muted-foreground">Changes to settings are saved automatically where applicable (e.g., theme). Integration settings require clicking 'Save'.</p>
        </CardFooter>
      </Card>
    </div>
  );
}

