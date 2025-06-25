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
import { Settings as SettingsIcon, Trash2, Moon, Sun, Loader2, Mail, KeyRound, ShieldAlert, PhoneCall, CheckCircle2, Mic, Lightbulb, AlertCircle, Sparkles } from "lucide-react";
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
      sendGridApiKey: data.sendGridApiKey || undefined,
      userDefaultFromEmail: data.userDefaultFromEmail || undefined,
      twilioAccountSid: data.twilioAccountSid || undefined,
      twilioAuthToken: data.twilioAuthToken || undefined,
      twilioPhoneNumber: data.twilioPhoneNumber || undefined,
    });
    if (success) {
        if (data.sendGridApiKey) setHasSendGridKey(true);
        if (data.twilioAccountSid) setHasTwilioSid(true);
    }
    setIsSavingCredentials(false);
    setValue("sendGridApiKey", ""); 
    setValue("twilioAccountSid", ""); 
    setValue("twilioAuthToken", "");
  };
  
  const isLoading = isAppContextLoading || authLoading || isLoadingCredentials;

  return (
    <div className="space-y-6 sm:space-y-8">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="font-headline text-xl sm:text-2xl flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 sm:w-6 sm:w-6" /> Platform Settings
          </CardTitle>
          <CardDescription className="text-sm">Manage your application preferences, data, and connect external services to power up your agents.</CardDescription>
        </CardHeader>
      </Card>
      
      <form onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-6 sm:space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg sm:text-xl flex items-center gap-2">
                <KeyRound className="w-4 h-4 sm:w-5 sm:w-5" /> External API Keys
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
                Connect your own API keys to enable agent abilities like sending emails or making calls. Keys are stored securely and associated with your user profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
            {/* SendGrid Card */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2"><Mail className="w-4 h-4"/>SendGrid</CardTitle>
                <CardDescription className="text-xs">Allow your agents to send emails on your behalf.</CardDescription>
                 {isLoadingCredentials && <div className="flex items-center text-xs text-muted-foreground"><Loader2 className="h-3 w-3 mr-1 animate-spin"/>Loading Status...</div>}
                {!isLoadingCredentials && hasSendGridKey && (
                    <Alert variant="default" className="p-2 text-xs border-foreground/30">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <AlertTitle className="text-xs font-medium">SendGrid Configured</AlertTitle>
                    </Alert>
                )}
                 {!isLoadingCredentials && !hasSendGridKey && (
                    <Alert variant="destructive" className="p-2 text-xs">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <AlertTitle className="text-xs font-medium">Not Configured</AlertTitle>
                    </Alert>
                )}
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                <div className="space-y-1">
                    <Label htmlFor="sendGridApiKey" className="text-xs font-medium">API Key</Label>
                    <Input id="sendGridApiKey" type="password" placeholder={hasSendGridKey ? "API Key is set (Enter new to change)" : "Paste your SendGrid API Key"} {...register("sendGridApiKey")} disabled={isLoading || isSavingCredentials}/>
                    {errors.sendGridApiKey && <p className="text-xs text-destructive">{errors.sendGridApiKey.message}</p>}
                </div>
                <div className="space-y-1">
                    <Label htmlFor="userDefaultFromEmail" className="text-xs font-medium">Default "From" Email Address</Label>
                    <Input id="userDefaultFromEmail" type="email" placeholder="e.g., support@myagency.com" {...register("userDefaultFromEmail")} disabled={isLoading || isSavingCredentials}/>
                    {errors.userDefaultFromEmail && <p className="text-xs text-destructive">{errors.userDefaultFromEmail.message}</p>}
                </div>
                 <Alert variant="default" className="p-3 text-xs bg-card">
                    <Lightbulb className="h-3.5 w-3.5" />
                    <AlertTitle className="text-xs font-medium">How to get your key:</AlertTitle>
                    <AlertDescription className="text-[11px] space-y-1 mt-1">
                        <p>1. Login to <a href="https://sendgrid.com/" target="_blank" rel="noopener noreferrer" className="underline">SendGrid</a>.</p>
                        <p>2. Go to 'Settings' &rarr; 'API Keys' and create a new key.</p>
                        <p>3. Paste it here. You must also add a verified "From" address.</p>
                    </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Twilio Card */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2"><PhoneCall className="w-4 h-4"/>Twilio</CardTitle>
                <CardDescription className="text-xs">Enable your agents to make and receive voice calls.</CardDescription>
                {isLoadingCredentials && <div className="flex items-center text-xs text-muted-foreground"><Loader2 className="h-3 w-3 mr-1 animate-spin"/>Loading Status...</div>}
                {!isLoadingCredentials && hasTwilioSid && (
                    <Alert variant="default" className="p-2 text-xs border-foreground/30">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <AlertTitle className="text-xs font-medium">Twilio Configured</AlertTitle>
                    </Alert>
                )}
                 {!isLoadingCredentials && !hasTwilioSid && (
                    <Alert variant="destructive" className="p-2 text-xs">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <AlertTitle className="text-xs font-medium">Not Configured</AlertTitle>
                    </Alert>
                )}
              </CardHeader>
              <CardContent className="flex-grow space-y-3">
                 <div className="space-y-1">
                    <Label htmlFor="twilioAccountSid" className="text-xs font-medium">Account SID</Label>
                    <Input id="twilioAccountSid" type="password" placeholder={hasTwilioSid ? "Account SID is set (Enter new to change)" : "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"} {...register("twilioAccountSid")} disabled={isLoading || isSavingCredentials}/>
                    {errors.twilioAccountSid && <p className="text-xs text-destructive">{errors.twilioAccountSid.message}</p>}
                </div>
                <div className="space-y-1">
                    <Label htmlFor="twilioAuthToken" className="text-xs font-medium">Auth Token</Label>
                    <Input id="twilioAuthToken" type="password" placeholder={hasTwilioSid ? "Auth Token is set (Enter new SID first)" : "Your Twilio Auth Token"} {...register("twilioAuthToken")} disabled={isLoading || isSavingCredentials}/>
                     {errors.twilioAuthToken && <p className="text-xs text-destructive">{errors.twilioAuthToken.message}</p>}
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="twilioPhoneNumber" className="text-xs font-medium">Default Twilio Phone Number</Label>
                    <Input id="twilioPhoneNumber" type="tel" placeholder="+1234567890 (E.164 format)" {...register("twilioPhoneNumber")} disabled={isLoading || isSavingCredentials}/>
                    {errors.twilioPhoneNumber && <p className="text-xs text-destructive">{errors.twilioPhoneNumber.message}</p>}
                </div>
              </CardContent>
            </Card>

          </CardContent>
           <CardFooter className="p-4 sm:p-6 border-t">
              <Button type="submit" size="sm" className="text-xs sm:text-sm" disabled={isLoading || isSavingCredentials}>
                {isSavingCredentials ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <KeyRound className="mr-2 h-3.5 w-3.5" />}
                {isSavingCredentials ? "Saving Credentials..." : "Save All API Credentials"}
              </Button>
            </CardFooter>
        </Card>
      </form>
      
      <div className="space-y-6 sm:space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg sm:text-xl">Interface</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="theme-switch" className="text-sm sm:text-base font-medium">
                  Theme
                </Label>
                <p className="text-xs sm:text-sm text-foreground/80">
                  Switch between light and dark mode.
                </p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Sun className={cn('h-4 w-4 sm:h-5 sm:w-5', theme === 'light' ? 'text-foreground' : 'text-foreground/60')} />
                <Switch
                  id="theme-switch"
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  aria-label="Toggle theme"
                  disabled={isLoading && !authLoading && !isAppContextLoading}
                />
                <Moon className={cn('h-4 w-4 sm:h-5 sm:w-5', theme === 'dark' ? 'text-foreground' : 'text-foreground/60')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg sm:text-xl">Data Management</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4">
              <div className="space-y-0.5">
                  <Label className="text-sm sm:text-base font-medium text-destructive">
                      Clear All Workspace Data
                  </Label>
                  <p className="text-xs sm:text-sm text-foreground/80">
                      Permanently delete all your clients and agents. This action cannot be undone.
                  </p>
              </div>
              <AlertDialog open={isClearDataDialogOpen} onOpenChange={setIsClearDataDialogOpen}>
                  <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isLoading || isClearingData} className="w-full sm:w-auto text-xs sm:text-sm border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                        {isClearingData || (isLoading && !authLoading && !isAppContextLoading) ? <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" /> : <Trash2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />} 
                        {isClearingData ? "Clearing..." : "Clear All Data"}
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                          This will permanently delete ALL clients and agents from your account. This action cannot be undone and your data will be lost forever.
                      </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                      <AlertDialogCancel disabled={isClearingData}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isClearingData}>
                          {isClearingData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, delete everything" }
                      </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
