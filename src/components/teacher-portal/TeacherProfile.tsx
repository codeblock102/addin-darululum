import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/hooks/use-toast.ts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Loader2, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Teacher } from "@/types/teacher.ts";

export function TeacherProfile({ teacher }: { teacher: Teacher }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: teacher.name || "",
    email: teacher.email || "",
    phone: teacher.phone || "",
    subject: teacher.subject || "",
    bio: teacher.bio || "",
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: Partial<Omit<Teacher, 'id'>>) => {
      const { data, error } = await supabase
        .from('teachers')
        .update(updatedData)
        .eq('id', teacher.id)
        .select();
      
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-profile'] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { ...dataToSubmit } = formData;
    updateProfileMutation.mutate(dataToSubmit);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt={teacher?.name || "Teacher"} />
              <AvatarFallback className="text-lg">
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-medium">{teacher?.name || "Teacher"}</h3>
              <p className="text-sm text-muted-foreground">{teacher?.subject || "Subject"} Teacher</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your email address"
                    disabled
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Taught</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g., Hifz, Tafseer"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Biography</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Briefly describe your teaching background and approach."
                  rows={4}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full md:w-auto"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="border-t pt-6">
        <h3 className="font-medium mb-4">Preferences</h3>
        <p className="text-muted-foreground mb-4">
          You can customize your teaching preferences from the preferences page.
        </p>
        <Button asChild variant="outline">
          <Link to="/preferences">Manage Preferences</Link>
        </Button>
      </div>
    </div>
  );
}
