
interface SettingsHeaderProps {
  isSaving: boolean;
  onSave: () => void;
}

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function SettingsHeader({ isSaving, onSave }: SettingsHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Configure application settings and preferences
          </p>
        </div>
        <Button 
          onClick={onSave} 
          disabled={isSaving}
          size="lg"
          className="min-w-[150px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
