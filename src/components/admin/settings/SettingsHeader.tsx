import { Button } from "@/components/ui/button.tsx";
import { Loader2, Save } from "lucide-react";

interface SettingsHeaderProps {
  isSaving: boolean;
  onSave: () => void;
}

export function SettingsHeader(
  { isSaving, onSave }: SettingsHeaderProps,
) {
  return (
    <div className="flex items-center justify-between pb-6 border-b border-gray-200">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          System Settings
        </h1>
        <p className="mt-1 text-base text-gray-500">
          Manage your system-wide settings and preferences.
        </p>
      </div>
      <Button onClick={onSave} disabled={isSaving} className="min-w-[120px]">
        {isSaving
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
          : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
      </Button>
    </div>
  );
}
