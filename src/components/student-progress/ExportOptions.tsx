
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/types/progress";
import { exportDataAsCSV } from "@/utils/exportUtils";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";

interface ExportOptionsProps {
  studentId: string;
  studentName: string;
  progressData: Progress[];
  attendanceData: any[];
  dhorData: any[];
  toast: any;
}

export function ExportOptions({ 
  studentId, 
  studentName, 
  progressData, 
  attendanceData, 
  dhorData,
  toast
}: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Process data for export
  const processDataForExport = () => {
    // Process progress data
    const processedProgressData = progressData.map(entry => ({
      date: entry.date || '',
      current_surah: entry.current_surah || '',
      current_juz: entry.current_juz || '',
      verses_memorized: entry.verses_memorized || 0,
      memorization_quality: entry.memorization_quality || '',
      notes: entry.notes || ''
    }));

    // Process attendance data
    const processedAttendanceData = attendanceData.map(entry => ({
      date: entry.date || '',
      status: entry.status || '',
      notes: entry.notes || ''
    }));

    // Process dhor book data
    const processedDhorData = dhorData.map(entry => ({
      entry_date: entry.entry_date || '',
      dhor_1: entry.dhor_1 || '',
      dhor_1_mistakes: entry.dhor_1_mistakes || 0,
      dhor_2: entry.dhor_2 || '',
      dhor_2_mistakes: entry.dhor_2_mistakes || 0,
      points: entry.points || 0,
      comments: entry.comments || ''
    }));

    return {
      progressData: processedProgressData,
      attendanceData: processedAttendanceData,
      dhorData: processedDhorData
    };
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const { progressData: processedProgressData } = processDataForExport();
      
      // Convert to format expected by the export utility
      const data = processedProgressData.map(entry => ({
        name: studentName,
        verses: entry.verses_memorized
      }));
      
      exportDataAsCSV(data, toast);
      toast({
        title: "Export Complete",
        description: "Data has been exported to CSV successfully."
      });
    } catch (error) {
      console.error("Export failed:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "There was an error exporting the data."
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      toast({
        title: "PDF Export",
        description: "PDF export functionality is in development."
      });
      setIsExporting(false);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Export Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={exportToCSV}
            disabled={isExporting || progressData.length === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Export as CSV
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={exportToPDF}
            disabled={isExporting || progressData.length === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Export as PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
