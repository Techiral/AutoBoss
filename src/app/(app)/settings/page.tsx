import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Settings</CardTitle>
        <CardDescription>Manage your application preferences and account details.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <SettingsIcon className="w-16 h-16 text-primary mb-4" />
        <h3 className="font-headline text-xl font-semibold mb-2">Settings Page Under Construction</h3>
        <p className="text-muted-foreground max-w-md">
          This section will allow you to configure various application settings. Check back later for more options!
        </p>
      </CardContent>
    </Card>
  );
}
