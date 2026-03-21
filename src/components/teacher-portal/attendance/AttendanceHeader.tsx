export const AttendanceHeader = () => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Student Attendance
        </h2>
        <p className="text-muted-foreground">
          Record and monitor attendance for all students.
        </p>
      </div>
    </div>
  );
};
