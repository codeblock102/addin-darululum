
import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ClassDialog } from "@/components/classes/ClassDialog";
import { ClassList } from "@/components/classes/ClassList";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { SearchInput } from "@/components/admin/SearchInput";
import { Plus } from "lucide-react";
import { hasPermission } from "@/utils/roleUtils"; 

const Classes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<any>(null);

  const handleAddClass = () => {
    setSelectedClass(null);
  };

  const handleEditClass = (classItem: any) => {
    setSelectedClass(classItem);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Class Management</h1>
          <Dialog onOpenChange={() => setSelectedClass(null)}>
            <DialogTrigger asChild>
              <Button onClick={handleAddClass}>
                <Plus className="mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <ClassDialog selectedClass={selectedClass} />
          </Dialog>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <SearchInput
            placeholder="Search classes by name or teacher..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <ClassList 
            searchQuery={searchQuery}
            onEdit={handleEditClass}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Classes;
