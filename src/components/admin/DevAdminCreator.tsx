import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { 
  UserPlus, 
  Building2, 
  Shield, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  RefreshCw
} from "lucide-react";

interface AdminForm {
  email: string;
  password: string;
  name: string;
  madrassah_id: string;
}

interface Madrassah {
  id: string;
  name: string;
  location: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  madrassah_name: string;
  madrassah_id: string;
  created_at: string;
  role: string;
}

export const DevAdminCreator = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState<AdminForm>({
    email: '',
    password: '',
    name: '',
    madrassah_id: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch madrassahs
  const { data: madrassahs, isLoading: madrassahsLoading } = useQuery({
    queryKey: ["madrassahs-for-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("madrassahs")
        .select("id, name, location")
        .order("name");
      
      if (error) throw error;
      return data as Madrassah[];
    },
  });

  // Fetch existing admin users
  const { data: adminUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          role,
          created_at,
          madrassah_id,
          madrassahs (
            name
          )
        `)
        .eq("role", "admin")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      return data.map(user => ({
        id: user.id,
        email: '', // We'll need to get this separately if needed
        name: user.name || '',
        madrassah_name: user.madrassahs?.name || 'No Madrassah',
        madrassah_id: user.madrassah_id || '',
        created_at: user.created_at,
        role: user.role
      })) as AdminUser[];
    },
  });

  // Create admin mutation
  const createAdminMutation = useMutation({
    mutationFn: async (adminData: AdminForm) => {
      setIsCreating(true);
      
      // Step 1: Create the user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminData.email,
        password: adminData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: adminData.name,
          role: 'admin'
        }
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create user account');
      }

      // Step 2: Create/update the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          name: adminData.name,
          role: 'admin',
          madrassah_id: adminData.madrassah_id,
          created_at: new Date().toISOString()
        });

      if (profileError) {
        throw new Error(`Failed to create profile: ${profileError.message}`);
      }

      return {
        user: authData.user,
        profile: {
          id: authData.user.id,
          name: adminData.name,
          role: 'admin',
          madrassah_id: adminData.madrassah_id
        }
      };
    },
    onSuccess: (data) => {
      toast({
        title: "Admin Created Successfully",
        description: `Admin account for ${form.name} has been created and can be used immediately.`,
      });
      
      // Reset form
      setForm({
        email: '',
        password: '',
        name: '',
        madrassah_id: ''
      });
      
      // Refresh the admin users list
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsCreating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Admin",
        description: error.message,
        variant: "destructive",
      });
      setIsCreating(false);
    },
  });

  // Delete admin mutation
  const deleteAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Delete from profiles first
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) {
        throw new Error(`Failed to delete profile: ${profileError.message}`);
      }

      // Delete the auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        throw new Error(`Failed to delete auth user: ${authError.message}`);
      }

      return userId;
    },
    onSuccess: () => {
      toast({
        title: "Admin Deleted",
        description: "Admin account has been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Admin",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.email || !form.password || !form.name || !form.madrassah_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (form.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    createAdminMutation.mutate(form);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, password }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Admin Account Creator
          </h2>
          <p className="text-gray-600">Create admin accounts and assign them to madrassahs</p>
        </div>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Create Admin Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create New Admin
          </CardTitle>
          <CardDescription>
            Create a new admin account that can be used immediately after creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter admin's full name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@madrassah.com"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter secure password"
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generatePassword}
                  className="mt-1"
                >
                  Generate Password
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="madrassah">Assign to Madrassah *</Label>
                <Select 
                  value={form.madrassah_id} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, madrassah_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a madrassah" />
                  </SelectTrigger>
                  <SelectContent>
                    {madrassahsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      madrassahs?.map((madrassah) => (
                        <SelectItem key={madrassah.id} value={madrassah.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <span>{madrassah.name}</span>
                            <span className="text-sm text-gray-500">({madrassah.location})</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm({ email: '', password: '', name: '', madrassah_id: '' })}
              >
                Clear Form
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Admin...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Admin Account
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Existing Admin Accounts
          </CardTitle>
          <CardDescription>
            Manage existing admin accounts and their madrassah assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading admin accounts...</span>
            </div>
          ) : adminUsers && adminUsers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Madrassah</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUsers.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500" />
                          {admin.madrassah_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          <Shield className="h-3 w-3 mr-1" />
                          {admin.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(admin.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Admin Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the admin account for <strong>{admin.name}</strong>? 
                                This action cannot be undone and will permanently remove their access.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAdminMutation.mutate(admin.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No admin accounts found.</p>
              <p className="text-sm">Create your first admin account using the form above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 