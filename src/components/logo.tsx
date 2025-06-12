
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  // ACTION REQUIRED: Verify Logo Dimensions
  // The width and height attributes below are set to 240x80, assuming a 3:1 aspect ratio for high quality.
  // If your 'public/logo.png' file has DIFFERENT DIMENSIONS,
  // PLEASE UPDATE the width={240} and height={80} attributes below
  // to match the ACTUAL aspect ratio and desired base size of your logo.png.
  return (
    <div className={cn(
      "flex items-center gap-2 text-foreground",
      className
    )}>
      <Image
        src="/logo.png" // Updated to use your specific file name
        alt="AutoBoss Company Logo"
        width={240}  // Assumed width, please verify and adjust if your logo.png is different
        height={80} // Assumed height, please verify and adjust if your logo.png is different
        className="shrink-0"
        priority // Adding priority as logos are often LCP elements
        data-ai-hint="modern tech company logo with text"
      />
    </div>
  );
}
