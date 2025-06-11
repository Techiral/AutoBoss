
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
import { Settings as SettingsIcon, Trash2, Moon, Sun, InfoIcon, Loader2, Mail, KeyRound, ShieldAlert, PhoneCall, MessageSquare, AlertCircle } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const credentialsFormSchema = z.object({
  sendGridApiKey: z.string().optional(),
  userDefaultFromEmail: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  twilioAccountSid: z.string().optional(),
  twilioAuthToken: z.string().optional(),
  twilioPhoneNumber: z.string().optional().refine(val => !val || /^\+[1-9]\d{1,14}$/.test(val), {
    message: "Invalid Twilio phone number format (e.g., +12223334444)",
  }),
});
type CredentialsFormData = z.infer<typeof credentialsFormSchema>;

export default function SettingsPage() {
  const { theme, toggleTheme, clearAllFirebaseData, isLoadingAgents: isAppContextLoading } = useAppContext();
  const { currentUser, updateUserCredentials, getUserCredentials, loading: authLoading } = useAuth();
  
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [hasSendGridKey, setHasSendGridKey] = useState(false);
  const [hasTwilioSid, setHasTwilioSid] = useState(false);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(true);


  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CredentialsFormData>({
    resolver: zodResolver(credentialsFormSchema),
    defaultValues: {
      sendGridApiKey: "",
      userDefaultFromEmail: "",
      twilioAccountSid: "",
      twilioAuthToken: "",
      twilioPhoneNumber: "",
    }
  });

  useEffect(() => {
    if (currentUser && !authLoading) {
      const fetchConfig = async () => {
        setIsLoadingCredentials(true);
        const creds = await getUserCredentials();
        if (creds) {
          // API keys/tokens are not set back to the form for security reasons
          setValue("userDefaultFromEmail", creds.userDefaultFromEmail || "");
          setValue("twilioPhoneNumber", creds.twilioPhoneNumber || "");
          setHasSendGridKey(!!creds.sendGridApiKey);
          setHasTwilioSid(!!creds.twilioAccountSid);
        } else {
          setHasSendGridKey(false);
          setHasTwilioSid(false);
        }
        setIsLoadingCredentials(false);
      };
      fetchConfig();
    } else if (!currentUser && !authLoading) {
        setIsLoadingCredentials(false);
    }
  }, [currentUser, authLoading, setValue, getUserCredentials]);

  const handleClearData = async () => {
    setIsClearingData(true);
    await clearAllFirebaseData(); 
    setIsClearingData(false);
    setIsClearDataDialogOpen(false);
  };

  const onCredentialsSubmit: SubmitHandler<CredentialsFormData> = async (data) => {
    setIsSavingCredentials(true);
    const success = await updateUserCredentials({ 
      sendGridApiKey: data.sendGridApiKey,
      userDefaultFromEmail: data.userDefaultFromEmail,
      twilioAccountSid: data.twilioAccountSid,
      twilioAuthToken: data.twilioAuthToken,
      twilioPhoneNumber: data.twilioPhoneNumber,
    });
    if (success) {
        // Re-fetch or update local state for hasSendGridKey/hasTwilioSid
        if (data.sendGridApiKey) setHasSendGridKey(true);
        if (data.twilioAccountSid) setHasTwilioSid(true);
    }
    setIsSavingCredentials(false);
    // Clear sensitive fields from form after submission attempt
    setValue("sendGridApiKey", ""); 
    setValue("twilioAccountSid", ""); 
    setValue("twilioAuthToken", ""); 
  };
  
  const isLoading = isAppContextLoading || authLoading || isLoadingCredentials;

  return (
    <TooltipProvider>
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className={cn("font-headline text-xl sm:text-2xl flex items-center gap-2", "text-gradient-dynamic")}>
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:w-6 text-primary" /> Application Settings
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
                disabled={isLoading && !authLoading && !isAppContextLoading} // Disable only if app context is loading
              />
              <Moon className={theme === 'dark' ? 'text-primary h-4 w-4 sm:h-5 sm:w-5' : 'text-muted-foreground h-4 w-4 sm:h-5 sm:w-5'} />
            </div>
          </div>

          <Separator />

          {/* API Credentials Configuration */}
          <Card className="bg-card">
            <CardHeader className="p-3 sm:p-4 pb-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <KeyRound className="w-4 h-4 sm:w-5 sm:w-5 text-primary" /> Your API Credentials
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Optionally, connect your own SendGrid (for emails) and Twilio (for SMS/Voice) accounts. This allows agents to send communications using your branding and account limits.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-2">
              <form onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-5 sm:space-y-6">
                {/* SendGrid Section */}
                <div className="space-y-3 p-3 border rounded-md bg-muted/20">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5"><Mail className="w-4 h-4 text-primary"/>SendGrid (Email)</h3>
                    {isLoadingCredentials && <div className="flex items-center text-xs text-muted-foreground"><Loader2 className="h-3 w-3 mr-1 animate-spin"/>Loading SendGrid status...</div>}
                    {!isLoadingCredentials && !hasSendGridKey && (
                        <Alert variant="default" className="p-2 text-xs bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/30">
                            <AlertCircle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                            <AlertTitle className="text-yellow-700 dark:text-yellow-300 text-xs font-medium">SendGrid Not Configured</AlertTitle>
                            <AlertDescription className="text-yellow-600/80 dark:text-yellow-200/80 text-[10px] sm:text-[11px]">
                                Your agents cannot send emails using your account until you provide a SendGrid API Key. They may use system defaults (if any) or email features will be unavailable.
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-1">
                        <Label htmlFor="sendGridApiKey" className="text-xs font-medium">Your SendGrid API Key</Label>
                        <Tooltip>
                            <TooltipTrigger asChild><Input id="sendGridApiKey" type="password" placeholder="Paste your SendGrid API Key" {...register("sendGridApiKey")} className="text-xs sm:text-sm" disabled={isLoading || isSavingCredentials}/></TooltipTrigger>
                            <TooltipContent><p>Your secret API key from SendGrid for sending emails.</p></TooltipContent>
                        </Tooltip>
                        {errors.sendGridApiKey && <p className="text-xs text-destructive">{errors.sendGridApiKey.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="userDefaultFromEmail" className="text-xs font-medium">Your Default "From" Email Address</Label>
                         <Tooltip>
                            <TooltipTrigger asChild><Input id="userDefaultFromEmail" type="email" placeholder="e.g., support@myagency.com" {...register("userDefaultFromEmail")} className="text-xs sm:text-sm" disabled={isLoading || isSavingCredentials}/></TooltipTrigger>
                            <TooltipContent><p>The email address emails will appear to be sent from by default.</p></TooltipContent>
                        </Tooltip>
                        {errors.userDefaultFromEmail && <p className="text-xs text-destructive">{errors.userDefaultFromEmail.message}</p>}
                    </div>
                </div>

                {/* Twilio Section */}
                <div className="space-y-3 p-3 border rounded-md bg-muted/20">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-primary"/>Twilio (SMS & Voice Calls)</h3>
                    {isLoadingCredentials && <div className="flex items-center text-xs text-muted-foreground"><Loader2 className="h-3 w-3 mr-1 animate-spin"/>Loading Twilio status...</div>}
                     {!isLoadingCredentials && !hasTwilioSid && (
                        <Alert variant="default" className="p-2 text-xs bg-yellow-500/10 dark:bg-yellow-500/20 border-yellow-500/30">
                            <AlertCircle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                            <AlertTitle className="text-yellow-700 dark:text-yellow-300 text-xs font-medium">Twilio Not Configured</AlertTitle>
                            <AlertDescription className="text-yellow-600/80 dark:text-yellow-200/80 text-[10px] sm:text-[11px]">
                                Your agents cannot send SMS or make/receive calls using your account until you provide Twilio credentials. They may use system defaults (if any) or related features will be unavailable.
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-1">
                        <Label htmlFor="twilioAccountSid" className="text-xs font-medium">Your Twilio Account SID</Label>
                        <Tooltip>
                            <TooltipTrigger asChild><Input id="twilioAccountSid" type="password" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" {...register("twilioAccountSid")} className="text-xs sm:text-sm" disabled={isLoading || isSavingCredentials}/></TooltipTrigger>
                             <TooltipContent><p>Your Twilio Account SID from the Twilio console.</p></TooltipContent>
                        </Tooltip>
                        {errors.twilioAccountSid && <p className="text-xs text-destructive">{errors.twilioAccountSid.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="twilioAuthToken" className="text-xs font-medium">Your Twilio Auth Token</Label>
                        <Tooltip>
                            <TooltipTrigger asChild><Input id="twilioAuthToken" type="password" placeholder="Your Twilio Auth Token" {...register("twilioAuthToken")} className="text-xs sm:text-sm" disabled={isLoading || isSavingCredentials}/></TooltipTrigger>
                             <TooltipContent><p>Your Twilio Auth Token from the Twilio console.</p></TooltipContent>
                        </Tooltip>
                         {errors.twilioAuthToken && <p className="text-xs text-destructive">{errors.twilioAuthToken.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="twilioPhoneNumber" className="text-xs font-medium">Your Default Twilio Phone Number</Label>
                        <Tooltip>
                            <TooltipTrigger asChild><Input id="twilioPhoneNumber" type="tel" placeholder="+1234567890 (E.164 format)" {...register("twilioPhoneNumber")} className="text-xs sm:text-sm" disabled={isLoading || isSavingCredentials}/></TooltipTrigger>
                            <TooltipContent><p>A Twilio phone number you own, in E.164 format (e.g., +12223334444).</p></TooltipContent>
                        </Tooltip>
                        {errors.twilioPhoneNumber && <p className="text-xs text-destructive">{errors.twilioPhoneNumber.message}</p>}
                    </div>
                </div>
                
                 <Alert variant="default" className="p-2 text-xs bg-accent/10 dark:bg-accent/20 border-accent/30">
                    <ShieldAlert className="h-3.5 w-3.5 text-accent" />
                    <AlertTitle className="text-accent text-xs font-medium">Security & Usage Note</AlertTitle>
                    <AlertDescription className="text-accent/80 dark:text-accent/90 text-[10px] sm:text-[11px]">
                     API keys and tokens are sensitive. They will be stored securely in your user profile in Firestore. If you don't provide credentials, the system may use global defaults if configured by the platform admin, or related features might be unavailable for your agents.
                    </AlertDescription>
                </Alert>
                <Button type="submit" size="sm" className="text-xs sm:text-sm" disabled={isLoading || isSavingCredentials}>
                  {isSavingCredentials ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <KeyRound className="mr-2 h-3.5 w-3.5" />}
                  {isSavingCredentials ? "Saving Credentials..." : "Save API Credentials"}
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
                          {isClearingData || (isLoading && !authLoading && !isAppContextLoading) ? <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />} 
                          {isClearingData ? "Clearing..." : ((isLoading && !authLoading && !isAppContextLoading) && !isClearingData ? "Loading..." : "Clear All My Agent Data")}
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
                <p><InfoIcon className="inline h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-primary" /><strong>Version:</strong> 1.3.0 (User API Credentials & Outbound Queuing)</p>
                <p><InfoIcon className="inline h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-primary" /><strong>Data Storage:</strong> Firebase Firestore</p>
                <p><InfoIcon className="inline h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 text-primary" /><strong>AI Provider:</strong> Google Gemini via Genkit</p>
             </div>
          </div>

        </CardContent>
        <CardFooter className="p-4 sm:p-6">
            <p className="text-xs text-muted-foreground">Changes to settings are saved automatically where applicable (e.g., theme). API Credentials require clicking 'Save'.</p>
        </CardFooter>
      </Card>
    </div>
    </TooltipProvider>
  );
}

