
interface TeacherProfileProps {
  children: React.ReactNode;
}

export const TeacherProfile = ({ children }: TeacherProfileProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Teacher Profile</h2>
      {children}
    </div>
  );
};
