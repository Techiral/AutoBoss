import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function AgentStudioPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Agent Studio</CardTitle>
        <CardDescription>Design and manage your agent's conversational flows visually.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Construction className="w-16 h-16 text-primary mb-4" />
        <h3 className="font-headline text-xl font-semibold mb-2">Visual Flow Designer Coming Soon!</h3>
        <p className="text-muted-foreground max-w-md">
          This section will allow you to create, edit, and visualize the conversation paths your AI agent can take.
          Stay tuned for updates!
        </p>
      </CardContent>
    </Card>
  );
}
