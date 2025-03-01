import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, UserPlus } from "lucide-react";
import type { User } from "@/types/user";

export const TeacherManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'teacher');

      if (error) throw error;
      return data as User[];
    },
  });

  const handleInviteTeacher = async (email: string) => {
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          role: 'teacher',
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Teacher invitation sent successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send teacher invitation",
        variant: "destructive",
      });
    }
  };

  const filteredTeachers = teachers?.filter(teacher =>
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (teacher.username && teacher.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2" />
              Invite Teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Teacher</DialogTitle>
            </DialogHeader>
            {/* Add invite form here */}
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers?.map((teacher) => (
              <TableRow key={teacher.id}>
                <TableCell>{teacher.username}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>Active</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
