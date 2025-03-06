
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { UserDialog } from "@/components/admin/UserDialog";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
  username: string;
  teacherId: string | null;
  createdAt: string;
}

interface UserListProps {
  users: User[];
  searchQuery: string;
  teachers: { id: string; name: string }[];
  refetchUsers: () => void;
}

export const UserList = ({ users, searchQuery, teachers, refetchUsers }: UserListProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);

  const handleUserDialogSuccess = () => {
    setUserDialogOpen(false);
    setSelectedUser(null);
    refetchUsers();
  };

  const openUserDialog = (user: User | null = null) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Accounts</h2>
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <Button onClick={() => openUserDialog()}>
            <span className="mr-2">＋</span>
            Add User
          </Button>
          <UserDialog 
            selectedUser={selectedUser} 
            teachers={teachers} 
            onSuccess={handleUserDialogSuccess}
          />
        </Dialog>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-200">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No users found matching your search criteria.
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-medium">{user.username || 'No username'}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.teacherId && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                    Teacher Account
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openUserDialog(user)}
              >
                Edit
              </Button>
            </div>
          ))
        )}
      </div>
    </>
  );
};
