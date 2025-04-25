
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ClassDialog } from "@/components/classes/ClassDialog";
import { ClassList } from "@/components/classes/ClassList";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { SearchInput } from "@/components/admin/SearchInput";
import { Plus } from "lucide-react";

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Class Management</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage class schedules and assignments
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </DialogTrigger>
            <ClassDialog 
              selectedClass={selectedClass}
              onClose={handleCloseDialog}
            />
          </Dialog>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <SearchInput
            placeholder="Search classes by name, teacher, or room..."
            value={searchQuery}
            onChange={setSearchQuery}
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
