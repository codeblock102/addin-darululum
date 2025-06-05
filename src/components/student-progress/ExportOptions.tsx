import React from 'react';
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { DailyActivityEntry } from "@/types/dhor-book.ts";
import { Tables } from "@/integrations/supabase/types.ts";

export interface ExportOptionsProps {
  studentId: string;
  studentName: string;
  progressData: DailyActivityEntry[];
  attendanceData: Tables<"attendance">[];
  sabaqParaData: Tables<"sabaq_para">[];
  juzRevisionsData: Tables<"juz_revisions">[];
  toast: any;
  onExportPDF?: () => void;
  onExportCSV?: () => void;
}

export const ExportOptions = ({ 
  onExportPDF, 
  onExportCSV, 
  studentId,
  studentName,
  progressData,
  attendanceData,
  sabaqParaData,
  juzRevisionsData,
  toast
}: ExportOptionsProps) => {
  
  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF();
    } else if (toast) {
      toast({
        title: "Export initiated",
        description: `Preparing PDF report for ${studentName || 'student'}`,
      });
      // Default PDF export logic could be implemented here
    }
  };
  
  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV();
    } else if (toast) {
      toast({
        title: "Export initiated",
        description: `Preparing CSV data for ${studentName || 'student'}`,
      });
      // Default CSV export logic could be implemented here
    }
  };
  
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <span className="font-medium text-gray-700 dark:text-gray-300 mr-auto mb-2 sm:mb-0">Export Data:</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportPDF}
            disabled={!studentId}
            className="w-full sm:w-auto"
          >
            <FileDown className="h-4 w-4 mr-2" />
            PDF Report
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            disabled={!studentId}
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            CSV Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
