import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from "recharts";

const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

interface Attendance {
  id: string;
  student_id?: string | null;
  date: string;
  status: string;
  notes?: string | null;
}

interface AttendanceStatsProps {
  attendanceData: Attendance[];
}

export function AttendanceStats({ attendanceData }: AttendanceStatsProps) {
  // Calculate attendance statistics
  const present = attendanceData.filter(record => record.status === 'present').length;
  const absent = attendanceData.filter(record => record.status === 'absent').length;
  const late = attendanceData.filter(record => record.status === 'late').length;
  const total = attendanceData.length;
  
  const attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
  
  const pieChartData = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
    { name: "Late", value: late },
  ].filter(item => item.value > 0);

  // Last 5 attendance records for quick view
  const recentAttendance = [...attendanceData]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Attendance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <h3 className="text-3xl font-bold">{attendanceRate}%</h3>
          <p className="text-sm text-muted-foreground">Attendance Rate</p>
        </div>

        <div className="h-[200px] mb-4">
          {total > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} days`, name]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)", 
                    borderRadius: "8px", 
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)", 
                    border: "1px solid #eee"
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No attendance data available
            </div>
          )}
        </div>
        
        {recentAttendance.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Recent Attendance</h4>
            <div className="space-y-2">
              {recentAttendance.map((record) => (
                <div key={record.id} className="flex justify-between items-center p-2 bg-muted/30 rounded-md">
                  <div className="text-sm">
                    {new Date(record.date).toLocaleDateString()}
                  </div>
                  <div>
                    <AttendanceStatusBadge status={record.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper component for attendance status badges
function AttendanceStatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
