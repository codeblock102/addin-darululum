
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const WeeklySchedule = () => {
  return (
    <Card className="h-auto lg:h-96">
      <CardHeader>
        <CardTitle>Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Upcoming classes will be displayed here
        </div>
      </CardContent>
    </Card>
  );
};
