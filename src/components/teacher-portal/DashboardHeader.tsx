
import { Teacher } from "@/types/teacher";

interface DashboardHeaderProps {
  teacher: Teacher;
}

export const DashboardHeader = ({ teacher }: DashboardHeaderProps) => {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Welcome, {teacher.name}</h1>
      <p className="text-muted-foreground">
        Teacher Portal - {teacher.subject} | Experience: {teacher.experience}
      </p>
    </div>
  );
};
