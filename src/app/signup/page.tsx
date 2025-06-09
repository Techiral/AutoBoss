
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
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, UserPlus, Mail } from "lucide-react";
import { Logo } from "@/components/logo";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export default function SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { signUp, currentUser, loading: authLoading } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (!authLoading && currentUser) {
      router.push("/dashboard");
    }
  }, [currentUser, authLoading, router]);

  const onEmailSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    await signUp(data.email, data.password);
    setIsSubmitting(false);
  };

  if (authLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin text-primary" />
        </div>
      );
  }

  if (currentUser && !authLoading) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/30 p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <Link href="/" aria-label="AutoBoss Homepage" className="hover:opacity-80 transition-opacity">
          <Logo collapsed={false} className="h-8 sm:h-9"/>
        </Link>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="font-headline text-2xl sm:text-3xl flex items-center justify-center gap-2">
           <UserPlus className="w-6 h-6 sm:w-7 sm:h-7" /> Create Your AutoBoss Account
          </CardTitle>
          <CardDescription className="text-sm">
            Join AutoBoss to start building and managing your AI agents.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 sm:space-y-6 p-4 sm:p-6">
          <form onSubmit={handleSubmit(onEmailSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="•••••••• (min. 6 characters)" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full py-2.5">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
              {isSubmitting ? "Creating Account..." : "Sign Up with Email"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 p-4 sm:p-6 pt-3 sm:pt-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto text-xs sm:text-sm" asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
      <p className="text-xs text-muted-foreground mt-6 sm:mt-8">© {new Date().getFullYear()} AutoBoss. All rights reserved.</p>
    </div>
  );
}
