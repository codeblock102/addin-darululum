
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

// Define an interface for the activity data with properly defined types
interface ActivityItem {
  id: string;
  date: string;
  verses_memorized?: number;
  memorization_quality?: string;
  students?: {
    name: string;
  };
}

export const RecentActivity = () => {
  const {
    data: recentActivity
  } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('progress').select('id, date, students(name), verses_memorized, memorization_quality').order('date', {
        ascending: false
      }).limit(5);
      if (error) throw error;
      return data as ActivityItem[];
    }
  });
  
  return (
    <Card className="h-auto lg:h-96">
      <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
        <CardTitle className="text-purple-700 dark:text-purple-300">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity ? recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <p className="font-medium">{activity.students?.name || 'Unknown Student'}</p>
                <p className="text-sm text-muted-foreground">
                  Memorized {activity.verses_memorized} verses
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">{new Date(activity.date).toLocaleDateString()}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activity.memorization_quality === 'excellent' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                    : activity.memorization_quality === 'good' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                }`}>
                  {activity.memorization_quality || 'not rated'}
                </span>
              </div>
            </div>
          )) : (
            <p className="text-muted-foreground text-center py-8">No recent activity to display</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
