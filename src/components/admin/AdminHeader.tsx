import { useI18n } from "@/contexts/I18nContext.tsx";

interface AdminHeaderProps {
  title: string;
  description: string;
}

export const AdminHeader = ({ title, description }: AdminHeaderProps) => {
  const { t } = useI18n();
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold">{t(title)}</h1>
      <p className="text-muted-foreground">{t(description)}</p>
    </div>
  );
};
