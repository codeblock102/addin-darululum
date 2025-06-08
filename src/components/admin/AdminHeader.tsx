import { ReactNode } from "react";

interface AdminHeaderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export const AdminHeader = (
  { title, description, children }: AdminHeaderProps,
) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-gray-500">{description}</p>
      </div>
      {children}
    </div>
  );
};
