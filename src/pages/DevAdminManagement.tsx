import { DevAdminCreator } from "@/components/admin/DevAdminCreator.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Shield, Settings, AlertTriangle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useNavigate } from "react-router-dom";

export default function DevAdminManagement() {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 text-[hsl(142.8,64.2%,24.1%)] border-[hsl(142.8,64.2%,24.1%)] hover:bg-[hsl(142.8,64.2%,24.1%)] hover:text-white transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Developer Admin Management</h1>
            <p className="text-gray-600">Create and manage admin accounts for Dār Al-Ulūm Montréal</p>
          </div>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert className="mb-6 border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Developer Access Only:</strong> This page is for creating admin accounts. 
          Admin accounts have full access to their assigned Dār Al-Ulūm Montréal's data.
        </AlertDescription>
      </Alert>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Admin Creation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create admin accounts with immediate access and auto-confirmed email
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              Dār Al-Ulūm Montréal Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Assign admins to specific Dār Al-Ulūm Montréal locations for proper access control
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Account Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              View existing admin accounts and manage their access as needed
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <DevAdminCreator />
    </div>
  );
} 