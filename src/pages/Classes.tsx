
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ClassDialog } from "@/components/classes/ClassDialog";
import { ClassList } from "@/components/classes/ClassList";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { SearchInput } from "@/components/admin/SearchInput";
import { Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function Classes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = (classItem?: any) => {
    setSelectedClass(classItem || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedClass(null);
    setIsDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AdminHeader
          title="Class Management"
          description="Create and manage class schedules and assignments"
        />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <div className="flex justify-end mb-4">
            <DialogTrigger asChild>
              <Button 
                className="bg-amber-500 hover:bg-amber-600 text-black"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </DialogTrigger>
          </div>
          <ClassDialog 
            selectedClass={selectedClass}
            onClose={handleCloseDialog}
          />
        </Dialog>

        <div className="glass-effect rounded-lg shadow-lg overflow-hidden">
          <SearchInput
            placeholder="Search classes by name, teacher, or room..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="border-gray-700/30 bg-white/5"
          />
          <ClassList 
            searchQuery={searchQuery}
            onEdit={handleOpenDialog}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
