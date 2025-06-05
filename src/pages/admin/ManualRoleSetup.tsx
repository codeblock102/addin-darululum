/**
 * @file ManualRoleSetup.tsx
 * @description This file defines the `ManualRoleSetup` component, an administrative tool for manually assigning a role (admin or teacher) to the currently authenticated user.
 * It is likely used during initial setup or for testing purposes where automated role assignment might not be in place.
 * The component displays the current user's email and metadata, allows selection of either 'admin' or 'teacher' role via radio buttons,
 * and provides a button to apply the selected role.
 * When a role is set:
 * 1. It updates the user's metadata in Supabase Auth using `supabase.auth.updateUser()`.
 * 2. If the selected role is 'teacher', it checks if a corresponding record exists in the 'teachers' table using the user's email.
 *    If no record exists, it creates one with placeholder details (name defaults to email, subject to 'To be determined').
 * 3. Stores the selected role in `localStorage` for immediate client-side use.
 * 4. Calls `refreshSession()` from `AuthContext` to update the application's auth state.
 * 5. Displays a success toast and redirects the user to the appropriate dashboard (`/admin` or `/teacher-portal`) after a short delay.
 * Error handling is included to display toast notifications for failures during the process.
 */
import React from 'react';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { useToast } from "@/components/ui/use-toast.ts";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client.ts";
import { useAuth } from "@/contexts/AuthContext.tsx";
import { Label } from "@/components/ui/label.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";

/**
 * @function ManualRoleSetup
 * @description A component that allows manual setting of user roles (admin or teacher).
 * It updates user metadata in Supabase, potentially creates a teacher record, refreshes the session, and redirects.
 * @returns {JSX.Element} The rendered manual role setup page.
 */
export default function ManualRoleSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher'>('admin');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  // Get current user info for display
  const [userInfo, setUserInfo] = useState<{email: string, metadata: any} | null>(null);
  
  useEffect(() => {
    /**
     * @function fetchUserInfo
     * @description Fetches and sets the current authenticated user's email and metadata.
     * Used for display purposes on the role setup page.
     * @async
     * @returns {Promise<void>}
     */
    const fetchUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserInfo({
          email: user.email || 'Unknown Email',
          metadata: user.user_metadata || {}
        });
      }
    };
    fetchUserInfo();
  }, []);

  /**
   * @function handleRoleSetup
   * @description Handles the logic for setting the selected role for the current user.
   * It updates the user's metadata in Supabase Auth.
   * If the role is 'teacher', it ensures a corresponding record exists in the 'teachers' table, creating one if necessary.
   * It then stores the role in localStorage, refreshes the session, shows a toast, and redirects.
   * @async
   * @input None directly, uses `selectedRole` state.
   * @output Updates user role in Supabase, localStorage, and auth context, then navigates the user.
   * @returns {Promise<void>}
   */
  const handleRoleSetup = async () => {
    setIsLoading(true);
    
    try {
      // Direct call to updateUser using Supabase JS client
      console.log(`Setting user role to: ${selectedRole}`);
      
      const updateResponse = await supabase.auth.updateUser({
        data: { role: selectedRole }
      });
      
      console.log("Update response:", updateResponse);
      
      if (updateResponse.error) {
        throw new Error(`Failed to update user metadata: ${updateResponse.error.message}`);
      }

      // If the role is teacher, ensure a teacher record exists
      if (selectedRole === 'teacher' && updateResponse.data.user?.email) {
        const userEmail = updateResponse.data.user.email;
        console.log(`Selected role is teacher. Checking/creating teacher record for ${userEmail}`);

        const { data: existingTeacher, error: checkError } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking for existing teacher record:", checkError.message);
          // Decide if this should be a fatal error or just a warning
        }

        if (!existingTeacher) {
          console.log(`No existing teacher record found for ${userEmail}. Creating one.`);
          const { error: insertError } = await supabase
            .from('teachers')
            .insert([{ 
              email: userEmail,
              name: userEmail, // Use email as name for now
              subject: 'To be determined', // Placeholder
              bio: 'Profile to be completed.', // Placeholder
              experience: 'Not specified' // Placeholder for experience
              // Add any other required fields with default/placeholder values
            }]);

          if (insertError) {
            console.error("Error creating teacher record:", insertError.message);
            toast({
              title: "Teacher Record Creation Failed",
              description: `Could not create a teacher database entry: ${insertError.message}. Please complete your profile later.`,
              variant: "destructive",
            });
            // Decide if this should prevent login or just warn
          } else {
            console.log(`Successfully created teacher record for ${userEmail}`);
          }
        } else {
          console.log(`Teacher record already exists for ${userEmail}`);
        }
      }
      
      // Also set in localStorage for immediate use
      localStorage.setItem('userRole', selectedRole);
      
      // Force a session refresh to ensure the auth context has the latest data
      await refreshSession();
      
      toast({
        title: "Role Setup Complete",
        description: `Your account has been set up as a ${selectedRole}. You will be redirected to the ${selectedRole} dashboard.`,
      });
      
      // Wait a moment before redirecting
      setTimeout(() => {
        navigate(selectedRole === 'admin' ? "/admin" : "/teacher-portal");
      }, 2000);
    } catch (error: any) {
      console.error("Error setting up role:", error);
      toast({
        title: "Setup Failed",
        description: error.message || "An unexpected error occurred while setting up your role.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Manual Role Setup</CardTitle>
          <CardDescription>
            Set your account role manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userInfo && (
            <div className="mb-6 text-sm">
              <p><strong>Current User:</strong> {userInfo.email}</p>
              <p><strong>Current Metadata:</strong> {JSON.stringify(userInfo.metadata)}</p>
            </div>
          )}
        
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Select Your Role</h3>
              <p className="text-sm text-gray-500">Choose the role you want to assign to your account</p>
            </div>
            
            <RadioGroup 
              value={selectedRole} 
              onValueChange={(value) => setSelectedRole(value as 'admin' | 'teacher')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="font-medium">Administrator</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="teacher" id="teacher" />
                <Label htmlFor="teacher" className="font-medium">Teacher</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleRoleSetup} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up role...
              </>
            ) : (
              "Set Up Role"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 