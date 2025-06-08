import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Calendar } from 'lucide-react';

export const WeeklySchedule = () => {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = new Date().getDay();
  
  return (
    <Card className="h-auto lg:h-96 border border-purple-100 dark:border-purple-900/30 shadow-sm">
      <CardHeader className="">
        <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Weekly Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-2">
          {daysOfWeek.map((day, index) => (
            <div 
              key={day} 
              className={`p-3 rounded-md flex items-center justify-between ${
                index === currentDay 
                  ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800' 
                  : 'border border-gray-100 dark:border-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  index === currentDay 
                    ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {day.substring(0, 1)}
                </div>
                <span className={`font-medium ${
                  index === currentDay 
                    ? 'text-purple-700 dark:text-purple-300' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {day}
                </span>
              </div>
              <div className={`text-sm ${
                index === currentDay 
                  ? 'text-purple-700 dark:text-purple-300' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {index === currentDay ? 'Today' : 'No classes'}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
