
interface TeacherPreferencesProps {
  children: React.ReactNode;
}

export const TeacherPreferences = ({ children }: TeacherPreferencesProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Teacher Preferences</h2>
      {children}
    </div>
  );
};
