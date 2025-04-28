
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const WeeklySchedule = () => {
  return <Card className="h-auto lg:h-96">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
        <CardTitle className="text-purple-700 dark:text-purple-300">Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Upcoming classes will be displayed here
        </div>
      </CardContent>
    </Card>;
};
