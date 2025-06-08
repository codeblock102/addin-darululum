import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { RecentActivity } from './RecentActivity.tsx';
import { WeeklySchedule } from './WeeklySchedule.tsx';

export const DashboardTabs = () => {
  return <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid grid-cols-3 mb-6 bg-gray-800">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="progress">Progress</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-800">
          <RecentActivity />
          <WeeklySchedule />
        </div>
      </TabsContent>
      
      <TabsContent value="progress" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Student Progress Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Progress data visualization will be displayed here
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="attendance" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Attendance chart will be displayed here
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>;
};