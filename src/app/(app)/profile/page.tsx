
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, UserCircle, Mail, ShieldCheck, Phone } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const displayNameFormSchema = z.object({
  displayName: z.string().min(1, "Display name cannot be empty").max(50, "Display name too long"),
});
type DisplayNameFormData = z.infer<typeof displayNameFormSchema>;

const phoneFormSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number seems too short").max(15, "Phone number seems too long").regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format (e.g., +12223334444)"),
});
type PhoneFormData = z.infer<typeof phoneFormSchema>;


export default function ProfilePage() {
  const { 
    currentUser, 
    updateUserDisplayName, 
    sendUserPasswordResetEmail, 
    loading: authLoading,
    updateUserPhoneNumberInFirestore,
    getUserPhoneNumberFromFirestore
  } = useAuth();

  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string | null>(null);
  const [isLoadingPhoneNumber, setIsLoadingPhoneNumber] = useState(true);

  const { toast } = useToast();

  const { register: registerDisplayName, handleSubmit: handleSubmitDisplayName, setValue: setDisplayNameValue, formState: { errors: displayNameErrors } } = useForm<DisplayNameFormData>({
    resolver: zodResolver(displayNameFormSchema),
    defaultValues: { displayName: "" }
  });

  const { register: registerPhone, handleSubmit: handleSubmitPhone, setValue: setPhoneValue, formState: { errors: phoneErrors } } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: { phoneNumber: "" }
  });

  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayNameValue("displayName", currentUser.displayName);
    } else {
      setDisplayNameValue("displayName", "");
    }

    const fetchPhoneNumber = async () => {
      if (!currentUser) { // Ensure currentUser exists before fetching
        setIsLoadingPhoneNumber(false);
        return;
      }
      setIsLoadingPhoneNumber(true);
      const phone = await getUserPhoneNumberFromFirestore();
      setCurrentPhoneNumber(phone);
      if (phone) {
        setPhoneValue("phoneNumber", phone);
      }
      setIsLoadingPhoneNumber(false);
    };

    if (!authLoading) { // Only fetch if auth is not loading
      fetchPhoneNumber();
    }
  }, [currentUser, setDisplayNameValue, getUserPhoneNumberFromFirestore, setPhoneValue, authLoading]);

  const onDisplayNameSubmit: SubmitHandler<DisplayNameFormData> = async (data) => {
    setIsUpdatingName(true);
    await updateUserDisplayName(data.displayName);
    setIsUpdatingName(false);
  };

  const onPhoneSubmit: SubmitHandler<PhoneFormData> = async (data) => {
    setIsUpdatingPhone(true);
    const success = await updateUserPhoneNumberInFirestore(data.phoneNumber);
    if (success) {
      setCurrentPhoneNumber(data.phoneNumber);
    }
    setIsUpdatingPhone(false);
  };

  const handleSendPasswordReset = async () => {
    setIsSendingResetEmail(true);
    await sendUserPasswordResetEmail();
    setIsSendingResetEmail(false);
  };

  if (authLoading || (!authLoading && currentUser && isLoadingPhoneNumber)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <Logo className="mb-3 h-8" />
        <Loader2 className="h-10 w-10 sm:h-12 sm:h-12 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground mt-2">Loading profile...</p>
      </div>
    );
  }

  if (!currentUser) { // If not loading and still no current user
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6"><CardTitle className="text-lg sm:text-xl">Profile Not Available</CardTitle></CardHeader>
        <CardContent className="p-4 sm:p-6"><p className="text-sm">Please log in to view your profile.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <UserCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            <div>
              <CardTitle className={cn("font-headline text-xl sm:text-2xl", "text-gradient-dynamic")}>Your Profile</CardTitle>
              <CardDescription className="text-sm">Manage your account settings.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-6 p-4 sm:p-6">
          <div>
            <Label htmlFor="email" className="flex items-center text-xs sm:text-sm font-medium text-muted-foreground">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 text-primary" /> Email Address
            </Label>
            <Input id="email" type="email" value={currentUser.email || "Not available"} readOnly disabled className="mt-1 bg-muted/50 text-sm"/>
          </div>

          <Separator />

          <form onSubmit={handleSubmitDisplayName(onDisplayNameSubmit)} className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="displayName" className="text-sm sm:text-base font-semibold">Display Name</Label>
              <p className="text-xs text-muted-foreground mb-1">This name is displayed in the application.</p>
              <Input id="displayName" placeholder="Enter your display name" {...registerDisplayName("displayName")} className="text-sm"/>
              {displayNameErrors.displayName && <p className="text-xs text-destructive mt-1">{displayNameErrors.displayName.message}</p>}
            </div>
            <Button type="submit" disabled={isUpdatingName} className={cn("w-full sm:w-auto text-sm py-2", "btn-gradient-primary")}>
              {isUpdatingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isUpdatingName ? "Saving..." : "Save Display Name"}
            </Button>
          </form>

          <Separator />

          <form onSubmit={handleSubmitPhone(onPhoneSubmit)} className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="phoneNumber" className="text-sm sm:text-base font-semibold flex items-center">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 text-primary"/> Phone Number
              </Label>
              <p className="text-xs text-muted-foreground mb-1">Optional: for account recovery or notifications.</p>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="e.g., +11234567890"
                {...registerPhone("phoneNumber")}
                defaultValue={currentPhoneNumber || ""}
                className="text-sm"
              />
              {phoneErrors.phoneNumber && <p className="text-xs text-destructive mt-1">{phoneErrors.phoneNumber.message}</p>}
            </div>
            <Button type="submit" disabled={isUpdatingPhone} className={cn("w-full sm:w-auto text-sm py-2", "btn-gradient-primary")}>
              {isUpdatingPhone ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isUpdatingPhone ? "Saving..." : "Save Phone Number"}
            </Button>
          </form>

          <Separator />

          <div>
            <h3 className="text-sm sm:text-base font-semibold flex items-center">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary"/> Security
            </h3>
            <p className="text-xs text-muted-foreground mb-2">Manage your account security settings.</p>
            <Button variant="outline" onClick={handleSendPasswordReset} disabled={isSendingResetEmail} className="w-full sm:w-auto text-sm py-2">
              {isSendingResetEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSendingResetEmail ? "Sending..." : "Send Password Reset Email"}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">A link to reset your password will be sent to your email.</p>
          </div>
        </CardContent>
        <CardFooter className="p-4 sm:p-6">
          <p className="text-xs text-muted-foreground">
            User since: {currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
