import { Button } from "@/components/ui/button.tsx";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext.tsx";

interface SubmitButtonProps {
  isPending: boolean;
  isUpdate: boolean;
}

export function SubmitButton({ isPending, isUpdate }: SubmitButtonProps) {
  const { t } = useI18n();
  return (
    <Button
      type="submit"
      className="w-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
      disabled={isPending}
    >
      {isPending
        ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.saving", "Saving...")}
          </span>
        )
        : (
          isUpdate ? t("pages.attendance.update", "Update Attendance") : t("pages.attendance.save.label", "Save Attendance")
        )}
    </Button>
  );
}
