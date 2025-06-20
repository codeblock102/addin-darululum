
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StudentGridHeaderProps {
  studentsCount: number;
  multiSelect: boolean;
}

export function StudentGridHeader({ studentsCount, multiSelect }: StudentGridHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Users className="h-5 w-5 text-green-400" />
          Select Students
        </h3>
        <p className="text-sm text-gray-400">
          {multiSelect ? 'Choose multiple students for bulk attendance' : 'Choose a student to record attendance'}
        </p>
      </div>
      <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 px-3 py-1">
        {studentsCount} students
      </Badge>
    </div>
  );
}
