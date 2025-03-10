
import { useToast } from "@/hooks/use-toast";

export const exportDataAsCSV = (data: Array<{ name: string; verses: number }>, toast: ReturnType<typeof useToast>["toast"]) => {
  if (!data || data.length === 0) return;
  
  // Create CSV for student progress
  const studentCSV = [
    'Student Name,Verses Memorized',
    ...data.map(student => `${student.name},${student.verses}`)
  ].join('\n');
  
  // Create and download the file
  const blob = new Blob([studentCSV], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `student-progress-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toast({
    title: "Export Complete",
    description: "Student progress data has been exported as CSV.",
  });
};
