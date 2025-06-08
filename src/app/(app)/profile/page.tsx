
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

const displayNameFormSchema = z.object({
  displayName: z.string().min(1, "Display name cannot be empty").max(50, "Display name too long"),
});
type DisplayNameFormData = z.infer<typeof displayNameFormSchema>;

const phoneFormSchema = z.object({
  // Basic validation, can be enhanced (e.g., with a library like libphonenumber-js for stricter E.164 format)
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
      setIsLoadingPhoneNumber(true);
      const phone = await getUserPhoneNumberFromFirestore();
      setCurrentPhoneNumber(phone);
      if (phone) {
        setPhoneValue("phoneNumber", phone);
      }
      setIsLoadingPhoneNumber(false);
    };

    if (currentUser) {
      fetchPhoneNumber();
    }
  }, [currentUser, setDisplayNameValue, getUserPhoneNumberFromFirestore, setPhoneValue]);

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

  if (authLoading || (currentUser && isLoadingPhoneNumber)) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Card>
        <CardHeader><CardTitle>Profile Not Available</CardTitle></CardHeader>
        <CardContent><p>Please log in to view your profile.</p></CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCircle className="w-10 h-10 text-primary" />
            <div>
              <CardTitle className="font-headline text-2xl">Your Profile</CardTitle>
              <CardDescription>Manage your account settings and personal information.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="email" className="flex items-center text-sm font-medium text-muted-foreground">
              <Mail className="w-4 h-4 mr-2" /> Email Address
            </Label>
            <Input id="email" type="email" value={currentUser.email || "Not available"} readOnly disabled className="mt-1 bg-muted/50"/>
          </div>

          <Separator />

          <form onSubmit={handleSubmitDisplayName(onDisplayNameSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="displayName" className="text-base font-semibold">Display Name</Label>
              <p className="text-xs text-muted-foreground mb-1">This name is displayed in the application.</p>
              <Input id="displayName" placeholder="Enter your display name" {...registerDisplayName("displayName")} />
              {displayNameErrors.displayName && <p className="text-sm text-destructive mt-1">{displayNameErrors.displayName.message}</p>}
            </div>
            <Button type="submit" disabled={isUpdatingName} className="w-full sm:w-auto">
              {isUpdatingName ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isUpdatingName ? "Saving..." : "Save Display Name"}
            </Button>
          </form>

          <Separator />

          <form onSubmit={handleSubmitPhone(onPhoneSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="phoneNumber" className="text-base font-semibold flex items-center">
                <Phone className="w-4 h-4 mr-2"/> Phone Number
              </Label>
              <p className="text-xs text-muted-foreground mb-1">Provide your phone number (e.g., for account recovery or notifications in the future).</p>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="e.g., +11234567890"
                {...registerPhone("phoneNumber")}
                defaultValue={currentPhoneNumber || ""}
              />
              {phoneErrors.phoneNumber && <p className="text-sm text-destructive mt-1">{phoneErrors.phoneNumber.message}</p>}
            </div>
            <Button type="submit" disabled={isUpdatingPhone} className="w-full sm:w-auto">
              {isUpdatingPhone ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isUpdatingPhone ? "Saving..." : "Save Phone Number"}
            </Button>
          </form>

          <Separator />

          <div>
            <h3 className="text-base font-semibold flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-primary"/> Security
            </h3>
            <p className="text-xs text-muted-foreground mb-2">Manage your account security settings.</p>
            <Button variant="outline" onClick={handleSendPasswordReset} disabled={isSendingResetEmail} className="w-full sm:w-auto">
              {isSendingResetEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSendingResetEmail ? "Sending..." : "Send Password Reset Email"}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">A link to reset your password will be sent to your registered email address.</p>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            User since: {currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
