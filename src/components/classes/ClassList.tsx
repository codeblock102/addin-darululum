import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Plus, Loader2, Users, MapPin, Calendar, Clock, MoreHorizontal } from "lucide-react";
import { ClassDialog } from "./ClassDialog.tsx";
import { useToast } from "@/components/ui/use-toast.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Badge } from "@/components/ui/badge.tsx";

interface Class {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  teacher_id: string | null;
  capacity: number | null;
  current_students: number | null;
  room: string | null;
  status: "active" | "inactive";
  days_of_week: string[] | null;
  time_slots: any[] | null;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
}

export const ClassList = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: classes, isLoading } = useQuery<Class[]>({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const deleteClassMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast({
        title: "Success",
        description: "Class deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to delete class: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteClassMutation.mutate(id);
  };

  const formatTimeSlots = (timeSlots: any[]): string => {
    if (!timeSlots || timeSlots.length === 0) return "No time slots";
    
    return timeSlots
      .map((slot: any) => {
        if (typeof slot === 'object' && slot.start_time && slot.end_time) {
          return `${slot.start_time} - ${slot.end_time}`;
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-gray-600 mt-1">Manage class schedules and information</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classes?.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{cls.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {cls.description || "No description"}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(cls)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(cls.id)}
                        className="text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{cls.current_students || 0}/{cls.capacity} students</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>{cls.room || "No room assigned"}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{cls.days_of_week?.join(", ") || "No days set"}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{formatTimeSlots(cls.time_slots || [])}</span>
                  </div>
                  
                  <div className="pt-2">
                    <Badge 
                      variant={cls.status === "active" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {cls.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClassDialog 
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingClass(null);
        }}
        classToEdit={editingClass}
      />
    </div>
  );
};
