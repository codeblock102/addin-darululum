import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { TeacherAccount } from "@/types/teacher.ts";
import { formatDistanceToNow } from "date-fns";
import { TeacherDetailDialog } from "./TeacherDetailDialog.tsx";
import { TeacherEditDialog } from "./TeacherEditDialog.tsx";
import { AccountActionDialog } from "./AccountActionDialog.tsx";
import { TeacherStatusBadge } from "./TeacherStatusBadge.tsx";
import { TeacherAccountActions } from "./TeacherAccountActions.tsx";
import { Users } from "lucide-react";

interface TeacherAccountsTableProps {
  teachers: TeacherAccount[];
}

export function TeacherAccountsTable({ teachers }: TeacherAccountsTableProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAccount | null>(
    null,
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleViewTeacher = (teacher: TeacherAccount) => {
    setSelectedTeacher(teacher);
    setDetailDialogOpen(true);
  };

  const handleEditTeacher = (teacher: TeacherAccount) => {
    setSelectedTeacher(teacher);
    setEditDialogOpen(true);
  };

  const handleSuspendTeacher = (teacher: TeacherAccount) => {
    setSelectedTeacher(teacher);
    setSuspendDialogOpen(true);
  };

  const handleDeleteTeacher = (teacher: TeacherAccount) => {
    setSelectedTeacher(teacher);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className="overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="border-gray-200 hover:bg-gray-50">
              <TableHead className="w-[200px] font-semibold text-gray-700">Full Name</TableHead>
              <TableHead className="w-[250px] font-semibold text-gray-700">Email</TableHead>
              <TableHead className="font-semibold text-gray-700">Subject</TableHead>
              <TableHead className="font-semibold text-gray-700">Grade</TableHead>
              <TableHead className="font-semibold text-gray-700">Last Activity</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700">Classes</TableHead>
              <TableHead className="font-semibold text-gray-700">Students</TableHead>
              <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Users className="h-8 w-8 mb-2 text-gray-400" />
                      <p className="text-sm font-medium">No teacher accounts found</p>
                      <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              )
              : (
                teachers.map((teacher) => (
                  <TableRow key={teacher.id} className="hover:bg-gray-50 border-gray-100 transition-colors duration-150">
                    <TableCell className="font-medium text-gray-900">
                      {teacher.name}
                    </TableCell>
                    <TableCell className="text-gray-700">{teacher.email || "No email"}</TableCell>
                    <TableCell className="text-gray-700">{teacher.subject || "N/A"}</TableCell>
                    <TableCell className="text-gray-700">{teacher.grade || "N/A"}</TableCell>
                    <TableCell className="text-gray-600">
                      {teacher.lastLogin
                        ? formatDistanceToNow(new Date(teacher.lastLogin), {
                          addSuffix: true,
                        })
                        : "Never logged in"}
                    </TableCell>
                    <TableCell>
                      <TeacherStatusBadge status={teacher.status} />
                    </TableCell>
                    <TableCell className="text-gray-700">{teacher.classesCount}</TableCell>
                    <TableCell className="text-gray-700">{teacher.studentsCount}</TableCell>
                    <TableCell className="text-right">
                      <TeacherAccountActions
                        teacher={teacher}
                        onView={handleViewTeacher}
                        onEdit={handleEditTeacher}
                        onSuspend={handleSuspendTeacher}
                        onDelete={handleDeleteTeacher}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <TeacherDetailDialog
        teacher={selectedTeacher}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      <TeacherEditDialog
        teacher={selectedTeacher}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <AccountActionDialog
        teacher={selectedTeacher}
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        actionType={selectedTeacher?.status === "active"
          ? "suspend"
          : "reactivate"}
      />

      <AccountActionDialog
        teacher={selectedTeacher}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        actionType="delete"
      />
    </>
  );
}
