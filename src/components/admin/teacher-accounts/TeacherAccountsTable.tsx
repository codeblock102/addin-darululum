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
      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-primary/5">
            <TableRow>
              <TableHead className="w-[200px]">Full Name</TableHead>
              <TableHead className="w-[250px]">Email</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Students</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No teacher accounts found.
                  </TableCell>
                </TableRow>
              )
              : (
                teachers.map((teacher) => (
                  <TableRow key={teacher.id} className="hover:bg-secondary/5">
                    <TableCell className="font-medium">
                      {teacher.name}
                    </TableCell>
                    <TableCell>{teacher.email || "No email"}</TableCell>
                    <TableCell>{teacher.subject || "N/A"}</TableCell>
                    <TableCell>{teacher.grade || "N/A"}</TableCell>
                    <TableCell>
                      {teacher.lastLogin
                        ? formatDistanceToNow(new Date(teacher.lastLogin), {
                          addSuffix: true,
                        })
                        : "Never logged in"}
                    </TableCell>
                    <TableCell>
                      <TeacherStatusBadge status={teacher.status} />
                    </TableCell>
                    <TableCell>{teacher.classesCount}</TableCell>
                    <TableCell>{teacher.studentsCount}</TableCell>
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
