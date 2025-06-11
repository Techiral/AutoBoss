
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  // To replace the logo:
  // 1. Place your logo image file (e.g., my-company-logo.png) in the /public folder.
  // 2. Update the src="/your-logo-filename.png" below to point to your new file.
  // 3. Adjust the width and height attributes as needed to match your logo's aspect ratio and desired size.
  // 4. If your logo image already includes the company name, you can remove the <span>AutoBoss</span> part.
  return (
    <div className={cn(
      "flex items-center gap-2 text-foreground",
      className
    )}>
      <Image
        src="/my-company-logo.png" // Ensure this file exists in your /public folder
        alt="Company Logo" // Update with your company name
        width={32} // Adjust as needed, current h-8 w-8 equivalent
        height={32} // Adjust as needed
        className="shrink-0" // Keeps the logo from shrinking if space is tight
        data-ai-hint="company brand" // Helps with AI image suggestions if needed later
      />
      {!collapsed && <span className="font-headline text-2xl font-semibold">AutoBoss</span>}
    </div>
  );
}
