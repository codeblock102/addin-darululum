
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
import { Edit, Users } from "lucide-react";

interface Class {
  id: string;
  name: string;
  teacher_id: string;
  teacher_name?: string;
  room: string;
  day_of_week: string;
  time_slot: string;
  capacity: number;
  status: string;
}

interface ClassListProps {
  searchQuery: string;
  onEdit: (classItem: Class) => void;
}

export const ClassList = ({ searchQuery, onEdit }: ClassListProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*, teachers(name)')
        .order('name', { ascending: true });

      if (error) throw error;
      return data.map(cls => ({
        ...cls,
        teacher_name: cls.teachers?.name
      }));
    },
  });

  const filteredClasses = classes?.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.teacher_name && 
       cls.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()))
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Teacher</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Schedule</TableHead>
          <TableHead>Capacity</TableHead>
          <TableHead>Status</TableHead>
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
            <TableCell>{cls.teacher_name || '—'}</TableCell>
            <TableCell>{cls.room || '—'}</TableCell>
            <TableCell>
              {cls.day_of_week} at {cls.time_slot}
            </TableCell>
            <TableCell>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                {cls.capacity}
              </div>
            </TableCell>
            <TableCell>
              <span className={`px-2 py-1 rounded-full text-xs ${
                cls.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {cls.status}
              </span>
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
};
