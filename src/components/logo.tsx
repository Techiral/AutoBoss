
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({ collapsed, className }: { collapsed?: boolean; className?: string }) {
  // ACTION REQUIRED: Logo Replacement & Dimension Update
  // 1. Replace src="/my-company-logo.png" with the path to your new logo image file in the /public folder.
  //    This new image should contain both your icon AND the "AutoBoss" text.
  // 2. CRITICAL: Update the width and height attributes below to match the
  //    actual aspect ratio of your new combined logo image.
  //    For example, if your new logo is 120px wide and 40px high, set width={120} height={40}
  //    or a proportional representation like width={90} height={30}.
  return (
    <div className={cn(
      "flex items-center gap-2 text-foreground",
      className
    )}>
      <Image
        src="/my-company-logo.png" // Replace this!
        alt="AutoBoss Company Logo" // Updated alt text
        width={96} // Example: Update this to your new logo's width
        height={32} // Example: Update this to your new logo's height
        className="shrink-0"
        data-ai-hint="modern tech company logo with text" // Hint updated
      />
      {/* The text span has been removed as per your request.
          The logo image above should now contain both the icon and company name. */}
    </div>
  );
}
