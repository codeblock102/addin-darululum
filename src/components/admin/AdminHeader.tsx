interface AdminHeaderProps {
  title: string;
  description: string;
}

export const AdminHeader = ({ title, description }: AdminHeaderProps) => {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};
