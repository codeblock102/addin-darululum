import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";
import { UserRound, CalendarDays, Phone, Book } from "lucide-react";

interface Student {
  id: string;
  name: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  guardian_name: string | null;
  guardian_contact: string | null;
  status: 'active' | 'inactive';
}

interface StudentQuickProfileModalProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StudentQuickProfileModal = ({ student, open, onOpenChange }: StudentQuickProfileModalProps) => {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not provided";
    return new Date(dateString).toLocaleDateString();
  };
  
  const handleDhorBookOpen = () => {
    navigate(`/students/${student.id}?tab=dhor-book`);
    onOpenChange(false);
  };
  
  const handleStudentProfileOpen = () => {
    navigate(`/students/${student.id}`);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
              <UserRound className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            </div>
            <span>{student.name}</span>
          </DialogTitle>
          <DialogDescription>
            Quick student information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Date of Birth</p>
              <p className="font-medium flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatDate(student.date_of_birth)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Enrollment Date</p>
              <p className="font-medium">
                {formatDate(student.enrollment_date)}
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Guardian</p>
            <p className="font-medium">{student.guardian_name || 'Not provided'}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Contact</p>
            <p className="font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {student.guardian_contact || 'Not provided'}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <span className={`px-2 py-1 rounded-full text-xs ${
              student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {student.status}
            </span>
          </div>
          
          <div className="pt-4 flex gap-2">
            <Button className="flex-1" onClick={handleDhorBookOpen}>
              <Book className="h-4 w-4 mr-2" />
              Open Dhor Book
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleStudentProfileOpen}>
              Full Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
