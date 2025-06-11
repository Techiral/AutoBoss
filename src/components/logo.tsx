
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  // ACTION REQUIRED: Logo Replacement
  // 1. Place your logo image file (e.g., autoboss-logo-light.svg or autoboss-logo-dark.svg) in the /public folder.
  // 2. Update the src="/your-logo-filename.png" below to point to your new file.
  //    Consider having separate logos for light/dark themes if your logo has color.
  //    You can use CSS to switch them or a more complex React component logic if needed.
  //    For simplicity, this example uses one logo.
  // 3. Adjust the width and height attributes as needed to match your logo's aspect ratio and desired size.
  // 4. If your logo image already includes the company name "AutoBoss", you can remove or comment out the <span>AutoBoss</span> part.
  return (
    <div className={cn(
      "flex items-center gap-2 text-foreground",
      className
    )}>
      <Image
        src="/my-company-logo.png" // Replace this with your actual logo file in /public
        alt="AutoBoss Logo" // Update with your company name if different
        width={32} // Adjust as needed
        height={32} // Adjust as needed
        className="shrink-0"
        data-ai-hint="modern tech company logo"
      />
      {!collapsed && <span className="font-headline text-2xl font-semibold">AutoBoss</span>}
    </div>
  );
}
