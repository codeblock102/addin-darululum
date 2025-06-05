import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { supabase } from '@/integrations/supabase/client.ts';

// Define a simplified interface for the activity data
interface ActivityItem {
  id: string;
  date: string;
  verses_memorized?: number;
  memorization_quality?: string;
  students?: {
    name: string;
  };
}

interface RecentActivityProps {
  teacherId?: string;
}

export const RecentActivity = ({ teacherId }: RecentActivityProps) => {
  const {
    data: recentActivity
  } = useQuery({
    queryKey: ['recentActivity', teacherId],
    queryFn: async () => {
      try {
        // Simplified query to avoid type instantiation issues
        const { data, error } = await supabase
          .from('progress')
          .select('id, date, verses_memorized, memorization_quality, student_id')
          .order('date', { ascending: false })
          .limit(5);
          
        if (error) throw error;
        
        // If no actual data exists, return empty array
        if (!data || data.length === 0) {
          return [] as ActivityItem[];
        }
        
        // Fetch student names separately to avoid deep type instantiation
        const enrichedData = await Promise.all(data.map(async (item) => {
          if (item.student_id) {
            const { data: studentData } = await supabase
              .from('students')
              .select('name')
              .eq('id', item.student_id)
              .single();
              
            return {
              ...item,
              students: { name: studentData?.name || 'Unknown Student' }
            };
          }
          return {
            ...item,
            students: { name: 'Unknown Student' }
          };
        }));
        
        return enrichedData as ActivityItem[];
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        return [] as ActivityItem[];
      }
    }
  });
  
  return (
    <Card className="h-auto">
      <CardHeader className=" dark:bg-purple-900/20">
        <CardTitle className="text-purple-700 dark:text-purple-300">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity && recentActivity.length > 0 ? recentActivity.map((activity) => (
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
