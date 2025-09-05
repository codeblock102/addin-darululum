import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card.tsx";
import { useI18n } from "@/contexts/I18nContext.tsx";

export const AccessDenied = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <Card className="p-6 flex flex-col items-center justify-center text-center">
      <h2 className="text-2xl font-bold mb-4">{t("pages.teacherPortal.accessDenied.title", "Access Denied")}</h2>
      <p className="text-gray-600 mb-6">{t("pages.teacherPortal.accessDenied.message", "You don't have permission to access the teacher portal. This area is restricted to teacher accounts.")}</p>
      <div className="space-x-4">
        <Button onClick={() => navigate("/")} variant="outline">{t("pages.teacherPortal.accessDenied.returnDashboard", "Return to Dashboard")}</Button>
        <Button onClick={() => navigate("/auth")} variant="default">{t("pages.teacherPortal.accessDenied.signInDifferent", "Sign in with a Different Account")}</Button>
      </div>
    </Card>
  );
};
