
import { Card, CardContent } from '@/components/ui/card';
import { Users, User, Search } from 'lucide-react';

export function NoClassSelectedState() {
  return (
    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Select a Class First
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
          Choose a class from the dropdown above to view and select students for attendance recording.
        </p>
      </CardContent>
    </Card>
  );
}

export function NoStudentsState() {
  return (
    <Card className="border-2 border-dashed border-amber-300 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-900/20">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Active Students
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
          There are no active students in this class. Add students to the class to record attendance.
        </p>
      </CardContent>
    </Card>
  );
}

export function NoSearchResultsState({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-lg font-medium text-gray-100 mb-2">
        No Students Found
      </h3>
      <p className="text-gray-400 text-center max-w-sm mx-auto">
        No students match your search for "{searchQuery}". Try adjusting your search terms.
      </p>
    </div>
  );
}
