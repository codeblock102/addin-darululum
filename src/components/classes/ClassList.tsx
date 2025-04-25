
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Edit, Users } from "lucide-react";

interface ClassListProps {
  searchQuery: string;
  onEdit: (classItem: any) => void;
}

export function ClassList({ searchQuery, onEdit }: ClassListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          teachers (
            name
          )
        `)
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const filteredClasses = classes?.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.teachers?.name && 
       cls.teachers.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (cls.room && 
       cls.room.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (filteredClasses?.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No classes found.</p>
      </div>
    );
  }

  const formatTime = (timeSlot: any) => {
    if (!timeSlot) return 'N/A';
    
    // Handle the new time_slots array format
    if (Array.isArray(timeSlot) && timeSlot.length > 0) {
      const firstSlot = timeSlot[0];
      return `${firstSlot.start_time} - ${firstSlot.end_time}`;
    }
    
    // Return as is if it's already formatted
    return timeSlot;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Schedule</TableHead>
          <TableHead>Teacher</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Capacity</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredClasses?.map((cls) => (
          <TableRow 
            key={cls.id}
            className="transition-colors hover:bg-muted/50"
            onMouseEnter={() => setHoveredId(cls.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <TableCell className="font-medium">{cls.name}</TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="text-sm font-medium">
                  {formatTime(cls.time_slots)}
                </div>
                <div className="flex flex-wrap gap-1">
                  {cls.days_of_week.map((day: string) => (
                    <Badge key={day} variant="outline" className="text-xs">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            </TableCell>
            <TableCell>{cls.teachers?.name || '—'}</TableCell>
            <TableCell>{cls.room}</TableCell>
            <TableCell>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className={cls.current_students >= cls.capacity ? "text-red-500" : ""}>
                  {cls.current_students} / {cls.capacity}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => onEdit(cls)}
                className={`transition-opacity duration-200 ${
                  hoveredId === cls.id ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
