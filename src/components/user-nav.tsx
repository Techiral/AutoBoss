
"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, LifeBuoy, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; 
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function UserNav() {
  const { currentUser, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login'); 
  };

  if (loading) {
    return (
        <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0" disabled>
             <Avatar className="h-8 w-8 sm:h-10 sm:w-10 animate-pulse bg-muted" />
        </Button>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button variant="outline" size="sm" asChild className="text-xs px-2 py-1 sm:px-3 sm:py-1.5 h-auto">
          <Link href="/login">
            <LogIn className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Login
          </Link>
        </Button>
        <Button size="sm" asChild className="text-xs px-2 py-1 sm:px-3 sm:py-1.5 h-auto">
          <Link href="/signup">
           <UserPlus className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Sign Up
          </Link>
        </Button>
      </div>
    );
  }

  const userDisplayName = currentUser.displayName || currentUser.email?.split('@')[0] || "User";
  const userEmail = currentUser.email || "No email available";
  const avatarFallback = userDisplayName.substring(0, 2).toUpperCase();


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            {currentUser.photoURL ? (
                <AvatarImage src={currentUser.photoURL} alt={userDisplayName} />
            ) : (
                <AvatarImage src={`https://placehold.co/40x40.png?text=${avatarFallback}`} alt={userDisplayName} data-ai-hint="user avatar placeholder"/>
            )}
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-medium leading-none truncate">{userDisplayName}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile"> 
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/support">
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Support</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
