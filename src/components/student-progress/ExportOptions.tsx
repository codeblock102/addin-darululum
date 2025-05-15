
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/types/progress";

interface ExportOptionsProps {
  studentId: string;
  studentName: string;
  progressData: Progress[];
  attendanceData: any[];
  toast: any;
}

export const ExportOptions = ({ 
  studentId, 
  studentName, 
  progressData, 
  attendanceData,
  toast 
}: ExportOptionsProps) => {
  const handleExport = () => {
    // Export implementation
    toast({
      title: "Export Started",
      description: "Your export is being prepared..."
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Options</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4">
        <Button onClick={handleExport}>Export Progress Report</Button>
        <Button onClick={handleExport}>Export Attendance Report</Button>
      </CardContent>
    </Card>
  );
};
