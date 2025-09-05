import { Loader2 } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext.tsx";

export const LoadingState = () => {
  const { t } = useI18n();
  return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-lg">{t("common.loadingProfile", "Loading your profile...")}</span>
    </div>
  );
};
