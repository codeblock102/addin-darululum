
// Import the correct icons from lucide-react
import { Download, FileSpreadsheet, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ExportOptionsProps {
  onExportPDF: () => void;
  onExportCSV: () => void;
  studentId?: string;
}

export const ExportOptions = ({ onExportPDF, onExportCSV, studentId }: ExportOptionsProps) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <span className="font-medium text-gray-700 dark:text-gray-300 mr-auto mb-2 sm:mb-0">Export Data:</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExportPDF}
            disabled={!studentId}
            className="w-full sm:w-auto"
          >
            <FileDown className="h-4 w-4 mr-2" />
            PDF Report
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onExportCSV}
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
