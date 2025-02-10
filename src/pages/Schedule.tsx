
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";

const Schedule = () => {
  // Sample schedule data - would come from backend in production
  const schedules = [
    {
      id: 1,
      time: "8:00 AM - 10:00 AM",
      class: "Morning Hifz",
      teacher: "Ustadh Muhammad",
      students: 12,
      room: "Room A1"
    },
    {
      id: 2,
      time: "10:30 AM - 12:30 PM",
      class: "Afternoon Hifz",
      teacher: "Ustadh Abdullah",
      students: 15,
      room: "Room B2"
    },
    {
      id: 3,
      time: "2:00 PM - 4:00 PM",
      class: "Evening Hifz",
      teacher: "Ustadh Ahmad",
      students: 10,
      room: "Room C3"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Class Schedule</h1>
            <p className="text-gray-500">Manage daily class schedules and assignments</p>
          </div>
          <Button>
            <CalendarIcon className="mr-2" />
            Add Class
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{schedule.class}</h3>
                    <p className="text-sm text-gray-500">{schedule.time}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Teacher:</span> {schedule.teacher}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Students:</span> {schedule.students}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Room:</span> {schedule.room}
                  </p>
                </div>
                <div className="pt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Schedule;
