
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/button";
import { TeacherAccount } from "@/types/teacher";
import { MoreHorizontal, Eye, Edit, UserMinus, Trash2, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TeacherDetailDialog } from "./TeacherDetailDialog";
import { TeacherEditDialog } from "./TeacherEditDialog";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AccountActionDialog } from "./AccountActionDialog";

interface TeacherAccountsTableProps {
  teachers: TeacherAccount[];
}

export function TeacherAccountsTable({ teachers }: TeacherAccountsTableProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAccount | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Handle opening the detail view dialog
  const handleViewTeacher = (teacher: TeacherAccount) => {
    setSelectedTeacher(teacher);
    setDetailDialogOpen(true);
  };

  // Handle opening the edit dialog
  const handleEditTeacher = (teacher: TeacherAccount) => {
    setSelectedTeacher(teacher);
    setEditDialogOpen(true);
  };

  // Handle opening the suspend dialog
  const handleSuspendTeacher = (teacher: TeacherAccount) => {
    setSelectedTeacher(teacher);
    setSuspendDialogOpen(true);
  };

  // Handle opening the delete dialog
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
              <TableHead>Last Activity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Students</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No teacher accounts found.
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-secondary/5">
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.email || "No email"}</TableCell>
                  <TableCell>
                    {teacher.lastLogin ? 
                      formatDistanceToNow(new Date(teacher.lastLogin), { addSuffix: true }) :
                      "Never logged in"}
                  </TableCell>
                  <TableCell>
                    {teacher.status === "active" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex w-fit items-center gap-1">
                        <Check className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex w-fit items-center gap-1">
                        <X className="h-3 w-3" />
                        Suspended
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{teacher.classesCount}</TableCell>
                  <TableCell>{teacher.studentsCount}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewTeacher(teacher)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditTeacher(teacher)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Account
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleSuspendTeacher(teacher)}
                          className={teacher.status === "active" ? "text-amber-600" : "text-green-600"}
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          {teacher.status === "active" ? "Suspend Account" : "Reactivate Account"}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTeacher(teacher)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Teacher Detail Dialog */}
      <TeacherDetailDialog
        teacher={selectedTeacher}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Teacher Edit Dialog */}
      <TeacherEditDialog
        teacher={selectedTeacher}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Suspend/Reactivate Account Dialog */}
      <AccountActionDialog
        teacher={selectedTeacher}
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        actionType={selectedTeacher?.status === "active" ? "suspend" : "reactivate"}
      />

      {/* Delete Account Dialog */}
      <AccountActionDialog
        teacher={selectedTeacher}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        actionType="delete"
      />
    </>
  );
}
