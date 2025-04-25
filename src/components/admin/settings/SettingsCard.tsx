
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface SettingsCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}

export function SettingsCard({ title, description, icon, children }: SettingsCardProps) {
  return (
    <Card className="border shadow-sm transition-all duration-300 hover:shadow-md animate-scaleIn overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 to-primary/10"></div>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2 text-primary transition-transform duration-300 hover:scale-110 hover:bg-primary/15">
            {icon}
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
        <CardDescription className="pt-1.5 text-sm text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">{children}</CardContent>
    </Card>
  );
}
