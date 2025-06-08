import { Fragment, useState } from "react";
import { ClassDialog } from "@/components/classes/ClassDialog.tsx";
import { ClassList } from "@/components/classes/ClassList.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogTrigger } from "@/components/ui/dialog.tsx";
import { SearchInput } from "@/components/table/SearchInput.tsx";
import { Plus } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader.tsx";
import { ClassFormData } from "@/components/classes/validation/classFormSchema.ts";

export default function Classes() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<(Partial<ClassFormData> & { id: string }) | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = (classItem?: (Partial<ClassFormData> & { id: string })) => {
    setSelectedClass(classItem || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedClass(null);
    setIsDialogOpen(false);
  };

  return (
    <Fragment>
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
    </Fragment>
  );
}
