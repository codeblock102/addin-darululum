
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { TeacherDialog } from "@/components/teachers/TeacherDialog";
import { TeacherList } from "@/components/teachers/TeacherList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Teachers = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<{
    id: string;
    name: string;
    subject: string;
    experience: string;
  } | null>(null);

  // Check authentication
  useState(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Teachers</h1>
            <p className="text-gray-500">Manage teaching staff and assignments</p>
          </div>
          <Dialog onOpenChange={() => setSelectedTeacher(null)}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <TeacherDialog selectedTeacher={selectedTeacher} />
          </Dialog>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search teachers by name or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <TeacherList 
            searchQuery={searchQuery}
            onEdit={setSelectedTeacher}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Teachers;
