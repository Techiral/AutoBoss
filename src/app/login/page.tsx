
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
import { Loader2, LogIn } from "lucide-react";
import { Logo } from "@/components/logo";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false); // Renamed from isLoading for clarity
  const { toast } = useToast();
  const router = useRouter();
  const { signIn, currentUser, loading: authLoading } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    // Redirect if user is already logged in and auth is not loading
    if (!authLoading && currentUser) {
      router.push("/dashboard");
    }
  }, [currentUser, authLoading, router]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);
    const user = await signIn(data.email, data.password);
    setIsSubmitting(false);
    if (user) {
      // router.push("/dashboard"); // Redirection is handled by useEffect above or AppLayout
    }
    // Toast for error is handled within signIn
  };
  
  // Show loader if auth state is still loading
  if (authLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
  }

  // If user is already logged in (and authLoading is false), useEffect will redirect.
  // So, we can directly render the form if not loading and no current user.
  // This avoids a flash of the form before redirection if already logged in.
  if (currentUser) {
    return null; // Or a minimal loading state if preferred, but useEffect handles redirect
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/30 p-4">
      <div className="mb-8">
        <Logo collapsed={false}/>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl flex items-center justify-center gap-2">
            <LogIn className="w-7 h-7"/> Login to AutoBoss
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your AI agents.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </p>
          </CardFooter>
        </form>
      </Card>
       <p className="text-xs text-muted-foreground mt-8">© {new Date().getFullYear()} AutoBoss. All rights reserved.</p>
    </div>
  );
}
    